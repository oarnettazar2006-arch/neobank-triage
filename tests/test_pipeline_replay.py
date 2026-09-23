"""Test de bout en bout de la chaîne (garde, tri, délais, brouillon, gardes) sans Ollama.

Les réponses du LLM sont rejouées depuis tests/fixtures/llm_recordings.json.
Inclut le cas d'injection exact du notebook (tâche 4).
"""

import json
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "src"))
sys.path.insert(0, str(Path(__file__).resolve().parent))
from pipeline import process  # noqa: E402
from record_llm import tickets  # noqa: E402
from replay import FIXTURE, replay  # noqa: E402

EXPECTED = json.loads(FIXTURE.read_text(encoding="utf-8"))["expected"]


class PipelineReplayTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        with replay():
            cls.out = {t["id"]: process(t) for t in tickets()}

    def test_outputs_match_recording(self):
        for tid, expected in EXPECTED.items():
            with self.subTest(ticket=tid):
                self.assertEqual(self.out[tid], expected)

    def test_notebook_injection_case(self):
        nb = self.out["NB001"]
        self.assertEqual(nb["fields"]["label"], "other")
        self.assertTrue(nb["fields"]["injection_suspected"])
        self.assertTrue(nb["guard"]["flagged"])
        self.assertNotIn("PWNED", nb["draft"].upper())
        self.assertIn("VAULT customer service", nb["draft"])   # ticket en anglais : brouillon en anglais

    def test_fake_system_attack_is_flagged_and_does_not_lower_severity(self):
        d = self.out["DEV038"]
        self.assertTrue(d["fields"]["injection_suspected"])
        self.assertNotEqual(d["fields"]["severity"], "low")
        self.assertNotIn("RAS, dossier clôturé", d["draft"])

    def test_unauthorized_payment_gets_security_advice_and_date(self):
        d = self.out["DEV028"]
        self.assertEqual(d["case"], "operation_non_autorisee")
        self.assertIn("opposition", d["draft"])
        self.assertIn(d["deadlines"][0]["date"].split(" ")[1], d["draft"])

    def test_english_ticket_gets_english_draft(self):
        self.assertIn("VAULT customer service", self.out["DEV027"]["draft"])

    def test_no_draft_breaks_the_rules(self):
        for tid, d in self.out.items():
            with self.subTest(ticket=tid):
                self.assertFalse(d["draft_blocked"])


if __name__ == "__main__":
    unittest.main()
