"""
AI matching schemas.
"""

from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from decimal import Decimal


class MatchResponse(BaseModel):
    """A single match result between two source records."""
    id: UUID
    property_id: UUID
    source_record_a: UUID
    source_record_b: UUID
    confidence_score: Decimal
    match_status: str
    matching_features: dict | None = None
    model_version: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class MatchTriggerResponse(BaseModel):
    """Response after triggering matching pipeline."""
    success: bool = True
    pairs_evaluated: int
    matched: int
    possible: int
    rejected: int
    properties_created: int
    properties_updated: int
    message: str = "Matching completed"
