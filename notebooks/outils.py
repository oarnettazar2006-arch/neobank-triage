"""Outils communs aux notebooks de la présentation.

Les notebooks lisent uniquement des résultats déjà enregistrés (eval/results/,
eval/evolution.json, eval/reports/, data/demo/, traces de la console) : aucun
appel à un modèle. calib60 n'est jamais chargé ; test100 n'est lu qu'à travers
les résultats du run final (tag v7-final).
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import matplotlib.pyplot as plt
from matplotlib import font_manager

REPO = Path(__file__).resolve().parent.parent
RESULTS = REPO / "eval" / "results"
FIGURES = REPO / "docs" / "presentation" / "figures"
KPIS = REPO / "docs" / "presentation" / "kpis.json"

# Les outils du harnais (bibliothèque standard, aucun appel au modèle à l'import).
sys.path.insert(0, str(REPO / "eval"))
from compare import ALL, FIELDS, compare, load, mcnemar_exact  # noqa: E402,F401
from run import bootstrap_ci  # noqa: E402,F401

# Runs de référence, les mêmes que eval/reports/final_test100.md et eval/evolution.json.
RUNS = {
    "test100_v7": "20260924T121931Z_v7_sous_motif_llama3.1-8b.jsonl",
    "test100_v0": "20260924T125426Z_v0_baseline_llama3.1-8b.jsonl",
    "test100_reply": "20260924T123011Z_reply_v2_fiche_test100.jsonl",
    "val60_v0": "20260923T132652Z_v0_baseline_llama3.1-8b.jsonl",
    "val60_v7": "20260923T220043Z_v7_sous_motif_llama3.1-8b.jsonl",
    "val60_reply": "20260924T060830Z_reply_v2_fiche_val60.jsonl",
    "holdout20_v0": "20260923T133521Z_v0_baseline_llama3.1-8b.jsonl",
    "holdout20_v7": "20260923T220652Z_v7_sous_motif_llama3.1-8b.jsonl",
    "holdout20_reply": "20260924T062548Z_reply_v2_fiche_holdout20.jsonl",
    "attacks30_v7": "20260923T220440Z_v7_sous_motif_llama3.1-8b.jsonl",
    "attacks30_reply": "20260924T062003Z_reply_v2_fiche_attacks30.jsonl",
}

# ---------------------------------------------------------------- lecture


def read_run(name: str) -> tuple[dict, list[dict], dict]:
    """(meta, lignes par ticket, résumé) d'un fichier de eval/results/ (nom de fichier ou clé de RUNS)."""
    path = RESULTS / RUNS.get(name, name)
    recs = [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]
    meta = next((r for r in recs if r["type"] == "meta"), {})
    rows = [r for r in recs if r["type"] in ("ticket", "reply")]
    summary = next((r for r in recs if r["type"] == "summary"), {})
    return meta, rows, summary


def read_jsonl(rel: str) -> list[dict]:
    """Un jeu de data/. Refuse calib60 et test100 : ils ne se lisent pas ici."""
    if "calib60" in rel or "test100" in rel:
        raise ValueError(f"{rel} : jeu réservé, on ne le charge pas dans les notebooks")
    return [json.loads(line) for line in (REPO / rel).read_text(encoding="utf-8").splitlines() if line.strip()]


def evolution() -> dict:
    return json.loads((REPO / "eval" / "evolution.json").read_text(encoding="utf-8"))


# Noms courts des versions, pour les axes des figures
COURT = {"v0": "Minimal", "v1": "Définitions", "v2": "Règles", "v3": "Exemples", "v4": "Anti-injection",
         "v5": "Garde en code", "v6": "Brouillon", "v7": "Sous-motif"}


def pct(x: float, digits: int = 1) -> str:
    """0.617 -> '61,7 %'."""
    return f"{100 * x:.{digits}f} %".replace(".", ",")


# ---------------------------------------------------------------- style des figures

FOND, TEXTE, GRIS, BLEU, ROUGE = "#0B0B0C", "#EDEDED", "#8A8F98", "#46B3DB", "#E5484D"
GRIS_FONCE = "#3A3D42"   # « tout le reste » : barres et séries secondaires
LIGNE = "#26282C"        # quadrillage très léger, quand il sert

