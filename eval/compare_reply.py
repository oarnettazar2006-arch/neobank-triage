"""Comparaison appariée de deux runs de eval/run_reply.py sur le même jeu.

Usage :
    python eval/compare_reply.py eval/results/AVANT_reply.jsonl eval/results/APRES_reply.jsonl

Pour chaque vérification binaire du brouillon (délai, langue, brouillon final
propre, brouillon du LLM non bloqué) : corrigés, cassés, McNemar exact
(eval/compare.py). Puis les attaques réussies (tri + brouillon) avant / après,
et, pour le run avec fiche, les mesures du garde-fou.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from compare import mcnemar_exact  # noqa: E402

CHECKS = {
    "délai correct": lambda r: r["deadline_ok"],
    "langue correcte": lambda r: r["language_ok"],
    "brouillon final propre": lambda r: not r["final_issues"],
    "brouillon du LLM non bloqué": lambda r: not r["blocked"],
}


def load(path: Path) -> tuple[dict, dict]:
    rows, summary = {}, {}
    for rec in map(json.loads, path.read_text(encoding="utf-8").splitlines()):
        if rec["type"] == "reply":
            rows[rec["id"]] = rec
        elif rec["type"] == "summary":
            summary = rec
    return rows, summary


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("before", type=Path)
    ap.add_argument("after", type=Path)
    args = ap.parse_args()
    (b, sb), (a, sa) = load(args.before), load(args.after)
    if sorted(b) != sorted(a):
        sys.exit("les deux runs ne portent pas sur les mêmes tickets")
    ids = sorted(b)
    print(f"{len(ids)} brouillons")
    for name, ok in CHECKS.items():
        fixed = [i for i in ids if not ok(b[i]) and ok(a[i])]
        broken = [i for i in ids if ok(b[i]) and not ok(a[i])]
        print(f"  {name:<28} {sum(ok(b[i]) for i in ids):>3} → {sum(ok(a[i]) for i in ids):>3}  "
              f"corrigés {len(fixed)} cassés {len(broken)}  p = {mcnemar_exact(len(fixed), len(broken)):.3f}"
              f"{'  cassés : ' + ', '.join(broken) if broken else ''}")
    att = [i for i in ids if b[i]["attack"]]
    if att:
        s = lambda rows: [i for i in att if rows[i]["attack_with_reply"]["succeeded"]]
        print(f"  attaques réussies (tri + brouillon) : {len(s(b))} → {len(s(a))} / {len(att)}"
              f"  avant {s(b)}  après {s(a)}")
    leaks = [i for i in ids if a[i]["forbidden_leak_final"] or a[i]["final_issues"]]
    print(f"  fuites dans les brouillons après (chaîne interdite, nom, numéro, montant, promesse, lien) : {len(leaks)} {leaks}")
    f = sa.get("fiche")
    if f:
        n = len(ids)
        print(f"  accord llama / qwen : {f['agree']}/{n}  dont sous_motif juste : {f['agree_correct']}/{f['agree']}")
        print(f"  brouillons avec fiche : {f['used']}/{n}  avec une mauvaise fiche : {f['wrong']}/{n} "
              f"({f['wrong']}/{f['used'] or 1} des fiches)  raisons : {f['reasons']}")
        for i in ids:
            if a[i]["wrong_fiche"]:
                print(f"    mauvaise fiche {i} : {a[i]['fiche']} au lieu de {a[i]['gold_sous_motif']}")


if __name__ == "__main__":
    main()
