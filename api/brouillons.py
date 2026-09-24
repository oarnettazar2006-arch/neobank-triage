"""Brouillons à valider : la file du conseiller, ses décisions et ses corrections.

La file réunit tous les tickets qui ont un brouillon et pas encore de décision :
- ceux des lots lancés avec brouillon (ou dont les brouillons ont été générés
  ensuite, `generer`) ; clé `LOT-XXXXXX-3` pour le ticket 3 du lot ;
- ceux du chat de l'espace client (pipeline complet) ; clé = la référence `VLT-XXXXXX`.

Tri par urgence : réclamations d'abord, puis échéance la plus proche, puis
gravité (haute d'abord). Les échéances et les jours ouvrés restants sont
calculés en code (src/deadlines.py), comme pour le client.

Décision : « valide » (le brouillon, éventuellement modifié, part chez le client ;
un ticket du chat passe au statut « Réponse envoyée ») ou « rejete » avec un
motif. Le conseiller peut corriger catégorie, produit et gravité. Un texte
modifié repasse la garde de sortie (src/output_guard.py) : ses alertes sont
montrées et enregistrées, elles ne bloquent pas. Rien ici ne change le bot.
"""

from __future__ import annotations

import csv
import io
import re
import sys
from collections import namedtuple
from datetime import date, datetime
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
for dossier in ("src", "eval"):
    if str(RACINE / dossier) not in sys.path:
        sys.path.insert(0, str(RACINE / dossier))

import output_guard  # noqa: E402
import reply  # noqa: E402
import triage_csv  # noqa: E402
from deadlines import end_of  # noqa: E402
from schema import ENUMS  # noqa: E402

from . import db, suivi, trace

CLE = r"^(?:LOT-[A-HJ-NP-Z2-9]{6}-[1-9][0-9]{0,2}|VLT-[A-HJ-NP-Z2-9]{6})$"
CHAMPS = {"categorie": "label", "produit": "product", "severite": "severity"}   # champ corrigeable -> champ du schéma
ORDRE_GRAVITE = {"high": 0, "medium": 1, "low": 2}
STATUT_ENVOYEE = "Réponse envoyée"
MOTIFS = ["Informations fausses ou inventées", "Ne répond pas à la demande", "Ton inadapté",
          "Ticket suspect : réponse à faire à la main", "Autre"]
_Echeance = namedtuple("_Echeance", "due")


class Refus(Exception):
    """Décision refusée, avec le message à afficher et le code HTTP."""

    def __init__(self, code: int, message: str):
        super().__init__(message)
        self.code = code


# --- Les tickets qui ont un brouillon --------------------------------------------------


def _echeance(due: datetime | None, kind: str | None, maintenant: datetime) -> dict | None:
    if due is None:
        return None
    return {"kind": kind, "iso": due.isoformat(), "texte": reply.format_date(due, "fr"), "court": f"{due:%d/%m}",
            **suivi.delai([_Echeance(due)], maintenant)}


def _du_lot(lot: dict, k: int, maintenant: datetime) -> dict | None:
    pred = lot["predictions"][k]
    if not pred or "brouillon" not in pred:
        return None
    ligne = lot["lignes"][k]
    t = db.get_trace(lot["id"], k)
    tri, redaction = t.get("tri"), t.get("brouillon")
    if tri:
        fields = tri["champs"]
    else:   # sans trace : les champs connus de la prédiction
        fields = {"label": pred["categorie_predite"], "product": pred["produit_predit"],
                  "severity": pred["severite_predite"], "sous_motif": pred.get("sous_motif") or None,
                  "is_complaint": pred["reclamation"] == "oui", "unauthorized_payment": False,
                  "injection_suspected": pred["injection_suspectee"] == "oui"}
    due = end_of(date.fromisoformat(pred["echeance"])) if pred.get("echeance") else None
    kind = next((e["kind"] for e in (t.get("delais") or {}).get("echeances", [])), None)
    recu = ligne.get("recu_le") or lot["cree_le"]
    return {
        "cle": f"{lot['id']}-{k + 1}", "source": "lot",
        "origine": {"lot": lot["id"], "nom": lot["nom"], "n": k + 1},
        "id": ligne.get("id") or f"#{k + 1}", "texte": ligne["ticket"],
        "canal": ligne.get("canal") or "form", "recu_le": recu,
        "fields": fields, "echeance": _echeance(due, kind, maintenant),
        "fiche": pred.get("fiche") or None,
        "fiche_raison": redaction["fiche"]["reason"] if redaction else pred.get("controle"),
        "brouillon": pred["brouillon"], "brouillon_bloque": pred.get("brouillon_bloque") == "oui",
        "passages_retires": tri["garde"]["matches"] if tri else [],
        "trace": {"lot": lot["id"], "n": k + 1, "disponible": bool(t)},
    }


