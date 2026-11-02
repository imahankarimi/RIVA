#!/bin/bash
# Complete fix procedure for the login issue
# Run this from the backend directory in a regular terminal

set -e

echo "🔧 RIVA Login Fix"
echo "=================="
echo ""

# Check we're in backend directory
if [ ! -f "alembic.ini" ]; then
    echo "❌ Error: Not in backend directory"
    echo "   Run: cd backend && ./fix_login.sh"
    exit 1
fi

# Check venv exists
if [ ! -f ".venv/bin/python" ]; then
    echo "❌ Error: Virtual environment not found"
    echo "   Create it with: python3 -m venv .venv"
    echo "   Install deps: .venv/bin/pip install -r requirements.txt"
    exit 1
fi

# Activate venv
source .venv/bin/activate

echo "Step 1: Checking current migration state..."
python -c "from alembic.config import Config; from alembic import command; cfg = Config('alembic.ini'); command.current(cfg)" || true
echo ""

echo "Step 2: Applying migrations..."
python -c "from alembic.config import Config; from alembic import command; cfg = Config('alembic.ini'); command.upgrade(cfg, 'head')"
echo ""

echo "Step 3: Verifying database schema..."
python diagnose_and_fix.py
echo ""

echo "Step 4: Checking if backend is running..."
if curl -s http://localhost:8000/api/health > /dev/null 2>&1; then
    echo "⚠️  Backend is running - restart it to pick up any code changes"
    echo "   Press Ctrl+C in the backend terminal, then run: ./run-backend.sh"
else
    echo "✓ Backend is not running"
    echo "  Start it with: ./run-backend.sh"
fi

echo ""
echo "✅ Fix complete!"
echo ""
echo "To test:"
echo "1. Start backend: ./run-backend.sh"
echo "2. Open browser: http://localhost:3000"
echo "3. Try logging in"
