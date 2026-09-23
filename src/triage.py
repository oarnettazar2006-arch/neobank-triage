"""Chaîne de tri VAULT : garde d'entrée, puis LLM avec le prompt v7.

    from triage import triage
    result = triage("Ma carte est refusée partout depuis ce matin.")

1. `guard` repère les tentatives d'injection et retire les passages suspects.
2. Le LLM classe le texte nettoyé (prompt v7 : champs v4 plus sous_motif, sortie contrainte par schéma).
3. `injection_suspected` = signalement du LLM OU détection par la garde.
Le texte d'origine est renvoyé tel quel pour le conseiller.
Bibliothèque standard uniquement.
"""

from __future__ import annotations

import json
import os
import urllib.request
from pathlib import Path

from guard import GuardResult, guard
from schema import output_schema

REPO = Path(__file__).resolve().parent.parent
PROMPT = REPO / "prompts" / "v7_sous_motif.txt"
MODEL = os.environ.get("OLLAMA_MODEL", "llama3.1:8b")
HOST = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
OPTIONS = {"temperature": 0, "seed": 42}
SCHEMA = output_schema(with_injection=True, with_sous_motif=True)


def prepare(text: str) -> tuple[str, GuardResult]:
    """Étape 1 : texte à envoyer au LLM, et résultat de la garde."""
    g = guard(text)
    return g.cleaned, g


def finalize(pred: dict, g: GuardResult) -> dict:
    """Étape 3 : la détection de la garde s'ajoute au signalement du LLM."""
    out = dict(pred)
    out["injection_suspected"] = bool(pred.get("injection_suspected")) or g.flagged
    return out


def triage(text: str, model: str = MODEL, host: str = HOST, prompt_path: Path = PROMPT) -> dict:
    llm_text, g = prepare(text)
    prompt = prompt_path.read_text(encoding="utf-8").replace("{ticket}", llm_text)
    payload = {"model": model, "messages": [{"role": "user", "content": prompt}], "format": SCHEMA,
               "stream": False, "options": OPTIONS}
    req = urllib.request.Request(host.rstrip("/") + "/api/chat", data=json.dumps(payload).encode(),
                                 headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req, timeout=600) as resp:
        pred = json.loads(json.loads(resp.read())["message"]["content"])
    return {
        "fields": finalize(pred, g),
        "original_text": g.original,
        "llm_text": llm_text,
        "guard": {"flagged": g.flagged, "matches": g.matches},
    }


if __name__ == "__main__":
    import sys
    print(json.dumps(triage(sys.stdin.read()), ensure_ascii=False, indent=1))
