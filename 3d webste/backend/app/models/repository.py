from datetime import datetime

from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String
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

    github_repo_id = Column(
        Integer,
        unique=True
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