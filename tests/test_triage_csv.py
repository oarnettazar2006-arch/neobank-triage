"""Tests de eval/triage_csv.py avec un LLM simulé (sans Ollama).

Le vrai code s'exécute (garde, tri, contrôleur, délais, rédacteur, garde de
sortie) ; seul l'appel HTTP à Ollama est remplacé. Le faux LLM répond selon le
schéma demandé et, pour le tri, selon un mot repère glissé dans le ticket.
"""

import csv
import io
import json
import sys
import tempfile
import unittest
import urllib.request
from pathlib import Path
from unittest import mock

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "eval"))
sys.path.insert(0, str(ROOT / "src"))
import controller  # noqa: E402
import triage  # noqa: E402
import triage_csv  # noqa: E402
from pipeline import process  # noqa: E402

BASE = {"sous_motif": "autre", "is_complaint": False, "unauthorized_payment": False, "injection_suspected": False}
TRI = {   # mot repère dans le ticket -> réponse du tri
    "CARTE": {**BASE, "label": "bug", "sous_motif": "carte_refusee", "product": "card", "severity": "high"},
    "FRAIS": {**BASE, "label": "billing", "sous_motif": "frais_contestes", "product": "account", "severity": "medium",
              "is_complaint": True},
    "RIB": {**BASE, "label": "other", "sous_motif": "demande_document", "product": "account", "severity": "low"},
}
RECU = "2026-10-07T14:00:00"   # mercredi


class FauxLLM:
    def __init__(self):
        self.calls = []   # (modèle, étape)

    def __call__(self, req, timeout=None):
        payload = json.loads(req.data)
        if req.full_url.endswith("/api/generate"):   # déchargement d'un modèle
            self.calls.append((payload["model"], "unload"))
            return _Response(b"{}")
        props = payload["format"]["properties"]
        if "brouillon" in props:
            step, content = "brouillon", {"brouillon": "Bonjour,\n\nVotre demande est transmise à un conseiller."}
        elif list(props) == ["sous_motif"]:
            step = "controle"
            content = {"sous_motif": "carte_refusee" if "CARTE" in ticket(payload, controller.prompt()) else "autre"}
        else:
            step = "tri"
            text = ticket(payload, triage.PROMPT.read_text(encoding="utf-8"))
            content = next(v for k, v in TRI.items() if k in text)
        self.calls.append((payload["model"], step))
        return _Response(json.dumps({"message": {"content": json.dumps(content, ensure_ascii=False)}}).encode())


def ticket(payload: dict, template: str) -> str:
    """Le texte du ticket inséré à la place de {ticket} dans le prompt."""
    before, after = template.split("{ticket}")
    text = payload["messages"][0]["content"]
    return text[len(before):len(text) - len(after)]


class _Response(io.BytesIO):
    def __enter__(self):
        return self

    def __exit__(self, *exc):
        return False


def write(path: Path, rows: list, delimiter: str = ",", bom: bool = False) -> Path:
    buf = io.StringIO()
    csv.writer(buf, delimiter=delimiter).writerows(rows)
    path.write_text(("﻿" if bom else "") + buf.getvalue(), encoding="utf-8")
    return path


def read(path: Path, delimiter: str = ",") -> list:
    with path.open(encoding="utf-8", newline="") as fh:
        return list(csv.DictReader(fh, delimiter=delimiter))


