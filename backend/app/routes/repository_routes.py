from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User
from app.schemas.repository_schema import (
    RepositoryCreate,
    RepositoryResponse,
    RepositoryDetailResponse
)
from app.services.repository_service import RepositoryService
from app.services.auth_service import get_current_user

router = APIRouter(
    prefix="/repositories",
    tags=["Repositories"]
)

service = RepositoryService()


@router.get("/", response_model=list[RepositoryResponse])
def list_repositories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    return service.get_repositories(db, current_user)


@router.post("/", response_model=RepositoryResponse)
def add_repository(
    repo_in: RepositoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    return service.add_repository(
        db,
        current_user,
        repo_in.owner,
        repo_in.name
    )


@router.get("/{repository_id}", response_model=RepositoryDetailResponse)
def get_repository(
    repository_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    return service.get_repository_detail(
        db,
        current_user,
        repository_id
    )


@router.post("/{repository_id}/sync", response_model=RepositoryDetailResponse)
def sync_repository(
    repository_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    return service.sync_single_repo(
        db,
        current_user,
        repository_id
    )


@router.delete("/{repository_id}")
def delete_repository(
    repository_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    return service.delete_repository(
        db,
        current_user,
        repository_id
    )

