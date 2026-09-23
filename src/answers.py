"""Base de réponses : une fiche par sous-motif (docs/answers/<sous_motif>.md).

Seules les sections « Ce que VAULT répond » et « Ce que le client peut faire »
sont transmises au rédacteur. « Ce que VAULT ne dit jamais » sert à la
relecture humaine. Les fiches ne contiennent ni montant, ni promesse, ni
délai chiffré : les dates viennent de src/deadlines.py.
"""

from __future__ import annotations

import re
from functools import lru_cache
from pathlib import Path

ANSWERS = Path(__file__).resolve().parent.parent / "docs" / "answers"


def _section(text: str, title: str) -> list[str]:
    m = re.search(rf"^## {re.escape(title)}\n(.*?)(?=^## |\Z)", text, re.M | re.S)
    items = re.findall(r"^- (.+)$", m.group(1), re.M) if m else []
    return [i for i in items if i != "Rien de particulier."]


@lru_cache(maxsize=None)
def load(sous_motif: str) -> dict:
    text = (ANSWERS / f"{sous_motif}.md").read_text(encoding="utf-8")
    situation = re.search(r"^## Situation\n\n(.+?)\n", text, re.M).group(1)
    return {"sous_motif": sous_motif, "situation": situation,
            "reponse": _section(text, "Ce que VAULT répond"),
            "client": _section(text, "Ce que le client peut faire"),
            "jamais": _section(text, "Ce que VAULT ne dit jamais")}


def for_writer(sous_motif: str) -> dict:
    """Ce que reçoit le rédacteur : la réponse type et les actions du client, rien d'autre."""
    card = load(sous_motif)
    return {"reponse_type": card["reponse"], "ce_que_le_client_peut_faire": card["client"]}
