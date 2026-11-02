#!/usr/bin/env python3
"""
Create a PostgreSQL backup before applying migrations.
Requires pg_dump to be accessible.
"""
import os
import subprocess
import sys
from datetime import datetime
from pathlib import Path

def create_backup():
    backup_dir = Path("backups")
    backup_dir.mkdir(exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_file = backup_dir / f"ledgerai_before_migration_{timestamp}.sql"

    # Get DATABASE_URL from environment
    db_url = os.environ.get("DATABASE_URL", "postgresql+psycopg://localhost/ledgerai")

    # Extract database name
    if "/" in db_url:
        db_name = db_url.split("/")[-1]
    else:
        db_name = "ledgerai"

    print(f"Creating backup of database '{db_name}'...")
    print(f"Backup file: {backup_file}")

    try:
        result = subprocess.run(
            ["pg_dump", "-d", db_name, "-f", str(backup_file), "--no-owner", "--no-acl"],
            capture_output=True,
            text=True,
            check=True
        )

        if backup_file.exists():
            size_mb = backup_file.stat().st_size / (1024 * 1024)
            print(f"✓ Backup created successfully ({size_mb:.2f} MB)")
            print(f"  File: {backup_file.absolute()}")
            return str(backup_file.absolute())
        else:
            print("✗ Backup file was not created")
            return None

    except subprocess.CalledProcessError as e:
        print(f"✗ pg_dump failed: {e}")
        print(f"  stdout: {e.stdout}")
        print(f"  stderr: {e.stderr}")
        return None
    except FileNotFoundError:
        print("✗ pg_dump not found. Install PostgreSQL client tools.")
        return None

if __name__ == "__main__":
    backup_path = create_backup()
    sys.exit(0 if backup_path else 1)
