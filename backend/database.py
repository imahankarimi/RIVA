import os

from dotenv import load_dotenv
from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from sqlalchemy.pool import QueuePool

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set")

# SQLAlchemy defaults to psycopg2 for `postgresql://`.
# RIVA uses psycopg (v3), so normalize PostgreSQL URLs explicitly.
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)
elif DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg://", 1)

# `connect_args` for PostgreSQL at runtime. The dedicated test files build
# their own SQLite engines, but anything reusing this module-level engine must
# not receive Postgres-only connection args (e.g. `options`) — so they are only
# applied when the URL is actually Postgres. This also lets the module import
# cleanly against a SQLite URL (singleton-test style) without crashing.
_engine_kwargs: dict = {
    "echo": os.getenv("SQL_ECHO", "false").lower() == "true",
    "hide_parameters": True,
}

if DATABASE_URL.startswith("postgresql"):
    _engine_kwargs.update(
        {
            "poolclass": QueuePool,
            # Connection pool sizing for production load
            "pool_size": 20,  # Core connections always maintained
            "max_overflow": 30,  # Extra connections when pool is full (total: 50)
            "pool_timeout": 30,  # Seconds to wait for a connection before error
            "pool_recycle": 3600,  # Recycle after 1 hour (prevents stale connections)
            "pool_pre_ping": True,  # Verify connection health before using
            "connect_args": {
                "connect_timeout": 10,  # PostgreSQL connection timeout
                "options": "-c statement_timeout=30000",  # 30s query timeout
            },
        }
    )

engine = create_engine(DATABASE_URL, **_engine_kwargs)


# Connection pool health monitoring
@event.listens_for(engine, "connect")
def receive_connect(dbapi_conn, connection_record):
    """Track connection creation for monitoring."""
    # Could add connection tracking/logging here
    pass


@event.listens_for(engine, "checkout")
def receive_checkout(dbapi_conn, connection_record, connection_proxy):
    """Verify connection is alive on checkout."""
    # pool_pre_ping already handles this, but this hook is available
    # for custom health checks if needed
    pass


SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
    expire_on_commit=True,  # Prevent implicit queries after commit
)


class Base(DeclarativeBase):
    pass


def get_db():
    """FastAPI dependency for database sessions.

    Ensures proper session lifecycle:
    - Created on request start
    - Automatically closed on request end
    - Rolled back on exceptions
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_pool_status() -> dict:
    """Get connection pool health metrics for monitoring."""
    pool = engine.pool
    return {
        "size": pool.size(),
        "checked_in": pool.checkedin(),
        "checked_out": pool.checkedout(),
        "overflow": pool.overflow(),
        "total_connections": pool.size() + pool.overflow(),
    }
