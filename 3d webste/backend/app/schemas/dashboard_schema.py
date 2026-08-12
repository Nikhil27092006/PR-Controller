from pydantic import BaseModel


class DashboardResponse(BaseModel):
    total_repositories: int

    total_open_prs: int

    critical_prs: int

    blocked_prs: int

    total_reviewers: int

    average_priority_score: float