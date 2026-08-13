from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.dependency import Dependency
from app.models.pull_request import PullRequest
from app.models.repository import Repository
from app.models.user import User
from app.analyzers.bottleneck_analyzer import find_bottlenecks
from app.services.auth_service import get_current_user

router = APIRouter(
    prefix="/bottlenecks",
    tags=["Bottlenecks"]
)


@router.get("/")
def get_bottlenecks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    # Only consider dependencies where the source PR belongs to a
    # repository this user has added, so one user never sees another
    # user's bottleneck data.
    dependency_rows = (
        db.query(Dependency)
        .join(
            PullRequest,
            PullRequest.id == Dependency.source_pr_id
        )
        .join(
            Repository,
            Repository.id == PullRequest.repository_id
        )
        .filter(Repository.user_id == current_user.id)
        .all()
    )

    dependency_pairs = [
        (row.source_pr_id, row.target_pr_id)
        for row in dependency_rows
    ]

    return find_bottlenecks(dependency_pairs)
