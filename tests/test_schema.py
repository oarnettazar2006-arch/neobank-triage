"""Le schéma unique (src/schema.py) est bien celui qu'utilisent le harnais et la chaîne."""

import json
import re
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "src"))
sys.path.insert(0, str(ROOT / "eval"))
import run  # noqa: E402
import schema  # noqa: E402
import triage  # noqa: E402


class SchemaTest(unittest.TestCase):
    def test_same_schema_everywhere(self):
        self.assertEqual(json.dumps(triage.SCHEMA), json.dumps(schema.output_schema(with_injection=True)))
        self.assertEqual(json.dumps(run.build_schema(False, True)), json.dumps(triage.SCHEMA))
        self.assertIs(run.ENUMS, schema.ENUMS)

    def test_field_order(self):
        s = schema.output_schema(with_evidence=True, with_injection=True)
        self.assertEqual(list(s["properties"]), ["evidence", "label", "product", "severity", "is_complaint",
                                                 "unauthorized_payment", "injection_suspected"])

    def test_values_match_the_guide(self):
        guide = (ROOT / "docs" / "annotation_guide.md").read_text(encoding="utf-8")
        for field, values in schema.ENUMS.items():
            row = re.search(rf"^\| {field} \| ([^|]+) \|", guide, re.M).group(1)
            self.assertEqual([v.strip() for v in row.split(",")], values, field)

    def test_sous_motifs_match_the_guide(self):
        guide = (ROOT / "docs" / "annotation_guide.md").read_text(encoding="utf-8")
        section = guide[guide.index("## 2 bis. sous_motif"):guide.index("## 3. product")]
        in_guide = re.findall(r"^\| ([a-z_]+) \| ", section, re.M)
        self.assertEqual([v for v in in_guide if v != "sous"], schema.SOUS_MOTIFS)

    def test_datasets_follow_the_schema(self):
        files = ["dev/dev40", "dev/guide_cases", "val/val60", "calib/calib60", "test/test100",
                 "attacks/attacks30", "attacks/holdout20", "attacks/notebook_case"]
        for name in files:
            for line in (ROOT / "data" / f"{name}.jsonl").read_text(encoding="utf-8").splitlines():
                r = json.loads(line)
                with self.subTest(file=name, id=r["id"]):
                    for field, values in schema.ENUMS.items():
                        self.assertIn(r[field], values)
                    self.assertIn(r["sous_motif"], schema.SOUS_MOTIFS)
                    for field in schema.BOOL_FIELDS + ["attack"]:
                        self.assertIsInstance(r[field], bool)
                    self.assertIn(r["channel"], schema.CHANNELS)
                    self.assertIn(r["split"], schema.SPLITS)
                    self.assertRegex(r["received_at"], r"^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d$")
                    if r["attack"]:
                        self.assertIn(r["attack_type"], schema.ATTACK_TYPES)
                        self.assertIsInstance(r["forbidden"], list)
                        self.assertIsInstance(r["attack_target"], dict)
                    else:
                        self.assertNotIn("attack_type", r)


if __name__ == "__main__":
    unittest.main()
