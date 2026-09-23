"""Comparaison appariée de deux runs de eval/run.py sur le même jeu.

Usage :
    python eval/compare.py eval/results/AVANT.jsonl eval/results/APRES.jsonl [--markdown]

Pour chaque champ, et pour « ticket entièrement juste » :
- corrigés : faux avant, juste après ;
- cassés : juste avant, faux après ;
- test de McNemar exact (binomial bilatéral sur corrigés + cassés).
Puis, ticket par ticket, les attaques dont le verdict change (critères 1-2 :
valeur visée ou chaîne interdite obtenue ; critère 3 : tentative signalée).
Aucune dépendance hors bibliothèque standard.
"""

from __future__ import annotations

import argparse
import json
import sys
from math import comb
from pathlib import Path

FIELDS = ["label", "product", "severity", "is_complaint", "unauthorized_payment"]
EXTRA = ["sous_motif"]  # comparé seulement si les deux runs le notent ; hors « tous les champs »
ALL = "tous les champs"


def load(path: Path) -> tuple[dict, dict, dict]:
    meta, tickets, attacks = {}, {}, {}
    for line in path.read_text(encoding="utf-8").splitlines():
        rec = json.loads(line)
        if rec["type"] == "meta":
            meta = rec
        elif rec["type"] == "ticket":
            hits = dict(rec["hits"])
            hits[ALL] = int(all(rec["hits"][f] for f in FIELDS))
            tickets[rec["id"]] = hits
            if rec.get("attack_result"):
                a = rec["attack_result"]
                attacks[rec["id"]] = {"obtained": a.get("obtained", a["attack_succeeded"]), "flagged": a.get("flagged")}
    return meta, tickets, attacks


def mcnemar_exact(b: int, c: int) -> float:
    """p-valeur bilatérale exacte : sous H0, b suit une loi binomiale(b + c, 1/2)."""
    n = b + c
    if n == 0:
        return 1.0
    k = min(b, c)
    return min(1.0, 2 * sum(comb(n, i) for i in range(k + 1)) / 2 ** n)


def compare(before: dict, after: dict) -> dict:
    ids = sorted(before)
    out = {}
    extra = [f for f in EXTRA if all(f in before[i] and f in after[i] for i in ids)]
    for f in FIELDS + extra + [ALL]:
        fixed = [i for i in ids if not before[i][f] and after[i][f]]
        broken = [i for i in ids if before[i][f] and not after[i][f]]
        out[f] = {
            "before": sum(before[i][f] for i in ids) / len(ids),
            "after": sum(after[i][f] for i in ids) / len(ids),
            "fixed": fixed,
            "broken": broken,
            "p_value": mcnemar_exact(len(fixed), len(broken)),
        }
    return out


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("before", type=Path)
    ap.add_argument("after", type=Path)
    ap.add_argument("--markdown", action="store_true", help="sortie en tableau Markdown")
    args = ap.parse_args()

    meta_a, before, att_a = load(args.before)
    meta_b, after, att_b = load(args.after)
    if set(before) != set(after):
        sys.exit("Les deux runs ne portent pas sur les mêmes tickets : comparaison appariée impossible.")
    if meta_a.get("data_sha256") != meta_b.get("data_sha256"):
        print("Attention : le fichier de données a changé entre les deux runs (sha256 différent).\n")

    res = compare(before, after)
    n = len(before)
    print(f"Avant : {meta_a.get('prompt_file')} ({meta_a.get('model')})")
    print(f"Après : {meta_b.get('prompt_file')} ({meta_b.get('model')})")
    print(f"n = {n} tickets appariés\n")
    if args.markdown:
        print("| Champ | Avant | Après | Corrigés | Cassés | p (McNemar exact) |")
        print("|---|---|---|---|---|---|")
        for f, r in res.items():
            print(f"| {f} | {r['before']:.1%} | {r['after']:.1%} | {len(r['fixed'])} | {len(r['broken'])} | {r['p_value']:.3f} |")
        print()
        for f, r in res.items():
            if r["fixed"] or r["broken"]:
                print(f"- **{f}** : corrigés {', '.join(r['fixed']) or '-'} ; cassés {', '.join(r['broken']) or '-'}")
    else:
        print(f"  {'champ':<22} {'avant':>7} {'après':>7} {'corrigés':>9} {'cassés':>7} {'p':>7}")
        for f, r in res.items():
            print(f"  {f:<22} {r['before']:>7.1%} {r['after']:>7.1%} {len(r['fixed']):>9} {len(r['broken']):>7} {r['p_value']:>7.3f}")
        print()
        for f, r in res.items():
            if r["fixed"] or r["broken"]:
                print(f"  {f} : corrigés {r['fixed']} ; cassés {r['broken']}")
    if att_a:
        show = lambda a: ("obtenue" if a["obtained"] else "bloquée") + ("" if a["flagged"] is None else (", signalée" if a["flagged"] else ", NON signalée"))
        print(f"\nAttaques (critères 1-2) : {sum(a['obtained'] for a in att_a.values())} → {sum(a['obtained'] for a in att_b.values())} sur {len(att_a)}")
        for i in sorted(att_a):
            a, b = att_a[i], att_b[i]
            mark = "  <-- change" if a["obtained"] != b["obtained"] else ""
            print(f"  {i}  avant : {show(a):<26} après : {show(b)}{mark}")


if __name__ == "__main__":
    main()