font_manager.fontManager.addfont("/System/Library/Fonts/HelveticaNeue.ttc")


def style() -> None:
    plt.rcParams.update({
        "font.family": "Helvetica Neue",
        "font.size": 22,
        "figure.facecolor": FOND, "axes.facecolor": FOND, "savefig.facecolor": FOND,
        "text.color": TEXTE, "axes.labelcolor": GRIS, "axes.edgecolor": GRIS,
        "xtick.color": GRIS, "ytick.color": GRIS, "xtick.labelsize": 20, "ytick.labelsize": 20,
        "axes.titlesize": 24, "axes.titlecolor": TEXTE, "axes.titleweight": "normal",
        "axes.titlelocation": "left", "axes.titlepad": 16,
        "axes.spines.top": False, "axes.spines.right": False,
        "axes.grid": False, "legend.frameon": False, "legend.fontsize": 20,
        "figure.dpi": 100, "savefig.dpi": 100,
    })


style()


def figure(nrows: int = 1, ncols: int = 1, left=0.07, right=0.97, top=0.80, bottom=0.14, **kw):
    """Une figure 1920 x 1080, avec la place du titre en haut et de la source en bas."""
    fig, axes = plt.subplots(nrows, ncols, figsize=(19.2, 10.8), **kw)
    fig.subplots_adjust(left=left, right=right, top=top, bottom=bottom)
    return fig, axes


def finish(fig, numero: int, nom: str, titre: str, source: str, sous_titre: str | None = None) -> Path:
    """Titre (une conclusion chiffrée), ligne de source discrète, export PNG 1920 x 1080."""
    t = fig.text(0.035, 0.93, titre, fontsize=40, color=TEXTE, weight="bold", va="center")
    renderer = fig.canvas.get_renderer()
    while t.get_window_extent(renderer).width > 0.93 * fig.bbox.width and t.get_fontsize() > 26:
        t.set_fontsize(t.get_fontsize() - 1)   # un titre long rétrécit au lieu de sortir du cadre
    if sous_titre:
        fig.text(0.035, 0.87, sous_titre, fontsize=24, color=GRIS, va="center")
    fig.text(0.035, 0.03, f"Source : {source}", fontsize=16, color=GRIS, va="center")
    FIGURES.mkdir(parents=True, exist_ok=True)
    path = FIGURES / f"{numero:02d}_{nom}.png"
    fig.savefig(path, dpi=100)   # pas de bbox_inches : la taille reste 1920 x 1080
    return path


def sobre(ax, grille_y: bool = False) -> None:
    """Axes discrets : pas de cadre haut/droite, quadrillage horizontal très léger si demandé."""
    ax.tick_params(length=0)
    for s in ("left", "bottom"):
        ax.spines[s].set_color(GRIS)
    if grille_y:
        ax.yaxis.grid(True, color=LIGNE, linewidth=1)
        ax.set_axisbelow(True)


# ---------------------------------------------------------------- chiffres clés


def kpi(cle: str, valeur, texte: str, source: str, figure: str | None = None) -> None:
    """Ajoute ou met à jour un chiffre clé dans docs/presentation/kpis.json."""
    data = json.loads(KPIS.read_text(encoding="utf-8")) if KPIS.exists() else {"kpis": {}}
    entry = {"valeur": valeur, "texte": texte, "source": source}
    if figure:
        entry["figure"] = figure
    data["kpis"][cle] = entry
    data["kpis"] = dict(sorted(data["kpis"].items()))
    # les sources citent les runs par leur horodatage : on donne le fichier complet de chacun
    cites = " ".join(e["source"] for e in data["kpis"].values())
    data["runs"] = {f.name[:16]: f"eval/results/{f.name}" for f in sorted(RESULTS.glob("*.jsonl"))
                    if f.name[:16] in cites}
    data["note"] = ("Écrit par les notebooks de notebooks/ à partir des résultats enregistrés, sans appel à un modèle. "
                    "Bot figé au tag v7-final.")
    KPIS.parent.mkdir(parents=True, exist_ok=True)
    KPIS.write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