def _du_chat(ticket: dict, maintenant: datetime) -> dict | None:
    res = ticket["resultat"]
    if ticket["traitement"] != "termine" or not res or not res.get("draft"):
        return None
    ds = suivi.echeances(ticket)
    return {
        "cle": ticket["ref"], "source": "chat", "origine": {"ref": ticket["ref"], "statut": ticket["statut"]},
        "id": ticket["ref"], "texte": ticket["texte"], "canal": ticket["canal"], "recu_le": ticket["recu_le"],
        "fields": res["fields"],
        "echeance": _echeance(ds[0].due, ds[0].kind, maintenant) if ds else None,
        "fiche": res["fiche"], "fiche_raison": res["fiche_reason"],
        "brouillon": res["draft"], "brouillon_bloque": res["draft_blocked"],
        "passages_retires": res["guard"]["matches"],
        "trace": {"ref": ticket["ref"], "disponible": bool(db.get_trace(ticket["ref"], 0))},
    }


def tous(maintenant: datetime) -> list[dict]:
    """Tous les tickets qui ont un brouillon, avec leur décision (ou None)."""
    decisions = db.decisions()
    out = [e for lot in db.lots_complets() for k in range(len(lot["lignes"])) if (e := _du_lot(lot, k, maintenant))]
    out += [e for t in db.all_tickets() if (e := _du_chat(t, maintenant))]
    for e in out:
        e["decision"] = decisions.get(e["cle"])
    return out


def un(cle: str, maintenant: datetime) -> dict:
    e = next((x for x in tous(maintenant) if x["cle"] == cle), None)
    if e is None:
        raise Refus(404, "aucun brouillon pour ce ticket")
    return e


def urgence(e: dict) -> tuple:
    """Réclamations d'abord, puis échéance la plus proche, puis gravité (haute d'abord)."""
    f = e["fields"]
    return (not f["is_complaint"], e["echeance"]["iso"] if e["echeance"] else "9999",
            ORDRE_GRAVITE.get(f["severity"], 3), e["recu_le"], e["cle"])


def _ligne(e: dict) -> dict:
    """Ce que la vue Brouillons affiche d'un ticket (codes du schéma ; libellés côté front)."""
    f = e["fields"]
    recu = datetime.fromisoformat(e["recu_le"])
    return {**{k: v for k, v in e.items() if k != "fields"},
            "recu_le_texte": f"{recu:%d/%m} à {recu:%H:%M}",
            "categorie": f["label"], "produit": f["product"], "severite": f["severity"],
            "sous_motif": f.get("sous_motif"), "reclamation": bool(f["is_complaint"]),
            "suspect": bool(f["injection_suspected"])}


def file(maintenant: datetime) -> dict:
    """GET /brouillons : la file triée par urgence et les chiffres de validation."""
    elements = tous(maintenant)
    attente = sorted((e for e in elements if e["decision"] is None), key=urgence)
    return {"file": [_ligne(e) for e in attente], "validation": stats(elements), "motifs": MOTIFS}


# --- Chiffres --------------------------------------------------------------------------


