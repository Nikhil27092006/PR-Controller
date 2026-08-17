from datetime import datetime

from pydantic import BaseModel, Field


class ReviewerResponse(BaseModel):
    id: int

    username: str

    pending_reviews: int

    completed_reviews: int

    avg_review_time_hours: int

    workload_score: int

    last_review_at: datetime | None = None

    class Config:
        from_attributes = True


class CapacityUpdateRequest(BaseModel):
    capacity: int = Field(
        ge=1,
        le=50,
        description="Max concurrent PR reviews this reviewer can comfortably handle"
    )