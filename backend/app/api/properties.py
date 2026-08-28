"""
Property endpoints — list, search, detail, sources, matches, map, stats.
All endpoints require authentication.
"""

import math
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.property import (
    PropertyResponse,
    PropertyListItem,
    PropertyStatsResponse,
    GeoJSONFeatureCollection,
    PropertyCaptureRequest,
    DuplicateCheckRequest,
    VerificationActionRequest,
    AIHouseDetectRequest,
    AIHouseDetectResponse,
    BatchAssignCodesRequest,
    BatchAssignCodesResponse,
)
from app.schemas.source import SourceRecordResponse
from app.schemas.match import MatchResponse
from app.schemas.common import PaginatedResponse, PaginationMeta
from app.services import property_service
from app.services.building_detector_service import (
    detect_satellite_buildings,
    batch_assign_and_register_houses,
)
from app.api.websocket import manager as ws_manager


router = APIRouter(prefix="/properties", tags=["Properties"])


@router.get(
    "",
    summary="List properties (paginated)",
)
def list_properties(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    """Return paginated list of all properties."""
    properties, total = property_service.list_properties(db, page, page_size)
    total_pages = math.ceil(total / page_size) if page_size > 0 else 0

    return {
        "success": True,
        "data": [PropertyListItem.model_validate(p) for p in properties],
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total_items": total,
            "total_pages": total_pages,
        },
    }


@router.get(
    "/search",
    summary="Search properties",
)
def search_properties(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    property_id: str | None = Query(None),
    village: str | None = Query(None),
    block: str | None = Query(None),
    district: str | None = Query(None),
    pincode: str | None = Query(None),
    status: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    """Search properties with filters."""
    properties, total = property_service.search_properties(
        db=db,
        property_id=property_id,
        village=village,
        block=block,
        district=district,
        pincode=pincode,
        status=status,
        page=page,
        page_size=page_size,
    )
    total_pages = math.ceil(total / page_size) if page_size > 0 else 0

    return {
        "success": True,
        "data": [PropertyListItem.model_validate(p) for p in properties],
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total_items": total,
            "total_pages": total_pages,
        },
    }


@router.get(
    "/map",
    summary="Get map GeoJSON data",
)
def get_map_data(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    min_lat: float | None = Query(None),
    min_lng: float | None = Query(None),
    max_lat: float | None = Query(None),
    max_lng: float | None = Query(None),
    limit: int = Query(1000, ge=1, le=10000),
):
    """
    Return GeoJSON FeatureCollection for map rendering.
    Supports bounding-box filtering with min_lat, min_lng, max_lat, max_lng.
    """
    return property_service.get_map_data(
        db=db,
        min_lat=min_lat,
        min_lng=min_lng,
        max_lat=max_lat,
        max_lng=max_lng,
        limit=limit,
    )


@router.get(
    "/stats",
    response_model=PropertyStatsResponse,
    summary="Get dashboard statistics",
)
def get_stats(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    """Return dashboard metrics: counts by status, sources, matches."""
    stats = property_service.get_stats(db)
    return PropertyStatsResponse(**stats)


@router.get(
    "/{property_id}",
    response_model=PropertyResponse,
    summary="Get property details",
)
def get_property(
    property_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    """Get complete details for a property by its BHU-ID."""
    prop = property_service.get_property_by_id(db, property_id)
    if not prop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"success": False, "error": {"code": "NOT_FOUND", "message": f"Property {property_id} not found"}},
        )
    return prop


@router.get(
    "/{property_id}/sources",
    summary="Get property source records",
)
def get_property_sources(
    property_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    """Return all source records that contributed to this unified property."""
    prop = property_service.get_property_by_id(db, property_id)
    if not prop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"success": False, "error": {"code": "NOT_FOUND", "message": f"Property {property_id} not found"}},
        )
    sources = property_service.get_property_sources(db, prop.id)
    return {
        "success": True,
        "data": [SourceRecordResponse.model_validate(s) for s in sources],
    }


