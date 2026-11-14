"""Regression tests for the backend test-database isolation itself.

Guards the guarantees every other backend test depends on:

1. Missing TEST_DATABASE_URL  -> hard failure with setup instructions
   (never a silent fallback to the application's DATABASE_URL).
2. A database name that does not clearly mark it as a test database
   (no "test" in the name) -> refused before any connection is opened.
3. Pointing TEST_DATABASE_URL at the application's DATABASE_URL database
   -> refused, whether DATABASE_URL comes from the environment or .env,
   including loopback host aliases.
4. Non-PostgreSQL targets (e.g. SQLite) -> refused, because the suite —
   including the AuditLog varchar(36) regression — needs Postgres semantics.
5. A connected engine is verified to be on the configured database
   (current_database() must match).
6. An undeterminable application database -> fail closed.
7. Credentials never appear in validation errors.
8. teardown_test_database refuses engines install_test_database did not
   create, so it cannot be aimed at the application database.

Only the end-to-end test at the bottom touches a database, and only after
install_test_database() has validated and locked the dedicated test database.
Everything else is pure URL validation.

Run:  python -m pytest -q test_test_database_isolation.py
"""

import os
import unittest
from unittest.mock import patch

import sqlalchemy as sa

os.environ["OPENAI_API_KEY"] = "sk-test"
os.environ["JWT_SECRET_KEY"] = "x" * 40

APP_DB = "postgresql+psycopg://localhost/ledgerai"
TEST_DB = "postgresql+psycopg://localhost/ledgerai_test"


