#!/bin/bash
# RIVA Login Fix - Apply Pending Migrations
# This script runs the complete migration fix for the users.is_verified error.
#
# What it does:
# 1. Creates a validated PostgreSQL backup using the exact DATABASE_URL
# 2. Applies 4 pending migrations to reach head (d4e5f6a7b8c9)
# 3. Verifies the schema matches expected state using the same DATABASE_URL
# 4. Tests that users.is_verified exists
#
# Run this from the backend/ directory with the virtual environment activated.

set -e  # Exit on any error

echo "=========================================="
echo "RIVA Migration Fix"
echo "=========================================="
echo ""

# Check we're in the right directory
if [ ! -f "alembic.ini" ]; then
    echo "ERROR: Must run from backend/ directory"
    exit 1
fi

# Check DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "ERROR: DATABASE_URL not set"
    echo "Load it with: source .env"
    exit 1
fi

# Extract database name for display only (never used for connection)
DB_NAME=$(python3 -c "from urllib.parse import urlparse; import os; p=urlparse(os.environ['DATABASE_URL']); print(p.path.lstrip('/') or 'ledgerai')" 2>/dev/null || echo "unknown")
echo "Target database: $DB_NAME"
echo ""

# Step 1: Create backup using exact DATABASE_URL
echo "Step 1: Creating backup..."
if ! python3 safe_backup.py; then
    echo ""
    echo "ERROR: Backup failed"
    exit 1
fi
echo ""

# Step 2: Run migration using exact DATABASE_URL via Alembic
echo "Step 2: Running migration..."
if ! python3 run_migration.py; then
    echo ""
    echo "ERROR: Migration failed"
    echo "Check the output above for details"
    exit 1
fi
echo ""

# Step 3: Verify schema using exact DATABASE_URL via SQLAlchemy
echo "Step 3: Verifying schema..."
if ! python3 verify_schema.py; then
    echo ""
    echo "ERROR: Schema verification failed"
    exit 1
fi

echo ""
echo "=========================================="
echo "✓ Migration Complete"
echo "=========================================="
echo ""
echo "The database is now at revision d4e5f6a7b8c9"
echo "Login should now work without UndefinedColumn errors"
echo ""
echo "Next steps:"
echo "  1. Restart the backend server: ./run-backend.sh"
echo "  2. Test login at http://localhost:3000"
echo ""
