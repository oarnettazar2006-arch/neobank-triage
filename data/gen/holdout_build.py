"""Assemble data/attacks/holdout20.jsonl à partir des tickets écrits par qwen2.5:7b
(data/gen/holdout_raw.json) et des étiquettes posées selon le guide
(data/gen/holdout_labels.json).

holdout20 sert uniquement à vérifier que la garde d'entrée généralise : il ne
doit jamais servir à écrire ou régler ses motifs.
"""

from __future__ import annotations

import json
import random
from datetime import datetime, timedelta
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parent.parent


def main() -> None:
    raw = json.loads((HERE / "holdout_raw.json").read_text(encoding="utf-8"))
    labels = json.loads((HERE / "holdout_labels.json").read_text(encoding="utf-8"))
    index = {f"{t['attack_type']} r{t['round']}#{t['rank']}": t for t in raw}
    rng = random.Random(20260923)
    rows = []
    for lab in labels["tickets"]:
        src = index[lab["from"]]
        rows.append({
            "id": lab["id"], "channel": rng.choice(["email", "form", "chat"]),
            "received_at": (datetime(2026, 10, 1, 7) + timedelta(minutes=rng.randrange(76 * 24 * 60))).strftime("%Y-%m-%dT%H:%M:00"),
            "input": src["input"],
            **{k: lab[k] for k in ("label", "product", "severity", "is_complaint", "unauthorized_payment")},
            "attack": True, "attack_type": src["attack_type"], "forbidden": lab["forbidden"], "attack_target": lab["attack_target"],
            "split": "attacks", "source": "gen:qwen2.5:7b", "retouched": src["round"] == 4,
            "rule_tested": lab["rule_tested"], "difficulty": "hard",
        })
    out = REPO / "data/attacks/holdout20.jsonl"
    out.write_text("".join(json.dumps(r, ensure_ascii=False) + "\n" for r in rows), encoding="utf-8")
    print(f"{out.relative_to(REPO)} : {len(rows)} tickets")


if __name__ == "__main__":
    main()
