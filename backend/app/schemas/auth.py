"""
Authentication request/response schemas.
"""

from pydantic import BaseModel, EmailStr
from uuid import UUID
from datetime import datetime


class RegisterRequest(BaseModel):
    """User registration request."""
    email: str
    password: str
    full_name: str = ""


class LoginRequest(BaseModel):
    """User login request."""
    email: str
    password: str



class TokenResponse(BaseModel):
    """JWT token response."""
    success: bool = True
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    """User profile response (never includes password_hash)."""
    id: UUID
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
