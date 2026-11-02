#!/bin/bash
# Complete automated fix for RIVA login issue
# Backs up database, applies migrations, verifies success
# Run from backend/ directory in a regular terminal

set -e  # Exit on error

echo "=============================================================="
echo "RIVA Login Fix - Complete Migration Application"
echo "=============================================================="
echo ""

# Check we're in backend directory
if [ ! -f "alembic.ini" ]; then
    echo "❌ Error: Not in backend directory"
    echo "   Run: cd backend && ./complete_fix.sh"
    exit 1
fi

# Check venv exists
if [ ! -f ".venv/bin/python" ]; then
    echo "❌ Error: Virtual environment not found at .venv/"
    exit 1
fi

# Activate venv
source .venv/bin/activate

# Create backups directory
mkdir -p backups

echo "Step 1: Creating database backup..."
echo "--------------------------------------------------------------"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backups/ledgerai_before_migration_${TIMESTAMP}.sql"

if command -v pg_dump &> /dev/null; then
    pg_dump -d ledgerai -f "$BACKUP_FILE" --no-owner --no-acl
    if [ -f "$BACKUP_FILE" ]; then
        SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
        echo "✓ Backup created: $BACKUP_FILE ($SIZE)"
    else
        echo "⚠️  Backup command ran but file not found"
        read -p "Continue without verified backup? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
else
    echo "⚠️  pg_dump not found - cannot create backup"
    read -p "Continue without backup? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi
echo ""

echo "Step 2: Checking current migration state..."
echo "--------------------------------------------------------------"
python -c "from alembic.config import Config; from alembic import command; cfg = Config('alembic.ini'); command.current(cfg)" || {
    echo "❌ Failed to check current revision"
    exit 1
}
echo ""

echo "Step 3: Checking migration graph..."
echo "--------------------------------------------------------------"
python -c "
from alembic.config import Config
from alembic.script import ScriptDirectory

cfg = Config('alembic.ini')
sd = ScriptDirectory.from_config(cfg)
heads = sd.get_revisions('heads')
print(f'Heads: {[h.revision for h in heads]}')
if len(heads) > 1:
    print('⚠️  Multiple heads detected - merge migration needed')
" || {
    echo "❌ Failed to analyze migration graph"
    exit 1
}
echo ""

echo "Step 4: Applying pending migrations..."
echo "--------------------------------------------------------------"
python -c "from alembic.config import Config; from alembic import command; cfg = Config('alembic.ini'); command.upgrade(cfg, 'head')" || {
    echo "❌ Migration failed!"
    echo ""
    echo "To restore from backup:"
    echo "  psql -d ledgerai -f $BACKUP_FILE"
    exit 1
}
echo ""

echo "Step 5: Verifying new revision..."
echo "--------------------------------------------------------------"
python -c "from alembic.config import Config; from alembic import command; cfg = Config('alembic.ini'); command.current(cfg)"
echo ""

echo "Step 6: Inspecting database schema..."
echo "--------------------------------------------------------------"
python inspect_db_state.py || {
    echo "⚠️  Inspection script failed (sandbox?)"
}
echo ""

echo "Step 7: Checking if backend is running..."
echo "--------------------------------------------------------------"
if curl -s http://localhost:8000/api/health > /dev/null 2>&1; then
    echo "⚠️  Backend is running"
    echo "   Restart it to ensure it uses the new schema:"
    echo "   1. Press Ctrl+C in the backend terminal"
    echo "   2. Run: ./run-backend.sh"
else
    echo "✓ Backend is not running"
    echo "  Start it with: ./run-backend.sh"
fi
echo ""

echo "=============================================================="
echo "✅ Migration Complete!"
echo "=============================================================="
echo ""
echo "Next steps:"
echo "1. Start backend: ./run-backend.sh"
echo "2. Test login at: http://localhost:3000"
echo "3. Check backend logs for any errors"
echo ""
echo "If login still fails:"
echo "- Check backend logs for the actual error"
echo "- Run: python inspect_db_state.py"
echo "- Restore backup if needed: psql -d ledgerai -f $BACKUP_FILE"
