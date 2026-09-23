"""draft_reply : brouillon de réponse au client, validé ensuite par un conseiller.

    from reply import draft_reply
    d = draft_reply(ticket, fields)
    # ticket : {"input": texte d'origine, "received_at": "2026-10-07T14:00:00", "channel": "email"}
    # fields : sortie validée du tri (label, product, severity, is_complaint,
    #          unauthorized_payment, injection_suspected)

Conception anti-injection (CaMeL simplifié) :
- le rédacteur (LLM) ne reçoit **jamais** le texte du ticket, ni un résumé :
  seulement des faits structurés à valeurs fermées (cas, produit, canal,
  langue) et les délais calculés en code (src/deadlines.py) ;
- la langue est détectée en code sur le texte d'origine et transmise comme
  valeur fermée (fr ou en) ;
- le texte d'origine ne sert qu'au code : détection de langue et garde de
  sortie (src/output_guard.py). Si la garde bloque le brouillon, un modèle
  fixe écrit en code le remplace.
Bibliothèque standard uniquement.
"""

from __future__ import annotations

import json
import os
import re
import urllib.request
from datetime import datetime
from pathlib import Path

import output_guard
from deadlines import compute_deadlines

REPO = Path(__file__).resolve().parent.parent
PROMPT = REPO / "prompts" / "reply_v1.txt"
PROMPTS = {"fr": PROMPT, "en": REPO / "prompts" / "reply_v1_en.txt"}
SIGNATURE = {"fr": "Cordialement,\nLe service client VAULT", "en": "Kind regards,\nVAULT customer service"}
# Lignes de fin que le modèle ajoute parfois malgré la consigne : retirées avant d'apposer la signature.
CLOSING_LINE = re.compile(r"^(?:cordialement|bien cordialement|bien à vous|kind regards|best regards|regards|sincerely|"
                          r"yours sincerely|le service client vault|vault customer service|l'équipe vault|the vault team|vault)"
                          r"[\s,.!]*$", re.I)
MODEL = os.environ.get("OLLAMA_MODEL", "llama3.1:8b")
HOST = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
OPTIONS = {"temperature": 0, "seed": 42}
SCHEMA = {"type": "object", "properties": {"brouillon": {"type": "string"}}, "required": ["brouillon"]}

EN_WORDS = {"the", "my", "i", "you", "is", "was", "and", "to", "for", "of", "it", "this", "have", "has", "me",
            "please", "can", "not", "with", "on", "in", "at", "but", "been", "your", "we", "are", "an", "be", "do"}
FR_WORDS = {"le", "la", "les", "de", "des", "du", "je", "j", "vous", "mon", "ma", "mes", "et", "est", "pas", "pour",
            "que", "qui", "sur", "avec", "une", "un", "dans", "ce", "cette", "il", "elle", "merci", "bonjour",
            "ne", "plus", "au", "aux", "en", "me", "moi", "votre", "vos", "c", "ai", "suis"}

PRODUCT = {"fr": {"card": "votre carte", "transfer": "votre virement", "direct_debit": "votre prélèvement",
                  "account": "votre compte", "unknown": "votre demande"},
           "en": {"card": "your card", "transfer": "your transfer", "direct_debit": "your direct debit",
                  "account": "your account", "unknown": "your request"}}
