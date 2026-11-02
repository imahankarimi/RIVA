#!/usr/bin/env python3
"""Check if the is_verified migration was applied."""
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(__file__))

from database import SessionLocal
from sqlalchemy import text

def check_migration():
    db = SessionLocal()
    try:
        # Check alembic version
        result = db.execute(text("SELECT version_num FROM alembic_version"))
        version = result.scalar()
        print(f"Current Alembic revision: {version}")

        # Check if is_verified column exists
        result = db.execute(text("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'users' AND column_name = 'is_verified'
        """))
        row = result.fetchone()

        if row:
            print(f"✓ is_verified column EXISTS")
            print(f"  Type: {row[1]}")
            print(f"  Nullable: {row[2]}")
            print(f"  Default: {row[3]}")
        else:
            print("✗ is_verified column MISSING")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_migration()
