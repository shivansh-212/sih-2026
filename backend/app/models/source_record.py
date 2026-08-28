"""
Source record model — stores raw and normalized data from external datasets.
"""

import enum
import uuid
from datetime import datetime, timezone
from decimal import Decimal

from geoalchemy2 import Geometry
from sqlalchemy import String, Numeric, Enum, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class DataSource(str, enum.Enum):
    """Supported data sources."""
    GOOGLE = "GOOGLE"
    SVAMITVA = "SVAMITVA"
    E_NAKSHA = "E_NAKSHA"


class SourceRecord(Base):
    """
    A single record ingested from an external dataset.
    Linked to a unified Property once matched.
    """

    __tablename__ = "source_records"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True, default=uuid.uuid4
    )
    property_uuid: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("properties.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    source: Mapped[DataSource] = mapped_column(
        Enum(DataSource, name="data_source"), nullable=False
    )
    external_record_id: Mapped[str | None] = mapped_column(String(255))

    # Location fields (pre-normalization)
    village: Mapped[str | None] = mapped_column(String(255))
    block: Mapped[str | None] = mapped_column(String(255))
    district: Mapped[str | None] = mapped_column(String(255))
    state: Mapped[str | None] = mapped_column(String(255))
    pincode: Mapped[str | None] = mapped_column(String(10))

    # Coordinates
    latitude: Mapped[Decimal | None] = mapped_column(Numeric(10, 7))
    longitude: Mapped[Decimal | None] = mapped_column(Numeric(10, 7))

    # PostGIS geometry
    geometry = mapped_column(
        Geometry(geometry_type="GEOMETRY", srid=4326),
        nullable=True,
    )

    # Raw and normalized data as JSONB
    raw_data: Mapped[dict | None] = mapped_column(JSONB, default=dict)
    normalized_data: Mapped[dict | None] = mapped_column(JSONB, default=dict)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    property = relationship("Property", back_populates="source_records")

    def __repr__(self) -> str:
        return f"<SourceRecord {self.source.value} ext_id={self.external_record_id}>"
