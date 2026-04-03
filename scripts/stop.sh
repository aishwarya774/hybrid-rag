#!/bin/bash
echo "Stopping HybridRAG..."
docker compose down
echo "✓ All services stopped. Your data and models are preserved."
echo "  Run ./scripts/start.sh to restart."
