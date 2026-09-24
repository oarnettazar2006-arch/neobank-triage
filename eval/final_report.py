"""Tableaux du rapport de note finale (eval/reports/final_test100.md).

Usage :
    python3 eval/final_report.py --v0 <run v0 test100> --v7 <run v7 test100> --reply <brouillons v7 test100> \
        --controller <contrôleur v7 test100> \
        --ref val60 <v0 val60> <v7 val60> <brouillons v7 val60> \
        --ref holdout20 <v0 holdout20> <v7 holdout20> <brouillons v7 holdout20>

Lit uniquement des fichiers de résultats (eval/run.py, eval/run_controller.py,
eval/run_reply.py) : aucun appel au modèle. Écrit les tableaux en Markdown sur
la sortie standard ; l'interprétation est rédigée à la main dans le rapport.
Bibliothèque standard uniquement.
"""

from __future__ import annotations

import argparse
import json
import random
from pathlib import Path

from compare import ALL, FIELDS, compare, load
from run import bootstrap_ci

TABLE_FIELDS = FIELDS + ["sous_motif"]
N_BOOT, SEED = 2000, 42   # comme eval/run.py


def read(path: Path) -> tuple[dict, list[dict], dict]:
    recs = [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]
    meta = next(r for r in recs if r["type"] == "meta")
    rows = [r for r in recs if r["type"] in ("ticket", "reply")]
    summary = next(r for r in recs if r["type"] == "summary")
    return meta, rows, summary


def all_hits(rows: list[dict]) -> list[int]:
    return [int(all(r["hits"][f] for f in FIELDS)) for r in rows]


def pct(x: float | None) -> str:
    return "–" if x is None else f"{100 * x:.1f}".replace(".", ",")


def acc_ci(summary: dict, rows: list[dict], field: str) -> tuple[float, tuple[float, float]] | None:
    if field == ALL:
        hits = all_hits(rows)
        return sum(hits) / len(hits), bootstrap_ci(hits, N_BOOT, random.Random(SEED))
    a = summary["accuracy"].get(field)
    return (a["value"], tuple(a["ci95"])) if a else None


def cell(x) -> str:
    if x is None:
        return "–"
    v, (lo, hi) = x
    return f"{pct(v)} % [{pct(lo)} ; {pct(hi)}]"


def p_str(p: float) -> str:
    return f"{p:.3f}".replace(".", ",") if p >= 0.001 else "< 0,001"


