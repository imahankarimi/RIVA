#!/usr/bin/env python3
"""
Inspect the current database state and migration graph.
Shows what needs to be applied to reach head.
"""
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import create_engine, text, inspect
from alembic.config import Config
from alembic.script import ScriptDirectory
from database import SessionLocal, engine as db_engine

def check_database_state():
    print("=" * 70)
    print("RIVA Database Migration Inspector")
    print("=" * 70)

    db = SessionLocal()

    try:
        # 1. Check current Alembic revision
        print("\n[1] Current Alembic Revision")
        print("-" * 70)
        result = db.execute(text("SELECT version_num FROM alembic_version"))
        current_revision = result.scalar()
        print(f"Database revision: {current_revision}")

        # 2. Check Alembic script directory
        print("\n[2] Migration Graph Analysis")
        print("-" * 70)
        alembic_cfg = Config("alembic.ini")
        script_dir = ScriptDirectory.from_config(alembic_cfg)

        # Get all revisions
        heads = script_dir.get_revisions("heads")
        print(f"Head revisions: {[h.revision for h in heads]}")

        # Get pending migrations
        current_rev = script_dir.get_revision(current_revision)
        print(f"\nCurrent: {current_rev.revision} - {current_rev.doc}")

        # Walk from current to each head
        for head in heads:
            print(f"\nPath to head {head.revision}:")
            path = list(script_dir.iterate_revisions(head.revision, current_revision))
            if len(path) <= 1:
                print("  Already at this head")
            else:
                for i, rev in enumerate(reversed(path[:-1]), 1):
                    print(f"  {i}. {rev.revision} - {rev.doc}")

        # 3. Check existing tables
        print("\n[3] Current Database Tables")
        print("-" * 70)
        inspector = inspect(db_engine)
        tables = sorted(inspector.get_table_names())
        print(f"Tables ({len(tables)}): {', '.join(tables)}")

        # 4. Check users table schema
        print("\n[4] Users Table Schema")
        print("-" * 70)
        if "users" in tables:
            columns = inspector.get_columns("users")
            print("Columns:")
            for col in columns:
                nullable = "NULL" if col['nullable'] else "NOT NULL"
                default = f", default={col.get('default', 'none')}" if col.get('default') else ""
                print(f"  - {col['name']:<20} {col['type']!s:<20} {nullable}{default}")

            has_is_verified = any(c['name'] == 'is_verified' for c in columns)
            if has_is_verified:
                print("\n✓ is_verified column EXISTS")
            else:
                print("\n✗ is_verified column MISSING (this is the problem)")

        # 5. Check for missing tables
        print("\n[5] Missing Tables Check")
        print("-" * 70)
        expected_tables = {
            "business_members": "9e8f7c6a5b4d",
            "user_sessions": "c3d4e5f6a7b8",
            "verification_tokens": "d4e5f6a7b8c9",
            "password_reset_tokens": "d4e5f6a7b8c9",
        }

        for table, migration in expected_tables.items():
            exists = table in tables
            status = "✓ EXISTS" if exists else "✗ MISSING"
            print(f"  {table:<25} {status:<15} (from {migration})")

        # 6. Check user count
        print("\n[6] Data Preservation Check")
        print("-" * 70)
        result = db.execute(text("SELECT COUNT(*) FROM users"))
        user_count = result.scalar()
        print(f"Users: {user_count}")

        result = db.execute(text("SELECT COUNT(*) FROM businesses"))
        business_count = result.scalar()
        print(f"Businesses: {business_count}")

        result = db.execute(text("SELECT COUNT(*) FROM journal_entries"))
        entry_count = result.scalar()
        print(f"Journal entries: {entry_count}")

        if user_count > 0 or business_count > 0 or entry_count > 0:
            print("\n⚠️  Database contains data - backup required before migration!")

        print("\n" + "=" * 70)

    except Exception as e:
        print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()

    return True

if __name__ == "__main__":
    success = check_database_state()
    sys.exit(0 if success else 1)
