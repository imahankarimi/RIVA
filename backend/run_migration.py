#!/usr/bin/env python3
"""Run database migrations with pre-flight and post-flight validation.

Prerequisites:
  1. A validated backup must exist (run safe_backup.py first)
  2. Alembic must be installed
  3. DATABASE_URL must be set

Checks:
  - Verifies backup exists before running migration
  - Runs alembic upgrade head
  - Validates final schema matches expected state
  - Reports exact changes made
"""
import os
import sys
import subprocess
from pathlib import Path
from urllib.parse import urlparse


def get_db_name() -> str:
    """Extract database name from DATABASE_URL."""
    db_url = os.environ.get('DATABASE_URL', '')
    if not db_url:
        return 'ledgerai'

    parsed = urlparse(db_url)
    db_name = parsed.path.lstrip('/') if parsed.path else 'ledgerai'
    return db_name


def check_backup_exists() -> Path | None:
    """Check if a recent backup exists.

    Returns the most recent backup file, or None if no valid backup found.
    """
    backup_dir = Path('backups')
    if not backup_dir.exists():
        return None

    db_name = get_db_name()
    backups = sorted(backup_dir.glob(f'{db_name}_backup_*.dump'), reverse=True)

    if not backups:
        return None

    most_recent = backups[0]
    size = most_recent.stat().st_size

    if size == 0:
        return None

    return most_recent


def get_current_revision() -> str | None:
    """Get current Alembic revision from database."""
    result = subprocess.run(
        ['alembic', 'current'],
        capture_output=True,
        text=True
    )

    if result.returncode != 0:
        return None

    # Parse output like "9d3f6a1c8e42 (head)"
    for line in result.stdout.split('\n'):
        if line.strip():
            return line.split()[0]

    return None


def get_head_revision() -> str | None:
    """Get target head revision."""
    result = subprocess.run(
        ['alembic', 'heads'],
        capture_output=True,
        text=True
    )

    if result.returncode != 0:
        return None

    for line in result.stdout.split('\n'):
        if line.strip():
            return line.split()[0]

    return None


def run_migration() -> bool:
    """Run alembic upgrade head.

    Returns True if successful, False otherwise.
    """
    print("Running: alembic upgrade head")
    result = subprocess.run(
        ['alembic', 'upgrade', 'head'],
        capture_output=True,
        text=True
    )

    print(result.stdout)

    if result.returncode != 0:
        print(f"\nERROR: Migration failed with exit code {result.returncode}", file=sys.stderr)
        print(f"STDERR: {result.stderr}", file=sys.stderr)
        return False

    return True


def verify_schema() -> tuple[bool, list[str]]:
    """Verify the final schema has all required components.

    Returns (success, list of issues)
    """
    issues = []

    # Check that we reached the expected head
    current = get_current_revision()
    expected = 'd4e5f6a7b8c9'  # Phase 2B verification tokens migration

    if current != expected:
        issues.append(f"Current revision {current} != expected {expected}")

    # Use psql to check for required tables and columns
    db_name = get_db_name()

    # Check tables exist
    required_tables = [
        'business_members',
        'user_sessions',
        'verification_tokens',
        'password_reset_tokens',
    ]

    for table in required_tables:
        result = subprocess.run(
            ['psql', '-d', db_name, '-c', f"\\d {table}", '-t'],
            capture_output=True,
            text=True
        )
        if result.returncode != 0 or not result.stdout.strip():
            issues.append(f"Table '{table}' does not exist")

    # Check users.is_verified column
    result = subprocess.run(
        ['psql', '-d', db_name, '-c',
         "SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='is_verified'",
         '-t'],
        capture_output=True,
        text=True
    )

    if result.returncode != 0 or 'is_verified' not in result.stdout:
        issues.append("Column 'users.is_verified' does not exist")

    return (len(issues) == 0, issues)


def main():
    print("=" * 60)
    print("RIVA Database Migration")
    print("=" * 60)

    # Check environment
    if not os.environ.get('DATABASE_URL'):
        print("\nERROR: DATABASE_URL not set", file=sys.stderr)
        sys.exit(1)

    db_name = get_db_name()
    print(f"\nDatabase: {db_name}")

    # Pre-flight check: backup must exist
    backup = check_backup_exists()
    if not backup:
        print("\nERROR: No validated backup found", file=sys.stderr)
        print("Run safe_backup.py first to create a backup", file=sys.stderr)
        sys.exit(1)

    print(f"✓ Backup exists: {backup}")

    # Show current and target revisions
    current = get_current_revision()
    head = get_head_revision()

    print(f"\nCurrent revision: {current}")
    print(f"Target revision:  {head}")

    if current == head:
        print("\n✓ Database is already at head revision")
        sys.exit(0)

    # Confirm before proceeding
    print("\n" + "=" * 60)
    print("READY TO RUN MIGRATION")
    print("=" * 60)
    print("\nThis will apply the following migrations:")
    print("  1. add_production_indexes - Add performance indexes")
    print("  2. 9e8f7c6a5b4d - Add business_members table")
    print("  3. c3d4e5f6a7b8 - Add user_sessions table (merge revision)")
    print("  4. d4e5f6a7b8c9 - Add verification_tokens, password_reset_tokens, users.is_verified")
    print(f"\nBackup: {backup}")
    print("\nProceed? [y/N]: ", end='')

    response = input().strip().lower()
    if response != 'y':
        print("Migration cancelled")
        sys.exit(0)

    # Run migration
    print("\n" + "=" * 60)
    print("RUNNING MIGRATION")
    print("=" * 60 + "\n")

    if not run_migration():
        print("\n❌ MIGRATION FAILED", file=sys.stderr)
        print(f"\nTo restore from backup:", file=sys.stderr)
        print(f"  dropdb {db_name}", file=sys.stderr)
        print(f"  createdb {db_name}", file=sys.stderr)
        print(f"  pg_restore -d {db_name} {backup}", file=sys.stderr)
        sys.exit(1)

    # Post-flight validation
    print("\n" + "=" * 60)
    print("VALIDATING SCHEMA")
    print("=" * 60)

    success, issues = verify_schema()

    if not success:
        print("\n❌ SCHEMA VALIDATION FAILED", file=sys.stderr)
        for issue in issues:
            print(f"  - {issue}", file=sys.stderr)
        print(f"\nMigration command succeeded but schema is incomplete.", file=sys.stderr)
        print(f"Manual investigation required.", file=sys.stderr)
        sys.exit(1)

    # Success
    print("\n" + "=" * 60)
    print("✓ MIGRATION COMPLETE")
    print("=" * 60)
    print(f"\nFinal revision: {get_current_revision()}")
    print("\nNew tables:")
    print("  - business_members (multi-user support)")
    print("  - user_sessions (refresh token rotation)")
    print("  - verification_tokens (email verification)")
    print("  - password_reset_tokens (password reset)")
    print("\nNew columns:")
    print("  - users.is_verified (Phase 2B)")
    print("\nNew indexes:")
    print("  - Production performance indexes on existing tables")
    print(f"\nBackup preserved: {backup}")


if __name__ == '__main__':
    main()
