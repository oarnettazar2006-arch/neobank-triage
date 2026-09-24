"""GET /evolution : l'onglet « Prompts » de la console lit eval/evolution.json tel quel.

    .venv/bin/python -m unittest discover -s api/tests -t .   # ou : make test-api
"""

from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path
from unittest import mock

from fastapi.testclient import TestClient

from api import main


class EvolutionTest(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(main.app)

    def test_sert_le_fichier_du_depot(self):
        r = self.client.get("/evolution")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json(), json.loads(main.EVOLUTION.read_text(encoding="utf-8")))
        self.assertEqual([v["version"] for v in r.json()["versions"]], [f"v{i}" for i in range(8)])

    def test_fichier_absent_404_avec_la_commande(self):
        with tempfile.TemporaryDirectory() as d, mock.patch.object(main, "EVOLUTION", Path(d) / "absent.json"):
            r = self.client.get("/evolution")
        self.assertEqual(r.status_code, 404)
        self.assertIn("build_evolution.py", r.json()["detail"])


if __name__ == "__main__":
    unittest.main()
