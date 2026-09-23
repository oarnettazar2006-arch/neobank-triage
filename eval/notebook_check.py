"""Note l'adaptateur src/notebook.py comme le fait le notebook du cours.

Usage :
    python eval/notebook_check.py --data data/dev/dev40.jsonl [--expect eval/results/<run --guard>.jsonl]

Reproduit `print_report(run_eval(cases, classify, scorer=exact))` : les cas
sont {"input", "expected": label}, le score est l'égalité exacte. Ajoute
l'exactitude de product et severity (extract) et le cas d'injection du
notebook. Avec --expect, vérifie que l'adaptateur donne exactement les
prédictions d'un run du harnais (même chaîne, même modèle).
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO / "src"))
from notebook import classify, extract  # noqa: E402


def exact(pred: str, expected: str) -> bool:
    return pred.strip().lower() == expected.strip().lower()


def run_eval(cases: list[dict], fn, scorer) -> list[dict]:
    return [{**c, "pred": fn(c["input"]), "ok": scorer(fn(c["input"]), c["expected"])} for c in cases]


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--data", required=True, type=Path)
    ap.add_argument("--expect", type=Path, help="run du harnais (--guard) dont les prédictions doivent être retrouvées")
    args = ap.parse_args()

    tickets = [json.loads(l) for l in args.data.read_text(encoding="utf-8").splitlines() if l.strip()]
    cases = [{"id": t["id"], "input": t["input"], "expected": t["label"]} for t in tickets]
    results = run_eval(cases, classify, scorer=exact)
    acc = sum(r["ok"] for r in results) / len(results)
    print(f"classify (notebook, scorer=exact) : {sum(r['ok'] for r in results)}/{len(results)} = {acc:.1%}")
    for f in ("product", "severity"):
        ok = sum(extract(t["input"])[f] == t[f] for t in tickets)
        print(f"extract {f:<9}: {ok}/{len(tickets)} = {ok / len(tickets):.1%}")
    nb = json.loads((REPO / "data/attacks/notebook_case.jsonl").read_text(encoding="utf-8").splitlines()[0])
    print(f"cas d'injection du notebook : classify -> {classify(nb['input'])!r} (attendu {nb['label']!r})")

    if args.expect:
        preds = {r["id"]: r["pred"] for r in (json.loads(l) for l in args.expect.read_text(encoding="utf-8").splitlines())
                 if r["type"] == "ticket"}
        same = sum(classify(t["input"]) == preds[t["id"]]["label"]
                   and extract(t["input"]) == {k: preds[t["id"]][k] for k in ("product", "severity")} for t in tickets)
        print(f"identique au run {args.expect.name} : {same}/{len(tickets)}")
        if same != len(tickets):
            sys.exit(1)


if __name__ == "__main__":
    main()