class TestDatabaseIsolationTests(unittest.TestCase):
    def test_missing_test_database_url_fails_with_instructions(self):
        from test_support import validate_test_database_url

        with self.assertRaises(RuntimeError) as ctx:
            validate_test_database_url(None)
        msg = str(ctx.exception)
        self.assertIn("TEST_DATABASE_URL", msg)
        self.assertIn("createdb", msg)
        self.assertIn("never fall back", msg.lower())

        with self.assertRaises(RuntimeError):
            validate_test_database_url("   ")

    def test_database_name_must_clearly_be_a_test_database(self):
        from test_support import validate_test_database_url

        for url in (
            APP_DB,  # the app's own development database
            "postgresql+psycopg://localhost/ledgerai_prod",
            "postgresql+psycopg://user:pass@neon.host/neondb",
        ):
            with self.assertRaises(RuntimeError) as ctx:
                validate_test_database_url(url)
            self.assertIn("clearly", str(ctx.exception))

    def test_non_postgres_target_is_refused(self):
        from test_support import validate_test_database_url

        for url in (
            "sqlite:///./ledgerai_test.db",
            "sqlite://",
            "mysql+pymysql://localhost/ledgerai_test",
        ):
            with self.assertRaises(RuntimeError) as ctx:
                validate_test_database_url(url)
            self.assertIn("PostgreSQL", str(ctx.exception))

    def test_app_database_is_refused_even_with_test_in_env_name(self):
        # Even if someone renames the app database with "test" in it, the
        # equality check against DATABASE_URL (environment AND .env) must
        # refuse it.
        from test_support import validate_test_database_url

        url = "postgresql+psycopg://localhost/ledgerai_test"
        with patch.dict(os.environ, {"DATABASE_URL": url}):
            with self.assertRaises(RuntimeError) as ctx:
                validate_test_database_url(url)
            self.assertIn("DEDICATED", str(ctx.exception))

    def test_app_database_name_is_refused_even_on_a_different_host(self):
        # Reusing the application database's name on another host is
        # ambiguous → refuse (fail closed), do not rely on hostname alone.
        from test_support import validate_test_database_url

        with patch.dict(
            os.environ,
            {"DATABASE_URL": "postgresql+psycopg://prod.example/ledgerai_test"},
        ):
            with self.assertRaises(RuntimeError) as ctx:
                validate_test_database_url(TEST_DB)
            self.assertIn("DEDICATED", str(ctx.exception))

    def test_loopback_host_aliases_are_treated_as_same_server(self):
        from test_support import validate_test_database_url

        with patch.dict(
            os.environ,
            {"DATABASE_URL": "postgresql+psycopg://localhost/ledgerai_test"},
        ):
            with self.assertRaises(RuntimeError):
                validate_test_database_url(
                    "postgresql+psycopg://127.0.0.1:5432/ledgerai_test"
                )

    def test_undeterminable_app_database_fails_closed(self):
        # No DATABASE_URL in the environment and no readable .env → the helper
        # must refuse rather than assume the test target is separate.
        from test_support import validate_test_database_url

        env_without_db = {
            k: v for k, v in os.environ.items() if k != "DATABASE_URL"
        }
        with patch.dict(os.environ, env_without_db, clear=True):
            with patch("test_support._env_file_value", return_value=None):
                with patch("dotenv.load_dotenv", lambda *a, **k: False):
                    with self.assertRaises(RuntimeError) as ctx:
                        validate_test_database_url(TEST_DB)
        self.assertIn("fail closed", str(ctx.exception).lower())

    def test_validation_errors_never_leak_credentials(self):
        from test_support import validate_test_database_url

        secret = "sup3r-s3cret-pw"
        bad = f"postgresql+psycopg://riva:{secret}@localhost/ledgerai_prod"
        with patch.dict(os.environ, {"DATABASE_URL": APP_DB}):
            with self.assertRaises(RuntimeError) as ctx:
                validate_test_database_url(bad)
        self.assertNotIn(secret, str(ctx.exception))

    def test_valid_test_url_passes_validation(self):
        from test_support import validate_test_database_url

        with patch.dict(os.environ, {"DATABASE_URL": APP_DB}):
            normalized = validate_test_database_url(TEST_DB)
        self.assertTrue(normalized.startswith("postgresql+psycopg://"))
        self.assertIn("ledgerai_test", normalized)

    def test_plain_postgres_urls_are_normalized(self):
        from test_support import validate_test_database_url

        with patch.dict(os.environ, {"DATABASE_URL": APP_DB}):
            normalized = validate_test_database_url("postgresql://localhost/ledgerai_test")
        self.assertTrue(normalized.startswith("postgresql+psycopg://"))

    def test_teardown_refuses_unregistered_engine(self):
        # Fail closed: teardown must never drop tables on an engine it did not
        # create (e.g. the application's engine passed by mistake).
        from test_support import teardown_test_database

        with self.assertRaises(RuntimeError) as ctx:
            teardown_test_database(object())
        self.assertIn("Refusing", str(ctx.exception))

    def test_concurrent_use_of_the_test_database_is_refused(self):
        # Two test processes must never drop/recreate the same database at the
        # same time. The session-level advisory lock makes the second one fail
        # fast instead of racing. This test only takes/releases a lock; it does
        # not create or drop any table.
        from test_support import (
            _acquire_exclusive_lock,
            create_test_engine,
            resolve_test_database_url,
        )

        dbname = sa.engine.url.make_url(resolve_test_database_url()).database
        engine1 = create_test_engine()
        conn1 = None
        engine2 = create_test_engine()
        try:
            conn1 = _acquire_exclusive_lock(engine1, dbname)
            with self.assertRaises(RuntimeError) as ctx:
                _acquire_exclusive_lock(engine2, dbname)
            self.assertIn("already in use", str(ctx.exception))
        finally:
            if conn1 is not None:
                try:
                    conn1.execute(sa.text("SELECT pg_advisory_unlock_all()"))
                    conn1.commit()
                finally:
                    conn1.close()
            engine1.dispose()
            engine2.dispose()

    def test_install_verifies_connected_database_name(self):
        # End-to-end: install_test_database must land on the configured test
        # database and leave a clean, fully created schema behind.
        from test_support import (
            install_test_database,
            resolve_test_database_url,
            teardown_test_database,
        )

        # Single source of truth for the expected name: the configured URL
        # (never a hardcoded name that could disagree with the helper policy).
        expected_dbname = sa.engine.url.make_url(resolve_test_database_url()).database

        try:
            engine, session_factory = install_test_database()
        except RuntimeError as exc:
            self.fail(
                "install_test_database() failed — the dedicated test database "
                f"is not available in this environment: {exc}"
            )
        try:
            with engine.connect() as conn:
                actual = conn.execute(sa.text("SELECT current_database()")).scalar()
            self.assertEqual(actual, expected_dbname)
            # Schema was created (users table exists and is empty).
            with engine.connect() as conn:
                count = conn.execute(sa.text("SELECT count(*) FROM users")).scalar()
            self.assertEqual(count, 0)
        finally:
            teardown_test_database(engine)


if __name__ == "__main__":
    unittest.main()