from fastapi import APIRouter

from app.database.session import SessionLocal
from app.models.dependency import Dependency
from app.analyzers.bottleneck_analyzer import find_bottlenecks

router = APIRouter(
    prefix="/bottlenecks",
    tags=["Bottlenecks"]
)


@router.get("/")
def get_bottlenecks():

    db = SessionLocal()

    try:

        dependency_rows = db.query(Dependency).all()

        dependency_pairs = [
            (row.source_pr_id, row.target_pr_id)
            for row in dependency_rows
        ]

        return find_bottlenecks(dependency_pairs)

    finally:

        db.close()