def stats(elements: list[dict]) -> dict:
    """Part des brouillons validés sans modification, modifiés, rejetés ; corrections par champ."""
    ds = [e["decision"] for e in elements if e["decision"]]
    corrections = {c: 0 for c in CHAMPS}
    for d in ds:
        for c in d["corrections"]:
            corrections[c["champ"]] += 1
    return {"brouillons": len(elements), "en_attente": len(elements) - len(ds), "decides": len(ds),
            "valides_sans_modification": sum(d["decision"] == "valide" and not d["modifie"] for d in ds),
            "valides_modifies": sum(d["decision"] == "valide" and d["modifie"] for d in ds),
            "rejetes": sum(d["decision"] == "rejete" for d in ds),
            "corrections": corrections}


def stats_lot(lot: dict, maintenant: datetime) -> dict:
    return stats([e for e in tous(maintenant) if e["source"] == "lot" and e["origine"]["lot"] == lot["id"]])


# --- Garde de sortie sur un texte modifié ---------------------------------------------------


def alertes(e: dict, texte: str) -> list[dict]:
    """La garde de sortie du bot, relancée sur le texte du conseiller. Les dates d'échéance
    calculées pour ce ticket sont permises, comme pour le brouillon du bot."""
    ticket = {"input": e["texte"], "received_at": e["recu_le"], "channel": e["canal"]}
    faits = reply.build_facts(ticket, e["fields"])
    permis = " ".join(x["date"] for x in faits["echeances"])
    return output_guard.check(texte, e["texte"], allowed_text=permis)


def verifier(cle: str, texte: str, maintenant: datetime) -> dict:
    e = un(cle, maintenant)
    return {"modifie": _normal(texte) != _normal(e["brouillon"]), "alertes": alertes(e, texte)}


def _normal(texte: str) -> str:
    return re.sub(r"\s+", " ", texte).strip()


# --- Décision -------------------------------------------------------------------------------


def decider(cle: str, demande: dict, maintenant: datetime) -> dict:
    """Valide ou rejette ; corrections des champs ; statut « Réponse envoyée » pour un ticket du chat validé."""
    e = un(cle, maintenant)
    if e["decision"]:
        raise Refus(409, "ce ticket a déjà une décision")
    decision, texte, motif = demande["decision"], demande["texte"], (demande.get("motif") or "").strip()
    if decision == "rejete" and not motif:
        raise Refus(422, "un rejet demande un motif")
    if decision == "valide" and not texte.strip():
        raise Refus(422, "le brouillon est vide")
    if decision == "valide" and e["fields"]["injection_suspected"] and not demande.get("relu"):
        raise Refus(422, "ticket suspect : cochez « J'ai relu le ticket signalé » avant de valider")
    corrections = []
    for champ, valeur in (demande.get("corrections") or {}).items():
        schema = CHAMPS.get(champ)
        if schema is None or valeur not in ENUMS[schema]:
            raise Refus(422, f"correction invalide : {champ} = {valeur}")
        if valeur != e["fields"][schema]:
            corrections.append({"champ": champ, "valeur_bot": e["fields"][schema], "valeur_conseiller": valeur})
    modifie = _normal(texte) != _normal(e["brouillon"])
    d = {"cle": cle, "source": e["source"], "decision": decision, "motif": motif or None,
         "brouillon_bot": e["brouillon"], "brouillon_final": texte, "modifie": modifie,
         "alertes": alertes(e, texte) if modifie else [], "decide_le": maintenant.isoformat()}
    envoi = (e["origine"]["ref"], STATUT_ENVOYEE) if e["source"] == "chat" and decision == "valide" else None
    if not db.enregistrer_decision(d, corrections, envoi):
        raise Refus(409, "ce ticket a déjà une décision")
    return {**d, "corrections": corrections}


# --- Export des corrections --------------------------------------------------------------------

COLONNES_EXPORT = ["cle", "source", "lot", "id", "ticket", "champ", "valeur_bot", "valeur_conseiller", "decision",
                   "corrige_le"]


