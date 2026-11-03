"""Lots de la console : un CSV de tickets trié par le pipeline, avec analyse et métriques.

Tout le calcul vient de eval/triage_csv.py (lecture du CSV, tri étape par étape,
métriques, CSV de sortie) : la console et `make triage` donnent les mêmes
chiffres. Ce module ajoute le suivi en base (progression, prédictions au fil
du tri, arrêt) et les répartitions affichées par la console.

Un ticket écrit à la main arrive ici comme un CSV d'une ligne (colonne `ticket`).
Un lot lancé avec `brouillon` fait aussi tourner le rédacteur et la garde de
sortie (`make triage BROUILLON=1`). Chaque étape de chaque ticket est
enregistrée pendant le lot (api/trace.py) pour l'onglet Pipeline.
"""

from __future__ import annotations

import io
import secrets
import sys
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "eval"))

import triage_csv  # noqa: E402
from reply import format_date  # noqa: E402
from schema import ENUMS  # noqa: E402

from . import brouillons, db, trace  # noqa: E402

MAX_TICKETS = 200
MAX_OCTETS = 2_000_000
ETAPES = ["tri", "contrôle"]
ETAPES_BROUILLON = ETAPES + ["brouillon"]
# Mesuré sur demo15 (docs/details.md) : 6,3 s par ticket pour le tri et le contrôle, départ à froid.
SECONDES_PAR_TICKET = 6.3
ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"
ID = r"^LOT-[A-HJ-NP-Z2-9]{6}$"
CHAMPS = {"categorie": "label", "produit": "product", "severite": "severity"}   # colonne -> champ du schéma


class LotArrete(Exception):
    pass


def lire(contenu: str) -> dict:
    """Vérifie le CSV comme `make triage` ; lève triage_csv.InputError avec le message à afficher."""
    if len(contenu.encode("utf-8")) > MAX_OCTETS:
        raise triage_csv.InputError(f"fichier trop lourd (plus de {MAX_OCTETS // 1_000_000} Mo)")
    colonnes, lignes, delimiteur = triage_csv.parse_tickets(contenu)
    if len(lignes) > MAX_TICKETS:
        raise triage_csv.InputError(f"{len(lignes)} tickets : {MAX_TICKETS} au plus par lot")
    return {"colonnes": colonnes, "lignes": lignes, "delimiteur": delimiteur}


def etapes(brouillon: bool) -> list[str]:
    return ETAPES_BROUILLON if brouillon else ETAPES


def apercu(nom: str, lu: dict) -> dict:
    """Ce que la console montre avant de lancer : nombre de tickets, bonnes réponses, durée estimée."""
    n = len(lu["lignes"])
    return {"nom": nom, "tickets": n, "colonnes": lu["colonnes"],
            "bonnes_reponses": [c for c in triage_csv.GOLD if any(r.get(c) for r in lu["lignes"])],
            "estimation_s": round(n * SECONDES_PAR_TICKET)}


def creer(nom: str, lu: dict, maintenant: datetime, brouillon: bool = False) -> str:
    while True:
        lot_id = "LOT-" + "".join(secrets.choice(ALPHABET) for _ in range(6))
        if db.insert_lot(lot_id, nom, maintenant.isoformat(), len(lu["lignes"]) * len(etapes(brouillon)),
                         lu["colonnes"], lu["delimiteur"], lu["lignes"], brouillon):
            return lot_id


class _Suivi(triage_csv.Progress):
    """La progression de triage_csv, écrite en base au lieu de la sortie d'erreur."""

    def __init__(self, lot_id: str, n: int, brouillon: bool):
        super().__init__(n, etapes(brouillon), stream=io.StringIO())
        self.lot_id = lot_id

    def begin(self, step: str) -> None:
        super().begin(step)
        db.update_lot(self.lot_id, etape=step)

    def tick(self, step: str, i: int, tid: str) -> None:
        super().tick(step, i, tid)
        db.update_lot(self.lot_id, fait=self.done, reste_s=round(self.remaining(i), 1))
        if db.arret_demande(self.lot_id):
            raise LotArrete


def _partielle(fields: dict) -> dict:
    """Les colonnes connues dès le tri ; le contrôle et l'échéance arrivent à la fin du lot."""
    return {"categorie_predite": fields["label"], "produit_predit": fields["product"],
            "severite_predite": fields["severity"], "sous_motif": fields.get("sous_motif", ""),
            "reclamation": triage_csv.yes_no(fields["is_complaint"]),
            "injection_suspectee": triage_csv.yes_no(fields["injection_suspected"])}


