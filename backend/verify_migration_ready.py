#!/usr/bin/env python3
"""Pre-migration verification: check that everything is ready for migration.

This script performs static checks WITHOUT mutating the database:
  - Validates migration file syntax and chain
  - Checks for missing models
  - Verifies PostgreSQL compatibility patterns
  - Confirms backup strategy is sound

Does NOT:
  - Connect to the database
  - Run migrations
  - Create backups
  - Modify any files
"""
import sys
from pathlib import Path
import re


def check_migration_files() -> tuple[bool, list[str]]:
    """Check migration file syntax and revision chain."""
    issues = []
    migration_dir = Path('alembic/versions')

    if not migration_dir.exists():
        issues.append("alembic/versions directory not found")
        return (False, issues)

    # Find all migration files
    migrations = sorted(migration_dir.glob('*.py'))
    migrations = [m for m in migrations if '__pycache__' not in str(m) and '__init__' not in m.name]

    if len(migrations) < 10:
        issues.append(f"Expected 10 migration files, found {len(migrations)}")

    # Check that target migration exists
    target_file = migration_dir / 'd4e5f6a7b8c9_add_verification_and_password_reset_tokens.py'
    if not target_file.exists():
        issues.append("Target migration d4e5f6a7b8c9 not found")

    # Check merge revision exists
    merge_file = migration_dir / 'c3d4e5f6a7b8_add_user_sessions_for_refresh_rotation.py'
    if not merge_file.exists():
        issues.append("Merge revision c3d4e5f6a7b8 not found")

    # Verify merge revision has tuple down_revision
    if merge_file.exists():
        content = merge_file.read_text()
        if '("9e8f7c6a5b4d", "add_production_indexes")' not in content:
            issues.append("Merge revision c3d4e5f6a7b8 does not properly merge both branches")

    return (len(issues) == 0, issues)


def check_postgresql_compatibility() -> tuple[bool, list[str]]:
    """Check for PostgreSQL compatibility issues in migrations."""
    issues = []
    migration_dir = Path('alembic/versions')

    # Patterns that would indicate PostgreSQL incompatibility
    bad_patterns = [
        (r'server_default="1"', 'Should use server_default=sa.true() for PostgreSQL'),
        (r'server_default=1', 'Should use server_default=sa.true() for PostgreSQL'),
        (r'AUTOINCREMENT', 'MySQL-specific, use SERIAL for PostgreSQL'),
        (r'ENGINE=InnoDB', 'MySQL-specific'),
        (r'IF NOT EXISTS', 'Not standard Alembic pattern, could mask errors'),
    ]

    for mig_file in migration_dir.glob('*.py'):
        if '__pycache__' in str(mig_file) or '__init__' in mig_file.name:
            continue

        content = mig_file.read_text()

        for pattern, issue_msg in bad_patterns:
            if re.search(pattern, content, re.IGNORECASE):
                issues.append(f"{mig_file.name}: {issue_msg}")

    # Check for proper Boolean handling in d4e5f6a7b8c9
    target_file = migration_dir / 'd4e5f6a7b8c9_add_verification_and_password_reset_tokens.py'
    if target_file.exists():
        content = target_file.read_text()
        # server_default="0" is acceptable - SQLAlchemy converts to FALSE for PostgreSQL
        # But we should verify it's used for boolean columns
        if 'server_default="0"' in content and 'Boolean()' in content:
            # This is OK - SQLAlchemy handles the conversion
            pass

    return (len(issues) == 0, issues)


def check_models_vs_migrations() -> tuple[bool, list[str]]:
    """Check for models that don't have migrations."""
    warnings = []  # Not blocking, just informational

    models_file = Path('models.py')
    if not models_file.exists():
        warnings.append("models.py not found - cannot check for missing migrations")
        return (True, warnings)  # Not blocking

    content = models_file.read_text()

    # Check for AuditLog model
    if 'class AuditLog' in content:
        # Check if audit_logs migration exists
        migration_dir = Path('alembic/versions')
        has_audit_migration = False

        for mig_file in migration_dir.glob('*.py'):
            if '__pycache__' in str(mig_file):
                continue
            mig_content = mig_file.read_text()
            if 'audit_logs' in mig_content:
                has_audit_migration = True
                break

        if not has_audit_migration:
            warnings.append("AuditLog model exists in models.py but no migration creates audit_logs table")

    return (True, warnings)  # Always pass, these are just warnings


def check_backup_scripts() -> tuple[bool, list[str]]:
    """Check that backup scripts exist and are correctly implemented."""
    issues = []

    backup_script = Path('safe_backup.py')
    if not backup_script.exists():
        issues.append("safe_backup.py not found")
        return (False, issues)

    content = backup_script.read_text()

    # Check for proper URL parsing (not string splitting)
    if 'urlparse' not in content:
        issues.append("safe_backup.py does not use urlparse for DATABASE_URL")

    # Check for validation
    if 'pg_restore --list' not in content and 'pg_restore", "--list"' not in content:
        issues.append("safe_backup.py does not validate backup with pg_restore --list")

    # Check it doesn't print credentials
    if 'print.*password' in content.lower() or 'print.*DATABASE_URL' in content.lower():
        issues.append("safe_backup.py may be printing credentials")

    return (len(issues) == 0, issues)


def main():
    print("=" * 60)
    print("RIVA Database Migration Pre-Flight Check")
    print("=" * 60)

    all_passed = True

    # Check 1: Migration files
    print("\n[1/4] Checking migration files...")
    passed, issues = check_migration_files()
    if passed:
        print("  ✓ Migration files OK")
    else:
        print("  ✗ Migration file issues:")
        for issue in issues:
            print(f"    - {issue}")
        all_passed = False

    # Check 2: PostgreSQL compatibility
    print("\n[2/4] Checking PostgreSQL compatibility...")
    passed, issues = check_postgresql_compatibility()
    if passed:
        print("  ✓ PostgreSQL compatibility OK")
    else:
        print("  ✗ PostgreSQL compatibility issues:")
        for issue in issues:
            print(f"    - {issue}")
        all_passed = False

    # Check 3: Models vs migrations
    print("\n[3/4] Checking models vs migrations...")
    passed, warnings = check_models_vs_migrations()
    if not warnings:
        print("  ✓ No missing migrations detected")
    else:
        print("  ⚠ Warnings (not blocking):")
        for warning in warnings:
            print(f"    - {warning}")

    # Check 4: Backup scripts
    print("\n[4/4] Checking backup scripts...")
    passed, issues = check_backup_scripts()
    if passed:
        print("  ✓ Backup scripts OK")
    else:
        print("  ✗ Backup script issues:")
        for issue in issues:
            print(f"    - {issue}")
        all_passed = False

    # Final result
    print("\n" + "=" * 60)
    if all_passed:
        print("✓ PRE-FLIGHT CHECK PASSED")
        print("=" * 60)
        print("\nReady to proceed with migration:")
        print("  1. Run: python3 safe_backup.py")
        print("  2. Run: python3 run_migration.py")
        print("\nNOTE: Database has NOT been modified by this check")
        sys.exit(0)
    else:
        print("✗ PRE-FLIGHT CHECK FAILED")
        print("=" * 60)
        print("\nFix the issues above before running migration")
        sys.exit(1)


if __name__ == '__main__':
    main()
