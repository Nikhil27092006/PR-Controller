from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
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
from app.utils.logger import get_logger

logger = get_logger(__name__)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


class AuthService:

    def register(self, db: Session, user_in: UserCreate) -> User:

        try:
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

        except HTTPException:
            raise

        except IntegrityError:
            # Two simultaneous registrations with the same email/
            # username can both pass the checks above before either
            # commits — the unique constraint on the table is the
            # real guarantee, this just turns that DB-level failure
            # into a clean, expected response instead of a raw 500.
            db.rollback()
            logger.warning(
                "Duplicate registration race for email=%s username=%s",
                user_in.email, user_in.username
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="That email or username was just taken. Please try again."
            )

        except SQLAlchemyError:
            db.rollback()
            logger.error(
                "Database error during registration for email=%s",
                user_in.email, exc_info=True
            )
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="A database error occurred. Please try again."
            )

    def authenticate(
        self,
        db: Session,
        credentials: UserLogin
    ) -> User:

        try:
            user = (
                db.query(User)
                .filter(User.email == credentials.email)
                .first()
            )

        except SQLAlchemyError:
            logger.error(
                "Database error during login for email=%s",
                credentials.email, exc_info=True
            )
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="A database error occurred. Please try again."
            )

        if not user or not user.password_hash:
            # Either no account exists, or it's a GitHub-only account
            # with no password set. Same generic message either way
            # so we don't leak which emails exist / how they signed up.
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )

        if not verify_password(credentials.password, user.password_hash):
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

        try:
            return (
                db.query(User)
                .filter(User.id == user_id)
                .first()
            )

        except SQLAlchemyError:
            logger.error(
                "Database error fetching user_id=%s",
                user_id, exc_info=True
            )
            raise

    def find_or_create_github_user(
        self,
        db: Session,
        email: str,
        github_id: str,
        github_username: str | None = None,
        avatar_url: str | None = None,
    ) -> User:
        """
        Resolve a GitHub OAuth login to a local User row.

        Order of resolution:
          1. Existing user with the same github_id — repeat login, just
             refresh the profile fields and return.
          2. Existing user with the same email — link the GitHub
             identity onto the existing password-based account.
          3. No match — create a new User with a username derived from
             the GitHub login (falling back to the local part of the
             email), guaranteeing uniqueness by suffixing the id on
             collision.
        """

        try:
            user = (
                db.query(User)
                .filter(User.github_id == github_id)
                .first()
            )

            if user:
                # Keep the profile fields fresh in case the user
                # changed their handle/avatar on GitHub.
                user.github_username = github_username or user.github_username
                user.avatar_url = avatar_url or user.avatar_url
                if email and not user.email:
                    user.email = email
                db.commit()
                db.refresh(user)
                return user

            user = (
                db.query(User)
                .filter(User.email == email)
                .first()
            )

            if user:
                # Link the GitHub identity to an existing email/password
                # account so the user keeps a single local profile.
                user.github_id = github_id
                user.github_username = github_username
                user.avatar_url = avatar_url
                db.commit()
                db.refresh(user)
                return user

            base_username = (github_username or email.split("@", 1)[0] or "user").strip()
            base_username = base_username[:80]  # leave room for uniqueness suffix
            candidate = base_username
            suffix = 1
            while (
                db.query(User)
                .filter(User.username == candidate)
                .first()
                is not None
            ):
                suffix += 1
                candidate = f"{base_username}{suffix}"
                if suffix > 1000:
                    # Practically unreachable; bail out instead of
                    # looping forever.
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail="Could not allocate a unique username for GitHub user",
                    )

            user = User(
                username=candidate,
                email=email,
                password_hash=None,
                github_id=github_id,
                github_username=github_username,
                avatar_url=avatar_url,
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            return user

        except HTTPException:
            raise
        except IntegrityError:
            # Two callbacks racing the same github_id/email — let the
            # second one re-read and return the now-existing user.
            db.rollback()
            logger.warning(
                "Integrity conflict on GitHub user upsert github_id=%s email=%s",
                github_id, email, exc_info=True,
            )
            user = (
                db.query(User)
                .filter(User.github_id == github_id)
                .first()
            )
            if user is None:
                user = (
                    db.query(User)
                    .filter(User.email == email)
                    .first()
                )
            if user is None:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Could not resolve GitHub user after conflict",
                )
            return user
        except SQLAlchemyError:
            db.rollback()
            logger.error(
                "Database error during GitHub user upsert github_id=%s",
                github_id, exc_info=True,
            )
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="A database error occurred. Please try again.",
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

    try:
        user = auth_service.get_user_by_id(db, int(user_id))

    except SQLAlchemyError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="A database error occurred. Please try again."
        )

    if user is None:
        raise credentials_exception

    return user
