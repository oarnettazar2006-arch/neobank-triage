"""Ce que l'API dit d'un ticket : délais, étapes et message fixe au client.

Tout est écrit en code. Le brouillon du bot n'apparaît jamais ici : il est
réservé au conseiller (GET /tickets).
"""

from __future__ import annotations

from datetime import date, datetime, timedelta
from typing import Optional

from deadlines import compute_deadlines, is_business_day
from reply import format_date

CANAL = "form"   # le chat de l'espace client crée un ticket écrit (décision d'Oscar, 2026-09-24)
STATUT_RECU = "Reçue"
PROCHE = 2       # échéance proche : 2 jours ouvrés (DESIGN.md 9)

# Étapes du pipeline, dans l'ordre. Des codes, pas des libellés : le client ne voit pas de jargon interne (DESIGN.md 9).
ETAPES = ["garde_entree", "tri", "delais", "controleur", "redaction", "garde_sortie"]
LIBELLE_ECHEANCE = {
    "accuse_reception": "Accusé de réception",
    "reponse": "Réponse",
    "remboursement": "Traitement du signalement",
    "objectif_interne": "Réponse d'un conseiller",
}
CAS_CLIENT = {"reclamation": "Réclamation", "operation_non_autorisee": "Opération non autorisée",
              "signalement": "Signalement", "question": "Question"}


def echeances(ticket: dict) -> list:
    """Délais de src/deadlines.py, une fois le tri connu ; liste vide avant."""
    res = ticket["resultat"] or {}
    fields = res.get("fields")
    if not fields:
        return []
    return compute_deadlines(datetime.fromisoformat(ticket["recu_le"]), fields["is_complaint"],
                             fields["unauthorized_payment"], fields["product"], ticket["canal"])


def jours_ouvres_entre(debut: date, fin: date) -> int:
    """Jours ouvrables strictement après `debut`, jusqu'à `fin` inclus."""
    n, d = 0, debut
    while d < fin:
        d += timedelta(days=1)
        n += is_business_day(d)
    return n


def delai(ds: list, maintenant: datetime) -> dict:
    """Situation de l'échéance la plus proche : normal, proche ou depasse."""
    if not ds:
        return {"delai": None, "jours_ouvres_restants": None}
    due = ds[0].due
    if maintenant > due:
        return {"delai": "depasse", "jours_ouvres_restants": 0}
    restants = jours_ouvres_entre(maintenant.date(), due.date())
    return {"delai": "proche" if restants <= PROCHE else "normal", "jours_ouvres_restants": restants}


def message_client(ticket: dict) -> str:
    """Message fixe du chat. Il ne dépend que de la référence et de la réclamation :
    un ticket suspect reçoit le même, et le brouillon n'y figure jamais."""
    msg = f"Votre demande est enregistrée sous la référence {ticket['ref']}. Nos experts l'examinent."
    res = ticket["resultat"]
    if res and res["fields"]["is_complaint"]:
        dates = {d.kind: format_date(d.due, "fr") for d in echeances(ticket)}
        if "accuse_reception" in dates:
            msg += f" Nous accuserons réception de votre réclamation au plus tard le {dates['accuse_reception']}."
        if "reponse" in dates:
            msg += f" Nous vous répondrons au plus tard le {dates['reponse']}."
    return msg


def vue_client(ticket: dict, maintenant: datetime) -> dict:
    """GET /tickets/{ref} : ni brouillon, ni catégorie interne, ni signal d'injection."""
    ds = echeances(ticket)
    faites = {e["nom"]: e["fini_le"] for e in ticket["etapes"]}
    res = ticket["resultat"]
    recu = datetime.fromisoformat(ticket["recu_le"])
    return {
        "reference": ticket["ref"],
        "statut": ticket["statut"],
        "traitement": ticket["traitement"],
        "cas": CAS_CLIENT[res["case"]] if res else None,
        "recu_le": {"iso": ticket["recu_le"], "texte": format_date(recu, "fr")},
        "echeances": [{"kind": d.kind, "libelle": LIBELLE_ECHEANCE[d.kind], "iso": d.due.isoformat(),
                       "texte": format_date(d.due, "fr")} for d in ds],
        **delai(ds, maintenant),
        "etapes": [{"nom": nom, "fait": nom in faites, "fini_le": faites.get(nom)} for nom in ETAPES],
        "message_client": message_client(ticket) if ticket["traitement"] in ("termine", "erreur") else None,
    }


def vue_console(ticket: dict, maintenant: datetime) -> dict:
    """GET /tickets : une ligne de la future console conseiller."""
    res: Optional[dict] = ticket["resultat"]
    f = res["fields"] if res else {}
    ds = echeances(ticket)
    return {
        "reference": ticket["ref"],
        "recu_le": ticket["recu_le"],
        "statut": ticket["statut"],
        "traitement": ticket["traitement"],
        "erreur": ticket["erreur"],
        "texte": ticket["texte"],
        "cas": res["case"] if res else None,
        "categorie": f.get("label"),
        "produit": f.get("product"),
        "severite": f.get("severity"),
        "sous_motif": f.get("sous_motif"),
        "reclamation": f.get("is_complaint"),
        "operation_non_autorisee": f.get("unauthorized_payment"),
        "injection_suspectee": f.get("injection_suspected"),
        "passages_retires": res["guard"]["matches"] if res else [],
        "fiche": res["fiche"] if res else None,
        "brouillon": res["draft"] if res else None,
        "echeance": {"kind": ds[0].kind, "iso": ds[0].due.isoformat()} if ds else None,
        **delai(ds, maintenant),
    }
