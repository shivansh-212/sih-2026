"""
Audit logging service.
Never logs passwords, JWT secrets, or sensitive credentials.
"""

from sqlalchemy.orm import Session
from uuid import UUID

from app.models.audit import AuditLog


def log_action(
    db: Session,
    user_id: UUID,
    action: str,
    resource_type: str,
    resource_id: str | None = None,
    details: dict | None = None,
) -> AuditLog:
    """
    Create an audit log entry.
    
    Actions: LOGIN, DATASET_UPLOAD, DATASET_PROCESS, PROPERTY_CREATE,
    PROPERTY_UPDATE, PROPERTY_STATUS_CHANGE, USER_CREATE, USER_ROLE_CHANGE,
    USER_DISABLE
    """
    entry = AuditLog(
        user_id=user_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        details=details or {},
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def get_audit_logs(
    db: Session,
    page: int = 1,
    page_size: int = 50,
    action: str | None = None,
) -> tuple[list[AuditLog], int]:
    """
    Retrieve paginated audit logs, optionally filtered by action.
    Returns (logs, total_count).
    """
    query = db.query(AuditLog)

    if action:
        query = query.filter(AuditLog.action == action)

    total = query.count()

    logs = (
        query
        .order_by(AuditLog.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return logs, total
