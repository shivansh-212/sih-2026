"""
Local Government Directory (LGD) and Cadastral Formula API Endpoints.
"""

from typing import Annotated
from fastapi import APIRouter, Depends, Query
from app.core.security import get_current_user
from app.models.user import User
from app.services import lgd_service

router = APIRouter(prefix="/lgd", tags=["Local Government Directory (LGD)"])


@router.get("/villages/search", summary="Search LGD Villages and Cadastral Codes")
def search_villages(
    current_user: Annotated[User, Depends(get_current_user)],
    query: str | None = Query(None, description="Village name, pincode, LGD code, or district"),
    limit: int = Query(15, ge=1, le=100),
):
    """Search authoritative Indian Local Government Directory (LGD) village records."""
    results = lgd_service.search_lgd_villages(query or "", limit=limit)
    return {
        "success": True,
        "count": len(results),
        "data": results,
    }


@router.get("/reverse-geocode", summary="Reverse Geocode Coordinates to LGD Village & Formula")
def reverse_geocode(
    current_user: Annotated[User, Depends(get_current_user)],
    latitude: float = Query(..., ge=-90.0, le=90.0),
    longitude: float = Query(..., ge=-180.0, le=180.0),
):
    """
    Find nearest official LGD village for any coordinates and
    dynamically generate the exact Cadastral formula and location code.
    """
    result = lgd_service.reverse_geocode_lgd(latitude, longitude)
    return {
        "success": True,
        "data": result,
    }