def traiter(lot_id: str, recu_le: str) -> None:
    """Tâche de fond : tous les tris, puis tous les contrôles, puis les brouillons s'il y a lieu
    (un seul modèle chargé à la fois). Chaque étape de chaque ticket est tracée au passage."""
    lot = db.get_lot(lot_id)
    db.update_lot(lot_id, statut="en_cours")
    brouillon = bool(lot["brouillon"])
    suivi = _Suivi(lot_id, len(lot["lignes"]), brouillon)
    traceur = trace.Traceur(lot_id)
    try:
        with traceur.ecoute():
            preds = triage_csv.process(lot["lignes"], brouillon, recu_le, suivi,
                                       on_triage=lambda k, f: db.set_prediction(lot_id, k, _partielle(f)),
                                       trace=traceur)
    except LotArrete:
        db.update_lot(lot_id, statut="arrete", reste_s=None, secondes=round(suivi.elapsed, 1))
        return
    except Exception as e:   # Ollama arrêté, JSON invalide… : le lot garde ce qui est déjà trié
        db.update_lot(lot_id, statut="erreur", reste_s=None, erreur=f"{type(e).__name__}: {e}"[:500])
        return
    db.update_lot(lot_id, statut="termine", predictions=preds, reste_s=0, secondes=round(suivi.elapsed, 1))


# --- Analyse -------------------------------------------------------------------


def repartitions(preds: list[dict]) -> dict:
    """Comptes par catégorie, produit et gravité (toutes les valeurs du schéma), et produit x gravité."""
    rep = {col: {v: 0 for v in ENUMS[champ]} for col, champ in CHAMPS.items()}
    croise = {p: {s: 0 for s in ENUMS["severity"]} for p in ENUMS["product"]}
    for p in preds:
        for col in CHAMPS:
            rep[col][p[triage_csv.GOLD[col][1]]] += 1
        croise[p["produit_predit"]][p["severite_predite"]] += 1
    return {**rep, "produit_x_severite": croise}


def analyse(lignes: list[dict], preds: list) -> dict:
    """Sur les tickets déjà triés : répartitions, réclamations, suspects, et métriques si bonnes réponses."""
    faits = [(r, p) for r, p in zip(lignes, preds) if p]
    lignes_faites, preds_faites = [r for r, _ in faits], [p for _, p in faits]
    m = triage_csv.metrics(lignes_faites, preds_faites) if faits else {"fields": {}}
    return {
        "tickets": len(faits),
        "reclamations": sum(p["reclamation"] == "oui" for p in preds_faites),
        "suspects": sum(p["injection_suspectee"] == "oui" for p in preds_faites),
        "repartitions": repartitions(preds_faites),
        "metriques": m if m["fields"] else None,
    }


def _echeance(pred: dict) -> dict:
    """L'échéance rédigée par l'API (le front ne calcule aucune date) : longue et courte."""
    if not pred.get("echeance"):
        return {"echeance_texte": None, "echeance_court": None}
    d = datetime.fromisoformat(pred["echeance"])
    return {"echeance_texte": format_date(d, "fr"), "echeance_court": f"{d:%d/%m}"}


def _cree_le_texte(iso: str) -> str:
    d = datetime.fromisoformat(iso)
    return f"{d:%d/%m} à {d:%H:%M}"


def vue_resume(lot: dict) -> dict:
    """Une ligne de la liste des lots."""
    return {"id": lot["id"], "nom": lot["nom"], "cree_le": _cree_le_texte(lot["cree_le"]), "statut": lot["statut"],
            "tickets": lot["total"] // len(etapes(lot["brouillon"])), "fait": lot["fait"], "total": lot["total"],
            "brouillon": bool(lot["brouillon"])}


def vue(lot: dict, maintenant: datetime) -> dict:
    """GET /lots/{id} : progression, lignes (entrée et prédiction), analyse et validation par le conseiller."""
    preds = lot["predictions"]
    lignes = [{"n": n + 1, "id": r.get("id") or f"#{n + 1}", "ticket": r["ticket"],
               "attendu": {c: r[c] for c in triage_csv.GOLD if r.get(c)},
               "prediction": {**p, **_echeance(p)} if p else None}
              for n, (r, p) in enumerate(zip(lot["lignes"], preds))]
    return {**vue_resume(lot), "etape": lot["etape"], "reste_s": lot["reste_s"], "secondes": lot["secondes"],
            "erreur": lot["erreur"], "etapes": etapes(lot["brouillon"]), "lignes": lignes,
            "analyse": {**analyse(lot["lignes"], preds), "validation": brouillons.stats_lot(lot, maintenant)},
            "brouillons_a_generer": len(brouillons.a_generer(lot)) if lot["statut"] not in ("en_attente", "en_cours") else 0}


def export(lot: dict) -> str:
    """Le même CSV que `make triage` : colonnes d'entrée, puis prédictions."""
    return triage_csv.csv_text(lot["colonnes"], lot["lignes"], lot["predictions"], lot["delimiteur"])
