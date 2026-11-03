"""Le bot est validé (tag v7-final) : ses prompts et son code de tri ne bougent plus.

Empreintes SHA-256 des fichiers au tag v7-final. Un changement de l'un d'eux est
une étape du bot (PR `exp/...`, mesurée avant et après, docs/regles_projet.md), jamais un
effet de bord d'une PR de console : on met alors à jour l'empreinte dans cette PR-là.
"""

import hashlib
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

EMPREINTES = {
    "prompts/reply_v1.txt": "c0b8ea511186d669ceeece655a94e15973018ee2532443f7a7faa46d6b87447e",
    "prompts/reply_v1_en.txt": "be7f13a715a9812f49e1e4cca341c192be6e685fd7b52c4a75372bd92bbf2259",
    "prompts/reply_v2_fiche.txt": "1369e0e6f3e06f6a159b868321cacacd29e61b551ffb5d49493bce8ba4a8b7ff",
    "prompts/v0_baseline.txt": "c758a066efc196c64c8ad6dc9218dc79aa40f185be60f176153ffe01ef571889",
    "prompts/v1_definitions.txt": "b6bef8bc90aef220619649831b37fc8167ef343a225a729a8af777ec62f30f2b",
    "prompts/v2_guide_fixes.txt": "afd838daf83b7dbdeb62fea3743da0e790e1fee15d6cb5477ca171fa50d375b1",
    "prompts/v3_few_shot.txt": "fa4ab777f6aa89fc9f9b634cac39b2821573f987f8a983ce0d11285012222c06",
    "prompts/v4_injection.txt": "155f6c3dbab33b19d3decc5f76f03082952dc1f5e562c35e4c78eae8aa7333ab",
    "prompts/v7_sous_motif.txt": "307c09c1c4fc622894a57cb85cac9d9ec31a13d1d237389469a550fa99289480",
    "src/triage.py": "fc81ded961954827e6c87baf5f701e24935102f3cc4df7e48e0030d7242fd1cb",
    "src/controller.py": "8ecb0adffc2937c87b2df001f5b2299b24d9741bf67bd4d1d819fe98cd7c0670",
    "src/reply.py": "3d0ffde4eb0a51821313709f2e40d8c95d4d17503df89c588416763e51b2c1f0",
    "src/guard.py": "eb9e1211a0653223ee0aec857cd9d2f42283f1e9ead4e251db34fc0a1d6edb75",
    "src/output_guard.py": "e0e58c6cab83f4955dde8255a2bc3dace42084a9d132072bdafdb0898c88ae00",
}


class BotFigeTest(unittest.TestCase):
    def test_prompts_et_code_du_bot_inchanges(self):
        for chemin, attendu in EMPREINTES.items():
            with self.subTest(chemin):
                self.assertEqual(hashlib.sha256((ROOT / chemin).read_bytes()).hexdigest(), attendu)

    def test_aucun_prompt_ajoute_sans_empreinte(self):
        prompts = {f"prompts/{p.name}" for p in (ROOT / "prompts").glob("*.txt")}
        self.assertEqual(prompts, {c for c in EMPREINTES if c.startswith("prompts/")})


if __name__ == "__main__":
    unittest.main()
