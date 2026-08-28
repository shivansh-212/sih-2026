"""
Admin-only endpoints — user management, audit logs.
"""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_admin
from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserRoleUpdate, UserStatusUpdate, UserListItem
from app.schemas.auth import UserResponse
from app.services import auth_service, audit_service

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get(
    "/users",
    summary="List all users (Admin)",
)
def list_users(
    current_admin: Annotated[User, Depends(get_current_admin)],
    db: Annotated[Session, Depends(get_db)],
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    """List all registered users."""
    import math
    from sqlalchemy import func

    total = db.query(func.count(User.id)).scalar() or 0
    users = (
        db.query(User)
        .order_by(User.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    total_pages = math.ceil(total / page_size) if page_size > 0 else 0

    return {
        "success": True,
        "data": [UserListItem.model_validate(u) for u in users],
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total_items": total,
            "total_pages": total_pages,
        },
    }


@router.post(
    "/users",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a user (Admin)",
)
def create_user(
    request: UserCreate,
    current_admin: Annotated[User, Depends(get_current_admin)],
    db: Annotated[Session, Depends(get_db)],
):
    """Create a new user with a specified role."""
    try:
        role = UserRole(request.role.upper())
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"success": False, "error": {"code": "INVALID_ROLE", "message": f"Invalid role: {request.role}"}},
        )

    try:
        user = auth_service.register_user(
            db=db,
            email=request.email,
            password=request.password,
            full_name=request.full_name,
            role=role,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"success": False, "error": {"code": "EMAIL_EXISTS", "message": str(e)}},
        )

    # Audit log
    audit_service.log_action(
        db=db,
        user_id=current_admin.id,
        action="USER_CREATE",
        resource_type="user",
        resource_id=str(user.id),
        details={"email": user.email, "role": user.role.value},
    )

    return user


@router.patch(
    "/users/{user_id}/role",
    response_model=UserResponse,
    summary="Change user role (Admin)",
)
def change_user_role(
    user_id: UUID,
    request: UserRoleUpdate,
    current_admin: Annotated[User, Depends(get_current_admin)],
    db: Annotated[Session, Depends(get_db)],
):
    """Change a user's role (USER or ADMIN)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"success": False, "error": {"code": "NOT_FOUND", "message": "User not found"}},
        )

    try:
        new_role = UserRole(request.role.upper())
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"success": False, "error": {"code": "INVALID_ROLE", "message": f"Invalid role: {request.role}"}},
        )

    old_role = user.role.value
    user.role = new_role
    db.commit()
    db.refresh(user)

    # Audit log
    audit_service.log_action(
        db=db,
        user_id=current_admin.id,
        action="USER_ROLE_CHANGE",
        resource_type="user",
        resource_id=str(user.id),
        details={"old_role": old_role, "new_role": new_role.value},
    )

    return user


@router.patch(
    "/users/{user_id}/status",
    response_model=UserResponse,
    summary="Enable or disable user (Admin)",
)
def change_user_status(
    user_id: UUID,
    request: UserStatusUpdate,
    current_admin: Annotated[User, Depends(get_current_admin)],
    db: Annotated[Session, Depends(get_db)],
):
    """Enable or disable a user account."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"success": False, "error": {"code": "NOT_FOUND", "message": "User not found"}},
        )

    user.is_active = request.is_active
    db.commit()
    db.refresh(user)

    # Audit log
    audit_service.log_action(
        db=db,
        user_id=current_admin.id,
        action="USER_DISABLE" if not request.is_active else "USER_ENABLE",
        resource_type="user",
        resource_id=str(user.id),
        details={"is_active": request.is_active},
    )

    return user


@router.get(
    "/audit-logs",
    summary="View audit logs (Admin)",
)
def view_audit_logs(
    current_admin: Annotated[User, Depends(get_current_admin)],
    db: Annotated[Session, Depends(get_db)],
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    action: str | None = Query(None),
):
    """View administrative audit logs with optional action filter."""
    import math

    logs, total = audit_service.get_audit_logs(db, page, page_size, action)
    total_pages = math.ceil(total / page_size) if page_size > 0 else 0

    return {
        "success": True,
        "data": [
            {
                "id": str(log.id),
                "user_id": str(log.user_id),
                "action": log.action,
                "resource_type": log.resource_type,
                "resource_id": log.resource_id,
                "details": log.details,
                "created_at": log.created_at.isoformat() if log.created_at else None,
            }
            for log in logs
        ],
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total_items": total,
            "total_pages": total_pages,
        },
    }
