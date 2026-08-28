"""
AI matching endpoints — ADMIN only.
"""

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_admin
from app.models.user import User
from app.schemas.match import MatchTriggerResponse
from app.services import matching_service, audit_service

router = APIRouter(prefix="/admin/matching", tags=["Matching (Admin)"])


@router.post(
    "/trigger",
    response_model=MatchTriggerResponse,
    summary="Trigger AI matching pipeline (Admin)",
)
def trigger_matching(
    current_admin: Annotated[User, Depends(get_current_admin)],
    db: Annotated[Session, Depends(get_db)],
):
    """
    Trigger the AI-assisted matching pipeline.
    Compares source records from different datasets and creates
    match results with confidence scores.
    """
    result = matching_service.run_matching(db)

    # Audit log
    audit_service.log_action(
        db=db,
        user_id=current_admin.id,
        action="MATCHING_TRIGGER",
        resource_type="matching",
        details=result,
    )

    return MatchTriggerResponse(**result)
