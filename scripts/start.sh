#!/bin/bash
# ─────────────────────────────────────────────────────────────
#  HybridRAG — One-click launcher (Mac / Linux)
#  Usage: ./start.sh
# ─────────────────────────────────────────────────────────────

set -e
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'

echo ""
echo -e "${GREEN}╔══════════════════════════════════════╗${NC}"
echo -e "${GREEN}║        HybridRAG Launcher            ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════╝${NC}"
echo ""

# ── Check Docker ─────────────────────────────────────────────
if ! command -v docker &> /dev/null; then
  echo -e "${RED}✗ Docker not found.${NC} Install from https://www.docker.com/get-started"
  exit 1
fi
if ! docker info &> /dev/null; then
  echo -e "${RED}✗ Docker daemon not running.${NC} Please start Docker Desktop."
  exit 1
fi
echo -e "${GREEN}✓ Docker ready${NC}"

# ── Create .env if missing ───────────────────────────────────
if [ ! -f .env ]; then
  cp .env.example .env
  echo -e "${YELLOW}⚠ Created .env from template. Add your OPENAI_API_KEY if needed.${NC}"
fi

# ── Create data dirs ─────────────────────────────────────────
mkdir -p data/uploads data/vectorstore
echo -e "${GREEN}✓ Data directories ready${NC}"

# ── Pull & Start ─────────────────────────────────────────────
echo ""
echo "Starting all services (first run downloads models, may take 5-10 min)..."
echo ""
docker compose up --build -d

# ── Wait for backend ─────────────────────────────────────────
echo "Waiting for backend to be ready..."
for i in $(seq 1 30); do
  if curl -sf http://localhost:8000/health &>/dev/null; then
    break
  fi
  sleep 2
done

echo ""
echo -e "${GREEN}╔══════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  🚀 HybridRAG is running!            ║${NC}"
echo -e "${GREEN}║                                      ║${NC}"
echo -e "${GREEN}║  UI:      http://localhost:3000      ║${NC}"
echo -e "${GREEN}║  API:     http://localhost:8000      ║${NC}"
echo -e "${GREEN}║  API Docs:http://localhost:8000/docs ║${NC}"
echo -e "${GREEN}║  Ollama:  http://localhost:11434     ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════╝${NC}"
echo ""
echo "To stop: ./stop.sh"
