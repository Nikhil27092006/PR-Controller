from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User
from app.schemas.reviewer_schema import CapacityUpdateRequest
from app.services.reviewer_service import ReviewerService
from app.services.auth_service import get_current_user
from app.utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter(
    prefix="/reviewers",
    tags=["Reviewers"]
)

service = ReviewerService()


@router.get("/")
def reviewer_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    try:
        return service.get_workload_for_user(db, current_user)

    except SQLAlchemyError:
        logger.error(
            "Failed to load reviewer analytics for user_id=%s",
            current_user.id, exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Could not load reviewer data right now. Please try again."
        )


@router.put("/{reviewer_id}/capacity")
def update_reviewer_capacity(
    reviewer_id: int,
    request: CapacityUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    try:
        reviewer = service.update_capacity(
            db, current_user, reviewer_id, request.capacity
        )

    except SQLAlchemyError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Could not update capacity right now. Please try again."
        )

    if not reviewer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reviewer not found"
        )

    return {
        "reviewer_id": reviewer.id,
        "username": reviewer.username,
        "capacity": reviewer.capacity
    }