class TriageCsvTest(unittest.TestCase):
    def setUp(self):
        self.dir = tempfile.TemporaryDirectory()
        self.addCleanup(self.dir.cleanup)
        self.tmp = Path(self.dir.name)
        self.llm = FauxLLM()
        patch = mock.patch.object(urllib.request, "urlopen", self.llm)
        patch.start()
        self.addCleanup(patch.stop)
        err = mock.patch.object(sys, "stderr", io.StringIO())
        self.stderr = err.start()
        self.addCleanup(err.stop)

    def run_csv(self, path: Path, *args: str) -> int:
        return triage_csv.main([str(path), "--recu-le", RECU, *args])

    def test_sortie_reprend_les_colonnes_et_ajoute_les_predictions(self):
        src = write(self.tmp / "t.csv", [
            ["id", "ticket", "categorie", "produit", "severite", "note"],
            ["A1", "Ma CARTE est refusée partout.", "bug", "card", "high", "x"],
            ["A2", "Ces FRAIS sont injustes,\nje conteste.", "billing", "card", "medium", "y"],
            ["A3", "Pouvez-vous m'envoyer un RIB ?", "other", "account", "low", "z"],
        ])
        self.assertEqual(self.run_csv(src), 0)
        out = read(self.tmp / "t_triage.csv")
        self.assertEqual(list(out[0])[:6], ["id", "ticket", "categorie", "produit", "severite", "note"])
        self.assertEqual(list(out[0])[6:], triage_csv.PREDICTED)
        self.assertEqual(out[1]["ticket"], "Ces FRAIS sont injustes,\nje conteste.")
        self.assertEqual([r["categorie_predite"] for r in out], ["bug", "billing", "other"])
        self.assertEqual([r["reclamation"] for r in out], ["non", "oui", "non"])
        self.assertEqual(out[0]["sous_motif"], "carte_refusee")
        self.assertEqual(out[0]["controle"], "accord")
        self.assertEqual(out[1]["controle"], "désaccord")
        # Échéances calculées en code depuis le mercredi 7 octobre 2026
        self.assertEqual(out[0]["echeance"], "2026-10-09")   # objectif interne, 2 jours ouvrables
        self.assertEqual(out[1]["echeance"], "2026-10-21")   # accusé de réception, 10 jours ouvrables
        self.assertIn("reste ~", self.stderr.getvalue())

    def test_rapport_markdown_precision_tout_juste_et_matrices(self):
        src = write(self.tmp / "t.csv", [
            ["ticket", "categorie", "produit", "severite"],
            ["CARTE refusée", "bug", "card", "high"],            # tout juste
            ["FRAIS contestés", "billing", "card", "medium"],    # produit faux (account prédit)
            ["RIB svp", "other", "account", "high"],             # gravité fausse (low prédit)
            ["RIB encore", "other", "account", ""],               # sans gravité : hors taux « tout juste »
        ])
        self.assertEqual(self.run_csv(src), 0)
        md = (self.tmp / "t_triage.md").read_text(encoding="utf-8")
        self.assertIn("| categorie | 4 | 4 | 100,0 % |", md)
        self.assertIn("| produit | 3 | 4 | 75,0 % |", md)
        self.assertIn("| severite | 2 | 3 | 66,7 % |", md)
        self.assertIn("1 sur 3, soit 33,3 %", md)
        self.assertIn("| card | **1** | 1 |", md)   # produit : un card juste, un card prédit account
        self.assertIn("### severite", md)

    def test_sans_bonnes_reponses_pas_de_rapport_et_separateur_point_virgule(self):
        src = write(self.tmp / "t.csv", [["id", "ticket"], ["A1", "CARTE bloquée ; plus rien, vite"], ["A2", "RIB"]],
                    delimiter=";", bom=True)
        self.assertEqual(self.run_csv(src), 0)
        out = read(self.tmp / "t_triage.csv", delimiter=";")
        self.assertEqual(out[0]["ticket"], "CARTE bloquée ; plus rien, vite")
        self.assertEqual(out[1]["produit_predit"], "account")
        self.assertFalse((self.tmp / "t_triage.md").exists())

    def test_brouillon_ajoute_les_colonnes_du_redacteur(self):
        src = write(self.tmp / "t.csv", [["ticket"], ["CARTE refusée"], ["RIB svp"]])
        self.assertEqual(self.run_csv(src, "--brouillon", "--out", str(self.tmp / "o.csv")), 0)
        out = read(self.tmp / "o.csv")
        self.assertEqual(list(out[0])[-3:], triage_csv.DRAFT_COLUMNS)
        self.assertEqual(out[0]["fiche"], "carte_refusee")   # tri et contrôleur d'accord
        self.assertEqual(out[1]["fiche"], "")                 # désaccord : brouillon générique
        self.assertIn("vendredi 9 octobre 2026", out[0]["brouillon"])   # date ajoutée en code
        self.assertEqual(out[0]["brouillon_bloque"], "non")

    def test_un_seul_modele_a_la_fois(self):
        src = write(self.tmp / "t.csv", [["ticket"], ["CARTE"], ["RIB"], ["FRAIS"]])
        self.assertEqual(self.run_csv(src, "--brouillon"), 0)
        steps = [s for _, s in self.llm.calls]
        self.assertEqual(steps, ["tri"] * 3 + ["unload"] + ["controle"] * 3 + ["brouillon"] * 3 + ["unload"])

    def test_trace_voit_chaque_etape_sans_changer_les_predictions(self):
        rows = [{"ticket": "CARTE refusée"}, {"ticket": "FRAIS abusifs"}]
        progress = lambda: triage_csv.Progress(2, ["tri", "contrôle", "brouillon"], stream=io.StringIO())  # noqa: E731
        vus = []

        def trace(step, k, call):
            vus.append((step, k))
            return call()

        sans = triage_csv.process(rows, True, RECU, progress())
        avec = triage_csv.process(rows, True, RECU, progress(), trace=trace)
        self.assertEqual(avec, sans)
        self.assertEqual(vus, [("tri", 0), ("tri", 1), ("contrôle", 0), ("contrôle", 1),
                               ("brouillon", 0), ("brouillon", 1), ("délais", 0), ("délais", 1)])

    def test_memes_champs_que_le_pipeline(self):
        src = write(self.tmp / "t.csv", [["id", "ticket"], ["A1", "CARTE refusée"], ["A2", "FRAIS abusifs"]])
        self.assertEqual(self.run_csv(src), 0)
        out = read(self.tmp / "t_triage.csv")
        for row in out:
            ref = process({"id": row["id"], "input": row["ticket"], "channel": "form", "received_at": RECU})
            self.assertEqual(row["categorie_predite"], ref["fields"]["label"])
            self.assertEqual(row["sous_motif"], ref["fields"]["sous_motif"])
            self.assertEqual(row["reclamation"], "oui" if ref["fields"]["is_complaint"] else "non")

    def test_canal_et_date_de_reception_par_ticket(self):
        src = write(self.tmp / "t.csv", [["ticket", "canal", "recu_le"],
                                          ["FRAIS", "chat", "2026-10-07T14:00:00"]])
        self.assertEqual(self.run_csv(src), 0)
        # Réclamation par chat : pas d'accusé de réception, réponse sous 15 jours ouvrables (produit account : 2 mois)
        self.assertEqual(read(self.tmp / "t_triage.csv")[0]["echeance"], "2026-12-07")

    def test_erreurs_d_entree(self):
        cases = {
            "sans_ticket.csv": [["texte"], ["CARTE"]],
            "mauvaise_valeur.csv": [["ticket", "categorie"], ["CARTE", "facturation"]],
            "ticket_vide.csv": [["ticket"], [""]],
            "vide.csv": [["ticket"]],
            "colonne_reservee.csv": [["ticket", "echeance"], ["CARTE", "x"]],
            "virgule_sans_guillemets.csv": [["ticket"], ["CARTE", "refusée"]],
        }
        for name, rows in cases.items():
            with self.subTest(name):
                self.assertEqual(self.run_csv(write(self.tmp / name, rows)), 2)
        self.assertEqual(self.llm.calls, [])
        self.assertIn("attendu : billing, bug, other", self.stderr.getvalue())

    def test_ollama_absent(self):
        src = write(self.tmp / "t.csv", [["ticket"], ["CARTE"]])
        with mock.patch.object(urllib.request, "urlopen", side_effect=ConnectionRefusedError("refusé")):
            self.assertEqual(self.run_csv(src), 1)
        self.assertIn("Ollama ne répond pas", self.stderr.getvalue())


