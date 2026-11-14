"""Shared test-database infrastructure for RIVA backend tests.

Every database-backed backend test module must route its database access
through this helper instead of importing ``database.engine`` /
``database.SessionLocal`` directly.

Why it exists
-------------
``database.py`` builds a module-level engine from the application's
``DATABASE_URL`` (development or production). Historically several backend
tests called ``Base.metadata.create_all(engine)`` against that engine, so test
records ("cafe@example.com", seeded perf data, audit rows, ...) were written
straight into the development database. That made the suite:

- non-repeatable — a second run failed signup with HTTP 409 because the
  hardcoded e-mail already existed, and
- unsafe — pointing ``DATABASE_URL`` at production and running the suite would
  mutate production data.

How isolation is enforced
-------------------------
1. Tests read ``TEST_DATABASE_URL`` (environment variable, or the local
   ``backend/.env.test`` file). There is NO fallback to the application's
   ``DATABASE_URL``: if ``TEST_DATABASE_URL`` is unset the helper fails fast
   with setup instructions.
2. The URL must be PostgreSQL — the suite (and especially the AuditLog
   resource_id regression) relies on Postgres enforcing varchar limits and
   other production semantics that SQLite silently ignores.
3. The database name must clearly mark it as a test database (contains
   "test", case-insensitive). Anything else is refused *before* a connection
   is opened.
4. The target may not be the same database the application's ``DATABASE_URL``
   points at. Both the process environment and the backend ``.env`` file are
   inspected, with loopback host aliases (localhost/127.0.0.1/::1) and the
   default port normalised, so a stray ``DATABASE_URL`` exported by another
   test module cannot defeat the check. Database names are also compared
   case-insensitively. If the application database cannot be determined
   unambiguously, validation FAILS CLOSED instead of assuming it is safe.
5. On connect, ``current_database()`` is verified to match the configured
   name, and it is verified AGAIN on the exact connection that is about to
   run DDL — so the tests always know exactly which database they are using,
   even across a connection-pool swap.
6. ``install_test_database()`` drops and recreates the full schema, so every
   run starts from a clean, deterministic state and never depends on records
   left by previous runs. Only the dedicated test database is ever touched;
   the development/production database of ``DATABASE_URL`` is never written,
   truncated, dropped or migrated by this module.
7. Destructive work (drop/create in install, drop in teardown) runs inside a
   single PostgreSQL transaction guarded by a session-level advisory lock.
   A second process trying to use the same test database at the same time
   fails fast instead of dropping tables underneath the first one, and the
   lock is automatically released if a process dies. ``teardown_test_database``
   additionally refuses any engine that ``install_test_database`` did not
   create, so it can never be pointed at the application database.
8. URLs included in error messages are redacted (``hide_password=True``), so
   credentials are never printed in logs or test reports.
"""

import hashlib
import os
import re
import threading
from pathlib import Path

import sqlalchemy as sa
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

_BACKEND_DIR = Path(__file__).resolve().parent

_LOOPBACK_HOSTS = {"localhost", "127.0.0.1", "::1", "0.0.0.0"}
_DEFAULT_POSTGRES_PORT = 5432

# Engines prepared by install_test_database(), mapped to the connection that
# holds their advisory lock and the database name that was verified.
_HELD_LOCKS: dict = {}
_HELD_LOCKS_GUARD = threading.Lock()

_SETUP_INSTRUCTIONS = """
RIVA tests refused to run: no test database is configured.

Set TEST_DATABASE_URL to a DEDICATED PostgreSQL test database — either as an
environment variable or inside backend/.env.test (see backend/.env.example):

    TEST_DATABASE_URL=postgresql+psycopg://localhost/ledgerai_test

Create the database once with:

    createdb ledgerai_test

Tests NEVER fall back to the application's DATABASE_URL, because that may
point at development or production data.
"""


def _normalize_postgres_url(url: str) -> str:
    """Normalize plain postgres URLs to the psycopg v3 driver, like database.py."""
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+psycopg://", 1)
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+psycopg://", 1)
    return url


