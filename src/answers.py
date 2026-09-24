"""Base de réponses : une fiche par sous-motif (docs/answers/<sous_motif>.md).

Seules les sections « Ce que VAULT répond » et « Ce que le client peut faire »
sont transmises au rédacteur. « Ce que VAULT ne dit jamais » sert à la
relecture humaine. Les fiches ne contiennent ni montant, ni promesse, ni
délai chiffré : les dates viennent de src/deadlines.py.

Garde-fou (choose) : une mauvaise fiche est pire qu'une réponse générique.
La fiche n'est utilisée que si le tri (llama) et le contrôleur (qwen) donnent
le même sous_motif, et que ce sous_motif est cohérent avec les champs du tri :
son label habituel (guide, section 2 bis) est le label prédit, et
operation_non_autorisee va de pair avec unauthorized_payment. Sinon : brouillon
générique.
"""

from __future__ import annotations

import re
from functools import lru_cache
from pathlib import Path

from schema import SOUS_MOTIF_LABEL

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


def choose(fields: dict, controller_sous_motif: str | None) -> dict:
    """Garde-fou : {"sous_motif": fiche retenue ou None, "reason": pourquoi}."""
    sm = fields.get("sous_motif")
    if controller_sous_motif is None or sm is None:
        reason = "pas de contrôleur" if controller_sous_motif is None else "pas de sous_motif prédit"
    elif sm != controller_sous_motif:
        reason = "désaccord"
    elif SOUS_MOTIF_LABEL[sm] != fields["label"]:
        reason = "incohérent avec label"
    elif (sm == "operation_non_autorisee") != bool(fields["unauthorized_payment"]):
        reason = "incohérent avec unauthorized_payment"
    else:
        return {"sous_motif": sm, "reason": "accord"}
    return {"sous_motif": None, "reason": reason}
