"""
Unified property database model.
Each row represents one physical property with a unique BHU-ID.
"""

import enum
import uuid
from datetime import datetime, timezone
from decimal import Decimal

from geoalchemy2 import Geometry
from sqlalchemy import String, Numeric, Enum, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class PropertyStatus(str, enum.Enum):
    """Property verification status."""
    VERIFIED = "VERIFIED"
    WARNING = "WARNING"
    CONFLICT = "CONFLICT"
    PENDING = "PENDING"


class Property(Base):
    """A unified property record identified by a unique property_id (BHU-ID)."""

    __tablename__ = "properties"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True, default=uuid.uuid4
    )
    property_id: Mapped[str] = mapped_column(
        String(50), unique=True, index=True, nullable=False,
        comment="Unique BHU-ID for this property",
    )

    # Location fields
    village: Mapped[str | None] = mapped_column(String(255), index=True)
    block: Mapped[str | None] = mapped_column(String(255), index=True)
    district: Mapped[str | None] = mapped_column(String(255), index=True)
    state: Mapped[str | None] = mapped_column(String(255), index=True)
    pincode: Mapped[str | None] = mapped_column(String(10), index=True)

    # Coordinates
    latitude: Mapped[Decimal | None] = mapped_column(Numeric(10, 7))
    longitude: Mapped[Decimal | None] = mapped_column(Numeric(10, 7))

    # PostGIS geometry (SRID 4326 = WGS84)
    geometry = mapped_column(
        Geometry(geometry_type="GEOMETRY", srid=4326),
        nullable=True,
    )

    # Metadata
    area_sq_m: Mapped[Decimal | None] = mapped_column(Numeric(15, 2))
    confidence_score: Mapped[Decimal | None] = mapped_column(
        Numeric(5, 2), comment="Overall confidence 0-100"
    )
    status: Mapped[PropertyStatus] = mapped_column(
        Enum(PropertyStatus, name="property_status"),
        nullable=False,
        default=PropertyStatus.PENDING,
    )

    # Structural & Survey Details (SmartLens GIS)
    property_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    build_material: Mapped[str | None] = mapped_column(String(100), nullable=True)
    floors: Mapped[int | None] = mapped_column(nullable=True, default=1)
    roof_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    condition: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # Owner Information
    owner_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    owner_phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    owner_email: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Field Worker & Verification Pipeline
    field_worker: Mapped[str | None] = mapped_column(String(100), nullable=True)
    verification_step: Mapped[str | None] = mapped_column(String(50), nullable=True, default="MAPPING_COMPLETE")
    site_photos: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    source_records = relationship("SourceRecord", back_populates="property")
    matches = relationship("PropertyMatch", back_populates="property")

    def __repr__(self) -> str:
        return f"<Property {self.property_id} status={self.status.value}>"
