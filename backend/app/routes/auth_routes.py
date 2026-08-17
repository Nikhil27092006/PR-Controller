from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User
from app.schemas.user_schema import (
    UserCreate,
    UserLogin,
    UserResponse,
    TokenResponse
)
from app.services.auth_service import (
    auth_service,
    get_current_user
)

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


@router.post("/register", response_model=TokenResponse)
def register(
    user_in: UserCreate,
    db: Session = Depends(get_db)
):

    user = auth_service.register(db, user_in)

    token = auth_service.create_token_for_user(user)

    return TokenResponse(
        access_token=token,
        user=user
    )


@router.post("/login", response_model=TokenResponse)
def login(
    credentials: UserLogin,
    db: Session = Depends(get_db)
):

    user = auth_service.authenticate(db, credentials)

    token = auth_service.create_token_for_user(user)

    return TokenResponse(
        access_token=token,
        user=user
    )


@router.get("/me", response_model=UserResponse)
def get_me(
    current_user: User = Depends(get_current_user)
):

    return current_user