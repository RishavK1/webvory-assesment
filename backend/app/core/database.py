"""Database engine, session factory and declarative base.

The engine is configured from `DATABASE_URL`, so the exact same code runs
against SQLite (local development / assignment review) and PostgreSQL
(production) with no changes beyond the environment variable.
"""

from collections.abc import Generator

from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import settings


def _engine_options() -> dict:
    """Driver-specific engine tuning.

    SQLite needs `check_same_thread=False` because FastAPI serves requests
    from a thread pool. PostgreSQL instead benefits from real connection
    pooling and liveness checks.
    """
    if settings.is_sqlite:
        return {"connect_args": {"check_same_thread": False}}
    return {"pool_pre_ping": True, "pool_size": 10, "max_overflow": 20}


engine = create_engine(settings.DATABASE_URL, echo=settings.DEBUG, **_engine_options())


if settings.is_sqlite:

    @event.listens_for(engine, "connect")
    def _enable_sqlite_foreign_keys(dbapi_connection, _connection_record):
        """SQLite ignores FOREIGN KEY constraints unless asked not to.

        Without this the ON DELETE CASCADE rules on comments/activities are
        silently dropped, so deleting a task would orphan its children.
        """
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    """Declarative base shared by every ORM model."""


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency yielding a request-scoped session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
