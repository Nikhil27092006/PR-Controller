from datetime import datetime
from typing import Any
from pydantic import BaseModel


class RepositoryCreate(BaseModel):
    owner: str
    name: str


class RepositoryResponse(BaseModel):
    id: int
    github_repo_id: int | None = None
    owner: str
    name: str
    full_name: str
    default_branch: str
    description: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class RepositoryDetailResponse(BaseModel):
    id: int
    github_repo_id: int | None = None
    owner: str
    name: str
    full_name: str
    default_branch: str
    description: str | None = None
    created_at: datetime
    last_synced_at: datetime | None = None

    total_prs: int = 0
    open_prs: int = 0
    merged_prs: int = 0
    closed_prs: int = 0
    blocked_prs: int = 0
    merge_conflicts_count: int = 0
    failing_checks_count: int = 0

    critical_prs: int = 0
    high_prs: int = 0
    medium_prs: int = 0
    low_prs: int = 0

    health_score: int = 100
    health_grade: str = "A+"
    health_status: str = "Optimal Health"

    avg_turnaround_hours: float | None = None
    merge_rate_pct: float = 0.0

    pull_requests: list[dict[str, Any]] = []
    reviewers: list[dict[str, Any]] = []
    alerts: list[dict[str, Any]] = []

    class Config:
        from_attributes = True