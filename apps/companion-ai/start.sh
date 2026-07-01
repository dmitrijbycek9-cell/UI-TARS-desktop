#!/usr/bin/env bash
set -euo pipefail
cmd="${1:-help}"
model="${2:-mistral}"
compose(){ if docker compose version >/dev/null 2>&1; then docker compose "$@"; else docker-compose "$@"; fi; }
case "$cmd" in
  docker) compose up --build ;;
  bg) compose up -d --build ;;
  llm) compose --profile local-llm up -d --build ;;
  pull) compose --profile local-llm up -d ollama && compose exec ollama ollama pull "$model" ;;
  logs) compose logs -f --tail=150 ;;
  stop) compose down ;;
  *) cat <<'HELP'
Companion AI MVP
  ./start.sh docker        starten ohne Ollama
  ./start.sh llm           starten mit Ollama-Service
  ./start.sh pull mistral  Modell in Ollama laden
  ./start.sh bg            im Hintergrund starten
  ./start.sh logs          Logs anzeigen
  ./start.sh stop          stoppen

Danach: http://localhost:8000
Demo: demo / demo123
HELP
  ;;
esac
