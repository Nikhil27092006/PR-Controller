from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token
)
from app.schemas.user_schema import UserCreate, UserLogin

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


class AuthService:

    def register(self, db: Session, user_in: UserCreate) -> User:

        existing_email = (
            db.query(User)
            .filter(User.email == user_in.email)
            .first()
        )

        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is already registered"
            )

        existing_username = (
            db.query(User)
            .filter(User.username == user_in.username)
            .first()
        )

        if existing_username:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username is already taken"
            )

        user = User(
            username=user_in.username,
            email=user_in.email,
            password_hash=hash_password(user_in.password)
        )

        db.add(user)
        db.commit()
        db.refresh(user)

        return user

    def authenticate(
        self,
        db: Session,
        credentials: UserLogin
    ) -> User:

        user = (
            db.query(User)
            .filter(User.email == credentials.email)
            .first()
        )

        if not user or not verify_password(
            credentials.password,
            user.password_hash
        ):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )

        return user

    def create_token_for_user(self, user: User) -> str:

        return create_access_token(
            data={"sub": str(user.id)}
        )

    def get_user_by_id(
        self,
        db: Session,
        user_id: int
    ) -> User | None:

        return (
            db.query(User)
            .filter(User.id == user_id)
            .first()
        )


auth_service = AuthService()


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """
    FastAPI dependency that validates the bearer token and returns
    the current User. Use like:

        @router.get("/protected")
        def protected_route(user: User = Depends(get_current_user)):
            ...
    """

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"}
    )

    payload = decode_access_token(token)

    if payload is None:
        raise credentials_exception

    user_id = payload.get("sub")

    if user_id is None:
        raise credentials_exception

    user = auth_service.get_user_by_id(db, int(user_id))

    if user is None:
        raise credentials_exception

    return user
