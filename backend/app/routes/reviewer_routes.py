from fastapi import APIRouter

from app.database.session import SessionLocal
from app.models.reviewer import Reviewer
from app.services.reviewer_service import ReviewerService

router = APIRouter(
    prefix="/reviewers",
    tags=["Reviewers"]
)

service = ReviewerService()


@router.get("/")
def reviewer_analytics():

    db = SessionLocal()

    try:

        reviewers = db.query(Reviewer).all()

        return service.analyze_reviewers(reviewers)

    finally:

        db.close()
