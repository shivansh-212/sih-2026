"""
Dataset ingestion endpoints — ADMIN only.
"""

from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_admin
from app.models.user import User
from app.schemas.source import DatasetUploadResponse, DatasetProcessResponse
from app.services import dataset_service, audit_service

router = APIRouter(prefix="/admin/datasets", tags=["Datasets (Admin)"])


@router.post(
    "/upload",
    response_model=DatasetUploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a dataset (Admin)",
)
async def upload_dataset(
    current_admin: Annotated[User, Depends(get_current_admin)],
    db: Annotated[Session, Depends(get_db)],
    file: UploadFile = File(...),
    source: str = Form(..., description="Data source: GOOGLE, SVAMITVA, or E_NAKSHA"),
):
    """
    Upload a CSV, JSON, or GeoJSON dataset file.
    The file is stored and metadata is tracked for later processing.
    """
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"success": False, "error": {"code": "NO_FILE", "message": "No file provided"}},
        )

    content = await file.read()

    try:
        result = dataset_service.upload_dataset(
            filename=file.filename,
            content=content,
            source=source,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"success": False, "error": {"code": "INVALID_DATASET", "message": str(e)}},
        )

    # Audit log
    audit_service.log_action(
        db=db,
        user_id=current_admin.id,
        action="DATASET_UPLOAD",
        resource_type="dataset",
        resource_id=result["dataset_id"],
        details={"filename": file.filename, "source": source, "records": result["record_count"]},
    )

    return DatasetUploadResponse(**result)


@router.post(
    "/{dataset_id}/process",
    response_model=DatasetProcessResponse,
    summary="Process an uploaded dataset (Admin)",
)
def process_dataset(
    dataset_id: str,
    current_admin: Annotated[User, Depends(get_current_admin)],
    db: Annotated[Session, Depends(get_db)],
):
    """
    Process an uploaded dataset:
    - Normalize records using source-specific adapters
    - Create/update source records
    - Create/update unified properties with BHU-IDs
    """
    try:
        result = dataset_service.process_dataset(db, dataset_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"success": False, "error": {"code": "PROCESS_ERROR", "message": str(e)}},
        )

    # Audit log
    audit_service.log_action(
        db=db,
        user_id=current_admin.id,
        action="DATASET_PROCESS",
        resource_type="dataset",
        resource_id=dataset_id,
        details=result,
    )

    return DatasetProcessResponse(**result)


@router.get(
    "",
    summary="List uploaded datasets (Admin)",
)
def list_datasets(
    current_admin: Annotated[User, Depends(get_current_admin)],
):
    """List all uploaded datasets and their processing status."""
    datasets = dataset_service.list_datasets()
    return {
        "success": True,
        "data": datasets,
    }
