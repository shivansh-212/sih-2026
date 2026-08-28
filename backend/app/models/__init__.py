"""
Models package — imports all models so Alembic can discover them.
"""

from app.models.user import User, UserRole  # noqa: F401
from app.models.property import Property, PropertyStatus  # noqa: F401
from app.models.source_record import SourceRecord, DataSource  # noqa: F401
from app.models.property_match import PropertyMatch, MatchStatus  # noqa: F401
from app.models.audit import AuditLog  # noqa: F401
