"""
Property request/response schemas.
"""

from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from decimal import Decimal
from typing import Any


class PropertyResponse(BaseModel):
    """Complete property details."""
    id: UUID
    property_id: str
    village: str | None = None
    block: str | None = None
    district: str | None = None
    state: str | None = None
    pincode: str | None = None
    latitude: Decimal | None = None
    longitude: Decimal | None = None
    area_sq_m: Decimal | None = None
    confidence_score: Decimal | None = None
    status: str
    property_type: str | None = None
    build_material: str | None = None
    floors: int | None = None
    roof_type: str | None = None
    condition: str | None = None
    owner_name: str | None = None
    owner_phone: str | None = None
    owner_email: str | None = None
    field_worker: str | None = None
    verification_step: str | None = None
    site_photos: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PropertyListItem(BaseModel):
    """Property in a list/search response (lighter than full details)."""
    id: UUID
    property_id: str
    village: str | None = None
    block: str | None = None
    district: str | None = None
    state: str | None = None
    pincode: str | None = None
    latitude: Decimal | None = None
    longitude: Decimal | None = None
    confidence_score: Decimal | None = None
    status: str
    property_type: str | None = None
    field_worker: str | None = None
    verification_step: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class PropertyCaptureRequest(BaseModel):
    """Request schema for field worker capturing a property."""
    latitude: float
    longitude: float
    accuracy_meters: float | None = 3.2
    property_type: str | None = "Residential (Detached)"
    build_material: str | None = "Brick / Masonry"
    floors: int | None = 1
    roof_type: str | None = "Gable - Asphalt Shingle"
    condition: str | None = "Good"
    area_sq_m: float | None = 120.0
    owner_name: str | None = None
    owner_phone: str | None = None
    owner_email: str | None = None
    field_worker: str | None = "Alex"
    village: str | None = "Koraon"
    block: str | None = "Sector 4"
    district: str | None = "Prayagraj"
    state: str | None = "Uttar Pradesh"
    pincode: str | None = "212306"
    site_photos: list[str] | None = None
    force_new: bool | None = False


class DuplicateCheckRequest(BaseModel):
    """Check if any house exists near given coordinates."""
    latitude: float
    longitude: float
    radius_meters: float = 15.0


class VerificationActionRequest(BaseModel):
    """Admin verify or flag action."""
    action: str  # "VERIFY" or "FLAG"
    reason: str | None = None
    notes: str | None = None


class PropertySearchParams(BaseModel):
    """Query parameters for property search."""
    property_id: str | None = None
    village: str | None = None
    block: str | None = None
    district: str | None = None
    pincode: str | None = None
    status: str | None = None
    page: int = 1
    page_size: int = 20


class PropertyStatsResponse(BaseModel):
    """Dashboard metrics."""
    success: bool = True
    total_properties: int
    verified_count: int
    warning_count: int
    conflict_count: int
    pending_count: int
    total_source_records: int
    total_matches: int
    sources_breakdown: dict[str, int] = {}


class GeoJSONFeature(BaseModel):
    """A single GeoJSON Feature."""
    type: str = "Feature"
    geometry: dict | None = None
    properties: dict


class GeoJSONFeatureCollection(BaseModel):
    """GeoJSON FeatureCollection for map rendering."""
    type: str = "FeatureCollection"
    features: list[GeoJSONFeature] = []


class AIHouseDetectRequest(BaseModel):
    """Parameters for AI satellite house & building footprint detection."""
    latitude: float = 25.4358
    longitude: float = 81.8463
    pincode: str = "212306"
    village: str = "Lakshmipur"
    village_code: str | None = None
    block: str = "Koraon"
    district: str = "Prayagraj"
    state: str = "Uttar Pradesh"
    radius_meters: float = 80.0
    zoom_level: int = 19
    bounds: dict[str, float] | None = None


class DetectedBuildingItem(BaseModel):
    """A single detected building structure."""
    temp_id: str
    house_number: str
    cadastral_code: str
    pincode: str
    village: str | None = None
    village_code: str
    block: str | None = None
    district: str | None = None
    state: str | None = None
    latitude: float
    longitude: float
    area_sq_m: float
    confidence_score: float
    roof_type: str
    floors: int
    build_material: str
    polygon: list[list[float]]
    verified: bool = False
    estimated_accuracy: str = "High (2m)"


class AIHouseDetectResponse(BaseModel):
    """Response from AI satellite house detection engine."""
    success: bool = True
    total_detected: int
    target_resolution: str
    center_coordinates: dict[str, float]
    pincode: str
    village: str | None = None
    village_code: str
    average_confidence: float
    buildings: list[DetectedBuildingItem]


class BatchAssignCodesRequest(BaseModel):
    """Batch verification and registration payload."""
    village: str | None = "Lakshmipur"
    village_code: str | None = "LAK042"
    block: str | None = "Koraon"
    district: str | None = "Prayagraj"
    state: str | None = "Uttar Pradesh"
    pincode: str | None = "212306"
    verified_buildings: list[dict[str, Any]]


class BatchAssignCodesResponse(BaseModel):
    """Result of batch code assignment and registration."""
    success: bool = True
    registered_count: int
    message: str
    properties: list[PropertyResponse] = []

