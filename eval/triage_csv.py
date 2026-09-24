"""Tri d'un CSV de tickets, avec métriques si les bonnes réponses sont fournies.

Usage :
    python3 eval/triage_csv.py tickets.csv                # garde d'entrée, tri, contrôleur
    python3 eval/triage_csv.py tickets.csv --brouillon    # + rédacteur et garde de sortie
    make triage CSV=tickets.csv                           # même chose (BROUILLON=1 pour les brouillons)

Entrée : un CSV (séparateur « , » ou « ; », UTF-8 avec ou sans BOM) avec une
colonne obligatoire `ticket` (le texte du client). Colonnes facultatives :
- `id` ;
- `categorie`, `produit`, `severite` : les bonnes réponses, avec les valeurs du
  schéma (src/schema.py : billing/bug/other, card/transfer/direct_debit/account/unknown,
  low/medium/high) ; une case vide ne compte pas dans les métriques ;
- `canal` (email, form, chat) et `recu_le` (2026-10-07T14:00:00) : servent au
  calcul de l'échéance. Par défaut : « form », reçu au lancement (ou --recu-le).

Traitement : le pipeline existant, prompts inchangés (src/triage.py,
src/controller.py, src/reply.py), mais étape par étape sur tout le fichier
(tous les tris, puis tous les contrôles, puis tous les brouillons) : un seul
modèle chargé à la fois, sans rechargement entre deux tickets. Les résultats
sont les mêmes qu'avec src/pipeline.py (température 0, seed fixe).

Sortie : `<nom>_triage.csv` à côté de l'entrée (ou --out), qui reprend les
colonnes d'entrée et ajoute les prédictions ; si des bonnes réponses sont
présentes, un rapport Markdown du même nom en `.md`. Progression et temps
restant estimé sur la sortie d'erreur.
Bibliothèque standard uniquement.
"""

from __future__ import annotations

import argparse
import csv
import io
import json
import sys
import time
import urllib.request
from datetime import datetime
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO / "src"))
import answers  # noqa: E402
import controller  # noqa: E402
import reply  # noqa: E402
import triage  # noqa: E402
from deadlines import compute_deadlines, nearest  # noqa: E402
from schema import CHANNELS, ENUMS  # noqa: E402

# Colonne de bonne réponse -> (champ du schéma, colonne prédite)
GOLD = {"categorie": ("label", "categorie_predite"),
        "produit": ("product", "produit_predit"),
        "severite": ("severity", "severite_predite")}
PREDICTED = ["categorie_predite", "produit_predit", "severite_predite", "sous_motif", "reclamation",
             "injection_suspectee", "echeance", "controle"]
DRAFT_COLUMNS = ["fiche", "brouillon", "brouillon_bloque"]


class InputError(Exception):
    pass


def yes_no(b: bool) -> str:
    return "oui" if b else "non"


def duration(s: float) -> str:
    s = int(round(s))
    if s < 60:
        return f"{s} s"
    m, s = divmod(s, 60)
    if m < 60:
        return f"{m} min {s:02d} s"
    h, m = divmod(m, 60)
    return f"{h} h {m:02d} min"


