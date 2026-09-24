"""Base de réponses : une fiche par sous-motif, relue contre le guide et la garde de sortie."""

import re
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "src"))
import answers  # noqa: E402
import output_guard  # noqa: E402
import controller  # noqa: E402
from schema import SOUS_MOTIF_LABEL, SOUS_MOTIFS  # noqa: E402

GUIDE = (ROOT / "docs" / "annotation_guide.md").read_text(encoding="utf-8")
SECTION = GUIDE[GUIDE.index("## 2 bis. sous_motif"):GUIDE.index("## 3. product")]
DEFS = dict(re.findall(r"^\| ([a-z_]+) \| ([^|]+) \|", SECTION, re.M))
LABELS = dict(re.findall(r"^\| ([a-z_]+) \| [^|]+ \| (billing|bug|other) \|", SECTION, re.M))
FIELDS = {"label": "bug", "sous_motif": "carte_refusee", "product": "card", "severity": "high",
          "is_complaint": False, "unauthorized_payment": False, "injection_suspected": False}


class AnswersTest(unittest.TestCase):
    def test_one_card_per_sous_motif(self):
        self.assertEqual(sorted(p.stem for p in answers.ANSWERS.glob("*.md")), sorted(SOUS_MOTIFS))

    def test_situation_matches_the_guide(self):
        for sm in SOUS_MOTIFS:
            with self.subTest(sous_motif=sm):
                self.assertEqual(answers.load(sm)["situation"].rstrip(".").lower(), DEFS[sm].strip().lower())

    def test_sent_text_passes_the_output_guard(self):
        for sm in SOUS_MOTIFS:
            sent = " ".join(answers.for_writer(sm)["reponse_type"] + answers.for_writer(sm)["ce_que_le_client_peut_faire"])
            with self.subTest(sous_motif=sm):
                self.assertTrue(answers.load(sm)["reponse"], "réponse vide")
                self.assertEqual(output_guard.check(sent, ""), [])
                self.assertIsNone(re.search(r"\d", sent), "aucun chiffre : les dates viennent du code")

    def test_never_section_is_not_sent(self):
        for sm in SOUS_MOTIFS:
            sent = answers.for_writer(sm)
            self.assertNotIn("jamais", sent)
            self.assertTrue(answers.load(sm)["jamais"])


class GateTest(unittest.TestCase):
    """Garde-fou : la fiche seulement si tri et contrôleur sont d'accord, et cohérents avec le label."""

    def test_label_map_matches_the_guide(self):
        self.assertEqual(SOUS_MOTIF_LABEL, LABELS)
        self.assertEqual(list(SOUS_MOTIF_LABEL), SOUS_MOTIFS)

    def test_agreement_gives_the_card(self):
        self.assertEqual(answers.choose(FIELDS, "carte_refusee"), {"sous_motif": "carte_refusee", "reason": "accord"})

    def test_generic_otherwise(self):
        cases = [(FIELDS, None, "pas de contrôleur"),
                 (FIELDS, "compte_bloque", "désaccord"),
                 (FIELDS | {"sous_motif": "question_carte"}, "question_carte", "incohérent avec label"),
                 (FIELDS | {"label": "billing", "sous_motif": "debit_errone", "unauthorized_payment": True},
                  "debit_errone", "incohérent avec unauthorized_payment"),
                 (FIELDS | {"label": "billing", "sous_motif": "operation_non_autorisee"},
                  "operation_non_autorisee", "incohérent avec unauthorized_payment"),
                 ({k: v for k, v in FIELDS.items() if k != "sous_motif"}, "carte_refusee", "pas de sous_motif prédit")]
        for fields, qwen, reason in cases:
            with self.subTest(reason=reason):
                self.assertEqual(answers.choose(fields, qwen), {"sous_motif": None, "reason": reason})

    def test_controller_sees_section_2_bis_only(self):
        prompt = controller.prompt()
        self.assertIn(SECTION, prompt)
        self.assertNotIn("## 3. product", prompt)
        self.assertEqual(prompt.count("{ticket}"), 1)

if __name__ == "__main__":
    unittest.main()
