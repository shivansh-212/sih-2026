"""
Authentication endpoints.
"""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse, UserResponse
from app.services import auth_service, audit_service
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
)
def register(
    request: RegisterRequest,
    db: Annotated[Session, Depends(get_db)],
):
    """
    Register a new user account.
    Default role is USER. Only admins can create ADMIN accounts via admin endpoints.
    """
    try:
        user = auth_service.register_user(
            db=db,
            email=request.email,
            password=request.password,
            full_name=request.full_name,
        )
        return user
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"success": False, "error": {"code": "EMAIL_EXISTS", "message": str(e)}},
        )


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Login and get JWT token",
)
def login(
    request: LoginRequest,
    db: Annotated[Session, Depends(get_db)],
):
    """
    Authenticate with email and password.
    Returns a JWT access token on success.
    """
    token = auth_service.authenticate_user(
        db=db,
        email=request.email,
        password=request.password,
    )
    if token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"success": False, "error": {"code": "INVALID_CREDENTIALS", "message": "Incorrect email or password"}},
        )

    # Log login action
    user = auth_service.get_user_by_email(db, request.email)
    if user:
        audit_service.log_action(
            db=db,
            user_id=user.id,
            action="LOGIN",
            resource_type="user",
            resource_id=str(user.id),
        )

    return TokenResponse(access_token=token)


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user profile",
)
def get_me(
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Return the current authenticated user's profile."""
    return current_user
