"""
Authentication business logic.
"""

from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password, create_access_token
from app.models.user import User, UserRole


def get_user_by_email(db: Session, email: str) -> User | None:
    """Look up a user by email address."""
    return db.query(User).filter(User.email == email).first()


def register_user(
    db: Session,
    email: str,
    password: str,
    full_name: str = "",
    role: UserRole = UserRole.USER,
) -> User:
    """
    Register a new user account.
    Raises ValueError if the email is already taken.
    """
    existing = get_user_by_email(db, email)
    if existing:
        raise ValueError("Email already registered")

    user = User(
        email=email,
        password_hash=hash_password(password),
        full_name=full_name,
        role=role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, email: str, password: str) -> str | None:
    """
    Authenticate a user and return a JWT access token.
    Returns None if credentials are invalid.
    """
    user = get_user_by_email(db, email)
    if user is None:
        return None

    if not verify_password(password, user.password_hash):
        return None

    if not user.is_active:
        return None

    # Create JWT with email as subject
    token = create_access_token(data={"sub": user.email})
    return token
