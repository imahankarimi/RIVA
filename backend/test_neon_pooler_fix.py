"""Test that database configuration works with Neon Pooler.

This test verifies that the database.py configuration no longer passes
statement_timeout in connection startup options, which Neon Pooler rejects.
"""
import os
import sys

# Set up test environment
os.environ['DATABASE_URL'] = 'postgresql+psycopg://user:pass@ep-test-pooler.neon.tech/db'

# Import database module
from database import _engine_kwargs, DATABASE_URL

def test_statement_timeout_removed():
    """Verify statement_timeout is not in connection startup options."""
    print("Testing database configuration...")
    print(f"Database URL: {DATABASE_URL[:30]}... (Neon pooler format)")

    # Check that we're testing PostgreSQL configuration
    assert DATABASE_URL.startswith("postgresql+psycopg://"), "Should use psycopg driver"

    # Check connect_args
    if 'connect_args' in _engine_kwargs:
        connect_args = _engine_kwargs['connect_args']
        print(f"Connection args: {connect_args}")

        # Verify statement_timeout is NOT in options
        if 'options' in connect_args:
            assert 'statement_timeout' not in connect_args['options'], \
                "statement_timeout must not be in connection startup options (Neon Pooler rejects it)"
            print("✓ statement_timeout not found in options")
        else:
            print("✓ No 'options' key in connect_args (statement_timeout removed)")

        # Verify connect_timeout is still present
        if 'connect_timeout' in connect_args:
            print(f"✓ connect_timeout preserved: {connect_args['connect_timeout']}s")

    # Verify pool configuration is intact
    assert _engine_kwargs.get('pool_size') == 20, "Pool size should be preserved"
    assert _engine_kwargs.get('max_overflow') == 30, "Max overflow should be preserved"
    assert _engine_kwargs.get('pool_pre_ping') is True, "pool_pre_ping should be preserved"

    print("✓ All database configuration checks passed")
    print("✓ Configuration is compatible with Neon Pooler")
    return True

if __name__ == '__main__':
    try:
        test_statement_timeout_removed()
        print("\n✅ TEST PASSED: Database configuration fixed for Neon Pooler")
        sys.exit(0)
    except AssertionError as e:
        print(f"\n❌ TEST FAILED: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ TEST ERROR: {e}")
        sys.exit(1)
