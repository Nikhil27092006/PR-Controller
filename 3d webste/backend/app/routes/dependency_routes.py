from fastapi import APIRouter

from app.services.dependency_service import DependencyService

router = APIRouter(
    prefix="/dependencies",
    tags=["Dependencies"]
)

service = DependencyService()


@router.post("/")
def dependencies(pr_body: str):

    return service.analyze_pr_dependencies(pr_body)