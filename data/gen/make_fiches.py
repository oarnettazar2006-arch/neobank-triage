"""Tire les fiches des jeux val60, calib60, test100 et attacks30 (étiquetage par construction).

La fiche est tirée avant l'écriture du ticket : l'étiquette vient de la fiche,
pas d'une lecture du texte. Les combinaisons de champs (label, product,
severity, is_complaint, unauthorized_payment, attack, difficulty) reprennent
celles de dev40, en proportion. Personas et styles sont nouveaux.

Usage : python data/gen/make_fiches.py   (écrit data/gen/fiches.csv, seed fixe)
"""

from __future__ import annotations

import csv
import json
import random
from datetime import datetime, timedelta
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parent.parent
SEED = 20260923
CONTENT = ["label", "product", "severity", "is_complaint", "unauthorized_payment"]
ATTACK_TYPES = ["direct", "fake_system", "impersonation", "data_exfil", "promise", "hidden", "foreign"]
SETS = [("val", "VAL", 60), ("calib", "CAL", 60), ("test", "TST", 100)]

PERSONAS = [
    "boulanger qui ouvre à 5 h", "infirmière de nuit", "chauffeur VTC", "expatrié au Portugal",
    "lycéenne de 17 ans", "agricultrice", "graphiste auto-entrepreneur", "veuf de 78 ans",
    "étudiante Erasmus", "intérimaire", "avocate pressée", "jeune père de jumeaux",
    "commerçante sur les marchés", "développeur", "aide-soignante", "militaire en mission",
    "musicien intermittent", "personne malvoyante qui dicte", "gérant de food truck",
    "retraitée installée au Maroc", "infirmier libéral", "doctorante", "couvreur",
    "mère solo de trois enfants", "saisonnier en station de ski", "comptable minutieuse",
    "joueur de poker en ligne", "photographe de mariage", "apprenti mécanicien", "pharmacienne",
]
STYLES = [
    "SMS sans ponctuation", "lettre formelle", "dictée vocale sans ponctuation", "très court",
    "long récit détaillé", "liste à puces", "ironique", "colère en majuscules", "poli et hésitant",
    "fautes d'orthographe", "télégraphique", "inquiet", "factuel", "familier", "sec",
]


def languages(n: int, rng: random.Random) -> list[str]:
    """Environ 10 % d'anglais ou de franglais, comme dev40 : 7,5 % anglais, 2,5 % franglais."""
    en, fg = round(0.075 * n), max(1, round(0.025 * n))
    langs = ["en"] * en + ["franglais"] * fg + ["fr"] * (n - en - fg)
    rng.shuffle(langs)
    return langs


def main() -> None:
    rng = random.Random(SEED)
    dev = [json.loads(l) for l in (REPO / "data/dev/dev40.jsonl").read_text(encoding="utf-8").splitlines()]
    channels = [r["channel"] for r in dev]
    start = datetime(2026, 10, 1, 7, 0)

    def base(tuple_row: dict, lang: str) -> dict:
        return {
            **{k: tuple_row[k] for k in CONTENT},
            "difficulty": tuple_row["difficulty"],
            "channel": rng.choice(channels),
            "received_at": (start + timedelta(minutes=rng.randrange(0, 76 * 24 * 60))).strftime("%Y-%m-%dT%H:%M:00"),
            "persona": rng.choice(PERSONAS),
            "style": rng.choice(STYLES),
            "lang": lang,
        }

    fiches = []
    attack_cycle = 0
    for split, prefix, n in SETS:
        # Reste tiré de façon stratifiée (un ticket sur deux de dev40 trié), pour garder les proportions.
        ordered = sorted(dev, key=lambda r: (r["attack"], r["label"], r["product"], r["severity"], r["id"]))
        offset = rng.randrange(2)
        tuples = dev * (n // len(dev)) + ordered[offset::2][: n % len(dev)]
        rng.shuffle(tuples)
        langs = languages(n, rng)
        for i, t in enumerate(tuples, 1):
            f = {"id": f"{prefix}{i:03d}", "split": split, **base(t, langs[i - 1]), "attack": t["attack"], "attack_type": ""}
            if t["attack"]:
                f["attack_type"] = ATTACK_TYPES[attack_cycle % len(ATTACK_TYPES)]
                attack_cycle += 1
            fiches.append(f)

    # attacks30 : les 7 types, contenu tiré des tickets normaux de dev40, ou sans vraie demande.
    normal = [r for r in dev if not r["attack"]]
    pure = {"label": "other", "product": "unknown", "severity": "low", "is_complaint": False,
            "unauthorized_payment": False, "difficulty": "hard"}
    types = [t for t in ATTACK_TYPES for _ in range(4)] + ["direct", "fake_system"]
    rng.shuffle(types)
    langs = languages(len(types), rng)
    for i, atype in enumerate(types, 1):
        content = pure if (atype in ("impersonation", "data_exfil") and rng.random() < 0.5) else dict(rng.choice(normal), difficulty="hard")
        fiches.append({"id": f"ATK{i:03d}", "split": "attacks", **base(content, langs[i - 1]), "attack": True, "attack_type": atype})

    cols = ["id", "split", *CONTENT, "attack", "attack_type", "difficulty", "channel", "received_at", "persona", "style", "lang"]
    with (HERE / "fiches.csv").open("w", encoding="utf-8", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=cols)
        w.writeheader()
        for f in fiches:
            w.writerow({k: (str(f[k]).lower() if isinstance(f[k], bool) else f[k]) for k in cols})
    print(f"{len(fiches)} fiches écrites dans {HERE / 'fiches.csv'}")


if __name__ == "__main__":
    main()
