"""Stockage des tickets dans SQLite (bibliothèque standard).

Le fichier de base (`api/vault.db` par défaut, `VAULT_DB` pour un autre chemin)
est ignoré par git. Une connexion par opération : le pipeline tourne dans un
autre fil que les requêtes, et SQLite sérialise les écritures.
"""

from __future__ import annotations

import json
import os
import sqlite3
from contextlib import closing
from pathlib import Path
from typing import Optional

DEFAULT = Path(__file__).resolve().parent / "vault.db"

SCHEMA = """
CREATE TABLE IF NOT EXISTS tickets (
    ref        TEXT PRIMARY KEY,
    recu_le    TEXT NOT NULL,             -- ISO, heure locale, à la seconde
    canal      TEXT NOT NULL,
    texte      TEXT NOT NULL,             -- texte d'origine, pour le conseiller seulement
    statut     TEXT NOT NULL,             -- statut client : Reçue, En cours d'examen, Réponse envoyée
    traitement TEXT NOT NULL,             -- pipeline : en_attente, en_cours, termine, erreur
    etapes     TEXT NOT NULL DEFAULT '[]',   -- JSON : [{nom, fini_le}]
    resultat   TEXT,                      -- JSON : sortie de pipeline.process
    erreur     TEXT
)
"""

SCHEMA_LOTS = """
CREATE TABLE IF NOT EXISTS lots (
    id          TEXT PRIMARY KEY,
    nom         TEXT NOT NULL,             -- nom du fichier, ou « Ticket écrit »
    cree_le     TEXT NOT NULL,             -- ISO, heure locale, à la seconde
    statut      TEXT NOT NULL,             -- en_attente, en_cours, termine, erreur, arrete
    etape       TEXT,                      -- tri, contrôle
    fait        INTEGER NOT NULL DEFAULT 0,   -- tickets traités, toutes étapes confondues
    total       INTEGER NOT NULL,          -- tickets x étapes
    reste_s     REAL,                      -- temps restant estimé
    secondes    REAL,                      -- durée totale, une fois terminé
    arret       INTEGER NOT NULL DEFAULT 0,   -- arrêt demandé par le conseiller
    colonnes    TEXT NOT NULL,             -- JSON : colonnes du CSV d'entrée
    delimiteur  TEXT NOT NULL,
    lignes      TEXT NOT NULL,             -- JSON : lignes du CSV d'entrée
    predictions TEXT NOT NULL,             -- JSON : une prédiction (ou null) par ligne
    erreur      TEXT
)
"""
LOT_JSON = ("colonnes", "lignes", "predictions")


def path() -> Path:
    return Path(os.environ.get("VAULT_DB", DEFAULT))


def connect() -> sqlite3.Connection:
    con = sqlite3.connect(path(), timeout=30)
    con.row_factory = sqlite3.Row
    return con


def init() -> None:
    with closing(connect()) as con, con:
        con.execute(SCHEMA)
        con.execute(SCHEMA_LOTS)
        # Un ticket resté en cours quand l'API s'est arrêtée ne reprendra pas tout seul.
        con.execute("UPDATE tickets SET traitement = 'erreur', erreur = 'interrompu' "
                    "WHERE traitement IN ('en_attente', 'en_cours')")
        con.execute("UPDATE lots SET statut = 'erreur', erreur = 'interrompu' WHERE statut IN ('en_attente', 'en_cours')")


def _row(r: Optional[sqlite3.Row]) -> Optional[dict]:
    if r is None:
        return None
    d = dict(r)
    d["etapes"] = json.loads(d["etapes"])
    d["resultat"] = json.loads(d["resultat"]) if d["resultat"] else None
    return d


def insert(ref: str, recu_le: str, canal: str, texte: str, statut: str) -> bool:
    """False si la référence existe déjà."""
    try:
        with closing(connect()) as con, con:
            con.execute("INSERT INTO tickets (ref, recu_le, canal, texte, statut, traitement) VALUES (?, ?, ?, ?, ?, 'en_attente')",
                        (ref, recu_le, canal, texte, statut))
        return True
    except sqlite3.IntegrityError:
        return False


