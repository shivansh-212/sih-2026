"""
User endpoints (self-service).
"""

from typing import Annotated

from fastapi import APIRouter, Depends
from app.core.security import get_current_user
from app.schemas.auth import UserResponse
from app.models.user import User

router = APIRouter(prefix="/users", tags=["Users"])


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user",
)
def get_current_user_profile(
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Return the current authenticated user's details."""
    return current_user
