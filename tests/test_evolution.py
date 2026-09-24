"""eval/evolution.json et docs/prompt_history.md : à jour, cohérents avec les résultats et l'historique Git.

L'onglet « Prompts » de la console et docs/prompt_history.md lisent ces fichiers ;
ce test garantit qu'ils disent la même chose que eval/results/ et que Git.
"""

import json
import subprocess
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "eval"))

import build_evolution as be  # noqa: E402

EVOLUTION = json.loads((ROOT / "eval" / "evolution.json").read_text(encoding="utf-8"))
VERSIONS = {v["version"]: v for v in EVOLUTION["versions"]}


def historique_complet() -> bool:
    r = subprocess.run(["git", "rev-parse", "--is-shallow-repository"], cwd=ROOT, capture_output=True, text=True)
    return r.returncode == 0 and r.stdout.strip() == "false"


class EvolutionTest(unittest.TestCase):
    def test_huit_versions_dans_l_ordre(self):
        self.assertEqual(list(VERSIONS), [f"v{i}" for i in range(8)])

    def test_v5_et_v6_ne_changent_pas_le_prompt_de_tri(self):
        for v in ("v5", "v6"):
            with self.subTest(v):
                self.assertFalse(VERSIONS[v]["change_le_prompt_de_tri"])
                self.assertEqual(VERSIONS[v]["prompt_texte"], VERSIONS["v4"]["prompt_texte"])
        for v in ("v0", "v1", "v2", "v3", "v4", "v7"):
            self.assertTrue(VERSIONS[v]["change_le_prompt_de_tri"])

    def test_texte_des_prompts_identique_aux_fichiers(self):
        for v in VERSIONS.values():
            with self.subTest(v["version"]):
                self.assertEqual(v["prompt_texte"], (ROOT / v["prompt"]).read_text(encoding="utf-8"))

    def test_une_serie_un_seul_jeu(self):
        for v in VERSIONS.values():
            for jeu, m in v["mesures"].items():
                with self.subTest(v["version"], jeu=jeu):
                    self.assertEqual(m["jeu"], jeu)
                    self.assertEqual(m["n"], EVOLUTION["jeux"][jeu]["n"])
        self.assertTrue(all("val60" in v["mesures"] for v in VERSIONS.values()), "chaque version a sa mesure val60")

    def test_chiffres_recalcules_depuis_les_resultats(self):
        for v in VERSIONS.values():
            for jeu, m in v["mesures"].items():
                with self.subTest(v["version"], jeu=jeu):
                    recalcule = be.mesurer(Path(m["run"]).name, jeu, EVOLUTION["jeux"][jeu]["fichier"])
                    self.assertEqual(recalcule["champs"], m["champs"])
                    self.assertEqual(recalcule["entierement_justes"], m["entierement_justes"])

    def test_v6_reprend_la_mesure_v5(self):
        self.assertEqual(VERSIONS["v6"]["mesures"]["val60"]["run"], VERSIONS["v5"]["mesures"]["val60"]["run"])
        self.assertEqual(VERSIONS["v6"]["mesures"]["val60"]["reprise_de"], "v5")
        self.assertEqual(VERSIONS["v6"]["effet"], {})

    def test_note_finale_a_part(self):
        f = EVOLUTION["final"]
        self.assertEqual((f["jeu"], f["v0"]["n"], f["v7"]["n"]), ("test100", 100, 100))
        self.assertEqual((f["v0"]["entierement_justes"]["justes"], f["v7"]["entierement_justes"]["justes"]), (8, 62))
        for v in VERSIONS.values():
            self.assertNotIn("test100", v["mesures"])

    def test_commandes_git(self):
        self.assertEqual(VERSIONS["v7"]["tags"][0]["nom"], "v7-final")
        self.assertIn("git show v7-final:prompts/v7_sous_motif.txt", [c["commande"] for c in VERSIONS["v7"]["git"]])
        self.assertEqual([v["pr"] for v in VERSIONS.values()], [2, 5, 7, 8, 11, 13, 16, 26])

    @unittest.skipUnless(historique_complet(), "historique Git incomplet (clone superficiel)")
    def test_fichiers_a_jour(self):
        donnees, md = be.construire()
        self.assertEqual(donnees, EVOLUTION, "lancer python3 eval/build_evolution.py")
        self.assertEqual(md, (ROOT / "docs" / "prompt_history.md").read_text(encoding="utf-8"))


if __name__ == "__main__":
    unittest.main()
