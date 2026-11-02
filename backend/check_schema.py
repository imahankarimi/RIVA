#!/usr/bin/env python3
"""Check the current database schema without exposing credentials."""
import os
from sqlalchemy import create_engine, text, inspect

# Use DATABASE_URL from environment
db_url = os.environ.get("DATABASE_URL", "postgresql+psycopg://localhost/ledgerai")
# Mask credentials in output
safe_url = db_url.split("@")[-1] if "@" in db_url else db_url

print(f"Connecting to: {safe_url}")

try:
    engine = create_engine(db_url)
    inspector = inspect(engine)

    # Check if users table exists
    if "users" in inspector.get_table_names():
        print("\n✓ users table exists")
        columns = inspector.get_columns("users")
        print(f"  Columns: {[c['name'] for c in columns]}")

        has_is_verified = any(c['name'] == 'is_verified' for c in columns)
        if has_is_verified:
            print("  ✓ is_verified column EXISTS")
        else:
            print("  ✗ is_verified column MISSING")
    else:
        print("\n✗ users table does not exist")

    # Check alembic_version
    with engine.connect() as conn:
        result = conn.execute(text("SELECT version_num FROM alembic_version"))
        version = result.scalar()
        print(f"\nCurrent Alembic revision: {version}")

except Exception as e:
    print(f"Error: {e}")
