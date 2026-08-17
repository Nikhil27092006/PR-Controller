from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User
from app.schemas.analytics_schema import EngineeringAnalyticsResponse
from app.services.analytics_service import AnalyticsService, RANGE_TO_WEEKS
from app.services.auth_service import get_current_user
from app.utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter(
    prefix="/analytics",
    tags=["Analytics"]
)

service = AnalyticsService()


@router.get("/engineering", response_model=EngineeringAnalyticsResponse)
def get_engineering_analytics(
    range: str = Query(
        default="6W",
        description="One of: " + ", ".join(RANGE_TO_WEEKS.keys())
    ),
    repository_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    if range not in RANGE_TO_WEEKS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"range must be one of: {', '.join(RANGE_TO_WEEKS.keys())}"
        )

    try:
        return service.get_engineering_analytics(
            db, current_user, range, repository_id
        )

    except SQLAlchemyError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Could not load analytics right now. Please try again."
        )
