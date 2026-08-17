
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User
from app.schemas.alert_schema import AlertResponse
from app.services.alert_service import AlertService
from app.services.auth_service import get_current_user
from app.utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter(
    prefix="/alerts",
    tags=["Alerts"]
)

service = AlertService()


@router.get("/", response_model=list[AlertResponse])
def get_alerts(
    unread_only: bool = Query(default=False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    try:
        return service.get_alerts_for_user(db, current_user, unread_only)

    except SQLAlchemyError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Could not load alerts right now. Please try again."
        )


@router.post("/refresh", response_model=list[AlertResponse])
def refresh_alerts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Recomputes alerts from current data. Also runs automatically
    after each sync, but exposed here so the frontend can trigger a
    manual refresh (e.g. an explicit "Check for alerts" button).
    """

    try:
        service.generate_alerts_for_user(db, current_user)
        return service.get_alerts_for_user(db, current_user)

    except SQLAlchemyError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Could not refresh alerts right now. Please try again."
        )


@router.put("/{alert_id}/read", response_model=AlertResponse)
def mark_alert_read(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    try:
        alert = service.mark_read(db, current_user, alert_id)

    except SQLAlchemyError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Could not update the alert right now. Please try again."
        )

    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found"
        )

    return alert


@router.put("/read-all")
def mark_all_alerts_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    try:
        service.mark_all_read(db, current_user)
        return {"message": "All alerts marked as read"}

    except SQLAlchemyError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Could not update alerts right now. Please try again."
        )