def _redact_url(url: str) -> str:
    """Render a database URL without its password (never log credentials)."""
    if not url:
        return "<unset>"
    try:
        return sa.engine.url.make_url(
            _normalize_postgres_url(url)
        ).render_as_string(hide_password=True)
    except Exception:
        # Last-resort redaction for unparseable input: hide userinfo.
        return re.sub(r"(://)[^/@]*@", r"\1***@", str(url))


def _canonical_target(parsed) -> tuple:
    """Canonical (host, port, dbname) with loopback aliases/defaults unified."""
    host = (parsed.host or "").lower()
    if host in _LOOPBACK_HOSTS:
        host = "localhost"
    port = parsed.port or _DEFAULT_POSTGRES_PORT
    return (host, port, parsed.database)


def _env_file_value(path: Path, key: str):
    """Read KEY from a dotenv-style file without touching the environment."""
    if not path.is_file():
        return None
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        name, _, value = line.partition("=")
        if name.strip() == key:
            return value.strip().strip("'\"") or None
    return None


def _app_database_targets():
    """All databases the application could be pointing at.

    Returns a set of canonical (host, port, dbname) tuples built from both the
    process environment and the backend ``.env`` file. The union is used so a
    stray ``DATABASE_URL`` exported into the environment by another test
    module cannot make the app database look "different" from what .env says.

    Fails closed: if any configured application URL is unparseable, or no
    application database can be determined at all, separate identity cannot be
    proven and validation is refused.
    """
    from dotenv import load_dotenv

    load_dotenv()  # same precedence rules database.py uses: env wins over .env
    candidates = {
        os.getenv("DATABASE_URL"),
        _env_file_value(_BACKEND_DIR / ".env", "DATABASE_URL"),
    }
    targets = set()
    unparseable = []
    configured = False
    for url in candidates:
        if not url:
            continue
        configured = True
        try:
            parsed = sa.engine.url.make_url(_normalize_postgres_url(url))
            targets.add(_canonical_target(parsed))
        except Exception:
            unparseable.append(_redact_url(url))
    if unparseable:
        raise RuntimeError(
            "Refusing to validate TEST_DATABASE_URL: the application's "
            "DATABASE_URL cannot be parsed, so its database identity is "
            "ambiguous (fail closed). Offending value(s): "
            + ", ".join(unparseable)
        )
    if not configured or not targets:
        raise RuntimeError(
            "Refusing to validate TEST_DATABASE_URL: the application's "
            "DATABASE_URL is not configured, so a dedicated test database "
            "cannot be proven separate from development/production (fail "
            "closed). Set DATABASE_URL in backend/.env or the environment."
        )
    return targets


def validate_test_database_url(url):
    """Validate TEST_DATABASE_URL, raising RuntimeError with a clear message.

    Enforced rules (before any connection is opened):
      * the variable must be set and non-empty;
      * the URL must target PostgreSQL;
      * the database name must clearly identify it as a test database
        (name contains "test", case-insensitive);
      * the target must not be the application's DATABASE_URL database, and
        must not even reuse the application database's name;
      * the application database must be unambiguously identifiable.
    Returns the normalized URL. Error messages never include credentials.
    """
    if not url or not url.strip():
        raise RuntimeError(_SETUP_INSTRUCTIONS)

    normalized = _normalize_postgres_url(url.strip())
    try:
        parsed = sa.engine.url.make_url(normalized)
    except Exception as exc:
        raise RuntimeError(
            "TEST_DATABASE_URL is not a parseable database URL:\n"
            f"    {_redact_url(url)}\n{exc}"
        ) from exc

    if not parsed.drivername.startswith("postgresql"):
        raise RuntimeError(
            "TEST_DATABASE_URL must target PostgreSQL so tests exercise the "
            f"same semantics as production (varchar limits, advisory locks). "
            f"Got driver {parsed.drivername!r}. Configure a dedicated test "
            "database such as postgresql+psycopg://localhost/ledgerai_test."
        )

    dbname = parsed.database or ""
    if "test" not in dbname.lower():
        raise RuntimeError(
            "TEST_DATABASE_URL must point at a database whose name clearly "
            "marks it as a test database (the name must contain 'test'), so "
            "tests can never be confused with development or production "
            f"data. Refusing to use database {dbname!r} from:\n"
            f"    {_redact_url(url)}\n"
            "Create and use a dedicated test database, e.g. ledgerai_test."
        )

    target = _canonical_target(parsed)
    app_targets = _app_database_targets()
    app_dbnames = {t[2].lower() for t in app_targets if t[2]}
    if target in app_targets or dbname.lower() in app_dbnames:
        raise RuntimeError(
            "TEST_DATABASE_URL points at the same database as the "
            "application's DATABASE_URL:\n"
            f"    host={parsed.host!r} port={parsed.port!r} db={dbname!r}\n"
            "Tests must use a DEDICATED test database, never the development "
            "or production database. Create one, e.g.:\n"
            "    createdb ledgerai_test\n"
            "and set TEST_DATABASE_URL=postgresql+psycopg://localhost/ledgerai_test"
        )

    return normalized


