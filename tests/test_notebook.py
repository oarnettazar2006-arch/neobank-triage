"""Tests de l'adaptateur notebook sans LLM : le tri est remplacé par une réponse fixe."""

import sys
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "src"))
import notebook  # noqa: E402

FIELDS = {"label": "bug", "product": "card", "severity": "high", "is_complaint": False,
          "unauthorized_payment": False, "injection_suspected": False}


class NotebookAdapterTest(unittest.TestCase):
    def setUp(self):
        notebook._triage.cache_clear()

    def test_classify_returns_a_label_string(self):
        with mock.patch("triage.triage", return_value={"fields": FIELDS}) as t:
            self.assertEqual(notebook.classify("Ma carte est refusée."), "bug")
            self.assertEqual(notebook.extract("Ma carte est refusée."), {"product": "card", "severity": "high"})
            self.assertEqual(t.call_count, 1)   # un seul appel au tri pour les deux fonctions

    def test_label_argument_overrides_triage(self):
        captured = {}

        def fake_draft(ticket, fields, **kw):
            captured.update(fields)
            return {"draft": "Bonjour"}
        with mock.patch("triage.triage", return_value={"fields": FIELDS}), mock.patch("reply.draft_reply", fake_draft):
            self.assertEqual(notebook.draft_reply_for("x", label="other", received_at="2026-10-07T10:00:00"), "Bonjour")
        self.assertEqual(captured["label"], "other")


if __name__ == "__main__":
    unittest.main()
