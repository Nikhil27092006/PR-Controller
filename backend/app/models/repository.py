from datetime import datetime

from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint
)
from sqlalchemy.orm import relationship

from app.database.base import Base


class Repository(Base):
    __tablename__ = "repositories"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True
    )

    # GitHub's numeric repo id. NOT globally unique anymore —
    # multiple users can each have their own row for the same
    # GitHub repo (one for the owner, one for a collaborator who
    # also connected the repo). Uniqueness is enforced per-user via
    # the composite constraint below.
    github_repo_id = Column(
        Integer,
        nullable=True,
        index=True
    )

    owner = Column(
        String(100),
        nullable=False
    )

    name = Column(
        String(200),
        nullable=False
    )

    full_name = Column(
        String(255),
        nullable=False
    )

    default_branch = Column(
        String(100),
        default="main"
    )

    description = Column(
        String(500),
        nullable=True
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    last_synced_at = Column(
        DateTime,
        nullable=True
    )

    owner_user = relationship(
        "User",
        back_populates="repositories"
    )

    pull_requests = relationship(
        "PullRequest",
        back_populates="repository",
        cascade="all, delete-orphan"
    )

    # A repo can only appear once per user. Without this composite
    # constraint, two users tracking the same GitHub repo would
    # collide on github_repo_id; with it, each user has their own
    # row keyed by their own user_id. (user_id is in the constraint
    # rather than nullable-FK'd away because some legacy rows may
    # still have user_id=NULL.)
    __table_args__ = (
        UniqueConstraint(
            "user_id", "github_repo_id",
            name="uq_repositories_user_github_repo_id",
        ),
    )