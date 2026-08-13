from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.pull_request import PullRequest
from app.models.repository import Repository
from app.models.user import User
from app.schemas.pr_schema import PullRequestResponse
from app.services.auth_service import get_current_user

router = APIRouter(
    prefix="/prs",
    tags=["Pull Requests"]
)


@router.get("/", response_model=list[PullRequestResponse])
def get_prs(
    repository_id: int | None = Query(
        default=None,
        description="Filter to a single repository"
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    query = (
        db.query(PullRequest)
        .join(Repository)
        .filter(Repository.user_id == current_user.id)
    )

    if repository_id is not None:
        query = query.filter(
            PullRequest.repository_id == repository_id
        )

    return query.order_by(
        PullRequest.priority_score.desc()
    ).all()
