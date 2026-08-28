"""
Test configuration and fixtures.
Uses SQLite in-memory database for fast, isolated tests.
Disables geoalchemy2 DDL events and provides stubs since SQLite doesn't have PostGIS.
"""

import os
import pytest

# Override environment BEFORE importing any app modules
os.environ["DATABASE_URL"] = "sqlite://"
os.environ["JWT_SECRET_KEY"] = "test-secret-key"
os.environ["ADMIN_EMAIL"] = "seed-admin@example.com"
os.environ["ADMIN_PASSWORD"] = "testadmin123"
os.environ["USER_EMAIL"] = "seed-user@example.com"
os.environ["USER_PASSWORD"] = "testuser123"

from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.compiler import compiles
from geoalchemy2.types import Geometry

# Register type compilers so SQLite can handle PostgreSQL-specific types
@compiles(Geometry, "sqlite")
def compile_geometry_sqlite(type_, compiler, **kw):
    return "TEXT"


@compiles(JSONB, "sqlite")
def compile_jsonb_sqlite(type_, compiler, **kw):
    return "TEXT"


# Disable geoalchemy2 DDL listeners BEFORE importing models
import geoalchemy2.admin.dialects.sqlite as _ga2_sqlite
_ga2_sqlite.before_create = lambda *a, **kw: None
_ga2_sqlite.after_create = lambda *a, **kw: None
_ga2_sqlite.before_drop = lambda *a, **kw: None
_ga2_sqlite.after_drop = lambda *a, **kw: None

from app.core.database import Base, get_db
from app.main import app
from fastapi.testclient import TestClient


# Create test database engine (SQLite in-memory)
test_engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

@event.listens_for(test_engine, "connect")
def connect(dbapi_con, con_record):
    dbapi_con.create_function("AsEWKB", 1, lambda x: x)
    dbapi_con.create_function("AsBinary", 1, lambda x: x)
    dbapi_con.create_function("GeomFromEWKT", 1, lambda x: x)
    dbapi_con.create_function("GeomFromText", 1, lambda x: x)
    dbapi_con.create_function("ST_AsGeoJSON", 1, lambda x: None)

TestSessionLocal = sessionmaker(bind=test_engine, autocommit=False, autoflush=False)


def override_get_db():
    """Override the database dependency for tests."""
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()


# Override the get_db dependency
app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="function", autouse=True)
def setup_database():
    """Create all tables before each test, drop after."""
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def db():
    """Provide a test database session."""
    session = TestSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client():
    """Provide a FastAPI test client."""
    return TestClient(app)


@pytest.fixture
def admin_token(client):
    """Register an admin user and return their JWT token."""
    client.post(
        "/api/v1/auth/register",
        json={"email": "admin@example.com", "password": "adminpass123", "full_name": "Test Admin"},
    )

    # Manually promote to admin via DB
    from app.models.user import User, UserRole
    db = TestSessionLocal()
    user = db.query(User).filter(User.email == "admin@example.com").first()
    if user:
        user.role = UserRole.ADMIN
        db.commit()
    db.close()

    # Login
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@example.com", "password": "adminpass123"},
    )
    data = response.json()
    assert "access_token" in data, f"Login failed: {data}"
    return data["access_token"]


@pytest.fixture
def user_token(client):
    """Register a normal user and return their JWT token."""
    client.post(
        "/api/v1/auth/register",
        json={"email": "user@example.com", "password": "userpass123", "full_name": "Test User"},
    )
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "user@example.com", "password": "userpass123"},
    )
    data = response.json()
    assert "access_token" in data, f"Login failed: {data}"
    return data["access_token"]


@pytest.fixture
def admin_headers(admin_token):
    """Return authorization headers for admin."""
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture
def user_headers(user_token):
    """Return authorization headers for normal user."""
    return {"Authorization": f"Bearer {user_token}"}
