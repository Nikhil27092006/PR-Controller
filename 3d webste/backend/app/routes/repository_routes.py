from fastapi import APIRouter

from app.services.repository_service import RepositoryService

router = APIRouter(
    prefix="/repositories",
    tags=["Repositories"]
)

service = RepositoryService()


@router.get("/")
def repositories():

    return service.get_repositories()