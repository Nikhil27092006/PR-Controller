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


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)

    # Which user this alert belongs to (alerts are scoped per user,
    # same as repositories/PRs).
    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    # "critical_pr" | "blocked_dependency" | "reviewer_overload" | "merge_conflict"
    alert_type = Column(
        String(50),
        nullable=False
    )

    severity = Column(
        String(20),
        default="warning"
    )  # "info" | "warning" | "critical"

    title = Column(
        String(255),
        nullable=False
    )

    message = Column(
        Text,
        nullable=True
    )

    # Optional links back to the thing that triggered this alert,
    # so the frontend can deep-link to it. Both nullable since not
    # every alert type relates to both.
    pull_request_id = Column(
        Integer,
        ForeignKey("pull_requests.id"),
        nullable=True
    )

    reviewer_id = Column(
        Integer,
        ForeignKey("reviewers.id"),
        nullable=True
    )

    is_read = Column(
        Boolean,
        default=False
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    user = relationship("User")
    pull_request = relationship("PullRequest")
    reviewer = relationship("Reviewer")
