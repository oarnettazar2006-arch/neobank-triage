# neobank-triage

Bot de triage de tickets support pour une néobanque (projet 1 : DATA, prompt et git).

## Arborescence

- `src/` : le bot, en bibliothèque standard
  - `schema.py` : valeurs fermées et schéma de sortie (source unique)
  - `guard.py` : garde d'entrée (injections repérées et retirées avant le LLM)
  - `triage.py` : chaîne de tri (garde, puis LLM avec `prompts/v7_sous_motif.txt`, qui prédit aussi `sous_motif`)
  - `deadlines.py` : délais réglementaires en jours ouvrables
  - `reply.py`, `output_guard.py` : brouillon de réponse et garde de sortie
  - `answers.py` : chargeur de la base de réponses (`docs/answers/`, une fiche par `sous_motif`) et garde-fou de la fiche (`choose`)
  - `controller.py` : contrôleur qwen2.5:7b, prédit `sous_motif` sur le texte nettoyé par la garde ; la fiche n'est transmise au rédacteur que si tri et contrôleur sont d'accord et cohérents avec le label
  - `notebook.py` : adaptateur compatible avec le notebook du cours (`classify`, `extract`, `draft_reply_for`)
- `prompts/` : prompts versionnés en `.txt` (`v7_sous_motif.txt` en service ; `reply_v1*.txt` pour les brouillons génériques, `reply_v2_fiche.txt` avec fiche ; v0 à v4 pour l'historique)
- `data/dev/` : dev40 (réglage), `guide_cases.jsonl` (cas limites du guide), `raw/` (sources de dev40)
- `data/val/` : val60, juge des étapes du bot
- `data/calib/` : calib60, réservé au seuil de confiance
- `data/test/` : test100, réservé à la note finale
- `data/demo/` : `demo15.csv`, 15 tickets tirés de val60 au format d'entrée de `make triage`
- `data/attacks/` : attacks30, holdout20 (contrôle de généralisation), `notebook_case.jsonl` (cas du notebook, rejoué à chaque évaluation)
- `data/gen/` : génération des jeux (fiches, textes, corrections, holdout)
- `data/qc/` : contrôle qualité des données (réétiquetage par qwen2.5:7b)
- `data/train/` : réservé, vide
- `eval/` : `triage_csv.py` (livrable principal : tri d'un CSV de tickets, métriques si les bonnes réponses sont là ; `make triage CSV=...`), `run.py` (harnais du tri), `compare.py` (McNemar apparié), `run_controller.py` (contrôleur), `run_reply.py` (brouillons, `--controller` pour la fiche) et `judge_reply.py`, `dedup.py`, `notebook_check.py`
- `eval/build_evolution.py` : écrit `eval/evolution.json` (onglet Prompts de la console) et `docs/prompt_history.md`, l'histoire des prompts v0 à v7, à partir de `eval/results/` et de Git ; `--check` vérifie qu'ils sont à jour
- `eval/reports/` : un rapport par étape (`final_test100.md` : note finale, tag `v7-final`, tableaux par `eval/final_report.py`) ; `eval/results/` : résultats bruts horodatés
- `tests/` : tests unitaires (`python3 -m unittest discover -s tests`) ; `test_bot_fige.py` vérifie que les prompts et le code du bot n'ont pas bougé depuis `v7-final`
- `docs/` : guide d'annotation, politique d'automatisation, data card, audit, base de réponses (`answers/`), histoire des prompts (`prompt_history.md`)
- `api/` : API FastAPI + SQLite (`main.py`, `db.py`, `suivi.py`, `lots.py` pour les lots de la console, `donnees_demo.json`), dépendances dans `api/requirements.txt`, environnement `.venv` (Python ≥ 3.10) ; base `api/vault.db` ignorée par git ; tests avec LLM simulé (`make test-api`)
- `site/` : le front (Vite, React, TypeScript, Tailwind), selon `docs/DESIGN.md` ; l'accueil client v2, le chat et la console conseiller (`/console` pour le tri d'un lot, `/console/prompts` pour l'évolution des prompts ; `src/console/`), sur l'API (`npm run dev`, `npm run lint`, `npm run build`, `npm test`)
- `make demo` : l'API (port 8000) et le site ensemble, avec le vrai pipeline sur Ollama

## Règles

- **Modèle par défaut :** `llama3.1:8b` via Ollama en local (`http://localhost:11434`).
- **Jamais de modèle de plus de 8 Go.** Le Mac a 16 Go de RAM, et un modèle plus gros l'a déjà fait planter.
- **Les 24 tickets officiels du prof servent uniquement à l'évaluation finale.** Ils ne servent jamais au réglage : ni pour ajuster le prompt, ni pour choisir des exemples few-shot, ni pour fixer des seuils.
- **Une modification à la fois.** Chaque changement est mesuré avant et après sur le même jeu de données.
- **Ne jamais deviner.** Si une consigne est ambiguë, ou si un fichier ou un script manque, poser la question au lieu de supposer ou de substituer.
- **Données entièrement synthétiques.** Aucune donnée réelle de banque, nulle part dans ce repo.

## Règles de fusion

- **PR d'étape du bot** (`exp/...` : prompt, schéma, modèle) : fusionnée seulement si deux conditions sont remplies.
  - Aucun champ ne régresse significativement face à la référence : McNemar exact apparié (`eval/compare.py`), p < 0,05 en défaveur.
  - Le nombre d'attaques réussies n'augmente pas face à la référence, sur les mêmes jeux.
  - Sinon, la PR reste ouverte avec l'explication. Une fois fusionnée, la version devient la référence.
  - **Objectif de la version finale : zéro attaque réussie**, vérifié sur test100 avant l'oral.
- **PR de données** (`data/...` : jeux, étiquettes, outils de génération) : fusionnée quand ses contrôles de qualité passent (format du guide, quasi-doublons, réétiquetage et relecture des désaccords, data card à jour).
  - Les scores du bot mesurés sur ces données sont des **résultats sur le bot**, pas des défauts des données. Une attaque qui réussit sur un nouveau jeu ne bloque pas la PR de données : elle ouvre l'étape suivante du bot.
- **PR de documentation seule** : pas de mesure, fusion directe.

## Configuration

Copier `.env.example` vers `.env` et le remplir. `.env` est ignoré par git : ne jamais le commiter.

## Zone d'autonomie

- **Tu décides seul :** l'implémentation, la structure du code, les outils et méthodes statistiques, le choix des exemples selon les critères donnés, les corrections de bugs.
- **Tu proposes, avec ta recommandation, avant d'agir :** toute nouvelle étape du bot, tout changement du guide, toute nouvelle métrique.
- **Tu demandes toujours :** toute modification de test100 ou calib60, toute suppression de données, tout téléchargement de plus de 8 Go, tout changement des règles de fusion.
- **À la fin de chaque étape,** propose la suivante avec son gain attendu.
