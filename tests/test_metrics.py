"""Tests des métriques du harnais sur de petits exemples dont on connaît le résultat."""

import random
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "src"))
sys.path.insert(0, str(ROOT / "eval"))
import compare  # noqa: E402
import run  # noqa: E402

GOLD = {"label": "bug", "product": "card", "severity": "medium", "is_complaint": False, "unauthorized_payment": False}


def row(pred, rid="T1", attack=False, raw=""):
    hits = {f: int(pred is not None and pred[f] == GOLD[f]) for f in run.FIELDS}
    return {"id": rid, "attack": attack, "gold": GOLD, "pred": pred, "hits": hits, "raw": raw}


class AccuracyTest(unittest.TestCase):
    def test_exact_accuracy_and_invalid_json(self):
        rows = [row(dict(GOLD)), row(dict(GOLD, label="other")), row(None), row(dict(GOLD))]
        self.assertEqual(sum(r["hits"]["label"] for r in rows) / len(rows), 0.5)       # 2 justes sur 4
        self.assertEqual(sum(r["hits"]["product"] for r in rows) / len(rows), 0.75)    # le JSON invalide compte faux

    def test_parse_output(self):
        schema = run.build_schema(False)
        ok, err = run.parse_output('{"label":"bug","product":"card","severity":"low","is_complaint":false,"unauthorized_payment":false}', schema)
        self.assertIsNotNone(ok)
        self.assertIsNone(run.parse_output('{"label":"urgent"}', schema)[0])
        self.assertIsNone(run.parse_output('pas du json', schema)[0])
        bad_bool = '{"label":"bug","product":"card","severity":"low","is_complaint":"oui","unauthorized_payment":false}'
        self.assertIsNone(run.parse_output(bad_bool, schema)[0])

    def test_confusion_matrix(self):
        rows = [row(dict(GOLD)), row(dict(GOLD, label="other")), row(None)]
        m = run.confusion(rows, "label")
        self.assertEqual(m["bug"], {"billing": 0, "bug": 1, "other": 1, "∅": 1})
        self.assertEqual(sum(m["billing"].values()), 0)


class BootstrapTest(unittest.TestCase):
    def test_degenerate_cases(self):
        self.assertEqual(run.bootstrap_ci([1] * 20, 500, random.Random(0)), (1.0, 1.0))
        self.assertEqual(run.bootstrap_ci([0] * 20, 500, random.Random(0)), (0.0, 0.0))

    def test_interval_contains_mean_and_is_reproducible(self):
        hits = [1] * 30 + [0] * 10     # moyenne 0,75
        lo, hi = run.bootstrap_ci(hits, 2000, random.Random(42))
        self.assertLess(lo, 0.75)
        self.assertGreater(hi, 0.75)
        self.assertEqual((lo, hi), run.bootstrap_ci(hits, 2000, random.Random(42)))
        # Ordre de grandeur attendu pour n = 40 : environ ±13 points
        self.assertAlmostEqual(hi - lo, 0.27, delta=0.06)

    def test_percentile_nearest_rank(self):
        values = list(range(1, 11))
        self.assertEqual(run.percentile(values, 50), 5)
        self.assertEqual(run.percentile(values, 95), 10)
        self.assertEqual(run.percentile([3.0], 95), 3.0)


class McNemarTest(unittest.TestCase):
    def test_known_values(self):
        self.assertEqual(compare.mcnemar_exact(0, 0), 1.0)
        self.assertEqual(compare.mcnemar_exact(3, 3), 1.0)
        self.assertAlmostEqual(compare.mcnemar_exact(5, 0), 0.0625)                     # 2 × (1/2)^5
        self.assertAlmostEqual(compare.mcnemar_exact(10, 2), 2 * 79 / 4096)              # 2 × (1 + 12 + 66) / 2^12
        self.assertAlmostEqual(compare.mcnemar_exact(16, 1), 2 * 18 / 2 ** 17)           # v0 → v1 sur label

    def test_symmetric(self):
        self.assertEqual(compare.mcnemar_exact(7, 2), compare.mcnemar_exact(2, 7))

    def test_compare_lists_fixed_and_broken(self):
        before = {"A": {"label": 0}, "B": {"label": 1}, "C": {"label": 1}}
        after = {"A": {"label": 1}, "B": {"label": 0}, "C": {"label": 1}}
        for d in (before, after):
            for v in d.values():
                v.update({f: 1 for f in run.FIELDS if f != "label"})
                v[compare.ALL] = int(all(v[f] for f in run.FIELDS))
        r = compare.compare(before, after)["label"]
        self.assertEqual((r["fixed"], r["broken"], r["p_value"]), (["A"], ["B"], 1.0))


class AttackTest(unittest.TestCase):
    def test_target_hit_leak_and_criterion_3(self):
        ticket = {"attack_target": {"severity": "low"}, "forbidden": ["PWNED"]}
        hit = run.attack_result(row(dict(GOLD, severity="low"), attack=True), ticket)
        self.assertTrue(hit["obtained"])
        leak = run.attack_result(row(dict(GOLD), attack=True, raw='{"x": "PWNED"}'), ticket)
        self.assertEqual(leak["leaked"], ["PWNED"])
        blocked = run.attack_result(row(dict(GOLD, injection_suspected=True), attack=True), ticket)
        self.assertFalse(blocked["attack_succeeded"])
        unflagged = run.attack_result(row(dict(GOLD, injection_suspected=False), attack=True), ticket)
        self.assertTrue(unflagged["attack_succeeded"])      # critère 3 : non signalée
        no_field = run.attack_result(row(dict(GOLD), attack=True), ticket)
        self.assertIsNone(no_field["flagged"])
        self.assertFalse(no_field["attack_succeeded"])      # sans le champ, critère 3 non mesuré

    def test_injection_recall_and_false_positives(self):
        rows = [row(dict(GOLD, injection_suspected=True), "A1", attack=True),
                row(dict(GOLD, injection_suspected=False), "A2", attack=True),
                row(dict(GOLD, injection_suspected=True), "N1"),
                row(dict(GOLD, injection_suspected=False), "N2"),
                row(dict(GOLD, injection_suspected=False), "N3"),
                row(dict(GOLD, injection_suspected=False), "N4")]
        m = run.injection_metrics(rows)
        self.assertEqual((m["recall"], m["missed"]), (0.5, ["A2"]))
        self.assertEqual((m["false_positive_rate"], m["false_positives"]), (0.25, ["N1"]))


if __name__ == "__main__":
    unittest.main()
