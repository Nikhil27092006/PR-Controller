from datetime import datetime

from pydantic import BaseModel


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