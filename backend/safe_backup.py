#!/usr/bin/env python3
"""Create and validate a PostgreSQL backup with proper URL parsing.

Validates the backup file after creation to ensure it's restorable.
Never prints credentials or full connection strings.
"""
import os
import sys
import subprocess
import getpass
from datetime import datetime
from pathlib import Path
from urllib.parse import urlparse


def parse_database_url(url: str) -> dict:
    """Parse DATABASE_URL into connection parameters.

    Returns dict with: host, port, database, user, password
    When no username is in the URL, defaults to current OS user.
    """
    parsed = urlparse(url)

    # Handle both postgresql:// and postgresql+psycopg://
    if not parsed.scheme.startswith('postgresql'):
        raise ValueError(f"Invalid DATABASE_URL scheme: {parsed.scheme}")

    return {
        'host': parsed.hostname or 'localhost',
        'port': parsed.port or 5432,
        'database': parsed.path.lstrip('/') if parsed.path else 'ledgerai',
        'user': parsed.username or getpass.getuser(),
        'password': parsed.password or '',
    }


def create_backup(db_params: dict, backup_path: Path) -> bool:
    """Create a custom-format PostgreSQL backup.

    Returns True if backup was created successfully, False otherwise.
    """
    # Build pg_dump command
    env = os.environ.copy()
    if db_params['password']:
        env['PGPASSWORD'] = db_params['password']

    cmd = [
        'pg_dump',
        '-h', db_params['host'],
        '-p', str(db_params['port']),
        '-U', db_params['user'],
        '-d', db_params['database'],
        '-F', 'c',  # custom format for validation
        '-f', str(backup_path),
    ]

    print(f"Creating backup at {backup_path}...")
    result = subprocess.run(cmd, env=env, capture_output=True, text=True)

    if result.returncode != 0:
        print(f"ERROR: pg_dump failed with exit code {result.returncode}", file=sys.stderr)
        print(f"STDERR: {result.stderr}", file=sys.stderr)
        return False

    if not backup_path.exists():
        print(f"ERROR: Backup file was not created at {backup_path}", file=sys.stderr)
        return False

    size = backup_path.stat().st_size
    if size == 0:
        print(f"ERROR: Backup file is empty (0 bytes)", file=sys.stderr)
        return False

    print(f"✓ Backup created: {size:,} bytes")
    return True


def validate_backup(backup_path: Path) -> bool:
    """Validate a custom-format backup with pg_restore --list.

    Returns True if the backup is valid and contains expected tables.
    """
    print(f"Validating backup...")

    result = subprocess.run(
        ['pg_restore', '--list', str(backup_path)],
        capture_output=True,
        text=True
    )

    if result.returncode != 0:
        print(f"ERROR: pg_restore --list failed with exit code {result.returncode}", file=sys.stderr)
        print(f"STDERR: {result.stderr}", file=sys.stderr)
        return False

    # Check for critical tables in the backup
    required_tables = ['users', 'businesses', 'accounts', 'journal_entries', 'alembic_version']
    found_tables = [t for t in required_tables if f'TABLE DATA public {t}' in result.stdout]

    if len(found_tables) != len(required_tables):
        missing = set(required_tables) - set(found_tables)
        print(f"WARNING: Some expected tables not found in backup: {missing}", file=sys.stderr)
        print("Backup may be incomplete or from a different database state.", file=sys.stderr)
        return False

    print(f"✓ Backup is valid and contains {len(found_tables)} critical tables")
    return True


def main():
    # Get DATABASE_URL from environment
    db_url = os.environ.get('DATABASE_URL')
    if not db_url:
        print("ERROR: DATABASE_URL environment variable not set", file=sys.stderr)
        sys.exit(1)

    # Parse connection parameters
    try:
        db_params = parse_database_url(db_url)
        print(f"Database: {db_params['database']} at {db_params['host']}:{db_params['port']}")
    except Exception as e:
        print(f"ERROR: Failed to parse DATABASE_URL: {e}", file=sys.stderr)
        sys.exit(1)

    # Generate backup filename with timestamp
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_dir = Path('backups')
    backup_dir.mkdir(exist_ok=True)
    backup_path = backup_dir / f"{db_params['database']}_backup_{timestamp}.dump"

    # Create and validate backup
    if not create_backup(db_params, backup_path):
        sys.exit(1)

    if not validate_backup(backup_path):
        print("\nERROR: Backup validation failed", file=sys.stderr)
        print("The backup file exists but may not be restorable.", file=sys.stderr)
        print(f"Manual inspection required: pg_restore --list {backup_path}", file=sys.stderr)
        sys.exit(1)

    print(f"\n✓ SUCCESS: Validated backup at {backup_path}")
    print(f"\nTo restore this backup (if needed):")
    print(f"  dropdb {db_params['database']}")
    print(f"  createdb {db_params['database']}")
    print(f"  pg_restore -d {db_params['database']} {backup_path}")


if __name__ == '__main__':
    main()
