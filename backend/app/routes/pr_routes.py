from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User
from app.schemas.pr_schema import (
    PullRequestResponse,
    PullRequestDetailResponse
)
from app.services.auth_service import get_current_user
from app.services.pr_service import PRService
from app.utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter(
    prefix="/prs",
    tags=["Pull Requests"]
)

service = PRService()


@router.get("/", response_model=list[PullRequestResponse])
def get_prs(
    repository_id: int | None = Query(
        default=None,
        description="Filter to a single repository"
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    try:
        return service.get_prs_for_user(db, current_user, repository_id)

    except SQLAlchemyError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Could not load pull requests right now. Please try again."
        )


@router.get("/{pr_id}", response_model=PullRequestDetailResponse)
def get_pr_detail(
    pr_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    try:
        pr_detail = service.get_pr_detail(db, current_user, pr_id)

    except SQLAlchemyError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Could not load this pull request right now. Please try again."
        )

    if not pr_detail:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pull request not found"
        )

    return pr_detail
