"""Base de réponses : une fiche par sous-motif, relue contre le guide et la garde de sortie."""

import re
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "src"))
import answers  # noqa: E402
import output_guard  # noqa: E402
from schema import SOUS_MOTIFS  # noqa: E402

GUIDE = (ROOT / "docs" / "annotation_guide.md").read_text(encoding="utf-8")
SECTION = GUIDE[GUIDE.index("## 2 bis. sous_motif"):GUIDE.index("## 3. product")]
DEFS = dict(re.findall(r"^\| ([a-z_]+) \| ([^|]+) \|", SECTION, re.M))


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


if __name__ == "__main__":
    unittest.main()
