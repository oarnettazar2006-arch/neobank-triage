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

## Configuration

Copier `.env.example` vers `.env` et le remplir. `.env` est ignoré par git : ne jamais le commiter.
