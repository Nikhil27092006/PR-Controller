from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String
from sqlalchemy.orm import relationship

from app.database.base import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    username = Column(
        String(100),
        unique=True,
        nullable=False
    )

    email = Column(
        String(255),
        unique=True,
        nullable=False
    )

    # Nullable so OAuth-only users (signed in via GitHub) can exist
    # without a password. Email/password login is still gated on this
    # being present in auth_service.authenticate().
    password_hash = Column(
        String(255),
        nullable=True
    )

    # GitHub identity — populated when a user signs in via GitHub
    # OAuth. github_id is the stable GitHub numeric id as a string and
    # is unique so the same GitHub account cannot create duplicate
    # local users on repeated logins.
    github_id = Column(
        String(64),
        unique=True,
        nullable=True,
        index=True
    )
    github_username = Column(
        String(100),
        nullable=True
    )
    avatar_url = Column(
        String(500),
        nullable=True
    )

    # The OAuth access token we received from GitHub during the
    # OAuth callback. Used to make per-user GitHub API calls
    # (fetching the user's repos, syncing their PRs) without
    # depending on the server-wide GITHUB_TOKEN having access to
    # that user's private repos. Nullable so password-only users
    # (no GitHub OAuth) can exist without this column being set.
    github_access_token = Column(
        String(500),
        nullable=True
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    repositories = relationship(
        "Repository",
        back_populates="owner_user",
        cascade="all, delete-orphan"
    )