#!/usr/bin/env python3
"""
Diagnose and fix the login issue.
Run this from a regular terminal (outside Claude Code sandbox).

Usage:
  cd backend
  source .venv/bin/activate
  python diagnose_and_fix.py
"""
import sys
from sqlalchemy import text, inspect
from database import SessionLocal, engine

def main():
    print("=" * 60)
    print("RIVA Login Diagnostic Tool")
    print("=" * 60)

    db = SessionLocal()
    try:
        # Step 1: Check Alembic version
        print("\n[1/4] Checking Alembic migration state...")
        result = db.execute(text("SELECT version_num FROM alembic_version"))
        version = result.scalar()
        print(f"  Current revision: {version}")

        expected = "d4e5f6a7b8c9"
        if version == expected:
            print(f"  ✓ At expected revision (includes is_verified)")
        else:
            print(f"  ⚠ Not at expected revision {expected}")
            print(f"  → Run: alembic upgrade head")

        # Step 2: Check users table schema
        print("\n[2/4] Checking users table schema...")
        inspector = inspect(engine)
        columns = inspector.get_columns("users")
        column_names = [c['name'] for c in columns]

        print(f"  Columns: {', '.join(column_names)}")

        has_is_verified = 'is_verified' in column_names
        if has_is_verified:
            print(f"  ✓ is_verified column exists")
            col = next(c for c in columns if c['name'] == 'is_verified')
            print(f"    Type: {col['type']}")
            print(f"    Nullable: {col['nullable']}")
            print(f"    Default: {col.get('default', 'None')}")
        else:
            print(f"  ✗ is_verified column MISSING")
            print(f"  → This is the problem! Run: alembic upgrade head")
            return False

        # Step 3: Check if any users exist
        print("\n[3/4] Checking for existing users...")
        result = db.execute(text("SELECT COUNT(*) FROM users"))
        count = result.scalar()
        print(f"  User count: {count}")

        if count > 0:
            # Show sample user data (without passwords)
            result = db.execute(text("""
                SELECT id, email, is_verified, created_at
                FROM users
                LIMIT 3
            """))
            print("  Sample users:")
            for row in result:
                print(f"    - {row[1]} (verified: {row[2]})")

        # Step 4: Test a login query
        print("\n[4/4] Testing login query pattern...")
        test_email = "test@example.com"
        result = db.execute(
            text("SELECT id, email, is_verified FROM users WHERE email = :email LIMIT 1"),
            {"email": test_email}
        )
        row = result.fetchone()
        if row:
            print(f"  ✓ Query works for {test_email}")
            print(f"    ID: {row[0]}")
            print(f"    Verified: {row[2]}")
        else:
            print(f"  No user found with email {test_email} (this is OK if you haven't signed up)")

        print("\n" + "=" * 60)
        print("✓ Database schema is correct!")
        print("=" * 60)
        print("\nNext steps:")
        print("1. Start the backend: ./run-backend.sh")
        print("2. Try logging in at http://localhost:3000")
        print("3. Check backend logs for any errors")
        return True

    except Exception as e:
        print(f"\n✗ Error: {e}")
        print("\nIf you see 'column users.is_verified does not exist':")
        print("→ Run: alembic upgrade head")
        return False
    finally:
        db.close()

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