class Demo15Test(unittest.TestCase):
    def test_demo15_tire_de_val60_et_varie(self):
        demo = read(ROOT / "data" / "demo" / "demo15.csv")
        val = {r["id"]: r for r in map(json.loads, (ROOT / "data" / "val" / "val60.jsonl").open(encoding="utf-8"))}
        others = {json.loads(line)["input"] for p in ("data/calib/calib60.jsonl", "data/test/test100.jsonl")
                  for line in (ROOT / p).open(encoding="utf-8")}
        self.assertEqual(len(demo), 15)
        self.assertEqual(list(demo[0]), ["id", "ticket", "categorie", "produit", "severite"])
        for row in demo:
            v = val[row["id"]]
            self.assertEqual((row["ticket"], row["categorie"], row["produit"], row["severite"]),
                             (v["input"], v["label"], v["product"], v["severity"]))
            self.assertNotIn(row["ticket"], others)
        chosen = [val[r["id"]] for r in demo]
        for field, values in triage_csv.ENUMS.items():
            self.assertEqual({v[field] for v in chosen}, set(values), field)
        self.assertTrue(any(v["attack"] for v in chosen))
        self.assertTrue(any(v["unauthorized_payment"] for v in chosen))
        self.assertTrue(any("implicite" in v["rule_tested"] and v["is_complaint"] for v in chosen))


if __name__ == "__main__":
    unittest.main()