TEXTS = {
    "fr": {"block_card": "faire opposition sur la carte depuis l'application, si ce n'est pas déjà fait",
           "no_codes": "ne jamais communiquer ses codes ni ses identifiants, même à une personne qui se présente comme un conseiller VAULT",
           "in_writing": "formaliser sa réclamation par écrit, par email ou via le formulaire de contact, pour qu'elle soit enregistrée",
           "situation": {"operation_non_autorisee": "le client signale une opération de paiement qu'il n'a pas autorisée",
                         "reclamation": "le client exprime un mécontentement : c'est une réclamation",
                         "signalement": "le client signale un problème",
                         "question": "le client pose une question ou fait une demande"},
           "instruction": {"operation_non_autorisee": "dire que le signalement est pris en charge en priorité, donner la date, puis transmettre les consignes de sécurité",
                           "reclamation": "accuser réception de la réclamation, donner les dates et transmettre les consignes s'il y en a",
                           "signalement": "dire que le problème est transmis à un conseiller et donner la date",
                           "question": "dire que la demande est transmise à un conseiller et donner la date"},
           "kinds": {"remboursement": "traitement prioritaire du signalement par un conseiller, au plus tard le",
                     "accuse_reception": "accusé de réception de la réclamation, au plus tard le",
                     "reponse": "réponse à la réclamation, au plus tard le",
                     "objectif_interne": "réponse d'un conseiller, au plus tard le"}},
    "en": {"block_card": "block the card from the app, if not already done",
           "no_codes": "never share codes or login details, even with someone claiming to work for VAULT",
           "in_writing": "send the complaint in writing, by email or through the contact form, so that it can be registered",
           "situation": {"operation_non_autorisee": "the customer reports a payment they did not authorise",
                         "reclamation": "the customer is dissatisfied: this is a complaint",
                         "signalement": "the customer reports a problem",
                         "question": "the customer asks a question or makes a request"},
           "instruction": {"operation_non_autorisee": "say the report is being handled as a priority, give the date, then pass on the security instructions",
                           "reclamation": "acknowledge the complaint, give the dates and pass on the instructions if there are any",
                           "signalement": "say the problem has been passed on to an advisor and give the date",
                           "question": "say the request has been passed on to an advisor and give the date"},
           "kinds": {"remboursement": "priority handling of the report by an advisor, by",
                     "accuse_reception": "acknowledgement of the complaint, by",
                     "reponse": "answer to the complaint, by",
                     "objectif_interne": "answer from an advisor, by"}},
}
MONTHS_FR = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre",
             "novembre", "décembre"]
DAYS_FR = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"]


def detect_language(text: str) -> str:
    """fr ou en, par comptage de mots-outils. Le franglais et les autres langues restent en fr."""
    words = re.findall(r"[a-zà-ÿ]+", text.lower())
    en = sum(w in EN_WORDS for w in words)
    fr = sum(w in FR_WORDS for w in words)
    return "en" if en >= 2 and en > fr else "fr"


def format_date(d: datetime, lang: str) -> str:
    if lang == "en":
        return d.strftime("%A %d %B %Y").replace(" 0", " ")
    return f"{DAYS_FR[d.weekday()]} {d.day} {MONTHS_FR[d.month - 1]} {d.year}"


def case_of(fields: dict) -> str:
    if fields["unauthorized_payment"]:
        return "operation_non_autorisee"
    if fields["is_complaint"]:
        return "reclamation"
    return "question" if fields["label"] == "other" else "signalement"


def build_facts(ticket: dict, fields: dict) -> dict:
    """Faits structurés transmis au rédacteur : aucune donnée du texte du ticket."""
    lang = detect_language(ticket["input"])
    received = datetime.fromisoformat(ticket["received_at"])
    ds = compute_deadlines(received, fields["is_complaint"], fields["unauthorized_payment"],
                           fields["product"], ticket["channel"])
    case = case_of(fields)
    t = TEXTS[lang]
    actions = []
    if case == "operation_non_autorisee":
        if fields["product"] == "card":
            actions.append(t["block_card"])
        actions.append(t["no_codes"])
    if fields["is_complaint"] and ticket["channel"] == "chat":
        actions.append(t["in_writing"])
    kinds = t["kinds"]
    return {
        "langue": lang,
        "situation": t["situation"][case],
        "consigne": t["instruction"][case],
        "cas": case,
        "motif": fields["label"],
        "sujet": PRODUCT[lang][fields["product"]],
        "urgent": fields["severity"] == "high",
        "canal": ticket["channel"],
        "ce_qui_va_se_passer": [{"etape": kinds[d.kind], "date": format_date(d.due, lang)} for d in ds],
        "ce_que_le_client_doit_faire": actions,
    }


