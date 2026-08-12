from fastapi import APIRouter

from app.services.dashboard_service import DashboardService

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)

service = DashboardService()


@router.get("/")
def dashboard():

    return service.get_dashboard()