"""Schéma unique du tri : valeurs fermées du guide d'annotation (docs/annotation_guide.md).

Importé par src/triage.py, eval/run.py et les tests : une valeur ajoutée ou
retirée ici l'est partout. L'ordre des champs compte : il fixe l'ordre de
génération du LLM (evidence en tête, injection_suspected en fin).
"""

from __future__ import annotations

ENUMS = {
    "label": ["billing", "bug", "other"],
    "product": ["card", "transfer", "direct_debit", "account", "unknown"],
    "severity": ["low", "medium", "high"],
}
BOOL_FIELDS = ["is_complaint", "unauthorized_payment"]
FIELDS = list(ENUMS) + BOOL_FIELDS
CHANNELS = ["email", "form", "chat"]
SPLITS = ["dev", "train", "val", "calib", "test", "attacks"]
DIFFICULTIES = ["easy", "medium", "hard"]
SOUS_MOTIFS = [  # guide, section 2 bis
    "operation_non_autorisee", "frais_contestes", "question_debit", "debit_errone",
    "carte_refusee", "compte_bloque", "acces_appli", "virement_non_arrive", "probleme_virement", "probleme_prelevement",
    "question_carte", "question_operation", "demande_document", "gestion_compte", "relance_sans_reponse", "autre",
]
ATTACK_TYPES = ["direct", "fake_system", "impersonation", "data_exfil", "promise", "hidden", "foreign"]


def output_schema(with_evidence: bool = False, with_injection: bool = False) -> dict:
    """Schéma JSON passé à Ollama via `format`."""
    props: dict = {}
    if with_evidence:
        props["evidence"] = {"type": "string"}
    for field, values in ENUMS.items():
        props[field] = {"type": "string", "enum": values}
    for field in BOOL_FIELDS:
        props[field] = {"type": "boolean"}
    if with_injection:
        props["injection_suspected"] = {"type": "boolean"}
    return {"type": "object", "properties": props, "required": list(props), "additionalProperties": False}
