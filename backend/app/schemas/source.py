"""
Source record and dataset schemas.
"""

from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from decimal import Decimal
from typing import Any


class SourceRecordResponse(BaseModel):
    """A single source record linked to a property."""
    id: UUID
    source: str
    external_record_id: str | None = None
    village: str | None = None
    block: str | None = None
    district: str | None = None
    state: str | None = None
    pincode: str | None = None
    latitude: Decimal | None = None
    longitude: Decimal | None = None
    raw_data: dict | None = None
    normalized_data: dict | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class DatasetUploadResponse(BaseModel):
    """Response after uploading a dataset file."""
    success: bool = True
    dataset_id: str
    filename: str
    source: str
    record_count: int
    message: str = "Dataset uploaded successfully"


class DatasetInfo(BaseModel):
    """Info about an uploaded dataset."""
    dataset_id: str
    filename: str
    source: str
    record_count: int
    status: str
    uploaded_at: datetime


class DatasetProcessResponse(BaseModel):
    """Response after processing a dataset."""
    success: bool = True
    dataset_id: str
    records_processed: int
    records_normalized: int
    records_failed: int
    properties_created: int
    properties_updated: int
    matches_found: int
    message: str = "Dataset processed successfully"
