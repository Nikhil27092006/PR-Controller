from datetime import datetime

from pydantic import BaseModel


class AlertResponse(BaseModel):
    id: int
    alert_type: str
    severity: str
    title: str
    message: str | None = None
    pull_request_id: int | None = None
    reviewer_id: int | None = None
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True
