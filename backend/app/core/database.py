"""
PostgreSQL / SQLite connection and session management.
Uses synchronous SQLAlchemy 2.x for simplicity.
Supports PostgreSQL (with PostGIS) and SQLite (with automatic fallback stubs).
"""

from typing import Generator
from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, sessionmaker, Session
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.compiler import compiles
from geoalchemy2.types import Geometry

from app.core.config import settings

# Register type compilers so SQLite can handle PostgreSQL-specific types if running on SQLite
@compiles(Geometry, "sqlite")
def compile_geometry_sqlite(type_, compiler, **kw):
    return "TEXT"


@compiles(JSONB, "sqlite")
def compile_jsonb_sqlite(type_, compiler, **kw):
    return "TEXT"


# Disable geoalchemy2 DDL listeners for SQLite
if settings.DATABASE_URL.startswith("sqlite"):
    import geoalchemy2.admin.dialects.sqlite as _ga2_sqlite
    _ga2_sqlite.before_create = lambda *a, **kw: None
    _ga2_sqlite.after_create = lambda *a, **kw: None
    _ga2_sqlite.before_drop = lambda *a, **kw: None
    _ga2_sqlite.after_drop = lambda *a, **kw: None


def _normalize_db_url(url: str) -> str:
    """Ensure PostgreSQL URLs use the psycopg (v3) dialect for SQLAlchemy 2.0."""
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+psycopg://", 1)
    if url.startswith("postgresql://") and not url.startswith("postgresql+"):
        return url.replace("postgresql://", "postgresql+psycopg://", 1)
    return url


def _create_engine():
    """Create the SQLAlchemy engine with appropriate settings."""
    url = _normalize_db_url(settings.DATABASE_URL)

    if url.startswith("sqlite"):
        eng = create_engine(
            url,
            connect_args={"check_same_thread": False},
        )
        @event.listens_for(eng, "connect")
        def connect_sqlite(dbapi_con, con_record):
            dbapi_con.create_function("AsEWKB", 1, lambda x: x)
            dbapi_con.create_function("AsBinary", 1, lambda x: x)
            dbapi_con.create_function("GeomFromEWKT", 1, lambda x: x)
            dbapi_con.create_function("GeomFromText", 1, lambda x: x)
            dbapi_con.create_function("ST_AsGeoJSON", 1, lambda x: None)
        return eng
    else:
        return create_engine(
            url,
            pool_pre_ping=True,
            pool_size=10,
            max_overflow=20,
        )


# Create the SQLAlchemy engine
engine = _create_engine()

# Session factory
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""
    pass


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency that yields a database session.
    Automatically closes the session when the request is done.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
