from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text
)
from sqlalchemy.orm import relationship

from app.database.base import Base


class PullRequest(Base):
    __tablename__ = "pull_requests"

    id = Column(Integer, primary_key=True, index=True)

    repository_id = Column(
        Integer,
        ForeignKey("repositories.id"),
        nullable=False
    )

    github_pr_number = Column(
        Integer,
        nullable=False
    )

    title = Column(
        String(500),
        nullable=False
    )

    description = Column(
        Text,
        nullable=True
    )

    author = Column(
        String(100),
        nullable=True
    )

    status = Column(
        String(50),
        default="open"
    )

    priority_score = Column(
        Integer,
        default=0
    )

    priority_level = Column(
        String(20),
        default="Low"
    )

    review_count = Column(
        Integer,
        default=0
    )

    blocked_count = Column(
        Integer,
        default=0
    )

    is_blocking = Column(
        Boolean,
        default=False
    )

    merge_conflict = Column(
        Boolean,
        default=False
    )

    failing_checks = Column(
        Boolean,
        default=False
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    repository = relationship(
        "Repository",
        back_populates="pull_requests"
    )

    outgoing_dependencies = relationship(
        "Dependency",
        foreign_keys="Dependency.source_pr_id",
        back_populates="source_pr",
        cascade="all, delete-orphan"
    )

    incoming_dependencies = relationship(
        "Dependency",
        foreign_keys="Dependency.target_pr_id",
        back_populates="target_pr",
        cascade="all, delete-orphan"
    )