from fastapi import APIRouter

router = APIRouter(
    prefix="/bottlenecks",
    tags=["Bottlenecks"]
)


@router.get("/")
def bottlenecks():
    return {
        "message": "Bottleneck analysis"
    }