def resolve_test_database_url():
    """Resolve and validate TEST_DATABASE_URL. Never falls back to DATABASE_URL."""
    # backend/.env.test is local (gitignored) configuration for the dedicated
    # test database. Existing environment variables take precedence.
    from dotenv import load_dotenv

    load_dotenv(dotenv_path=_BACKEND_DIR / ".env.test")
    url = os.getenv("TEST_DATABASE_URL")
    return validate_test_database_url(url)


def _verify_current_database(conn, expected_dbname):
    """Prove the given connection is on the intended database, or fail clearly."""
    actual = conn.execute(sa.text("SELECT current_database()")).scalar()
    if actual != expected_dbname:
        raise RuntimeError(
            "Test database mismatch: TEST_DATABASE_URL names "
            f"{expected_dbname!r} but the server reports the connection "
            f"landed on {actual!r}. Refusing to run tests against an "
            "unintended database."
        )
    return actual


def _connect_and_verify(engine, expected_dbname):
    """Connect and prove we are on the intended database, or fail clearly."""
    try:
        with engine.connect() as conn:
            _verify_current_database(conn, expected_dbname)
    except sa.exc.OperationalError as exc:
        engine.dispose()
        raise RuntimeError(
            "Cannot connect to the configured RIVA test database "
            f"{expected_dbname!r}. It may not exist yet — create it with:\n"
            f"    createdb {expected_dbname}\n"
            f"Underlying error: {exc}"
        ) from exc


def _advisory_lock_key(dbname: str) -> int:
    """Stable 64-bit advisory-lock key scoped to this test database."""
    digest = hashlib.sha256(f"riva-test-db-lock:{dbname}".encode("utf-8")).digest()
    return int.from_bytes(digest[:8], "big", signed=True)


def _acquire_exclusive_lock(engine, expected_dbname):
    """Hold a session-level advisory lock for the lifetime of the test DB use.

    Session-level locks survive COMMIT and are released automatically when the
    connection closes (including process death). ``pg_try_advisory_lock`` makes
    a concurrent test process fail fast rather than drop tables under a running
    suite, so destructive races are impossible.
    """
    conn = engine.connect()
    try:
        acquired = conn.execute(
            sa.text("SELECT pg_try_advisory_lock(:key)").bindparams(
                key=_advisory_lock_key(expected_dbname)
            )
        ).scalar()
        conn.commit()  # session-level lock survives the commit
        if not acquired:
            raise RuntimeError(
                "The RIVA test database is already in use by another test "
                "process (advisory lock held). Refusing to drop/recreate the "
                "schema concurrently. Run the suite serially, or wait for the "
                "other run to finish."
            )
        _verify_current_database(conn, expected_dbname)
        conn.commit()
    except Exception:
        conn.close()
        raise
    return conn


