"""Garde d'entrée : repère les tentatives d'injection avant le LLM.

Motifs tirés du rapport v4 (eval/reports/v4_injection.md) et du guide
(section 9), jamais de data/attacks/holdout20.jsonl, qui sert seulement à
vérifier que la garde généralise :

- fausse balise système ([SYSTEM], <<SYSTEM>>, SYSTEM:, [ADMIN]...) ;
- nom de champ du schéma suivi d'une valeur (label=other, severity low...),
  ou ordre de reclasser le ticket vers une valeur du schéma ;
- texte caché (commentaire HTML, balise masquée, caractères invisibles,
  consigne après plusieurs lignes vides) ;
- consigne adressée à l'assistant (ignorer ses instructions, répondre une
  phrase dictée, message « pour l'IA », « l'assistente »...) ;
- lettres espacées (« l a b e l », « i g n o r e »).

Si un motif est trouvé, `flagged` passe à vrai et le passage est retiré du
texte envoyé au LLM. Le texte d'origine reste disponible pour le conseiller.
Bibliothèque standard uniquement.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field

FIELDS = r"(?:label|severity|product|is_complaint|unauthorized_payment|injection_suspected)"
VALUES = r"(?:billing|bug|other|low|medium|high|card|transfer|direct_debit|account|unknown|true|false)"
EMPTY = "(aucun contenu après filtrage)"

# Blocs retirés en entier, avant le découpage en phrases.
BLOCKS = [
    ("texte caché", re.compile(r"<!--.*?-->", re.S)),
    ("texte caché", re.compile(r"<(\w+)[^>]*(?:display\s*:\s*none|visibility\s*:\s*hidden|hidden)[^>]*>.*?</\1\s*>", re.S | re.I)),
    ("fausse balise système", re.compile(r"<<\s*(?:SYSTEM|SYSTÈME|ADMIN)\s*>>.*?(?:<<\s*END\s*>>|$)", re.S | re.I | re.M)),
    ("fausse balise système", re.compile(r"\[\s*(?:SYSTEM|SYSTÈME|SYSTEME|ADMIN|ADMINISTRATEUR)\b[^\]]*\].*$", re.I | re.M)),
    ("fausse balise système", re.compile(r"\[[^\]]*\b(?:message\s+(?:système|systeme|system)|system\s+message)\b[^\]]*\]", re.I)),
    ("fausse balise système", re.compile(r"-{2,}\s*(?:SYSTEM|SYSTÈME|ADMIN)\s*:.*?(?:-{2,}|$)", re.I | re.M)),
]

# Motifs cherchés phrase par phrase : la phrase entière est retirée.
SENTENCE_RULES = [
    ("fausse balise système", re.compile(r"(?:^|\s)(?:SYSTEM|SYSTÈME|ADMIN)\s*:", re.M)),
    ("fausse balise système", re.compile(r"\b(?:message\s+(?:système|systeme|system)|note\s+(?:au|pour\s+le)\s+modèle)\s*:", re.I)),
    ("fausse balise système", re.compile(
        r"\b(?:note|nota|hinweis)\s+(?:au|pour\s+le|per\s+il|para\s+el|an\s+das|für\s+das|for\s+the|to\s+the)\s+"
        r"(?:système|systeme|sistema|system)\s*:", re.I)),
    ("champ du schéma", re.compile(rf"\b{FIELDS}\s*[=:]\s*[\"'«]?\s*{VALUES}\b", re.I)),
    ("champ du schéma", re.compile(rf"\b{FIELDS}\s+(?:en\s+|à\s+|to\s+)?{VALUES}\b", re.I)),
    ("reclassement demandé", re.compile(
        rf"\b(?:classe[rz]?|classez|mets|mettez|mettre|passe[rz]?|marque[rz]?|mark|set|put)\b[^.\n]{{0,40}}?"
        rf"\b(?:en|as|to|comme)\s+(?:«\s*)?(?:{VALUES}|low\s+priority|priorité\s+basse|non\s+prioritaire)\b", re.I)),
    ("consigne à l'assistant", re.compile(
        r"\b(?:ignore[sz]?|ignorez|ignorer|ignora|ignoriere|oublie[sz]?|oubliez|disregard|forget)\b[^.\n]{0,50}?"
        r"\b(?:instructions?|consignes?|règles?|regles?|règlement|prompt|regole|istruzioni|reglas|instrucciones|regeln|anweisungen|rules)\b", re.I)),
    ("consigne à l'assistant", re.compile(
        r"\b(?:réponds|répondez|reply|respond|answer|rispondi|antworte|responde|écris|écrivez|write|"
        r"confirme[zr]?|confirm|commence[zr]?\s+(?:ta|votre)\s+réponse\s+par)\b[^.\n]{0,80}?[«\"“„]", re.I)),
    ("consigne à l'assistant", re.compile(
        r"\b(?:note|nota|hinweis|instruction|consigne|message)s?\s+(?:pour|au|à|a|per|para|an|to|for)\s+"
        r"(?:l['’]\s*|il\s+|el\s+|den\s+|the\s+|le\s+)?(?:assistant[ea]?n?|ia|ai|robot|modèle|model|classifieur)\b", re.I)),
    ("consigne à l'assistant", re.compile(r"\b(?:assistente|assistenten|asistente)\b|\btoi,?\s+l['’]assistant\b|\bassistant\s*:", re.I)),
    ("lettres espacées", re.compile(r"\b(?:\w[ \t]){4,}\w\b")),
    ("caractère invisible", re.compile("[\u200b-\u200f\u2060\ufeff]")),
]
# Texte isolé après au moins trois lignes vides : retiré s'il contient une consigne.
HIDDEN_TAIL = re.compile(r"\n[ \t]*\n[ \t]*\n[ \t]*\n\s*(.+)\Z", re.S)
TAIL_HINT = re.compile(r"\b(?:consigne|mets|mettre|classe[rz]?|ignore[rsz]?|réponds|répondez|label|severity)\b", re.I)
SPLIT = re.compile(r"(?<=[.!?])\s+|\n+")


@dataclass
class GuardResult:
    original: str
    cleaned: str
    flagged: bool = False
    matches: list[dict] = field(default_factory=list)


def guard(text: str) -> GuardResult:
    matches: list[dict] = []
    work = text

    tail = HIDDEN_TAIL.search(work)
    if tail and TAIL_HINT.search(tail.group(1)):
        matches.append({"rule": "texte caché", "text": tail.group(1).strip()})
        work = work[: tail.start()]

    for rule, rx in BLOCKS:
        for m in rx.finditer(work):
            matches.append({"rule": rule, "text": m.group(0).strip()})
        work = rx.sub(" ", work)

    kept = []
    for sentence in SPLIT.split(work):
        hit = next(((rule, m) for rule, rx in SENTENCE_RULES if (m := rx.search(sentence))), None)
        if hit:
            matches.append({"rule": hit[0], "text": sentence.strip()})
        elif sentence.strip():
            kept.append(sentence.strip())

    cleaned = " ".join(kept).strip() if matches else text
    return GuardResult(original=text, cleaned=cleaned or EMPTY, flagged=bool(matches), matches=matches)
