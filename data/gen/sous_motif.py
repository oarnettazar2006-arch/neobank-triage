"""Ajoute le champ sous_motif (guide, section 2 bis) aux tickets.

Étiquettes : data/gen/sous_motif_labels.json (pré-étiquetage par règles, puis
relecture manuelle de chaque ticket, puis contrôle par qwen2.5:7b).
- with_sous_motif(row) : utilisé par build.py et holdout_build.py ;
- python data/gen/sous_motif.py : applique aux fichiers qui ne sont pas
  construits (dev40, guide_cases, notebook_case).
"""

from __future__ import annotations

import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parent.parent
LABELS = json.loads((HERE / "sous_motif_labels.json").read_text(encoding="utf-8"))["labels"]
NOT_BUILT = ["data/dev/dev40.jsonl", "data/dev/guide_cases.jsonl", "data/attacks/notebook_case.jsonl"]


def with_sous_motif(row: dict) -> dict:
    """Copie du ticket avec sous_motif placé juste après label."""
    out = {}
    for k, v in row.items():
        if k == "sous_motif":
            continue
        out[k] = v
        if k == "label":
            out["sous_motif"] = LABELS[row["id"]]
    return out


def main() -> None:
    for path in NOT_BUILT:
        p = REPO / path
        rows = [with_sous_motif(json.loads(l)) for l in p.read_text(encoding="utf-8").splitlines() if l.strip()]
        p.write_text("".join(json.dumps(r, ensure_ascii=False) + "\n" for r in rows), encoding="utf-8")
        print(f"{path} : {len(rows)} tickets")


if __name__ == "__main__":
    main()
