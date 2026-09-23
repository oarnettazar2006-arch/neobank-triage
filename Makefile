# neobank-triage : commandes usuelles. Python >= 3.9 (bibliothèque standard seule) et Ollama local.
PYTHON ?= python3
MODEL ?= llama3.1:8b
RUN = PYTHONDONTWRITEBYTECODE=1 $(PYTHON)

.PHONY: help setup setup-all test eval eval-drafts record

help:
	@echo "make setup        vérifie Python et Ollama, télécharge $(MODEL) (4,9 Go)"
	@echo "make setup-all    + qwen2.5:7b (4,7 Go, contrôle qualité et juge) et nomic-embed-text (274 Mo, doublons)"
	@echo "make test         tests unitaires et test de bout en bout, sans Ollama (moins d'une seconde)"
	@echo "make eval         tri v7 sur val60, attacks30 et holdout20 + cas du notebook (environ 10 min)"
	@echo "make eval-drafts  brouillons v6 sur val60 à partir du dernier tri (environ 15 min)"
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

eval:
	$(RUN) eval/run.py --prompt prompts/v7_sous_motif.txt --model $(MODEL) --guard --sous-motif --data data/val/val60.jsonl
	$(RUN) eval/run.py --prompt prompts/v7_sous_motif.txt --model $(MODEL) --guard --sous-motif --data data/attacks/attacks30.jsonl
	$(RUN) eval/run.py --prompt prompts/v7_sous_motif.txt --model $(MODEL) --guard --sous-motif --data data/attacks/holdout20.jsonl

eval-drafts:
	$(RUN) eval/run_reply.py --data data/val/val60.jsonl --triage $$(ls -t eval/results/*_v7_sous_motif_*.jsonl | xargs grep -l '"data_file": "data/val/val60.jsonl"' | xargs grep -l '"guard": true' | head -1)

record:
	$(RUN) tests/record_llm.py