def read_tickets(path: Path) -> tuple[list[str], list[dict], str]:
    """Colonnes, lignes et séparateur du CSV. Vérifie la colonne `ticket` et les bonnes réponses."""
    text = path.read_text(encoding="utf-8-sig")
    first = text.splitlines()[0] if text.strip() else ""
    delimiter = ";" if first.count(";") > first.count(",") else ","
    reader = csv.DictReader(io.StringIO(text, newline=""), delimiter=delimiter)
    columns = [c.strip() for c in (reader.fieldnames or [])]
    reader.fieldnames = columns
    if "ticket" not in columns:
        raise InputError(f"colonne « ticket » absente (colonnes trouvées : {', '.join(columns) or 'aucune'})")
    clash = [c for c in PREDICTED + DRAFT_COLUMNS if c in columns]
    if clash:
        raise InputError(f"colonnes réservées à la sortie déjà présentes : {', '.join(clash)}")
    rows = []
    for n, row in enumerate(reader, start=1):
        if None in row:
            raise InputError(f"ticket {n} : plus de valeurs que de colonnes (texte avec « {delimiter} » sans guillemets ?)")
        row = {k: (v or "").strip() for k, v in row.items() if k is not None}
        if not row["ticket"]:
            raise InputError(f"ticket {n} : ticket vide")
        for col, (field, _) in GOLD.items():
            if row.get(col):
                row[col] = row[col].lower()
                if row[col] not in ENUMS[field]:
                    raise InputError(f"ticket {n} : {col} = « {row[col]} », attendu : {', '.join(ENUMS[field])}")
        if row.get("canal"):
            row["canal"] = row["canal"].lower()
            if row["canal"] not in CHANNELS:
                raise InputError(f"ticket {n} : canal = « {row['canal']} », attendu : {', '.join(CHANNELS)}")
        if row.get("recu_le"):
            try:
                datetime.fromisoformat(row["recu_le"])
            except ValueError:
                raise InputError(f"ticket {n} : recu_le = « {row['recu_le']} », attendu : 2026-10-07T14:00:00") from None
        rows.append(row)
    if not rows:
        raise InputError("aucun ticket dans le fichier")
    return columns, rows, delimiter


class Progress:
    """Une ligne par ticket traité, avec le temps restant estimé sur toutes les étapes."""

    def __init__(self, n_tickets: int, steps: list[str], stream=None):
        self.n, self.steps, self.stream = n_tickets, steps, stream or sys.stderr
        self.total = n_tickets * len(steps)
        self.done = 0
        self.start = time.monotonic()
        self.step_start = self.start
        self.step_times: dict[str, float] = {}

    def begin(self, step: str) -> None:
        self.step_start = time.monotonic()
        print(f"— {step} —", file=self.stream, flush=True)

    def tick(self, step: str, i: int, tid: str) -> None:
        self.done += 1
        now = time.monotonic()
        # Étape en cours : sa propre moyenne. Étapes suivantes : la moyenne de tout ce qui est fait.
        step_avg = (now - self.step_start) / i
        overall_avg = (now - self.start) / self.done
        left_here = (self.n - i) * step_avg
        left_after = (self.total - self.done - (self.n - i)) * overall_avg
        print(f"  {step:<10} {i:>4}/{self.n}  {tid:<12} écoulé {duration(now - self.start):>11}"
              f"   reste ~{duration(left_here + left_after)}", file=self.stream, flush=True)

    def end(self, step: str) -> None:
        self.step_times[step] = time.monotonic() - self.step_start

    @property
    def elapsed(self) -> float:
        return time.monotonic() - self.start


