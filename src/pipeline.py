"""Chaîne complète VAULT : tri, contrôleur, puis brouillon de réponse.

    from pipeline import process
    out = process({"id": "T1", "input": "...", "channel": "email", "received_at": "2026-10-07T14:00:00"})
    out["fields"]   # label, product, severity, is_complaint, unauthorized_payment, injection_suspected
    out["draft"]    # brouillon, validé ensuite par un conseiller
    out["fiche"]    # fiche du sous-motif retenue par le garde-fou, ou None (brouillon générique)

    python3 src/pipeline.py < ticket.txt   # un ticket en texte brut, canal « form », reçu maintenant
"""

from __future__ import annotations

import json
import sys
from datetime import datetime

import controller
import reply
import triage


def process(ticket: dict) -> dict:
    t = triage.triage(ticket["input"])
    qwen = controller.predict(t["llm_text"])   # texte nettoyé par la garde, jamais le texte brut
    d = reply.draft_reply(ticket, t["fields"], controller_sous_motif=qwen)
    return {
        "id": ticket.get("id"),
        "fields": t["fields"],
        "guard": t["guard"],
        "case": d["facts"]["cas"],
        "deadlines": d["facts"]["ce_qui_va_se_passer"],
        "controller_sous_motif": qwen,
        "fiche": d["fiche"]["sous_motif"],
        "fiche_reason": d["fiche"]["reason"],
        "draft": d["draft"],
        "dates": d["dates"],
        "draft_blocked": d["blocked"],
    }


if __name__ == "__main__":
    text = sys.stdin.read()
    now = datetime.now().replace(microsecond=0).isoformat()
    print(json.dumps(process({"input": text, "channel": "form", "received_at": now}), ensure_ascii=False, indent=1))
