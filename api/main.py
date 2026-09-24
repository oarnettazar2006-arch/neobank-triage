"""API VAULT : données de démo de l'accueil, chat client et tickets triés par le vrai pipeline.

    .venv/bin/uvicorn api.main:app --port 8000     # depuis la racine du repo (ou : make demo)

- GET  /compte, GET /operations : données fictives de l'accueil (api/donnees_demo.json) ;
- POST /chat : crée le ticket (statut « Reçue ») et répond tout de suite ; le
  pipeline complet (src/pipeline.py) tourne ensuite en tâche de fond ;
- GET  /tickets/{ref} : vue client (statut, délais, étapes, message fixe), sans brouillon ;
- GET  /tickets : vue conseiller, pour la future console (brouillon compris) ;
- POST /lots/apercu, POST /lots : un CSV de tickets (ou un ticket écrit, en CSV
  d'une ligne), vérifié puis trié en tâche de fond comme `make triage` ;
- GET  /lots, GET /lots/{id} : progression, prédictions au fil du tri, analyse
  et métriques ; POST /lots/{id}/arreter ; GET /lots/{id}/export.csv ;
- GET  /evolution : l'histoire des prompts de tri v0 à v7 (eval/evolution.json,
  écrit par eval/build_evolution.py), pour l'onglet « Prompts » de la console.

Un seul pipeline à la fois (verrou) : Ollama ne garde qu'un modèle en mémoire
sur ce Mac de 16 Go. Pas d'authentification : démo locale seulement.
"""

from __future__ import annotations

import json
import re
import secrets
import sys
import threading
from contextlib import asynccontextmanager
from datetime import datetime
from pathlib import Path

from fastapi import BackgroundTasks, FastAPI, HTTPException, Path as Chemin
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "src"))

import pipeline  # noqa: E402

from . import db, lots, suivi  # noqa: E402

EVOLUTION = Path(__file__).resolve().parent.parent / "eval" / "evolution.json"
DONNEES = json.loads((Path(__file__).resolve().parent / "donnees_demo.json").read_text(encoding="utf-8"))
LONGUEUR_MAX = 2000
ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"   # sans 0/O ni 1/I/L : une référence se recopie sans erreur
REF = r"^VLT-[A-HJ-NP-Z2-9]{6}$"
VERROU = threading.Lock()


def maintenant() -> datetime:
    """Horloge de l'API (remplacée dans les tests)."""
    return datetime.now().replace(microsecond=0)


@asynccontextmanager
async def _cycle(_app: FastAPI):
    db.init()
    yield


app = FastAPI(title="VAULT API", docs_url="/docs", redoc_url=None, lifespan=_cycle)
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^http://(localhost|127\.0\.0\.1)(:\d+)?$",   # le site en local, rien d'autre
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


