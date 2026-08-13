from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.repository import Repository
from app.models.user import User
from app.services.github_service import GitHubService
from app.services.sync_service import SyncService


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

        return (
            db.query(Repository)
            .filter(Repository.user_id == user.id)
            .all()
        )

    def add_repository(
        self,
        db: Session,
        user: User,
        owner: str,
        name: str
    ) -> Repository:

        existing = (
            db.query(Repository)
            .filter(Repository.user_id == user.id)
            .filter(Repository.owner == owner)
            .filter(Repository.name == name)
            .first()
        )

        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"{owner}/{name} is already added"
            )

        try:
            repo_data = self.github.fetch_repository(owner, name)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=(
                    f"Could not find {owner}/{name} on GitHub, or "
                    "it isn't accessible with the configured token"
                )
            )

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

        # Sync immediately so the repo isn't empty until the next
        # scheduled background sync runs.
        try:
            self.sync_service.sync_repository(db, db_repo)
        except Exception:
            # Don't fail the add operation if the first sync hits an
            # issue (e.g. rate limit) — it'll retry on the next
            # scheduled sync.
            pass

        return db_repo

    def delete_repository(
        self,
        db: Session,
        user: User,
        repository_id: int
    ):

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

        db.delete(db_repo)
        db.commit()

        return {"message": f"{db_repo.full_name} removed"}