def fallback(facts: dict) -> str:
    """Brouillon fixe écrit en code, utilisé si la garde de sortie bloque le brouillon du LLM."""
    steps = facts["ce_qui_va_se_passer"]
    if facts["langue"] == "en":
        body = ["Hello,", f"Thank you for your message about {facts['sujet']}. It has been passed on to an advisor."]
        body += [f"You will receive an answer by {s['date']}." for s in steps[:1]]
        if facts["cas"] == "operation_non_autorisee":
            body.append("For your security, never share your codes or passwords, even with someone claiming to work for VAULT.")
        if facts["cas"] == "reclamation" and facts["canal"] == "chat":
            body.append("Please also send your complaint in writing, by email or through the contact form, so that it can be registered.")
        body.append(SIGNATURE["en"])
    else:
        body = ["Bonjour,", f"Nous avons bien reçu votre message concernant {facts['sujet']}. Il a été transmis à un conseiller."]
        body += [f"Vous recevrez une réponse au plus tard le {s['date']}." for s in steps[:1]]
        body += [f"Nous vous invitons à {a}." for a in facts["ce_que_le_client_doit_faire"]]
        body.append(SIGNATURE["fr"])
    return "\n".join(body)


WRITER_KEYS = ["situation", "consigne", "sujet", "urgent", "ce_qui_va_se_passer", "ce_que_le_client_doit_faire"]


def write(facts: dict, model: str = MODEL, host: str = HOST, prompt_path: Path | None = None) -> str:
    """Le rédacteur ne reçoit que WRITER_KEYS : ni codes techniques, ni texte du ticket."""
    prompt_path = prompt_path or PROMPTS[facts["langue"]]
    sent = {k: facts[k] for k in WRITER_KEYS}
    prompt = prompt_path.read_text(encoding="utf-8").replace("{faits}", json.dumps(sent, ensure_ascii=False, indent=1))
    payload = {"model": model, "messages": [{"role": "user", "content": prompt}], "format": SCHEMA,
               "stream": False, "options": OPTIONS}
    req = urllib.request.Request(host.rstrip("/") + "/api/chat", data=json.dumps(payload).encode(),
                                 headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req, timeout=600) as resp:
        text = json.loads(json.loads(resp.read())["message"]["content"])["brouillon"].strip()
    # La signature est ajoutée en code : on retire celle que le modèle aurait écrite malgré la consigne.
    lines = text.rstrip().split("\n")
    while lines and (not lines[-1].strip() or CLOSING_LINE.match(lines[-1].strip())):
        lines.pop()
    body = "\n".join(lines)
    for tail in ("Le service client VAULT.", "Le service client VAULT", "VAULT customer service.", "VAULT customer service"):
        if body.rstrip().endswith(tail):
            body = body.rstrip()[: -len(tail)]
    return body.rstrip() + "\n\n" + SIGNATURE[facts["langue"]]


def normalize(text: str) -> str:
    """Pour comparer les dates : minuscules, sans ponctuation ni espaces multiples."""
    return " ".join(re.sub(r"[^\w\s]", " ", text.lower()).split())


def draft_reply(ticket: dict, fields: dict, forbidden: list[str] | None = None, **llm) -> dict:
    """Brouillon final, brouillon du LLM, faits transmis et violations relevées par la garde de sortie."""
    facts = build_facts(ticket, fields)
    llm_draft = write(facts, **llm)
    allowed = " ".join(s["date"] for s in facts["ce_qui_va_se_passer"])
    issues = output_guard.check(llm_draft, ticket["input"], allowed_text=allowed, forbidden=forbidden)
    return {
        "draft": fallback(facts) if issues else llm_draft,
        "llm_draft": llm_draft,
        "blocked": bool(issues),
        "issues": issues,
        "facts": facts,
    }
