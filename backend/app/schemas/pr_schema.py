from datetime import datetime

from pydantic import BaseModel


class PullRequestResponse(BaseModel):
    id: int
    repository_id: int
    github_pr_number: int
    title: str
    description: str | None = None
    author: str | None = None

    status: str

    priority_score: int
    priority_level: str

    review_count: int

    blocked_count: int
    is_blocking: bool

    merge_conflict: bool
    failing_checks: bool

    created_at: datetime
    updated_at: datetime
    merged_at: datetime | None = None
    closed_at: datetime | None = None

    class Config:
        from_attributes = True