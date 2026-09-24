"""Contrôleur qwen2.5:7b : sous_motif prédit sur le texte nettoyé par la garde.

Usage :
    python eval/run_controller.py --data data/val/val60.jsonl

Même entrée que le tri en production : le texte passé par la garde d'entrée
(src/guard.py), jamais le texte brut. Refuse calib60 et test100.
Résultats : eval/results/<horodatage>_controller_qwen2.5-7b_<jeu>.jsonl, lus
ensuite par eval/run_reply.py --controller.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import subprocess
import sys
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO / "src"))
import controller  # noqa: E402
from guard import guard  # noqa: E402

RESERVED = {"calib60", "test100"}


def git_info() -> dict:
    run = lambda *a: subprocess.run(["git", *a], cwd=REPO, capture_output=True, text=True).stdout.strip()
    return {"commit": run("rev-parse", "HEAD"), "dirty": bool(run("status", "--porcelain"))}


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--data", required=True, type=Path)
    ap.add_argument("--out-dir", type=Path, default=REPO / "eval" / "results")
    args = ap.parse_args()
    if args.data.stem in RESERVED:
        sys.exit(f"{args.data.stem} est réservé : le contrôleur n'y tourne pas.")

    tickets = [json.loads(l) for l in args.data.read_text(encoding="utf-8").splitlines() if l.strip()]
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    out_path = args.out_dir / f"{stamp}_controller_{controller.MODEL.replace(':', '-')}_{args.data.stem}.jsonl"
    meta = {"type": "meta", "model": controller.MODEL, "options": controller.OPTIONS,
            "prompt_sha256": hashlib.sha256(controller.prompt().encode()).hexdigest(),
            "input": "texte nettoyé par la garde (src/guard.py)", "data_file": str(args.data),
            "git": git_info(), "started_at": datetime.now(timezone.utc).isoformat()}
    ok = 0
    with out_path.open("w", encoding="utf-8") as out:
        out.write(json.dumps(meta, ensure_ascii=False) + "\n")
        for k, t in enumerate(tickets, 1):
            g = guard(t["input"])
            pred = controller.predict(g.cleaned, keep_alive="5m")
            ok += pred == t["sous_motif"]
            out.write(json.dumps({"type": "ticket", "id": t["id"], "gold": t["sous_motif"], "qwen": pred,
                                  "guard_flagged": g.flagged}, ensure_ascii=False) + "\n")
            print(f"  [{k:>3}/{len(tickets)}] {t['id']} {pred}{'' if pred == t['sous_motif'] else '  ≠ ' + t['sous_motif']}", flush=True)
        out.write(json.dumps({"type": "summary", "n": len(tickets), "correct": ok}) + "\n")
    # Décharge qwen : jamais deux modèles en mémoire.
    req = urllib.request.Request(controller.HOST + "/api/generate", method="POST",
                                 data=json.dumps({"model": controller.MODEL, "keep_alive": 0}).encode())
    urllib.request.urlopen(req, timeout=60).read()
    print(f"sous_motif juste : {ok}/{len(tickets)} → {out_path.relative_to(REPO)}")


if __name__ == "__main__":
    main()
