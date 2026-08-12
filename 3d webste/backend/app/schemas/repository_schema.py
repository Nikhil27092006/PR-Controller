from datetime import datetime

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