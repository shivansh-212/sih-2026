"""
User management schemas (admin operations).
"""

from pydantic import BaseModel, EmailStr
from uuid import UUID
from datetime import datetime


class UserCreate(BaseModel):
    """Admin: create a new user."""
    email: EmailStr
    password: str
    full_name: str = ""
    role: str = "USER"


class UserRoleUpdate(BaseModel):
    """Admin: change a user's role."""
    role: str


class UserStatusUpdate(BaseModel):
    """Admin: enable or disable a user."""
    is_active: bool


class UserListItem(BaseModel):
    """User in a list response."""
    id: UUID
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
