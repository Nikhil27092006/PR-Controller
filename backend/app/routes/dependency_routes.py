from fastapi import APIRouter

from app.services.dependency_service import DependencyService
from app.schemas.dependency_schema import DependencyRequest

router = APIRouter(
    prefix="/dependencies",
    tags=["Dependencies"]
)

service = DependencyService()


@router.post("/")
def dependencies(request: DependencyRequest):

    return service.analyze_pr_dependencies(request.pr_body)
