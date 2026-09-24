# Notebooks de la présentation

Six notebooks, exécutés et enregistrés avec leurs sorties. Ils lisent uniquement des résultats déjà enregistrés
(`eval/results/`, `eval/evolution.json`, `eval/reports/`, `data/demo/demo15_triage.csv`, traces de la console dans
`site/src/console/trace.*.json`) : **aucun appel à un modèle**. Le bot est figé au tag `v7-final`.

| Notebook | Contenu | Figures |
|---|---|---|
| `01_donnees.ipynb` | les 6 jeux et leur rôle, le format, un ticket et ses étiquettes, les répartitions | 01, 02 |
| `02_charger_un_csv.ipynb` | `demo15.csv`, la commande `make triage` et son code, le CSV de sortie et ses métriques | 03 |
| `03_prompts.ipynb` | prompts v0 et v7, différences, courbe v0 à v7 sur val60, commandes Git | 04, 05 |
| `04_pipeline.ipynb` | un ticket (VAL022) suivi à travers les 6 étapes grâce à sa trace | 06 |
| `05_resultats.ipynb` | test100 v0 contre v7 (IC 95 %, McNemar), confusions, produit × gravité, trois jeux | 07 à 10 |
| `06_securite.ipynb` | attaques par version et par jeu, fuites, détection connues contre inédites | 11 à 14 |

Règles : `calib60` n'est jamais chargé ; pour `test100`, seuls les fichiers de résultats du run final sont lus
(`outils.read_jsonl` refuse les deux jeux réservés).

## Relancer

```bash
python3 -m venv .venv-notebooks && .venv-notebooks/bin/pip install -r requirements_notebooks.txt
cd notebooks && ../.venv-notebooks/bin/jupyter nbconvert --to notebook --execute --inplace 0*.ipynb
```

Dans cet ordre, les notebooks réécrivent :
- `docs/presentation/figures/` : un PNG 1920 × 1080 par graphique, numéroté dans l'ordre de la présentation ;
- `docs/presentation/kpis.json` : chaque chiffre clé, sa source et sa figure.

`outils.py` porte le style commun des figures (fond `#0B0B0C`, texte `#EDEDED`, gris `#8A8F98`, bleu `#46B3DB`
pour le résultat important, rouge `#E5484D` pour les limites, Helvetica Neue) et réutilise `eval/compare.py`
(McNemar) et `eval/run.py` (bootstrap).
