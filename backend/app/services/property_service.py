"""
Property business logic — CRUD, search, map data, stats.
"""

import json
from decimal import Decimal
from typing import Any

from geoalchemy2.functions import ST_AsGeoJSON
from sqlalchemy import func, cast
from sqlalchemy.orm import Session

from app.models.property import Property, PropertyStatus
from app.models.source_record import SourceRecord, DataSource
from app.models.property_match import PropertyMatch
from app.utils.geo import build_feature, build_feature_collection


def list_properties(
    db: Session,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[Property], int]:
    """Return paginated properties."""
    total = db.query(func.count(Property.id)).scalar() or 0
    properties = (
        db.query(Property)
        .order_by(Property.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return properties, total


def get_property_by_id(db: Session, property_id: str) -> Property | None:
    """Get a property by its BHU-ID string."""
    return db.query(Property).filter(Property.property_id == property_id).first()


def get_property_sources(db: Session, property_uuid) -> list[SourceRecord]:
    """Get all source records linked to a property."""
    return (
        db.query(SourceRecord)
        .filter(SourceRecord.property_uuid == property_uuid)
        .order_by(SourceRecord.created_at.desc())
        .all()
    )


def get_property_matches(db: Session, property_uuid) -> list[PropertyMatch]:
    """Get all AI match results for a property."""
    return (
        db.query(PropertyMatch)
        .filter(PropertyMatch.property_id == property_uuid)
        .order_by(PropertyMatch.created_at.desc())
        .all()
    )


def search_properties(
    db: Session,
    property_id: str | None = None,
    village: str | None = None,
    block: str | None = None,
    district: str | None = None,
    pincode: str | None = None,
    status: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[Property], int]:
    """
    Search properties with optional filters.
    All text filters use case-insensitive ILIKE.
    """
    query = db.query(Property)

    if property_id:
        query = query.filter(Property.property_id.ilike(f"%{property_id}%"))
    if village:
        query = query.filter(Property.village.ilike(f"%{village}%"))
    if block:
        query = query.filter(Property.block.ilike(f"%{block}%"))
    if district:
        query = query.filter(Property.district.ilike(f"%{district}%"))
    if pincode:
        query = query.filter(Property.pincode == pincode)
    if status:
        try:
            status_enum = PropertyStatus(status.upper())
            query = query.filter(Property.status == status_enum)
        except ValueError:
            pass  # Invalid status — skip filter

    total = query.count()
    properties = (
        query
        .order_by(Property.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return properties, total


def get_map_data(
    db: Session,
    min_lat: float | None = None,
    min_lng: float | None = None,
    max_lat: float | None = None,
    max_lng: float | None = None,
    limit: int = 1000,
) -> dict:
    """
    Return GeoJSON FeatureCollection for map rendering.
    Supports bounding-box filtering.
    """
    query = db.query(Property)

    # Bounding box filter
    if all(v is not None for v in [min_lat, min_lng, max_lat, max_lng]):
        query = query.filter(
            Property.latitude >= min_lat,
            Property.latitude <= max_lat,
            Property.longitude >= min_lng,
            Property.longitude <= max_lng,
        )

    properties = query.limit(limit).all()

    features = []
    for prop in properties:
        # Try to get geometry as GeoJSON from PostGIS
        geometry_json = None
        if prop.geometry is not None:
            try:
                result = db.execute(
                    func.ST_AsGeoJSON(prop.geometry)
                ).scalar()
                if result:
                    geometry_json = json.loads(result)
            except Exception:
                pass

        feature = build_feature(
            property_id=prop.property_id,
            geometry_geojson=geometry_json,
            latitude=float(prop.latitude) if prop.latitude else None,
            longitude=float(prop.longitude) if prop.longitude else None,
            properties={
                "property_id": prop.property_id,
                "village": prop.village,
                "block": prop.block,
                "district": prop.district,
                "pincode": prop.pincode,
                "confidence_score": float(prop.confidence_score) if prop.confidence_score else None,
                "status": prop.status.value if prop.status else None,
            },
        )
        features.append(feature)

    return build_feature_collection(features)


def get_stats(db: Session) -> dict:
    """Return dashboard metrics."""
    total = db.query(func.count(Property.id)).scalar() or 0
    verified = db.query(func.count(Property.id)).filter(
        Property.status == PropertyStatus.VERIFIED
    ).scalar() or 0
    warning = db.query(func.count(Property.id)).filter(
        Property.status == PropertyStatus.WARNING
    ).scalar() or 0
    conflict = db.query(func.count(Property.id)).filter(
        Property.status == PropertyStatus.CONFLICT
    ).scalar() or 0
    pending = db.query(func.count(Property.id)).filter(
        Property.status == PropertyStatus.PENDING
    ).scalar() or 0

    total_sources = db.query(func.count(SourceRecord.id)).scalar() or 0
    total_matches = db.query(func.count(PropertyMatch.id)).scalar() or 0

    # Source breakdown
    sources_breakdown = {}
    for source in DataSource:
        count = db.query(func.count(SourceRecord.id)).filter(
            SourceRecord.source == source
        ).scalar() or 0
        sources_breakdown[source.value] = count

    return {
        "total_properties": total,
        "verified_count": verified,
        "warning_count": warning,
        "conflict_count": conflict,
        "pending_count": pending,
        "total_source_records": total_sources,
        "total_matches": total_matches,
        "sources_breakdown": sources_breakdown,
    }


def haversine_distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great-circle distance between two points in meters."""
    import math
    R = 6371000.0  # Earth radius in meters
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c


def check_duplicates(
    db: Session,
    latitude: float,
    longitude: float,
    radius_meters: float = 15.0,
) -> list[dict]:
    """Find properties within radius_meters of target coordinate."""
    # Rough bounding box filter first (~0.001 deg approx 111m)
    deg_delta = (radius_meters * 2) / 111000.0
    candidates = (
        db.query(Property)
        .filter(
            Property.latitude.isnot(None),
            Property.longitude.isnot(None),
            Property.latitude >= latitude - deg_delta,
            Property.latitude <= latitude + deg_delta,
            Property.longitude >= longitude - deg_delta,
            Property.longitude <= longitude + deg_delta,
        )
        .all()
    )

    matches = []
    for prop in candidates:
        if prop.latitude and prop.longitude:
            dist = haversine_distance_meters(
                latitude, longitude, float(prop.latitude), float(prop.longitude)
            )
            if dist <= radius_meters:
                matches.append({
                    "property_id": prop.property_id,
                    "distance_meters": round(dist, 1),
                    "village": prop.village,
                    "district": prop.district,
                    "latitude": float(prop.latitude),
                    "longitude": float(prop.longitude),
                    "status": prop.status.value if prop.status else "PENDING",
                    "owner_name": prop.owner_name,
                })
    return sorted(matches, key=lambda x: x["distance_meters"])


def capture_property(
    db: Session,
    data: Any,
    worker_name: str | None = None,
) -> Property:
    """Capture a newly surveyed property from field worker."""
    from app.services.id_service import generate_property_id

    # Generate persistent unique BHU-ID / SmartLens ID
    property_id = generate_property_id(data.state or "Uttar Pradesh", data.district or "Prayagraj")

    photos_json = json.dumps(data.site_photos) if data.site_photos else None

    prop = Property(
        property_id=property_id,
        latitude=Decimal(str(round(data.latitude, 7))),
        longitude=Decimal(str(round(data.longitude, 7))),
        village=data.village or "Koraon",
        block=data.block or "Sector 4",
        district=data.district or "Prayagraj",
        state=data.state or "Uttar Pradesh",
        pincode=data.pincode or "212306",
        area_sq_m=Decimal(str(data.area_sq_m or 120.0)),
        confidence_score=Decimal("94.5"),
        status=PropertyStatus.PENDING,
        property_type=data.property_type or "Residential (Detached)",
        build_material=data.build_material or "Brick / Masonry",
        floors=data.floors or 1,
        roof_type=data.roof_type or "Gable - Asphalt Shingle",
        condition=data.condition or "Good",
        owner_name=data.owner_name or "Johnathan Doe",
        owner_phone=data.owner_phone or "+1 (555) 019-2834",
        owner_email=data.owner_email or "j.doe@example.com",
        field_worker=worker_name or data.field_worker or "Alex",
        verification_step="UNDER_REVIEW",
        site_photos=photos_json,
    )
    db.add(prop)
    db.commit()
    db.refresh(prop)
    return prop


def update_property_verification(
    db: Session,
    property_id: str,
    action: str,
    reason: str | None = None,
    notes: str | None = None,
) -> Property | None:
    """Verify or flag an issue for a property record."""
    prop = get_property_by_id(db, property_id)
    if not prop:
        return None

    if action.upper() == "VERIFY":
        prop.status = PropertyStatus.VERIFIED
        prop.verification_step = "VERIFIED"
        prop.confidence_score = Decimal("99.0")
    elif action.upper() == "FLAG":
        prop.status = PropertyStatus.WARNING
        prop.verification_step = "CORRECTION"
    db.commit()
    db.refresh(prop)
    return prop

