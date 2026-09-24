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
  fixe écrit en code le remplace ;
- fiche du sous-motif (docs/answers/) : transmise seulement si le garde-fou
  l'accepte (src/answers.py : choose, accord tri / contrôleur et cohérence
  avec le label). La fiche est un texte fixe du repo, pas un extrait du
  ticket. Fiches en français seulement : un ticket anglais garde le brouillon
  générique ;
- dates : calculées en code, le LLM ne peut pas les perdre. Après la
  rédaction, fix_dates vérifie que chaque date calculée figure dans le
  brouillon. Une date manquante est ajoutée par une phrase écrite en code,
  une date fausse est remplacée par la date calculée. Si ce n'est pas
  possible proprement : brouillon générique (sans fiche), puis modèle fixe.
Bibliothèque standard uniquement.
"""

from __future__ import annotations

import json
import os
import re
import urllib.request
from datetime import datetime
from pathlib import Path

import answers
import output_guard
from deadlines import compute_deadlines

REPO = Path(__file__).resolve().parent.parent
PROMPT = REPO / "prompts" / "reply_v1.txt"
PROMPTS = {"fr": PROMPT, "en": REPO / "prompts" / "reply_v1_en.txt"}
PROMPT_FICHE = REPO / "prompts" / "reply_v2_fiche.txt"   # brouillon avec fiche (français)
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


# Mots courants du domaine, pour les tickets trop courts pour contenir des mots-outils
# (« Called 3 times. No callback. Unacceptable. ») : utilisés seulement par le repli.
EN_DOMAIN = {"card", "account", "transfer", "payment", "charged", "charge", "fee", "fees", "refund", "declined",
             "callback", "called", "call", "times", "time", "no", "still", "waiting", "help", "thanks", "thank",
             "hello", "hi", "dear", "great", "product", "reply", "instructions", "ignore", "all", "unacceptable",
             "service", "bank", "money", "cash", "why", "how", "what", "when", "need", "want", "would", "could",
             "any", "nobody", "again"}
FR_DOMAIN = {"carte", "compte", "virement", "prélèvement", "frais", "euros", "depuis", "encore", "toujours", "rien",
             "appli", "application", "banque", "refusée", "bloqué", "bloquée", "pourquoi", "comment", "svp", "oui", "non"}


def detect_language(text: str) -> str:
    """fr ou en.

    1. Règle majoritaire sur les mots-outils : en si au moins 2 mots-outils anglais
       et plus que de français.
    2. Repli : aucun mot français (outil ou domaine) et au moins un mot anglais
       (outil ou domaine) donnent en.
    Le franglais (« card declined partout, plus de cash ») reste en fr, comme les
    autres langues.
    """
    words = re.findall(r"[a-zà-ÿ]+", text.lower())
    en = sum(w in EN_WORDS for w in words)
    fr = sum(w in FR_WORDS for w in words)
    if en >= 2 and en > fr:
        return "en"
    fr_any = sum(w in FR_WORDS or w in FR_DOMAIN for w in words)
    en_any = sum(w in EN_WORDS or w in EN_DOMAIN for w in words)
    return "en" if fr_any == 0 and en_any >= 1 else "fr"


def format_date(d: datetime, lang: str) -> str:
    if lang == "en":
        return d.strftime("%A %d %B %Y").replace(" 0", " ")
    day = "1er" if d.day == 1 else str(d.day)   # typographie française : « 1er janvier »
    return f"{DAYS_FR[d.weekday()]} {day} {MONTHS_FR[d.month - 1]} {d.year}"


def case_of(fields: dict) -> str:
    if fields["unauthorized_payment"]:
        return "operation_non_autorisee"
    if fields["is_complaint"]:
        return "reclamation"
    return "question" if fields["label"] == "other" else "signalement"


def build_facts(ticket: dict, fields: dict, sous_motif: str | None = None) -> dict:
    """Faits structurés transmis au rédacteur : aucune donnée du texte du ticket.

    `sous_motif` : fiche retenue par le garde-fou (None : brouillon générique).
    """
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
    card = answers.for_writer(sous_motif) if sous_motif and lang == "fr" else {}
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
        "echeances": [{"kind": d.kind, "due": d.due.date().isoformat(), "date": format_date(d.due, lang)} for d in ds],
        "ce_que_le_client_doit_faire": actions,
        "fiche": sous_motif if card else None,
        **card,
    }


# Phrase écrite en code pour chaque échéance, quand le brouillon du LLM l'a perdue.
DATE_SENTENCE = {
    "fr": {"accuse_reception": "Nous accuserons réception de votre réclamation au plus tard le {date}.",
           "reponse": "Nous vous apporterons une réponse au plus tard le {date}.",
           "remboursement": "Votre signalement sera traité en priorité par un conseiller au plus tard le {date}.",
           "objectif_interne": "Un conseiller vous répondra au plus tard le {date}."},
    "en": {"accuse_reception": "We will acknowledge your complaint by {date}.",
           "reponse": "We will answer your complaint by {date}.",
           "remboursement": "Your report will be handled as a priority by an advisor by {date}.",
           "objectif_interne": "An advisor will answer you by {date}."},
}


def fallback(facts: dict) -> str:
    """Brouillon fixe écrit en code : garde de sortie qui bloque, ou dates impossibles à corriger."""
    dates = [DATE_SENTENCE[facts["langue"]][e["kind"]].format(date=e["date"]) for e in facts["echeances"]]
    if facts["langue"] == "en":
        body = ["Hello,", f"Thank you for your message about {facts['sujet']}. It has been passed on to an advisor."]
        body += dates
        if facts["cas"] == "operation_non_autorisee":
            body.append("For your security, never share your codes or passwords, even with someone claiming to work for VAULT.")
        if facts["cas"] == "reclamation" and facts["canal"] == "chat":
            body.append("Please also send your complaint in writing, by email or through the contact form, so that it can be registered.")
        body.append(SIGNATURE["en"])
    else:
        body = ["Bonjour,", f"Nous avons bien reçu votre message concernant {facts['sujet']}. Il a été transmis à un conseiller."]
        body += dates
        body += [f"Nous vous invitons à {a}." for a in facts["ce_que_le_client_doit_faire"]]
        body.append(SIGNATURE["fr"])
    return "\n".join(body)


WRITER_KEYS = ["situation", "consigne", "sujet", "urgent", "ce_qui_va_se_passer", "ce_que_le_client_doit_faire"]
FICHE_KEYS = ["reponse_type", "ce_que_le_client_peut_faire"]


def write(facts: dict, model: str = MODEL, host: str = HOST, prompt_path: Path | None = None) -> str:
    """Le rédacteur ne reçoit que WRITER_KEYS (+ FICHE_KEYS si une fiche est retenue) : ni codes techniques, ni texte du ticket."""
    fiche = facts.get("fiche")
    prompt_path = prompt_path or (PROMPT_FICHE if fiche else PROMPTS[facts["langue"]])
    sent = {k: facts[k] for k in WRITER_KEYS + (FICHE_KEYS if fiche else [])}
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
    return " ".join(re.sub(r"\b1er\b", "1", re.sub(r"[^\w\s]", " ", text.lower())).split())


MONTHS_EN = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october",
             "november", "december"]
_WD = "|".join(DAYS_FR + ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"])
_FR_DATE = (rf"(?:(?:{_WD})\s+)?(?P<d>\d{{1,2}})(?:er)?\s+(?P<m>{'|'.join(MONTHS_FR)})(?:\s+(?P<y>\d{{4}}))?")
_EN_DATE = (rf"(?:(?:{_WD}),?\s+)?(?:(?P<d2>\d{{1,2}})(?:st|nd|rd|th)?\s+(?P<m2>{'|'.join(MONTHS_EN)})"
            rf"|(?P<m3>{'|'.join(MONTHS_EN)})\s+(?P<d3>\d{{1,2}})(?:st|nd|rd|th)?,?)(?:\s+(?P<y2>\d{{4}}))?")
DATE_MENTION = re.compile(rf"\b(?:{_FR_DATE}|{_EN_DATE})\b", re.I)


def _mentions(text: str) -> list[tuple[re.Match, tuple]]:
    """Dates écrites dans le brouillon : (correspondance, (jour, mois, année ou None))."""
    out = []
    for m in DATE_MENTION.finditer(text):
        g = m.groupdict()
        day = int(g["d"] or g["d2"] or g["d3"])
        month_name = (g["m"] or g["m2"] or g["m3"]).lower()
        month = (MONTHS_FR if g["m"] else MONTHS_EN).index(month_name) + 1
        year = g["y"] or g["y2"]
        out.append((m, (day, month, int(year) if year else None)))
    return out


def dates_ok(draft: str, facts: dict) -> bool:
    return all(normalize(e["date"]) in normalize(draft) for e in facts["echeances"])


def fix_dates(draft: str, facts: dict) -> tuple[str | None, str]:
    """Remet dans le brouillon les dates calculées en code.

    - date écrite qui correspond à une échéance (même jour, même mois) : récrite exactement comme calculée ;
    - date fausse : remplacée si c'est la seule et qu'une seule échéance manque, sinon None (repli) ;
    - échéance absente : phrase écrite en code (DATE_SENTENCE), ajoutée avant la signature.
    Renvoie (brouillon, "ok" | "corrigé") ou (None, raison).
    """
    due = [(tuple(int(x) for x in e["due"].split("-")), e) for e in facts["echeances"]]
    by_day = lambda ymd: [e for (y, m, d), e in due if (d, m) == ymd[:2] and ymd[2] in (None, y)]
    mentions = _mentions(draft)
    seen, wrong = set(), []
    for m, ymd in mentions:
        match = by_day(ymd)
        if match:
            seen.add(match[0]["date"])
        else:
            wrong.append(m)
    missing = [e for _, e in due if e["date"] not in seen]
    if len(wrong) > 1 or (wrong and len(missing) != 1):
        return None, "dates fausses"
    fixed, changed = draft, False
    for m, ymd in reversed(mentions):   # de la fin vers le début : les positions restent valables
        match = by_day(ymd)
        new = match[0]["date"] if match else missing.pop()["date"]
        if normalize(m.group(0)) != normalize(new):
            changed = True
        fixed = fixed[:m.start()] + new + fixed[m.end():]
    sig = SIGNATURE[facts["langue"]]
    for e in reversed(missing):   # dernière échéance d'abord : chaque ajout se place avant la précédente insérée
        sentence = DATE_SENTENCE[facts["langue"]][e["kind"]].format(date=e["date"])
        later = [fixed.find(x["date"]) for x in facts["echeances"] if x["due"] > e["due"] and x["date"] in fixed]
        if later:
            # Avant la phrase qui donne l'échéance suivante : l'ordre chronologique est respecté.
            start = max(fixed.rfind(b, 0, min(later)) for b in (". ", "! ", "? ", "\n"))
            if start < 0:
                return None, "insertion impossible"
            cut = start + 1 if fixed[start] == "\n" else start + 2
            fixed = fixed[:cut] + sentence + " " + fixed[cut:]
        else:
            body = fixed[: -len(sig)].rstrip() if fixed.endswith(sig) else fixed.rstrip()
            if not body:
                return None, "brouillon vide"
            fixed = body + " " + sentence + ("\n\n" + sig if fixed.endswith(sig) else "")
        changed = True
    if not dates_ok(fixed, facts):
        return None, "insertion impossible"
    return fixed, "corrigé" if changed else "ok"


def _checked(ticket: dict, facts: dict, forbidden, **llm) -> dict:
    """Un brouillon du LLM, sa garde de sortie et la correction des dates (avec garde de sortie à nouveau)."""
    llm_draft = write(facts, **llm)
    allowed = " ".join(e["date"] for e in facts["echeances"])
    issues = output_guard.check(llm_draft, ticket["input"], allowed_text=allowed, forbidden=forbidden)
    draft, dates = (None, "bloqué") if issues else fix_dates(llm_draft, facts)
    if draft is not None and output_guard.check(draft, ticket["input"], allowed_text=allowed, forbidden=forbidden):
        draft, dates = None, "garde de sortie après correction"
    return {"llm_draft": llm_draft, "issues": issues, "draft": draft, "dates": dates}


def draft_reply(ticket: dict, fields: dict, forbidden: list[str] | None = None,
                controller_sous_motif: str | None = None, **llm) -> dict:
    """Brouillon final, brouillon du LLM, faits transmis, fiche et violations relevées par la garde de sortie.

    `controller_sous_motif` : sous_motif prédit par le contrôleur (src/controller.py).
    Sans lui, pas de fiche : brouillon générique.
    `dates` : "ok" (toutes les dates déjà justes), "corrigé" (dates insérées ou récrites en code),
    "repli générique" (brouillon avec fiche impossible à corriger : brouillon sans fiche),
    "modèle fixe" (brouillon écrit en code).
    """
    gate = answers.choose(fields, controller_sous_motif)
    facts = build_facts(ticket, fields, gate["sous_motif"])
    if gate["sous_motif"] and not facts["fiche"]:
        gate = {"sous_motif": None, "reason": "anglais"}
    first = r = _checked(ticket, facts, forbidden, **llm)
    dates = r["dates"]
    if r["draft"] is None and facts["fiche"] and not r["issues"]:
        # La fiche a fait perdre les dates sans qu'on puisse les remettre : brouillon générique.
        gate = {"sous_motif": None, "reason": f"repli générique ({r['dates']})"}
        facts = build_facts(ticket, fields, None)
        r = _checked(ticket, facts, forbidden, **llm)
        dates = "repli générique" if r["draft"] is not None else dates
    draft = r["draft"]
    if draft is None:
        draft, dates = fallback(facts), "modèle fixe"
    return {
        "draft": draft,
        "llm_draft": first["llm_draft"],
        "blocked": bool(first["issues"]),
        "issues": first["issues"],
        "facts": facts,
        "fiche": gate,
        "dates": dates,
    }
