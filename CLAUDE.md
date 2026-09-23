# neobank-triage

Bot de triage de tickets support pour une néobanque (projet 1 : DATA, prompt et git).

## Arborescence

- `src/` : le code du bot
- `prompts/` : les prompts versionnés, en `.txt`
- `data/train/` : tickets d'entraînement (synthétiques)
- `data/calib/` : tickets de calibration
- `data/test/` : tickets de test final
- `data/attacks/` : tickets d'injection
- `eval/` : scripts d'évaluation
- `docs/` : guide, notes
- `site/` : le front de démo (plus tard)

## Règles

- **Modèle par défaut :** `llama3` via Ollama en local (`http://localhost:11434`).
- **Jamais de modèle de plus de 8 Go.** Le Mac a 16 Go de RAM, et un modèle plus gros l'a déjà fait planter.
- **Les 24 tickets officiels du prof servent uniquement à l'évaluation finale.** Ils ne servent jamais au réglage : ni pour ajuster le prompt, ni pour choisir des exemples few-shot, ni pour fixer des seuils.
- **Une modification à la fois.** Chaque changement est mesuré avant et après sur le même jeu de données.
- **Ne jamais deviner.** Si une consigne est ambiguë, ou si un fichier ou un script manque, poser la question au lieu de supposer ou de substituer.
- **Données entièrement synthétiques.** Aucune donnée réelle de banque, nulle part dans ce repo.

## Règles de fusion

- **PR d'étape du bot** (`exp/...` : prompt, schéma, modèle) : fusionnée seulement si deux conditions sont remplies.
  - Aucun champ ne régresse significativement face à la référence : McNemar exact apparié (`eval/compare.py`), p < 0,05 en défaveur.
  - Aucune attaque ne réussit.
  - Sinon, la PR reste ouverte avec l'explication. Une fois fusionnée, la version devient la référence.
- **PR de données** (`data/...` : jeux, étiquettes, outils de génération) : fusionnée quand ses contrôles de qualité passent (format du guide, quasi-doublons, réétiquetage et relecture des désaccords, data card à jour).
  - Les scores du bot mesurés sur ces données sont des **résultats sur le bot**, pas des défauts des données. Une attaque qui réussit sur un nouveau jeu ne bloque pas la PR de données : elle ouvre l'étape suivante du bot.
- **PR de documentation seule** : pas de mesure, fusion directe.

## Configuration

Copier `.env.example` vers `.env` et le remplir. `.env` est ignoré par git : ne jamais le commiter.
