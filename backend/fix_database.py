#!/usr/bin/env python3
"""
RIVA Database Migration Fix

Applies pending migrations to add users.is_verified column and related tables.
Loads DATABASE_URL from .env file automatically.
"""
import os
import subprocess
import sys
from dotenv import load_dotenv

def main():
    # Load .env file to get DATABASE_URL
    load_dotenv()

    print("=" * 60)
    print("RIVA Database Migration Fix")
    print("=" * 60)
    print()

    # Check environment
    if not os.environ.get('DATABASE_URL'):
        print("ERROR: DATABASE_URL not set in .env file", file=sys.stderr)
        print("Check backend/.env contains: DATABASE_URL=postgresql+psycopg://localhost/ledgerai", file=sys.stderr)
        sys.exit(1)

    print("✓ DATABASE_URL loaded from .env")
    print()

    # Use sys.executable to ensure subprocesses use the same Python (venv)
    python = sys.executable

    print("Step 1: Create backup...")
    result = subprocess.run([python, 'safe_backup.py'], env=os.environ.copy())
    if result.returncode != 0:
        print("\nERROR: Backup failed", file=sys.stderr)
        sys.exit(1)
    print()

    print("Step 2: Apply migrations...")
    result = subprocess.run(['alembic', 'upgrade', 'head'], env=os.environ.copy())
    if result.returncode != 0:
        print("\nERROR: Migration failed", file=sys.stderr)
        sys.exit(1)
    print()

    print("Step 3: Verify schema...")
    result = subprocess.run([python, 'verify_schema.py'], env=os.environ.copy())
    if result.returncode != 0:
        print("\nERROR: Verification failed", file=sys.stderr)
        sys.exit(1)

    print()
    print("=" * 60)
    print("✓ SUCCESS - Migration Complete")
    print("=" * 60)
    print()
    print("Now run: ./run-backend.sh")
    print("Then test login at: http://localhost:3000")

if __name__ == '__main__':
    main()
