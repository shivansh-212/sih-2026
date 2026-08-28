"""
Audit log model — tracks administrative actions.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class AuditLog(Base):
    """
    Administrative audit log entry.
    Never logs passwords, JWT secrets, or sensitive credentials.
    """

    __tablename__ = "audit_logs"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    action: Mapped[str] = mapped_column(
        String(50), nullable=False, index=True,
        comment="e.g. LOGIN, DATASET_UPLOAD, PROPERTY_CREATE",
    )
    resource_type: Mapped[str] = mapped_column(
        String(50), nullable=False,
        comment="e.g. user, property, dataset",
    )
    resource_id: Mapped[str | None] = mapped_column(String(255))
    details: Mapped[dict | None] = mapped_column(JSONB, default=dict)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    user = relationship("User")

    def __repr__(self) -> str:
        return f"<AuditLog {self.action} by={self.user_id}>"
