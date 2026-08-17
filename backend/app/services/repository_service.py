from fastapi import HTTPException, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.models.repository import Repository
from app.models.user import User
from app.services.github_service import GitHubService
from app.services.github_exceptions import (
    GitHubAuthError,
    GitHubRateLimitError,
    GitHubNotFoundError,
    GitHubNetworkError,
    GitHubServiceError
)
from app.services.sync_service import SyncService
from app.utils.logger import get_logger

logger = get_logger(__name__)


class RepositoryService:

    def __init__(self):

        self.github = GitHubService()
        self.sync_service = SyncService()

    def get_repositories(
        self,
        db: Session,
        user: User
    ):
        """
        Lists repositories the given user has added, read from the
        database (not a live GitHub call on every request).
        """

        try:
            return (
                db.query(Repository)
                .filter(Repository.user_id == user.id)
                .all()
            )

        except SQLAlchemyError:
            logger.error(
                "Database error listing repositories for user_id=%s",
                user.id, exc_info=True
            )
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Could not load your repositories right now. Please try again."
            )

    def add_repository(
        self,
        db: Session,
        user: User,
        owner: str,
        name: str
    ) -> Repository:

        try:
            existing = (
                db.query(Repository)
                .filter(Repository.user_id == user.id)
                .filter(Repository.owner == owner)
                .filter(Repository.name == name)
                .first()
            )
        except SQLAlchemyError:
            logger.error(
                "Database error checking for existing repo %s/%s "
                "(user_id=%s)", owner, name, user.id, exc_info=True
            )
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="A database error occurred. Please try again."
            )

        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"{owner}/{name} is already added"
            )

        # Each GitHub error type gets its own accurate response
        # instead of a blanket "not found" — a rate-limited or
        # unauthorized request is a very different problem for the
        # user than a repo that genuinely doesn't exist.
        #
        # Use the user's own OAuth token (if they have one) to
        # validate the repo — the server-wide token may not have
        # access to their private repos. Falls back to the
        # server-wide token when the user has no OAuth token
        # (password-only account).
        per_user_github = GitHubService(
            access_token=user.github_access_token
        )

        try:
            repo_data = per_user_github.fetch_repository(owner, name)

        except GitHubNotFoundError:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=(
                    f"Could not find {owner}/{name} on GitHub, or "
                    "it isn't accessible with the configured token"
                )
            )

        except GitHubAuthError as exc:
            logger.error("GitHub auth error adding %s/%s: %s", owner, name, exc)
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=(
                    "The server's GitHub token is invalid or lacks "
                    "access. Contact your administrator."
                )
            )

        except GitHubRateLimitError as exc:
            logger.warning("GitHub rate limit adding %s/%s: %s", owner, name, exc)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="GitHub API rate limit reached. Please try again shortly."
            )

        except GitHubNetworkError as exc:
            logger.error("GitHub network error adding %s/%s: %s", owner, name, exc)
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Could not reach GitHub right now. Please try again."
            )

        except GitHubServiceError as exc:
            logger.error("GitHub error adding %s/%s: %s", owner, name, exc)
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="GitHub returned an unexpected error. Please try again."
            )

        try:
            db_repo = Repository(
                user_id=user.id,
                github_repo_id=repo_data["id"],
                owner=owner,
                name=name,
                full_name=repo_data["full_name"],
                description=repo_data.get("description"),
                default_branch=repo_data.get("default_branch", "main")
            )

            db.add(db_repo)
            db.commit()
            db.refresh(db_repo)

        except SQLAlchemyError:
            db.rollback()
            logger.error(
                "Database error saving new repo %s/%s (user_id=%s)",
                owner, name, user.id, exc_info=True
            )
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Could not save the repository. Please try again."
            )

        # Sync immediately so the repo isn't empty until the next
        # scheduled background sync runs. Failures here are logged
        # but don't fail the add — the repo is already saved and
        # will pick up data on the next scheduled sync.
        try:
            self.sync_service.sync_repository(db, db_repo)

        except GitHubServiceError as exc:
            logger.warning(
                "Initial sync failed for %s (will retry on next "
                "scheduled sync): %s", db_repo.full_name, exc
            )

        except SQLAlchemyError:
            db.rollback()
            logger.error(
                "Database error during initial sync of %s",
                db_repo.full_name, exc_info=True
            )

        return db_repo

    def delete_repository(
        self,
        db: Session,
        user: User,
        repository_id: int
    ):

        try:
            db_repo = (
                db.query(Repository)
                .filter(Repository.id == repository_id)
                .filter(Repository.user_id == user.id)
                .first()
            )

            if not db_repo:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Repository not found"
                )

            full_name = db_repo.full_name

            db.delete(db_repo)
            db.commit()

            return {"message": f"{full_name} removed"}

        except HTTPException:
            raise

        except SQLAlchemyError:
            db.rollback()
            logger.error(
                "Database error deleting repository_id=%s "
                "(user_id=%s)", repository_id, user.id, exc_info=True
            )
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Could not remove the repository. Please try again."
            )
