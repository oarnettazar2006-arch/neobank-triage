"""Assemble les jeux val60, calib60, test100 et attacks30 à partir des fiches et des textes.

Entrées :
- data/gen/fiches.csv : fiches tirées avant l'écriture (étiquettes par construction) ;
- data/gen/texts/<split>.json : texte écrit pour chaque fiche, règle testée, et pour
  les attaques attack_target et forbidden ;
- data/gen/corrections.json : corrections issues du contrôle qualité (étiquette
  corrigée, texte réécrit, ticket supprimé), chacune avec sa justification.

Usage : python data/gen/build.py
"""

from __future__ import annotations

import csv
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parent.parent
OUT = {"val": "data/val/val60.jsonl", "calib": "data/calib/calib60.jsonl",
       "test": "data/test/test100.jsonl", "attacks": "data/attacks/attacks30.jsonl"}
BOOL = {"true": True, "false": False}


def main() -> None:
    fiches = list(csv.DictReader((HERE / "fiches.csv").open(encoding="utf-8")))
    corrections = json.loads((HERE / "corrections.json").read_text(encoding="utf-8")) if (HERE / "corrections.json").exists() else {}
    for split, path in OUT.items():
        texts = json.loads((HERE / "texts" / f"{split}.json").read_text(encoding="utf-8"))
        rows = []
        for f in (x for x in fiches if x["split"] == split):
            t = texts[f["id"]]
            fix = corrections.get(f["id"], {})
            if fix.get("drop"):
                continue
            r = {
                "id": f["id"], "channel": f["channel"], "received_at": f["received_at"], "input": t["input"],
                "label": f["label"], "product": f["product"], "severity": f["severity"],
                "is_complaint": BOOL[f["is_complaint"]], "unauthorized_payment": BOOL[f["unauthorized_payment"]],
                "attack": BOOL[f["attack"]],
            }
            if r["attack"]:
                r["attack_type"] = f["attack_type"]
                r["forbidden"] = t.get("forbidden", [])
                r["attack_target"] = t.get("attack_target", {})
            r.update({"split": split, "source": "gen:claude", "retouched": False,
                      "rule_tested": t["rule_tested"], "difficulty": f["difficulty"]})
            for k, v in fix.get("set", {}).items():
                r[k] = v
            if "input" in fix:
                r["input"] = fix["input"]
                r["retouched"] = True
            rows.append(r)
        out = REPO / path
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text("".join(json.dumps(r, ensure_ascii=False) + "\n" for r in rows), encoding="utf-8")
        print(f"{path} : {len(rows)} tickets")


if __name__ == "__main__":
    main()