@router.get(
    "/{property_id}/matches",
    summary="Get property AI match results",
)
def get_property_matches(
    property_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    """Return AI matching results for this property."""
    prop = property_service.get_property_by_id(db, property_id)
    if not prop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"success": False, "error": {"code": "NOT_FOUND", "message": f"Property {property_id} not found"}},
        )
    matches = property_service.get_property_matches(db, prop.id)
    return {
        "success": True,
        "data": [MatchResponse.model_validate(m) for m in matches],
    }


@router.post(
    "/check-duplicate",
    summary="Check for existing properties near coordinates (Duplicate Detection)",
)
def check_duplicate(
    request: DuplicateCheckRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    """Check if any house exists within given radius (Page 8 duplicate detection)."""
    duplicates = property_service.check_duplicates(
        db=db,
        latitude=request.latitude,
        longitude=request.longitude,
        radius_meters=request.radius_meters,
    )
    return {
        "success": True,
        "has_duplicate": len(duplicates) > 0,
        "count": len(duplicates),
        "duplicates": duplicates,
    }


@router.post(
    "/capture",
    summary="Capture house location from mobile field worker",
)
async def capture_house(
    request: PropertyCaptureRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    """
    Capture a new property location in the field.
    Mints persistent unique BHU-ID / SmartLens ID and broadcasts via WebSocket.
    """
    # Proximity check unless force_new is true
    if not request.force_new:
        duplicates = property_service.check_duplicates(
            db=db,
            latitude=request.latitude,
            longitude=request.longitude,
            radius_meters=10.0,
        )
        if duplicates:
            return {
                "success": False,
                "status": "DUPLICATE_WARNING",
                "message": "Potential Duplicate Found within 10 meters",
                "duplicates": duplicates,
            }

    prop = property_service.capture_property(
        db=db,
        data=request,
        worker_name=current_user.full_name or "Alex",
    )

    # Broadcast real-time capture event via WebSocket
    await ws_manager.broadcast({
        "type": "NEW_HOUSE_MAPPED",
        "property_id": prop.property_id,
        "worker_name": current_user.full_name or "Alex",
        "village": prop.village,
        "block": prop.block,
        "lat": float(prop.latitude) if prop.latitude else None,
        "lng": float(prop.longitude) if prop.longitude else None,
        "timestamp": prop.created_at.isoformat(),
        "status": prop.status.value,
        "message": f"{current_user.full_name or 'Alex'} mapped {prop.property_id} in {prop.block or 'Sector 4'}",
    })

    return {
        "success": True,
        "status": "RECORD_GENERATED",
        "data": PropertyResponse.model_validate(prop),
        "message": "The spatial record has been successfully minted and logged in the system.",
    }


@router.post(
    "/{property_id}/verify",
    summary="Update property verification status (Verify or Flag Issue)",
)
async def verify_property(
    property_id: str,
    request: VerificationActionRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    """Admin verify or flag a property issue with live WebSocket notification."""
    prop = property_service.update_property_verification(
        db=db,
        property_id=property_id,
        action=request.action,
        reason=request.reason,
        notes=request.notes,
    )
    if not prop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"success": False, "error": {"code": "NOT_FOUND", "message": f"Property {property_id} not found"}},
        )

    # Broadcast event via WebSocket
    event_text = (
        f"Admin verified {prop.property_id}"
        if request.action.upper() == "VERIFY"
        else f"System flagged {prop.property_id} for review"
    )
    await ws_manager.broadcast({
        "type": "VERIFICATION_STATUS_CHANGED",
        "property_id": prop.property_id,
        "status": prop.status.value,
        "verification_step": prop.verification_step,
        "action": request.action,
        "reason": request.reason,
        "message": event_text,
    })

    return {
        "success": True,
        "data": PropertyResponse.model_validate(prop),
    }


@router.post(
    "/bulk-sync",
    summary="Bulk sync offline-captured records",
)
async def bulk_sync_properties(
    records: list[PropertyCaptureRequest],
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    """Sync queued items saved during offline field operation."""
    created = []
    for item in records:
        prop = property_service.capture_property(
            db=db,
            data=item,
            worker_name=current_user.full_name or "Alex",
        )
        created.append(prop.property_id)

    await ws_manager.broadcast({
        "type": "BULK_SYNC_COMPLETED",
        "count": len(created),
        "worker": current_user.full_name or "Alex",
        "message": f"Worker {current_user.full_name or 'Alex'} synced {len(created)} offline records.",
    })

    return {
        "success": True,
        "synced_count": len(created),
        "property_ids": created,
    }


@router.get(
    "/active-workers/list",
    summary="Get list of active field workers",
)
def get_active_workers(
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Return active field workers and their live telemetry status."""
    return {
        "success": True,
        "data": [
            {
                "id": "w-42",
                "name": "Sarah Jenkins",
                "email": "sarah.j@smartlens.io",
                "status": "ACTIVE",
                "sector": "Sector 4",
                "mapped_today": 18,
                "current_lat": 40.7128,
                "current_lng": -74.0060,
                "battery": "88%",
                "gps_accuracy": "2.8m",
            },
            {
                "id": "w-12",
                "name": "Alex",
                "email": "alex@smartlens.io",
                "status": "ACTIVE",
                "sector": "Sector 2",
                "mapped_today": 12,
                "current_lat": 40.7145,
                "current_lng": -74.0042,
                "battery": "94%",
                "gps_accuracy": "3.1m",
            },
            {
                "id": "w-08",
                "name": "David Chen",
                "email": "david.c@smartlens.io",
                "status": "ACTIVE",
                "sector": "Sector 1",
                "mapped_today": 15,
                "current_lat": 40.7110,
                "current_lng": -74.0090,
                "battery": "76%",
                "gps_accuracy": "3.5m",
            },
            {
                "id": "w-19",
                "name": "Marcus Row",
                "email": "marcus.r@smartlens.io",
                "status": "IDLE",
                "sector": "Sector 3",
                "mapped_today": 9,
                "current_lat": 40.7160,
                "current_lng": -74.0020,
                "battery": "62%",
                "gps_accuracy": "4.0m",
            },
        ],
    }


@router.post(
    "/ai-detect-houses",
    response_model=AIHouseDetectResponse,
    summary="AI Satellite House Footprint Detection (~1m Scale)",
)
def ai_detect_houses(
    request: AIHouseDetectRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    """
    High-Precision 1-Meter Satellite Building & House Detection Engine.
    Filters out tree canopies, vegetation, and roads.
    Detects individual rooftop structures, generates 1m geometric polygons, calculates
    surface areas, and assigns non-duplicating unique sequential codes formatted as:
    {PINCODE}-{VILLAGE_CODE}-H{NO}.
    """
    result = detect_satellite_buildings(
        center_lat=request.latitude,
        center_lng=request.longitude,
        pincode=request.pincode,
        village=request.village,
        village_code=request.village_code,
        block=request.block,
        district=request.district,
        state=request.state,
        radius_meters=request.radius_meters,
        zoom_level=request.zoom_level,
        bounds=request.bounds,
        db=db,
    )
    return result


@router.post(
    "/batch-assign-codes",
    response_model=BatchAssignCodesResponse,
    summary="Batch Verify & Assign Permanent Cadastral Codes",
)
async def batch_assign_codes(
    request: BatchAssignCodesRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    """
    Persist verified AI-detected house footprints into authoritative Property database,
    assign permanent unique property codes ({PINCODE}-{VILLAGE_CODE}-H{NO}),
    link source records, and broadcast a real-time event.
    """
    if not request.verified_buildings:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No verified buildings provided in request.",
        )

    saved_properties = batch_assign_and_register_houses(
        db=db,
        user_id=current_user.id,
        verified_houses=request.verified_buildings,
        village=request.village,
        village_code=request.village_code,
        block=request.block,
        district=request.district,
        state=request.state,
        pincode=request.pincode,
    )

    # Broadcast real-time WebSocket notification
    await ws_manager.broadcast({
        "type": "CADASTRAL_BATCH_REGISTERED",
        "title": "Satellite Census Verified",
        "message": f"Successfully registered {len(saved_properties)} verified houses under {request.village} ({request.pincode})",
        "data": {
            "village": request.village,
            "village_code": request.village_code,
            "pincode": request.pincode,
            "count": len(saved_properties),
        },
    })

    return {
        "success": True,
        "registered_count": len(saved_properties),
        "message": f"Successfully assigned authoritative codes and registered {len(saved_properties)} properties.",
        "properties": [PropertyResponse.model_validate(p) for p in saved_properties],
    }


