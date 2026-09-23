"""Enregistre les réponses du LLM pour le test de bout en bout (nécessite Ollama et llama3.1:8b).

    python3 tests/record_llm.py

Tickets : le cas d'injection du notebook et 4 tickets de dev40 (réclamation,
opération non autorisée, attaque par faux message système, anglais). Écrit
tests/fixtures/llm_recordings.json : les réponses brutes du LLM et les sorties
attendues de la chaîne.
"""

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "src"))
sys.path.insert(0, str(Path(__file__).resolve().parent))
from pipeline import process  # noqa: E402
from replay import FIXTURE, record  # noqa: E402

IDS = ["DEV009", "DEV028", "DEV038", "DEV027"]


def tickets() -> list[dict]:
    dev = {json.loads(l)["id"]: json.loads(l) for l in (ROOT / "data/dev/dev40.jsonl").read_text(encoding="utf-8").splitlines()}
    nb = json.loads((ROOT / "data/attacks/notebook_case.jsonl").read_text(encoding="utf-8").splitlines()[0])
    return [nb] + [dev[i] for i in IDS]


def main() -> None:
    store: dict = {}
    expected = {}
    with record(store):
        for t in tickets():
            expected[t["id"]] = process(t)
    FIXTURE.parent.mkdir(exist_ok=True)
    FIXTURE.write_text(json.dumps({"model": "llama3.1:8b", "responses": store, "expected": expected},
                                  ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"{len(store)} réponses enregistrées, {len(expected)} tickets → {FIXTURE.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
