#!/usr/bin/env bash
# ==============================================================================
# GRIM-MORE: ONE-CLICK DEMO RUNNER
# Starts both FastAPI Backend (:8000) and Frontend Web Server (:3000)
# ==============================================================================

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

echo "🧪 Starting Grim-More System..."

# 1. Setup virtual environment if missing
if [ ! -d ".venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv .venv
    .venv/bin/pip install -r requirements.txt
fi

# 2. Trap cleanup on exit (Ctrl+C)
cleanup() {
    echo ""
    echo "🛑 Shutting down Grim-More services..."
    kill $(jobs -p) 2>/dev/null || true
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# 3. Start FastAPI Backend on port 8000
echo "⚡ Launching FastAPI Backend on http://127.0.0.1:8000..."
.venv/bin/uvicorn backend.main:app --port 8000 &
BACKEND_PID=$!

# 4. Start Static Web Server on port 3000
echo "💻 Launching Frontend Web Server on http://localhost:3000..."
python3 -m http.server 3000 --directory frontend &
FRONTEND_PID=$!

# 5. Wait for services to initialize
sleep 2

echo "=============================================================="
echo "✨ Grim-More is LIVE and ready for Judges!"
echo "   👉 Dashboard: http://localhost:3000"
echo "   👉 Pitch Deck: http://localhost:3000/slides.html"
echo "   👉 API Docs:   http://127.0.0.1:8000/docs"
echo "=============================================================="
echo "Press [Ctrl+C] to stop all services."

# Keep script running
wait

