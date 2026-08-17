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
    first_review_at: datetime | None = None

    class Config:
        from_attributes = True


class PriorityBreakdownItem(BaseModel):
    factor: str
    score: int
    description: str


class DependencyRefResponse(BaseModel):
    id: int
    github_pr_number: int
    title: str
    status: str
    priority_level: str


class ReviewerRefResponse(BaseModel):
    reviewer_id: int
    username: str
    status: str


class TimelineEventResponse(BaseModel):
    type: str  # "created" | "review" | "merged" | "closed"
    timestamp: datetime
    actor: str | None = None
    label: str
    detail: str | None = None


class PullRequestDetailResponse(BaseModel):
    id: int
    repository_id: int
    repository_full_name: str
    github_pr_number: int
    title: str
    description: str | None = None
    author: str | None = None

    status: str

    priority_score: int
    priority_level: str
    priority_breakdown: list[PriorityBreakdownItem] = []

    merge_conflict: bool
    failing_checks: bool

    created_at: datetime
    updated_at: datetime
    merged_at: datetime | None = None
    closed_at: datetime | None = None
    first_review_at: datetime | None = None

    blocking: list[DependencyRefResponse] = []
    blocked_by: list[DependencyRefResponse] = []

    reviewers: list[ReviewerRefResponse] = []

    timeline: list[TimelineEventResponse] = []

    class Config:
        from_attributes = True