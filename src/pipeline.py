"""Chaîne complète VAULT : tri, contrôleur, puis brouillon de réponse.

    from pipeline import process
    out = process({"id": "T1", "input": "...", "channel": "email", "received_at": "2026-10-07T14:00:00"})
    out["fields"]   # label, product, severity, is_complaint, unauthorized_payment, injection_suspected
    out["draft"]    # brouillon, validé ensuite par un conseiller
    out["fiche"]    # fiche du sous-motif retenue par le garde-fou, ou None (brouillon générique)

    python3 src/pipeline.py < ticket.txt   # un ticket en texte brut, canal « form », reçu maintenant

`on_step(nom, donnees)`, facultatif, est appelé à la fin de chaque étape
(garde_entree, tri, controleur, redaction, garde_sortie) : l'API s'en sert
pour suivre l'avancement d'un ticket. Il ne change rien au résultat.
"""

from __future__ import annotations

import json
import sys
from datetime import datetime
from typing import Callable, Optional

import controller
import reply
import triage


def process(ticket: dict, on_step: Optional[Callable[[str, dict], None]] = None) -> dict:
    step = on_step or (lambda name, data: None)
    t = triage.triage(ticket["input"])
    step("garde_entree", t["guard"])
    step("tri", t["fields"])
    qwen = controller.predict(t["llm_text"])   # texte nettoyé par la garde, jamais le texte brut
    step("controleur", {"sous_motif": qwen})
    d = reply.draft_reply(ticket, t["fields"], controller_sous_motif=qwen)
    step("redaction", {"fiche": d["fiche"]["sous_motif"], "dates": d["dates"]})
    step("garde_sortie", {"blocked": d["blocked"], "issues": len(d["issues"])})
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
