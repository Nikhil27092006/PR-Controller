from fastapi import APIRouter

from app.database.session import SessionLocal
from app.models.pull_request import PullRequest

router = APIRouter(
    prefix="/prs",
    tags=["Pull Requests"]
)


@router.get("/")
def get_prs():

    db = SessionLocal()

    try:

        prs = db.query(
            PullRequest
        ).all()

        return [
            {
                "id": pr.id,
                "title": pr.title,
                "author": pr.author,
                "status": pr.status,
                "priority_score": pr.priority_score,
                "priority_level": pr.priority_level
            }
            for pr in prs
        ]

    finally:

        db.close()