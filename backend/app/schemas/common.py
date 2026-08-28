"""
Common response schemas used across the API.
"""

from pydantic import BaseModel
from typing import Any


class ErrorDetail(BaseModel):
    """Structured error detail."""
    code: str
    message: str


class ErrorResponse(BaseModel):
    """Standard error response format."""
    success: bool = False
    error: ErrorDetail


class SuccessResponse(BaseModel):
    """Generic success response."""
    success: bool = True
    message: str = "Operation completed successfully"


class PaginationMeta(BaseModel):
    """Pagination metadata."""
    page: int
    page_size: int
    total_items: int
    total_pages: int


class PaginatedResponse(BaseModel):
    """Base paginated response."""
    success: bool = True
    data: list[Any] = []
    pagination: PaginationMeta
