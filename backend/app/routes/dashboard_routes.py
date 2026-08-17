from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User
from app.services.dashboard_service import DashboardService
from app.services.auth_service import get_current_user
from app.utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)

service = DashboardService()


@router.get("/")
def dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    try:
        return service.get_dashboard(db, current_user)

    except SQLAlchemyError:
        logger.error(
            "Failed to load dashboard for user_id=%s",
            current_user.id, exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Could not load dashboard data right now. Please try again."
        )
