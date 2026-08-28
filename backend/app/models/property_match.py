"""
Property match model — stores AI matching results between source records.
"""

import enum
import uuid
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import String, Numeric, Enum, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class MatchStatus(str, enum.Enum):
    """AI matching classification."""
    MATCHED = "MATCHED"
    POSSIBLE = "POSSIBLE"
    REJECTED = "REJECTED"


class PropertyMatch(Base):
    """
    Result of AI-assisted matching between two source records.
    Linked to the unified Property they contribute to.
    """

    __tablename__ = "property_matches"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True, default=uuid.uuid4
    )
    property_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("properties.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    source_record_a: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("source_records.id", ondelete="CASCADE"),
        nullable=False,
    )
    source_record_b: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("source_records.id", ondelete="CASCADE"),
        nullable=False,
    )
    confidence_score: Mapped[Decimal] = mapped_column(
        Numeric(5, 2), nullable=False,
        comment="Match confidence 0-100",
    )
    match_status: Mapped[MatchStatus] = mapped_column(
        Enum(MatchStatus, name="match_status"), nullable=False
    )
    matching_features: Mapped[dict | None] = mapped_column(
        JSONB, default=dict,
        comment="Breakdown of individual feature scores",
    )
    model_version: Mapped[str | None] = mapped_column(String(50))

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    property = relationship("Property", back_populates="matches")
    record_a = relationship("SourceRecord", foreign_keys=[source_record_a])
    record_b = relationship("SourceRecord", foreign_keys=[source_record_b])

    def __repr__(self) -> str:
        return f"<PropertyMatch {self.match_status.value} score={self.confidence_score}>"
