from datetime import datetime

from pydantic import BaseModel


class DependencyRequest(BaseModel):
    pr_body: str


class DependencyResponse(BaseModel):
    id: int

    source_pr_id: int

    target_pr_id: int

    dependency_type: str

    created_at: datetime

    class Config:
        from_attributes = True