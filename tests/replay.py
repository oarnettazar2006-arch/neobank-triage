"""Rejoue des réponses du LLM enregistrées, pour tester la chaîne sans Ollama.

Chaque requête envoyée à Ollama (modèle, messages, schéma, options) est
identifiée par l'empreinte SHA-256 de son JSON. En mode rejeu, une requête
inconnue fait échouer le test : un prompt, un schéma ou une date qui change
se voit tout de suite. `record_llm.py` régénère les enregistrements.
"""

from __future__ import annotations

import hashlib
import io
import json
import urllib.request
from contextlib import contextmanager
from pathlib import Path
from unittest import mock

FIXTURE = Path(__file__).resolve().parent / "fixtures" / "llm_recordings.json"


def key(body: bytes) -> str:
    return hashlib.sha256(json.dumps(json.loads(body), sort_keys=True, ensure_ascii=False).encode()).hexdigest()


class _Response(io.BytesIO):
    def __enter__(self):
        return self

    def __exit__(self, *exc):
        return False


@contextmanager
def replay(path: Path = FIXTURE):
    recordings = json.loads(path.read_text(encoding="utf-8"))["responses"]

    def fake_urlopen(req, timeout=None):
        k = key(req.data)
        if k not in recordings:
            raise AssertionError(f"requête au LLM non enregistrée ({k[:12]}…) : relancer tests/record_llm.py")
        return _Response(json.dumps({"message": {"content": recordings[k]}}).encode())

    with mock.patch.object(urllib.request, "urlopen", fake_urlopen):
        yield


@contextmanager
def record(store: dict):
    real = urllib.request.urlopen

    def recording_urlopen(req, timeout=None):
        resp = real(req, timeout=timeout)
        body = resp.read()
        if req.full_url.endswith("/api/chat"):
            store[key(req.data)] = json.loads(body)["message"]["content"]
        return _Response(body)

    with mock.patch.object(urllib.request, "urlopen", recording_urlopen):
        yield
