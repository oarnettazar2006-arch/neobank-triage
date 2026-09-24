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


def path() -> Path:
    return Path(os.environ.get("VAULT_DB", DEFAULT))


def connect() -> sqlite3.Connection:
    con = sqlite3.connect(path(), timeout=30)
    con.row_factory = sqlite3.Row
    return con


def init() -> None:
    with closing(connect()) as con, con:
        con.execute(SCHEMA)
        # Un ticket resté en cours quand l'API s'est arrêtée ne reprendra pas tout seul.
        con.execute("UPDATE tickets SET traitement = 'erreur', erreur = 'interrompu' "
                    "WHERE traitement IN ('en_attente', 'en_cours')")


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
