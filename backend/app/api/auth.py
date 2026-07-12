from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    TokenResponse
)
from app.models.user import User
from app.services.auth_service import register_user
from app.core.security import (
    verify_password,
    create_access_token
)
from app.api.dependencies import get_current_user

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


@router.post("/register")
def register(
    request: RegisterRequest,
    db: Session = Depends(get_db)
):

    user = register_user(db, request)

    if user is None:
        raise HTTPException(
            status_code=400,
            detail="Email already exists"
        )

    return {
        "message": "User Registered Successfully"
    }


@router.post(
    "/login",
    response_model=TokenResponse
)
def login(
    request: LoginRequest,
    db: Session = Depends(get_db)
):

    user = db.query(User).filter(
        User.email == request.email
    ).first()

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid Email or Password"
        )

    if not verify_password(
        request.password,
        user.password
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid Email or Password"
        )

    token = create_access_token(
        {
            "sub": str(user.id),
            "role": user.role.value
        }
    )

    return TokenResponse(
        access_token=token,
        token_type="bearer"
    )

@router.get("/me")
def current_user(
    user=Depends(get_current_user)
):

    return {
        "id": str(user.id),
        "name": user.full_name,
        "email": user.email,
        "role": user.role.value
    }