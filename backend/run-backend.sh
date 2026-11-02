#!/bin/bash
# Launch the RIVA backend.
#
# Always uses backend/.venv/bin/python directly. Relying on `source
# .venv/bin/activate` is fragile: in some shells it silently no-ops, leaving the
# system Python (Anaconda) on PATH, which has none of the dependencies and fails
# with `ModuleNotFoundError: No module named 'fastapi'`.

set -euo pipefail

BACKEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PY="$BACKEND_DIR/.venv/bin/python"

if [ ! -x "$PY" ]; then
  echo "❌ Virtualenv not found at $PY"
  echo "   Create it with:"
  echo "     python3 -m venv '$BACKEND_DIR/.venv'"
  echo "     '$PY' -m pip install -r '$BACKEND_DIR/requirements.txt'"
  exit 1
fi

cd "$BACKEND_DIR"

# Preflight: fail loudly here instead of halfway through startup.
if ! "$PY" -c "import fastapi, uvicorn, sqlalchemy, psycopg, jwt, bcrypt" 2>/dev/null; then
  echo "❌ Backend dependencies missing from the venv."
  echo "   Fix with: '$PY' -m pip install -r '$BACKEND_DIR/requirements.txt'"
  exit 1
fi

HOST="${HOST:-0.0.0.0}"
PORT="${PORT:-8000}"

echo "🚀 RIVA backend: http://localhost:$PORT"
exec env HOST="$HOST" PORT="$PORT" "$PY" main.py "$@"