from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User
from app.services.dependency_graph_service import DependencyGraphService
from app.services.auth_service import get_current_user
from app.schemas.dependency_schema import DependencyRequest
from app.utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter(
    prefix="/dependencies",
    tags=["Dependencies"]
)

graph_service = DependencyGraphService()


@router.post("/")
def dependencies(
    request: DependencyRequest,
    current_user: User = Depends(get_current_user)
):

    return graph_service.analyze_pr_dependencies(request.pr_body)


@router.get("/graph")
def dependency_graph(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns { nodes, edges } for the PR dependency graph across all
    of this user's repositories, ready to pass straight into
    reactflow's <ReactFlow nodes={} edges={} /> on the frontend.
    """

    try:
        return graph_service.get_graph_for_user(db, current_user)

    except SQLAlchemyError:
        logger.error(
            "Failed to build dependency graph for user_id=%s",
            current_user.id, exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Could not load the dependency graph right now. Please try again."
        )
