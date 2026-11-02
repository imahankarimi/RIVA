#!/usr/bin/env python3
"""Apply the missing is_verified migration using the backend's database connection."""
import os
import sys

# Load environment from .env file
from dotenv import load_dotenv
load_dotenv()

from alembic.config import Config
from alembic import command

def main():
    # Create Alembic config
    alembic_cfg = Config("alembic.ini")

    # Show current revision
    print("Current revision:")
    command.current(alembic_cfg)

    print("\nMigration history:")
    command.history(alembic_cfg)

    # Check if we need to upgrade
    print("\nApplying pending migrations...")
    try:
        command.upgrade(alembic_cfg, "head")
        print("\n✓ Migrations applied successfully")
    except Exception as e:
        print(f"\n✗ Migration failed: {e}")
        sys.exit(1)

    # Show new revision
    print("\nNew revision:")
    command.current(alembic_cfg)

if __name__ == "__main__":
    main()