def export_corrections(maintenant: datetime, lot_id: str | None = None) -> str:
    """Une ligne par champ corrigé, avec le texte du ticket : de quoi réétiqueter."""
    buf = io.StringIO(newline="")
    w = csv.DictWriter(buf, fieldnames=COLONNES_EXPORT)
    w.writeheader()
    for e in sorted(tous(maintenant), key=lambda x: x["decision"]["decide_le"] if x["decision"] else ""):
        d = e["decision"]
        if not d or (lot_id and e["origine"].get("lot") != lot_id):
            continue
        for c in d["corrections"]:
            w.writerow({"cle": e["cle"], "source": e["source"], "lot": e["origine"].get("lot", ""), "id": e["id"],
                        "ticket": e["texte"], "champ": c["champ"], "valeur_bot": c["valeur_bot"],
                        "valeur_conseiller": c["valeur_conseiller"], "decision": d["decision"],
                        "corrige_le": c["corrige_le"]})
    return buf.getvalue()


# --- Générer les brouillons d'un lot lancé sans ---------------------------------------------------


class GenerationArretee(Exception):
    pass


def a_generer(lot: dict) -> list[int]:
    """Tickets triés du lot qui n'ont pas encore de brouillon."""
    return [k for k, p in enumerate(lot["predictions"]) if p and "brouillon" not in p]


def preparer_generation(lot: dict) -> list[int]:
    """Vérifie qu'on peut générer, puis marque le lot « en cours, étape brouillon »."""
    if lot["statut"] in ("en_attente", "en_cours"):
        raise Refus(409, "le lot est en cours de tri")
    ks = a_generer(lot)
    if not ks:
        raise Refus(409, "tous les tickets triés de ce lot ont déjà un brouillon")
    sans_trace = [k + 1 for k in ks if not {"tri", "controle"} <= set(db.get_trace(lot["id"], k))]
    if sans_trace:
        raise Refus(409, "lot trié avant l'enregistrement des traces : relancez-le avec brouillon")
    n = len(lot["lignes"])
    db.update_lot(lot["id"], statut="en_cours", etape="brouillon", brouillon=1, arret=0, erreur=None,
                  total=n * 3, fait=n * 3 - len(ks), reste_s=None)
    return ks


def generer(lot_id: str) -> None:
    """Tâche de fond : le rédacteur (et sa garde de sortie) sur chaque ticket, avec les champs du tri
    et l'avis du contrôleur enregistrés dans la trace : mêmes entrées que `make triage BROUILLON=1`."""
    lot = db.get_lot(lot_id)
    traceur = trace.Traceur(lot_id)
    debut = datetime.now()
    try:
        with traceur.ecoute():
            for k in a_generer(lot):
                t = db.get_trace(lot_id, k)
                ligne = lot["lignes"][k]
                ticket = {"id": ligne.get("id") or f"#{k + 1}", "input": ligne["ticket"],
                          "channel": ligne.get("canal") or "form", "received_at": ligne.get("recu_le") or lot["cree_le"]}
                d = traceur("brouillon", k, lambda: reply.draft_reply(ticket, t["tri"]["champs"],
                                                                        controller_sous_motif=t["controle"]["sous_motif"]))
                db.set_prediction(lot_id, k, {**lot["predictions"][k], "fiche": d["fiche"]["sous_motif"] or "",
                                              "brouillon": d["draft"], "brouillon_bloque": triage_csv.yes_no(d["blocked"])})
                db.update_lot(lot_id, fait=db.get_lot(lot_id)["fait"] + 1)
                if db.arret_demande(lot_id):
                    raise GenerationArretee
        triage_csv.unload(reply.MODEL)
    except GenerationArretee:
        db.update_lot(lot_id, statut="arrete", reste_s=None)
        return
    except Exception as e:   # Ollama arrêté… : les brouillons déjà écrits restent
        db.update_lot(lot_id, statut="erreur", reste_s=None, erreur=f"{type(e).__name__}: {e}"[:500])
        return
    secondes = (lot["secondes"] or 0) + (datetime.now() - debut).total_seconds()
    db.update_lot(lot_id, statut="termine", reste_s=0, secondes=round(secondes, 1))
