from pydantic import BaseModel


class TrendPoint(BaseModel):
    week: str
    value: float | None = None


class VolumeTrendPoint(BaseModel):
    week: str
    created: int
    closed: int


class AnalyticsSummary(BaseModel):
    avg_review_time_hours: float | None = None
    avg_merge_time_hours: float | None = None
    prs_created: int
    blockers_detected: int


class EngineeringAnalyticsResponse(BaseModel):
    range: str
    summary: AnalyticsSummary
    review_time_trend: list[TrendPoint]
    merge_time_trend: list[TrendPoint]
    blockers_trend: list[TrendPoint]
    pr_volume_trend: list[VolumeTrendPoint]