def create_test_engine():
    """Build an engine for the validated TEST_DATABASE_URL and verify it."""
    url = resolve_test_database_url()
    parsed = sa.engine.url.make_url(url)
    engine = create_engine(url, pool_pre_ping=True)
    _connect_and_verify(engine, parsed.database)
    return engine


def _drop_all_tables(conn):
    """Drop every table in the default schema on ``conn``.

    ``Base.metadata.drop_all()`` cannot sort the users<->businesses foreign-key
    cycle (CircularDependencyError), so tables are dropped explicitly with
    CASCADE. This helper is only ever called on a connection to the validated
    dedicated test database — never on the application's DATABASE_URL target.
    """
    inspector = sa.inspect(conn)
    table_names = inspector.get_table_names()
    if not table_names:
        return
    quoted = ", ".join(f'"{name}"' for name in sorted(table_names))
    conn.execute(sa.text(f"DROP TABLE {quoted} CASCADE"))


def install_test_database():
    """Prepare the dedicated test database for a test class.

    Drops and recreates the full application schema, so setup/teardown are
    deterministic and runs never depend on data left behind by previous runs.

    Returns ``(engine, session_factory)``. ``engine`` must later be passed to
    ``teardown_test_database()``.
    """
    import models  # noqa: F401 — populate Base.metadata with all app tables
    from database import Base

    url = resolve_test_database_url()
    expected_dbname = sa.engine.url.make_url(url).database
    engine = create_engine(url, pool_pre_ping=True)
    lock_conn = None
    try:
        # 1. Prove the pool reaches the configured database.
        _connect_and_verify(engine, expected_dbname)
        # 2. Serialize against any other test process, then verify identity
        #    again on the exact connection that will perform DDL.
        lock_conn = _acquire_exclusive_lock(engine, expected_dbname)
        with lock_conn.begin():
            _verify_current_database(lock_conn, expected_dbname)
            _drop_all_tables(lock_conn)
            # create_all on a Connection participates in the same transaction
            # as the drops: setup is atomic (all or nothing) and serialized.
            Base.metadata.create_all(lock_conn)
    except Exception:
        if lock_conn is not None:
            lock_conn.close()
        engine.dispose()
        raise

    with _HELD_LOCKS_GUARD:
        _HELD_LOCKS[engine] = (lock_conn, expected_dbname)

    session_factory = sessionmaker(
        bind=engine,
        autoflush=False,
        autocommit=False,
        expire_on_commit=True,  # mirror database.SessionLocal semantics
    )
    return engine, session_factory


def make_get_db_override(session_factory):
    """Build a FastAPI dependency override for database.get_db.

    Mirrors database.get_db's lifecycle (yield a session, always close), but
    bound to the dedicated test engine so every request the app serves during
    tests is isolated from development/production data.
    """

    def _override_get_db():
        db = session_factory()
        try:
            yield db
        finally:
            db.close()

    return _override_get_db


def teardown_test_database(engine):
    """Drop the test schema and dispose of the test engine.

    Fail-closed: only an engine returned by ``install_test_database()`` (and
    therefore holding the verified advisory lock) is accepted. Anything else —
    e.g. the application engine passed by mistake — raises instead of
    dropping tables.
    """
    with _HELD_LOCKS_GUARD:
        held = _HELD_LOCKS.pop(engine, None)
    if held is None:
        raise RuntimeError(
            "teardown_test_database() received an engine that was not created "
            "by install_test_database(). Refusing to drop tables (this guard "
            "prevents accidentally wiping the application database)."
        )

    lock_conn, expected_dbname = held
    try:
        with engine.begin() as conn:
            # Re-verify immediately before the destructive operation.
            _verify_current_database(conn, expected_dbname)
            _drop_all_tables(conn)
    finally:
        try:
            lock_conn.execute(
                sa.text("SELECT pg_advisory_unlock(:key)").bindparams(
                    key=_advisory_lock_key(expected_dbname)
                )
            )
            lock_conn.commit()
        except Exception:
            # Closing the connection also releases a session-level lock.
            pass
        finally:
            lock_conn.close()
        engine.dispose()