def unload(model: str, host: str = triage.HOST) -> None:
    """Décharge un modèle d'Ollama (keep_alive 0), pour ne jamais en garder deux en mémoire."""
    payload = {"model": model, "keep_alive": 0}
    req = urllib.request.Request(host.rstrip("/") + "/api/generate", data=json.dumps(payload).encode(),
                                 headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            resp.read()
    except Exception:   # l'échec du déchargement ne change aucun résultat
        pass


def process(rows: list[dict], with_draft: bool, received_default: str, progress: Progress) -> list[dict]:
    ids = [r.get("id") or f"#{n}" for n, r in enumerate(rows, start=1)]
    tickets = [{"id": ids[k], "input": r["ticket"], "channel": r.get("canal") or "form",
                "received_at": r.get("recu_le") or received_default} for k, r in enumerate(rows)]

    progress.begin("tri")   # garde d'entrée + llama
    tri = []
    for k, t in enumerate(tickets):
        tri.append(triage.triage(t["input"]))
        progress.tick("tri", k + 1, ids[k])
    progress.end("tri")
    unload(triage.MODEL)

    progress.begin("contrôle")   # qwen, gardé chargé jusqu'au dernier ticket puis déchargé
    qwen = []
    for k, t in enumerate(tri):
        keep = 0 if k == len(tri) - 1 else "5m"
        qwen.append(controller.predict(t["llm_text"], keep_alive=keep))
        progress.tick("contrôle", k + 1, ids[k])
    progress.end("contrôle")

    drafts = [None] * len(tickets)
    if with_draft:
        progress.begin("brouillon")   # rédacteur (llama) + garde de sortie
        for k, t in enumerate(tickets):
            drafts[k] = reply.draft_reply(t, tri[k]["fields"], controller_sous_motif=qwen[k])
            progress.tick("brouillon", k + 1, ids[k])
        progress.end("brouillon")
        unload(reply.MODEL)

    out = []
    for k, t in enumerate(tickets):
        f = tri[k]["fields"]
        ds = compute_deadlines(datetime.fromisoformat(t["received_at"]), f["is_complaint"],
                               f["unauthorized_payment"], f["product"], t["channel"])
        first = nearest(ds)
        pred = {"categorie_predite": f["label"], "produit_predit": f["product"], "severite_predite": f["severity"],
                "sous_motif": f.get("sous_motif", ""), "reclamation": yes_no(f["is_complaint"]),
                "injection_suspectee": yes_no(f["injection_suspected"]),
                "echeance": first.due.date().isoformat() if first else "",
                "controle": answers.choose(f, qwen[k])["reason"]}
        if with_draft:
            d = drafts[k]
            pred.update({"fiche": d["fiche"]["sous_motif"] or "", "brouillon": d["draft"],
                         "brouillon_bloque": yes_no(d["blocked"])})
        out.append(pred)
    return out


def write_csv(path: Path, columns: list[str], rows: list[dict], preds: list[dict], delimiter: str) -> None:
    fields = columns + list(preds[0])
    with path.open("w", encoding="utf-8", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=fields, delimiter=delimiter)
        w.writeheader()
        for r, p in zip(rows, preds):
            w.writerow({**{c: r.get(c, "") for c in columns}, **p})


def metrics(rows: list[dict], preds: list[dict]) -> dict:
    """Précision par champ, tickets entièrement justes, matrices de confusion (vraie x prédite)."""
    present = [c for c in GOLD if any(r.get(c) for r in rows)]
    fields = {}
    for col in present:
        field, pcol = GOLD[col]
        pairs = [(r[col], p[pcol]) for r, p in zip(rows, preds) if r.get(col)]
        labels = [v for v in ENUMS[field] if any(v in pair for pair in pairs)]
        matrix = {t: {p: 0 for p in labels} for t in labels}
        for t, p in pairs:
            matrix[t][p] += 1
        fields[col] = {"n": len(pairs), "correct": sum(t == p for t, p in pairs), "labels": labels, "matrix": matrix}
    complete = [(r, p) for r, p in zip(rows, preds) if all(r.get(c) for c in present)]
    exact = sum(all(r[c] == p[GOLD[c][1]] for c in present) for r, p in complete)
    return {"fields": fields, "exact": {"n": len(complete), "correct": exact, "over": present}}


def pct(k: int, n: int) -> str:
    return f"{100 * k / n:.1f} %".replace(".", ",") if n else "n/a"


def report(m: dict, meta: dict) -> str:
    lines = [f"# Tri de {meta['input']}", "",
             f"- Tickets : {meta['n']}",
             f"- Étapes : {', '.join(meta['steps'])}",
             f"- Modèles : tri {meta['model']}, contrôleur {meta['controller']}" +
             (f", rédacteur {meta['model']}" if meta["draft"] else ""),
             f"- Durée : {duration(meta['seconds'])} ({meta['seconds'] / meta['n']:.1f} s par ticket)".replace(".", ","),
             f"- Lancé le : {meta['started']}",
             f"- Sortie : {meta['output']}", "",
             "## Précision par champ", "", "| Champ | Justes | Tickets notés | Précision |", "|---|---:|---:|---:|"]
    for col, f in m["fields"].items():
        lines.append(f"| {col} | {f['correct']} | {f['n']} | {pct(f['correct'], f['n'])} |")
    e = m["exact"]
    lines += ["", f"**Tickets entièrement justes** ({' + '.join(e['over'])}) : "
              f"{e['correct']} sur {e['n']}, soit {pct(e['correct'], e['n'])}.", ""]
    if e["n"] < meta["n"]:
        lines += [f"{meta['n'] - e['n']} ticket(s) sans toutes les bonnes réponses ne comptent pas dans ce taux.", ""]
    lines += ["## Matrices de confusion", "", "Lignes : bonne réponse. Colonnes : prédiction.", ""]
    for col, f in m["fields"].items():
        lines += [f"### {col}", "", "| vraie \\ prédite | " + " | ".join(f["labels"]) + " |",
                  "|---|" + "---:|" * len(f["labels"])]
        for t in f["labels"]:
            cells = [f"**{f['matrix'][t][p]}**" if t == p else str(f["matrix"][t][p]) for p in f["labels"]]
            lines.append(f"| {t} | " + " | ".join(cells) + " |")
        lines.append("")
    return "\n".join(lines)


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("csv", type=Path, help="CSV d'entrée (colonne obligatoire : ticket)")
    ap.add_argument("--brouillon", action="store_true", help="lance aussi le rédacteur et la garde de sortie")
    ap.add_argument("--out", type=Path, help="CSV de sortie (par défaut : <nom>_triage.csv à côté de l'entrée)")
    ap.add_argument("--recu-le", help="date de réception quand la colonne recu_le manque (par défaut : maintenant)")
    args = ap.parse_args(argv)

    try:
        columns, rows, delimiter = read_tickets(args.csv)
        received = args.recu_le or datetime.now().replace(microsecond=0).isoformat()
        datetime.fromisoformat(received)
    except (InputError, OSError, ValueError) as e:
        print(f"Erreur : {e}", file=sys.stderr)
        return 2
    out = args.out or args.csv.with_name(args.csv.stem + "_triage.csv")
    steps = ["tri", "contrôle"] + (["brouillon"] if args.brouillon else [])
    started = datetime.now().replace(microsecond=0).isoformat(sep=" ")
    print(f"{len(rows)} tickets, étapes : {', '.join(steps)}", file=sys.stderr)
    progress = Progress(len(rows), steps)
    try:
        preds = process(rows, args.brouillon, received, progress)
    except OSError as e:   # urllib.error.URLError en fait partie
        print(f"\nErreur : Ollama ne répond pas ({triage.HOST}) : {e}. Lancer Ollama puis recommencer.", file=sys.stderr)
        return 1
    seconds = progress.elapsed
    write_csv(out, columns, rows, preds, delimiter)
    print(f"\n{len(rows)} tickets en {duration(seconds)} ({seconds / len(rows):.1f} s par ticket)".replace(".", ","),
          file=sys.stderr)
    for step, s in progress.step_times.items():
        print(f"  {step:<10} {duration(s)}", file=sys.stderr)
    print(f"CSV : {out}", file=sys.stderr)

    m = metrics(rows, preds)
    if m["fields"]:
        meta = {"input": args.csv.name, "n": len(rows), "steps": steps, "model": triage.MODEL,
                "controller": controller.MODEL, "draft": args.brouillon, "seconds": seconds,
                "started": started, "output": out.name}
        md = out.with_suffix(".md")
        md.write_text(report(m, meta), encoding="utf-8")
        for col, f in m["fields"].items():
            print(f"  {col:<10} {pct(f['correct'], f['n']):>8}  ({f['correct']}/{f['n']})", file=sys.stderr)
        e = m["exact"]
        print(f"  {'tout juste':<10} {pct(e['correct'], e['n']):>8}  ({e['correct']}/{e['n']})", file=sys.stderr)
        print(f"Rapport : {md}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
