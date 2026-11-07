#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PG_DATA="${HOME}/.prflow_pgdata"
PG_BIN="/Library/PostgreSQL/18/bin"

echo "============================================"
echo "   PR Controller - Starting Services"
echo "============================================"

# 1. Start PostgreSQL if not already running
if ! "${PG_BIN}/pg_isready" -h localhost -p 5432 >/dev/null 2>&1; then
    echo "[1/3] Starting PostgreSQL..."
    "${PG_BIN}/pg_ctl" -D "${PG_DATA}" -l "${PG_DATA}/postgres.log" start
    sleep 2
else
    echo "[1/3] PostgreSQL is already running."
fi

# 2. Run DB migrations
echo "[2/3] Running DB migrations..."
cd "${DIR}/backend"
"${DIR}/.venv/bin/python" migrate_add_columns.py
"${DIR}/.venv/bin/python" migrate_add_github_token.py

# 3. Start services
echo "[3/3] Starting FastAPI backend and Vite frontend..."
echo "Backend:  http://localhost:8000"
echo "Frontend: http://localhost:3001"
echo "Swagger:  http://localhost:8000/docs"
echo "============================================"

# Trap SIGINT to stop background processes cleanly
cleanup() {
    echo "Stopping services..."
    kill $(jobs -p) 2>/dev/null || true
}
trap cleanup EXIT

"${DIR}/.venv/bin/python" -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
cd "${DIR}"
npm run dev
