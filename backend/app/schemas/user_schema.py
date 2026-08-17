from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    username: str
    email: EmailStr
    # Optional because OAuth-created users (via GitHub) do not provide
    # a password. Email/password registration still requires it in the
    # route layer.
    password: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    created_at: datetime
    avatar_url: Optional[str] = None
    github_username: Optional[str] = None

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class GithubUserProfile(BaseModel):
    """Subset of the GitHub /user payload that we care about."""
    id: int
    login: str
    avatar_url: Optional[str] = None
    email: Optional[str] = None
    name: Optional[str] = None