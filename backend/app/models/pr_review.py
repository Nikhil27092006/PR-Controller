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


class PRReview(Base):
    """
    A single submitted review event on a PR, fetched from GitHub's
    /pulls/{number}/reviews endpoint. Distinct from PRReviewer
    (which tracks *requested* reviewers) — this tracks reviews that
    were actually *submitted*, with a real timestamp, which is what
    review-time metrics and the PR timeline are built from.
    """

    __tablename__ = "pr_reviews"

    id = Column(Integer, primary_key=True, index=True)

    pull_request_id = Column(
        Integer,
        ForeignKey("pull_requests.id"),
        nullable=False
    )

    reviewer_username = Column(
        String(100),
        nullable=True
    )

    # APPROVED | CHANGES_REQUESTED | COMMENTED | DISMISSED
    state = Column(
        String(30),
        nullable=True
    )

    submitted_at = Column(
        DateTime,
        nullable=True
    )

    # Fetched once and stored — we don't need to re-fetch every
    # sync for a review that already happened.
    fetched_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    pull_request = relationship("PullRequest", back_populates="reviews")
