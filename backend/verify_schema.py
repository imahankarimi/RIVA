#!/usr/bin/env python3
"""Verify the database schema matches expected state after migration.

Uses the exact DATABASE_URL from environment to connect.
Never prints credentials.
"""
import os
import sys
from sqlalchemy import create_engine, text, inspect
from urllib.parse import urlparse


def mask_url(url: str) -> str:
    """Mask credentials in URL for display."""
    parsed = urlparse(url)
    if parsed.password:
        masked = url.replace(parsed.password, '***')
        return masked
    return url


def get_db_name(url: str) -> str:
    """Extract database name from URL."""
    parsed = urlparse(url)
    return parsed.path.lstrip('/') if parsed.path else 'ledgerai'


def verify_schema() -> tuple[bool, list[str]]:
    """Verify the database has the expected schema.

    Returns (success, list of issues)
    """
    db_url = os.environ.get('DATABASE_URL')
    if not db_url:
        return False, ["DATABASE_URL not set"]

    # Ensure psycopg dialect
    if db_url.startswith("postgresql://"):
        db_url = db_url.replace("postgresql://", "postgresql+psycopg://", 1)
    elif db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql+psycopg://", 1)

    issues = []

    try:
        engine = create_engine(db_url, echo=False)

        with engine.connect() as conn:
            # Check Alembic revision
            result = conn.execute(text("SELECT version_num FROM alembic_version"))
            current_revision = result.scalar()
            expected_revision = 'd4e5f6a7b8c9'

            if current_revision != expected_revision:
                issues.append(f"Current revision {current_revision} != expected {expected_revision}")

            # Check users.is_verified column
            result = conn.execute(text(
                "SELECT column_name FROM information_schema.columns "
                "WHERE table_name='users' AND column_name='is_verified'"
            ))
            if not result.scalar():
                issues.append("Column 'users.is_verified' does not exist")

            # Check required tables
            inspector = inspect(engine)
            existing_tables = set(inspector.get_table_names())

            required_tables = {
                'business_members',
                'user_sessions',
                'verification_tokens',
                'password_reset_tokens',
            }

            missing = required_tables - existing_tables
            if missing:
                issues.append(f"Missing tables: {', '.join(missing)}")

        engine.dispose()

    except Exception as e:
        issues.append(f"Database connection error: {str(e)}")

    return (len(issues) == 0, issues)


def main():
    db_url = os.environ.get('DATABASE_URL')
    if not db_url:
        print("ERROR: DATABASE_URL not set", file=sys.stderr)
        sys.exit(1)

    db_name = get_db_name(db_url)
    print(f"Verifying schema for database: {db_name}")

    success, issues = verify_schema()

    if not success:
        print("\n❌ Schema verification FAILED:", file=sys.stderr)
        for issue in issues:
            print(f"  - {issue}", file=sys.stderr)
        sys.exit(1)

    print("✓ Schema verification passed")
    print("  - Alembic revision: d4e5f6a7b8c9")
    print("  - users.is_verified exists")
    print("  - All required tables present")
    sys.exit(0)


if __name__ == '__main__':
    main()
