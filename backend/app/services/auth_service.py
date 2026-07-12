from sqlalchemy.orm import Session

from app.models.user import User, UserRole
from app.schemas.auth import RegisterRequest
from app.core.security import hash_password


def register_user(db: Session, request: RegisterRequest):

    existing_user = db.query(User).filter(
        User.email == request.email
    ).first()

    if existing_user:
        return None

    user = User(
        full_name=request.full_name,
        email=request.email,
        password=hash_password(request.password),
        role=UserRole.EMPLOYEE,
        is_active=True
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user