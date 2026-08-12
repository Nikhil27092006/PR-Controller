from fastapi import APIRouter

router = APIRouter(
    prefix="/reviewers",
    tags=["Reviewers"]
)


@router.get("/")
def reviewer_analytics():
    return {
        "message": "Reviewer analytics"
    }