def get(ref: str) -> Optional[dict]:
    with closing(connect()) as con:
        return _row(con.execute("SELECT * FROM tickets WHERE ref = ?", (ref,)).fetchone())


def all_tickets() -> list[dict]:
    with closing(connect()) as con:
        return [_row(r) for r in con.execute("SELECT * FROM tickets ORDER BY recu_le DESC, ref")]


def set_traitement(ref: str, traitement: str, erreur: Optional[str] = None) -> None:
    with closing(connect()) as con, con:
        con.execute("UPDATE tickets SET traitement = ?, erreur = ? WHERE ref = ?", (traitement, erreur, ref))


def add_etape(ref: str, nom: str, fini_le: str) -> None:
    with closing(connect()) as con, con:
        (etapes,) = con.execute("SELECT etapes FROM tickets WHERE ref = ?", (ref,)).fetchone()
        con.execute("UPDATE tickets SET etapes = ? WHERE ref = ?",
                    (json.dumps(json.loads(etapes) + [{"nom": nom, "fini_le": fini_le}]), ref))


def set_resultat(ref: str, resultat: dict) -> None:
    with closing(connect()) as con, con:
        con.execute("UPDATE tickets SET resultat = ?, traitement = 'termine', erreur = NULL WHERE ref = ?",
                    (json.dumps(resultat, ensure_ascii=False), ref))


# --- Lots de la console ---------------------------------------------------------


def insert_lot(lot_id: str, nom: str, cree_le: str, total: int, colonnes: list, delimiteur: str, lignes: list) -> bool:
    """False si l'identifiant existe déjà."""
    try:
        with closing(connect()) as con, con:
            con.execute("INSERT INTO lots (id, nom, cree_le, statut, total, colonnes, delimiteur, lignes, predictions) "
                        "VALUES (?, ?, ?, 'en_attente', ?, ?, ?, ?, ?)",
                        (lot_id, nom, cree_le, total, json.dumps(colonnes, ensure_ascii=False), delimiteur,
                         json.dumps(lignes, ensure_ascii=False), json.dumps([None] * len(lignes))))
        return True
    except sqlite3.IntegrityError:
        return False


def get_lot(lot_id: str) -> Optional[dict]:
    with closing(connect()) as con:
        r = con.execute("SELECT * FROM lots WHERE id = ?", (lot_id,)).fetchone()
    if r is None:
        return None
    d = dict(r)
    for k in LOT_JSON:
        d[k] = json.loads(d[k])
    return d


def all_lots() -> list[dict]:
    """Les lots, du plus récent au plus ancien, sans leurs lignes."""
    with closing(connect()) as con:
        return [dict(r) for r in con.execute("SELECT id, nom, cree_le, statut, fait, total FROM lots "
                                             "ORDER BY cree_le DESC, rowid DESC")]


def update_lot(lot_id: str, **champs) -> None:
    """Met à jour les champs donnés ; `predictions` est encodé en JSON."""
    if "predictions" in champs:
        champs["predictions"] = json.dumps(champs["predictions"], ensure_ascii=False)
    cles = ", ".join(f"{k} = ?" for k in champs)
    with closing(connect()) as con, con:
        con.execute(f"UPDATE lots SET {cles} WHERE id = ?", (*champs.values(), lot_id))


def set_prediction(lot_id: str, k: int, prediction: dict) -> None:
    """La prédiction du ticket k, dès que le tri la connaît."""
    with closing(connect()) as con, con:
        (preds,) = con.execute("SELECT predictions FROM lots WHERE id = ?", (lot_id,)).fetchone()
        preds = json.loads(preds)
        preds[k] = prediction
        con.execute("UPDATE lots SET predictions = ? WHERE id = ?", (json.dumps(preds, ensure_ascii=False), lot_id))


def arret_demande(lot_id: str) -> bool:
    with closing(connect()) as con:
        (arret,) = con.execute("SELECT arret FROM lots WHERE id = ?", (lot_id,)).fetchone()
    return bool(arret)