class Message(BaseModel):
    message: str = Field(min_length=1, max_length=LONGUEUR_MAX)

    @field_validator("message")
    @classmethod
    def _non_vide(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("message vide")
        return v


@app.get("/compte")
def compte() -> dict:
    return DONNEES["compte"]


@app.get("/operations")
def operations() -> dict:
    return DONNEES["operations"]


def nouvelle_reference() -> str:
    return "VLT-" + "".join(secrets.choice(ALPHABET) for _ in range(6))


def traiter(ref: str) -> None:
    """Tâche de fond : le pipeline complet, étape par étape, sur le ticket enregistré."""
    t = db.get(ref)
    with VERROU:
        db.set_traitement(ref, "en_cours")

        def etape(nom: str, _donnees: dict) -> None:
            db.add_etape(ref, nom, maintenant().isoformat())
            if nom == "tri":   # les délais sont calculés en code dès que le tri est connu
                db.add_etape(ref, "delais", maintenant().isoformat())

        try:
            out = pipeline.process({"id": ref, "input": t["texte"], "channel": t["canal"], "received_at": t["recu_le"]},
                                   on_step=etape)
        except Exception as e:   # Ollama arrêté, JSON invalide… : le ticket reste, le conseiller le reprendra
            db.set_traitement(ref, "erreur", f"{type(e).__name__}: {e}"[:500])
            return
        db.set_resultat(ref, out)


@app.post("/chat", status_code=201)
def chat(m: Message, taches: BackgroundTasks) -> dict:
    recu = maintenant().isoformat()
    while True:
        ref = nouvelle_reference()
        if db.insert(ref, recu, suivi.CANAL, m.message, suivi.STATUT_RECU):
            break
    taches.add_task(traiter, ref)
    # Message de base, sans dates : le front l'affiche si le suivi ne répond plus.
    return {"reference": ref, "statut": suivi.STATUT_RECU,
            "message_client": suivi.message_client({"ref": ref, "resultat": None})}


@app.get("/tickets/{ref}")
def ticket(ref: str = Chemin(pattern=REF)) -> dict:
    t = db.get(ref)
    if t is None:
        raise HTTPException(404, "référence inconnue")
    return suivi.vue_client(t, maintenant())


@app.get("/tickets")
def tickets() -> list:
    now = maintenant()
    return [suivi.vue_console(t, now) for t in db.all_tickets()]


# --- Console : lots de tickets ----------------------------------------------------


class Fichier(BaseModel):
    nom: str = Field(min_length=1, max_length=200)
    contenu: str = Field(min_length=1)


def _lire(f: Fichier) -> dict:
    try:
        return lots.lire(f.contenu)
    except lots.triage_csv.InputError as e:
        raise HTTPException(422, str(e)) from None


def _lot(lot_id: str) -> dict:
    lot = db.get_lot(lot_id)
    if lot is None:
        raise HTTPException(404, "lot inconnu")
    return lot


def traiter_lot(lot_id: str, recu_le: str) -> None:
    with VERROU:   # un seul pipeline à la fois, chat compris
        lots.traiter(lot_id, recu_le)


@app.post("/lots/apercu")
def apercu_lot(f: Fichier) -> dict:
    return lots.apercu(f.nom, _lire(f))


@app.post("/lots", status_code=201)
def creer_lot(f: Fichier, taches: BackgroundTasks) -> dict:
    lu = _lire(f)
    now = maintenant()
    lot_id = lots.creer(f.nom, lu, now)
    taches.add_task(traiter_lot, lot_id, now.isoformat())
    return {"id": lot_id, **lots.apercu(f.nom, lu)}


@app.get("/lots")
def liste_lots() -> list:
    return [lots.vue_resume(lot) for lot in db.all_lots()]


@app.get("/lots/{lot_id}")
def lot(lot_id: str = Chemin(pattern=lots.ID)) -> dict:
    return lots.vue(_lot(lot_id))


@app.post("/lots/{lot_id}/arreter", status_code=202)
def arreter_lot(lot_id: str = Chemin(pattern=lots.ID)) -> dict:
    _lot(lot_id)
    db.update_lot(lot_id, arret=1)
    return {"id": lot_id}


@app.get("/lots/{lot_id}/export.csv")
def export_lot(lot_id: str = Chemin(pattern=lots.ID)) -> Response:
    lot = _lot(lot_id)
    if lot["statut"] != "termine":
        raise HTTPException(409, "lot pas encore terminé")
    nom = re.sub(r"[^A-Za-z0-9_-]", "", Path(lot["nom"]).stem) or "tickets"
    return Response(lots.export(lot), media_type="text/csv; charset=utf-8",
                    headers={"Content-Disposition": f'attachment; filename="{nom}_triage.csv"'})


# --- Console : évolution des prompts ------------------------------------------------


@app.get("/evolution")
def evolution() -> dict:
    """Lu à chaque appel : un nouveau `python3 eval/build_evolution.py` se voit sans relancer l'API."""
    if not EVOLUTION.exists():
        raise HTTPException(404, "eval/evolution.json absent : lancer python3 eval/build_evolution.py")
    return json.loads(EVOLUTION.read_text(encoding="utf-8"))
