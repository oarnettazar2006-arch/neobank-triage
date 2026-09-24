# neobank-triage : commandes usuelles. Python >= 3.9 (bibliothèque standard seule) et Ollama local.
PYTHON ?= python3
MODEL ?= llama3.1:8b
RUN = PYTHONDONTWRITEBYTECODE=1 $(PYTHON)

# API (FastAPI) : environnement à part, dans .venv (Python >= 3.10).
API_PYTHON ?= $(shell command -v python3.13 || command -v python3.12 || command -v python3.11 || command -v python3.10 || echo python3)
VENV = .venv

.PHONY: help setup setup-all test test-api demo triage eval eval-drafts record

help:
	@echo "make setup        vérifie Python et Ollama, télécharge $(MODEL) (4,9 Go)"
	@echo "make setup-all    + qwen2.5:7b (4,7 Go, contrôle qualité et juge) et nomic-embed-text (274 Mo, doublons)"
	@echo "make test         tests unitaires et test de bout en bout, sans Ollama (moins d'une seconde)"
	@echo "make test-api     tests de l'API (FastAPI), LLM simulé, sans Ollama"
	@echo "make demo         lance l'API (port 8000) et le site (port 5173), avec le vrai pipeline sur Ollama"
	@echo "make triage CSV=chemin.csv   trie un CSV de tickets (colonne ticket) ; métriques si categorie/produit/severite"
	@echo "                  sont fournies ; BROUILLON=1 lance aussi le rédacteur (démo : CSV=data/demo/demo15.csv)"
	@echo "make eval         tri v7 sur val60, attacks30 et holdout20 + cas du notebook (environ 10 min)"
	@echo "make eval-drafts  contrôleur qwen puis brouillons avec fiche sur val60, à partir du dernier tri (environ 20 min)"
	@echo "make record       réenregistre les réponses du LLM du test de bout en bout"

setup:
	@$(PYTHON) -c "import sys; assert sys.version_info >= (3, 9), \"Python >= 3.9 requis\"; print(\"Python\", sys.version.split()[0], \"ok\")"
	@command -v ollama >/dev/null || (echo "Ollama introuvable : https://ollama.com/download" && exit 1)
	ollama pull $(MODEL)

setup-all: setup
	ollama pull qwen2.5:7b
	ollama pull nomic-embed-text

test:
	$(RUN) -m unittest discover -s tests -v

$(VENV)/.api-ok: api/requirements.txt
	$(API_PYTHON) -m venv $(VENV)
	$(VENV)/bin/pip install -q -r api/requirements.txt
	@touch $@

site/node_modules: site/package-lock.json
	cd site && npm ci
	@touch $@

test-api: $(VENV)/.api-ok
	PYTHONDONTWRITEBYTECODE=1 $(VENV)/bin/python -m unittest discover -s api/tests -t . -v

# Ctrl-C arrête l'API et le site ensemble. Si le port 5173 est pris, Vite prend le suivant.
demo: $(VENV)/.api-ok site/node_modules
	@command -v ollama >/dev/null || (echo "Ollama introuvable : https://ollama.com/download" && exit 1)
	@ollama list >/dev/null   # réveille Ollama s'il dort
	@trap 'kill 0' INT TERM EXIT; \
	$(VENV)/bin/uvicorn api.main:app --host 127.0.0.1 --port 8000 & \
	(cd site && npm run dev -- --host 127.0.0.1) & \
	wait

triage:
	@test -n "$(CSV)" || (echo "Usage : make triage CSV=chemin.csv [BROUILLON=1]" && exit 2)
	@ollama list >/dev/null 2>&1 || true   # réveille Ollama s'il dort
	$(RUN) eval/triage_csv.py "$(CSV)" $(if $(BROUILLON),--brouillon)

eval:
	$(RUN) eval/run.py --prompt prompts/v7_sous_motif.txt --model $(MODEL) --guard --sous-motif --data data/val/val60.jsonl
	$(RUN) eval/run.py --prompt prompts/v7_sous_motif.txt --model $(MODEL) --guard --sous-motif --data data/attacks/attacks30.jsonl
	$(RUN) eval/run.py --prompt prompts/v7_sous_motif.txt --model $(MODEL) --guard --sous-motif --data data/attacks/holdout20.jsonl

eval-drafts:
	$(RUN) eval/run_controller.py --data data/val/val60.jsonl
	$(RUN) eval/run_reply.py --data data/val/val60.jsonl \
		--controller $$(ls -t eval/results/*_controller_*_val60.jsonl | head -1) \
		--triage $$(ls -t eval/results/*_v7_sous_motif_*.jsonl | xargs grep -l '"data_file": "data/val/val60.jsonl"' | xargs grep -l '"guard": true' | head -1)

record:
	$(RUN) tests/record_llm.py