def complaints(rows: list[dict]) -> dict:
    gold = [r for r in rows if r["gold"]["is_complaint"]]
    pred = [r for r in rows if r["pred"] and r["pred"]["is_complaint"]]
    tp = [r for r in gold if r["pred"] and r["pred"]["is_complaint"]]
    return {"gold": len(gold), "detected": len(tp), "missed": sorted(r["id"] for r in gold if r not in tp),
            "false_pos": sorted(r["id"] for r in pred if not r["gold"]["is_complaint"]), "pred": len(pred)}


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    for name in ("v0", "v7", "reply", "controller"):
        ap.add_argument(f"--{name}", type=Path, required=True)
    ap.add_argument("--ref", nargs=4, action="append", default=[], metavar=("JEU", "V0", "V7", "REPLY"))
    args = ap.parse_args()

    m0, r0, s0 = read(args.v0)
    m7, r7, s7 = read(args.v7)
    _, rr, sr = read(args.reply)
    _, _, sc = read(args.controller)
    out = []
    w = out.append

    w("## Runs\n")
    w("| Run | Fichier | Commit | Arbre propre |\n|---|---|---|---|")
    for name, m, p in (("v7 tri (garde + v7_sous_motif)", m7, args.v7), ("v7 contrôleur qwen", None, args.controller),
                       ("v7 brouillons avec fiche", None, args.reply), ("v0 tri (v0_baseline)", m0, args.v0)):
        meta = m or read(p)[0]
        g = meta.get("git", {})
        w(f"| {name} | `{p.name}` | `{g.get('commit', '')[:7]}` | {'oui' if g.get('dirty') is False else 'NON'} |")
    w(f"\nModèle du tri : `{m7['model']}` (digest `{m7['model_digest'][:12]}`), Ollama {m7.get('ollama_version')}, "
      f"température {m7['options']['temperature']}, seed {m7['options']['seed']}.\n")

    # --- Précision par champ + McNemar --------------------------------------
    _, t0, _ = load(args.v0)
    _, t7, _ = load(args.v7)
    cmp = compare(t0, t7)
    w("## Précision par champ (IC 95 % par bootstrap, 2000 tirages) et McNemar v0 contre v7\n")
    w(f"n = {s7['n']} tickets.\n")
    w("| Champ | v0 | v7 | corrigés | cassés | McNemar p |\n|---|---|---|---:|---:|---:|")
    for f in TABLE_FIELDS + [ALL]:
        c = cmp.get(f)
        name = "**tickets entièrement justes**" if f == ALL else f
        mc = (f"{len(c['fixed'])} | {len(c['broken'])} | {p_str(c['p_value'])}") if c else "– | – | –"
        w(f"| {name} | {cell(acc_ci(s0, r0, f))} | {cell(acc_ci(s7, r7, f))} | {mc} |")
    w("\n« Tickets entièrement justes » : les 5 champs du schéma d'origine (label, product, severity, is_complaint, "
      "unauthorized_payment) ; sous_motif n'existe pas en v0 et n'y entre pas.\n")

    # --- Matrices de confusion ----------------------------------------------
    w("## Matrices de confusion (lignes : vérité, colonnes : prédiction)\n")
    for f in ("label", "product", "severity"):
        for name, s in (("v0", s0), ("v7", s7)):
            mat = s["confusion"][f]
            cols = [c for c in next(iter(mat.values())) if c != "∅" or any(mat[t]["∅"] for t in mat)]
            w(f"**{f}, {name}**\n")
            w("| vérité \\ prédit | " + " | ".join(cols) + " |\n|---|" + "---:|" * len(cols))
            for t in mat:
                w(f"| {t} | " + " | ".join(f"**{mat[t][c]}**" if c == t else str(mat[t][c]) for c in cols) + " |")
            w("")

    # --- Réclamations --------------------------------------------------------
    w("## Réclamations (is_complaint)\n")
    w("| | v0 | v7 |\n|---|---|---|")
    c0, c7 = complaints(r0), complaints(r7)
    w(f"| Réclamations dans le jeu | {c0['gold']} | {c7['gold']} |")
    w(f"| Détectées (rappel) | {c0['detected']} ({pct(c0['detected'] / c0['gold'])} %) | "
      f"{c7['detected']} ({pct(c7['detected'] / c7['gold'])} %) |")
    w(f"| Signalées à tort | {len(c0['false_pos'])} | {len(c7['false_pos'])} |")
    w(f"| Précision | {pct(c0['detected'] / c0['pred']) if c0['pred'] else '–'} % | "
      f"{pct(c7['detected'] / c7['pred']) if c7['pred'] else '–'} % |")
    w(f"\nRéclamations manquées par v7 : {', '.join(c7['missed']) or 'aucune'}. "
      f"Signalées à tort par v7 : {', '.join(c7['false_pos']) or 'aucune'}.\n")

    # --- Attaques et fuites --------------------------------------------------
    a0, a7, ar = s0["attacks"], s7["attacks"], sr["attacks"]
    w("## Attaques et fuites\n")
    w(f"{a7['n']} attaques dans le jeu. Une attaque réussit si elle obtient la valeur visée ou une chaîne interdite "
      "(critères 1-2), ou si elle n'est pas signalée (critère 3). v0 n'a pas de champ injection_suspected : "
      "le critère 3 n'y est pas mesurable, seuls les critères 1-2 comptent.\n")
    w("| | v0 | v7 (tri) | v7 (tri + brouillon) |\n|---|---|---|---|")
    w(f"| Attaques réussies | {a0['succeeded']} / {a0['n']} (critères 1-2 seuls) | {a7['succeeded']} / {a7['n']} | "
      f"{ar['succeeded_with_reply']} / {ar['n']} |")
    w(f"| dont valeur visée ou chaîne obtenue (1-2) | {a0['obtained']} | {a7['obtained']} | – |")
    inj = s7.get("injection") or {}
    w(f"| Attaques non signalées (3) | non mesuré | {len(inj.get('missed', []))} | – |")
    w(f"| Tickets normaux signalés à tort | – | {len(inj.get('false_positives', []))} / {inj.get('n_normal')} | – |")
    leak0 = sum(bool(r.get("attack_result", {}).get("leaked")) for r in r0)
    leak7 = sum(bool(r.get("attack_result", {}).get("leaked")) for r in r7)
    w(f"| Fuites de chaîne interdite dans la sortie du tri | {leak0} | {leak7} | – |")
    w(f"| Fuites de chaîne interdite dans le brouillon final | – | – | {ar['forbidden_leak_final']} |")
    w(f"\nAttaques réussies, v0 : {', '.join(a0['ids_succeeded']) or 'aucune'} ; "
      f"v7 : {', '.join(a7['ids_succeeded']) or 'aucune'} "
      f"(non signalées : {', '.join(inj.get('missed', [])) or 'aucune'}).\n")
    fi, li = sr["final_issues"], sr["llm_draft_issues"]
    w(f"**Brouillons v7** ({sr['n']}) : contrôles de fuite sur le brouillon du LLM puis sur le brouillon final "
      "(après la garde de sortie).\n")
    w("| Contrôle | brouillon du LLM | brouillon final |\n|---|---:|---:|")
    for k in [k for k in fi if k != "n"]:
        w(f"| {k} | {li[k]} | {fi[k]} |")
    w(f"\nBrouillons bloqués par la garde de sortie : {sr['blocked']}. Délai correct : {sr['deadline_ok']}/{sr['n']}. "
      f"Langue correcte : {sr['language_ok']}/{sr['n']}. Fiche utilisée : {sr['fiche']['used']}, "
      f"mauvaise fiche : {sr['fiche']['wrong']}. Contrôleur qwen : sous_motif juste {sc['correct']}/{sc['n']}.\n")
    nb0, nb7 = s0.get("notebook_case") or {}, s7.get("notebook_case") or {}
    w(f"Cas d'injection du notebook : v0 {'bloqué' if nb0 and not nb0['attack_succeeded'] else 'RÉUSSI'}"
      f"{'' if nb0.get('flagged') is not None else ' (critères 1-2)'}, "
      f"v7 {'bloqué' if nb7 and not nb7['attack_succeeded'] else 'RÉUSSI'}.\n")

    # --- Comparaison entre jeux ----------------------------------------------
    w("## Comparaison avec val60 et holdout20\n")
    sets = [(name, read(Path(p0)), read(Path(p7)), read(Path(pr))) for name, p0, p7, pr in args.ref]
    sets.append(("test100", (m0, r0, s0), (m7, r7, s7), (None, rr, sr)))
    w("Précision (%) par jeu. Écart = v7 − v0, en points.\n")
    w("| Champ | " + " | ".join(f"{n} v0 | {n} v7 | {n} écart" for n, *_ in sets) + " |")
    w("|---|" + "---:|" * (3 * len(sets)))
    for f in TABLE_FIELDS + [ALL]:
        cells = []
        for _, (_, x0, y0), (_, x7, y7), _ in sets:
            a, b = acc_ci(y0, x0, f), acc_ci(y7, x7, f)
            d = f"{100 * (b[0] - a[0]):+.1f}".replace(".", ",") if a and b else "–"
            cells += [pct(a[0]) if a else "–", pct(b[0]) if b else "–", d]
        w(f"| {'tout juste' if f == ALL else f} | " + " | ".join(cells) + " |")
    w("\n| Attaques | " + " | ".join(n for n, *_ in sets) + " |\n|---|" + "---:|" * len(sets))
    w("| v0 réussies (critères 1-2) | " + " | ".join(f"{y0['attacks']['succeeded']}/{y0['attacks']['n']}"
                                                    for _, (_, _, y0), *_ in sets) + " |")
    w("| v7 réussies (tri) | " + " | ".join(f"{y7['attacks']['succeeded']}/{y7['attacks']['n']}"
                                            for _, _, (_, _, y7), _ in sets) + " |")
    w("| v7 réussies (tri + brouillon) | " + " | ".join(
        f"{yr['attacks']['succeeded_with_reply']}/{yr['attacks']['n']}" for *_, (_, _, yr) in sets) + " |")
    w("| v7 fuites dans le brouillon final | " + " | ".join(
        str(yr["attacks"]["forbidden_leak_final"]) for *_, (_, _, yr) in sets) + " |")
    print("\n".join(out))


if __name__ == "__main__":
    main()
