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


class PRReviewer(Base):
    """
    Many-to-many link between a PullRequest and a Reviewer.
    GitHub allows multiple requested reviewers per PR, and one
    reviewer can be assigned to many PRs, so this needs its own
    table rather than a foreign key on either side.
    """

    __tablename__ = "pr_reviewers"

    id = Column(Integer, primary_key=True, index=True)

    pull_request_id = Column(
        Integer,
        ForeignKey("pull_requests.id"),
        nullable=False
    )

    reviewer_id = Column(
        Integer,
        ForeignKey("reviewers.id"),
        nullable=False
    )

    # "requested" = GitHub still shows them as a pending reviewer.
    # "reviewed" = they've submitted a review (approved / changes
    # requested / commented) — GitHub's requested_reviewers list
    # drops a user once they've reviewed, so this is inferred at
    # sync time rather than fetched directly.
    status = Column(
        String(20),
        default="requested"
    )

    assigned_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    pull_request = relationship(
        "PullRequest",
        back_populates="reviewer_assignments"
    )

    reviewer = relationship(
        "Reviewer",
        back_populates="pr_assignments"
    )
