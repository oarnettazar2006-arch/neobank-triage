"""Détection des tickets trop proches, par embeddings nomic (via Ollama).

Usage :
    python eval/dedup.py --new data/val/val60.jsonl data/calib/calib60.jsonl \
                         --ref data/dev/dev40.jsonl data/dev/guide_cases.jsonl \
                         [--threshold 0.85] [--out rapport.json]

Compare chaque ticket de `--new` à tous les tickets de `--ref` et à tous les
autres tickets de `--new` (y compris d'un autre fichier). Affiche les paires
dont la similarité cosinus dépasse le seuil. Code de sortie 1 s'il en reste.
Bibliothèque standard uniquement ; un seul modèle chargé à la fois.
"""

from __future__ import annotations

import argparse
import json
import math
import os
import sys
import urllib.request
from pathlib import Path

MODEL = "nomic-embed-text"
PREFIX = "search_document: "  # préfixe de tâche nomic pour des documents ; "clustering: " rend 0,85 inutilisable (médiane 0,86 sur dev40)


def ollama(host: str, path: str, payload: dict) -> dict:
    req = urllib.request.Request(host.rstrip("/") + path, data=json.dumps(payload).encode(),
                                 headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req, timeout=600) as resp:
        return json.loads(resp.read())


def unload_others(host: str) -> None:
    req = urllib.request.Request(host.rstrip("/") + "/api/ps")
    with urllib.request.urlopen(req, timeout=30) as resp:
        loaded = json.loads(resp.read()).get("models", [])
    for m in loaded:
        if not m["name"].startswith(MODEL):
            ollama(host, "/api/generate", {"model": m["name"], "keep_alive": 0})


def embed(host: str, texts: list[str], batch: int = 32) -> list[list[float]]:
    vectors = []
    for i in range(0, len(texts), batch):
        chunk = [PREFIX + t for t in texts[i:i + batch]]
        vectors += ollama(host, "/api/embed", {"model": MODEL, "input": chunk})["embeddings"]
    return [normalize(v) for v in vectors]


def normalize(v: list[float]) -> list[float]:
    n = math.sqrt(sum(x * x for x in v)) or 1.0
    return [x / n for x in v]


def cosine(a: list[float], b: list[float]) -> float:
    return sum(x * y for x, y in zip(a, b))


def load(paths: list[Path]) -> list[dict]:
    rows = []
    for p in paths:
        for line in p.read_text(encoding="utf-8").splitlines():
            if line.strip():
                r = json.loads(line)
                rows.append({"file": p.name, "id": r["id"], "input": r["input"]})
    return rows


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--new", nargs="+", type=Path, required=True, help="jeux à contrôler")
    ap.add_argument("--ref", nargs="*", type=Path, default=[], help="jeux de référence, non modifiables")
    ap.add_argument("--threshold", type=float, default=0.85)
    ap.add_argument("--out", type=Path, help="écrit toutes les paires au-dessus du seuil en JSON")
    ap.add_argument("--host", default=os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434"))
    args = ap.parse_args()

    new, ref = load(args.new), load(args.ref)
    unload_others(args.host)
    vn = embed(args.host, [r["input"] for r in new])
    vr = embed(args.host, [r["input"] for r in ref]) if ref else []

    pairs = []
    for i, a in enumerate(new):
        for j in range(i + 1, len(new)):
            s = cosine(vn[i], vn[j])
            if s > args.threshold:
                pairs.append({"sim": round(s, 4), "a": a, "b": new[j], "kind": "new-new"})
        for j, b in enumerate(ref):
            s = cosine(vn[i], vr[j])
            if s > args.threshold:
                pairs.append({"sim": round(s, 4), "a": a, "b": b, "kind": "new-ref"})
    pairs.sort(key=lambda p: -p["sim"])

    # Similarité maximale de chaque nouveau ticket, pour le rapport.
    best = []
    for i, a in enumerate(new):
        sims = [cosine(vn[i], vn[j]) for j in range(len(new)) if j != i] + [cosine(vn[i], v) for v in vr]
        best.append(max(sims) if sims else 0.0)
    best.sort()
    q = lambda p: best[min(len(best) - 1, int(p * len(best)))]
    print(f"{len(new)} tickets contrôlés contre {len(new) - 1} autres et {len(ref)} de référence")
    print(f"Similarité max par ticket : médiane {q(0.5):.3f}, p90 {q(0.9):.3f}, max {best[-1]:.3f}")
    print(f"Paires au-dessus de {args.threshold} : {len(pairs)}")
    for p in pairs:
        print(f"  {p['sim']:.3f}  {p['a']['file']}:{p['a']['id']}  ~  {p['b']['file']}:{p['b']['id']}")
        print(f"         {p['a']['input'][:90]}")
        print(f"         {p['b']['input'][:90]}")
    if args.out:
        args.out.write_text(json.dumps(pairs, ensure_ascii=False, indent=1), encoding="utf-8")
    sys.exit(1 if pairs else 0)


if __name__ == "__main__":
    main()
