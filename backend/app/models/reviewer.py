from datetime import datetime

from sqlalchemy import (
    Column,
    DateTime,
    Integer,
    String
)
from sqlalchemy.orm import relationship

from app.database.base import Base


class Reviewer(Base):
    __tablename__ = "reviewers"

    id = Column(Integer, primary_key=True, index=True)

    username = Column(
        String(100),
        unique=True,
        nullable=False
    )

    pending_reviews = Column(
        Integer,
        default=0
    )

    completed_reviews = Column(
        Integer,
        default=0
    )

    avg_review_time_hours = Column(
        Integer,
        default=0
    )

    workload_score = Column(
        Integer,
        default=0
    )

    # Max number of concurrent PR review assignments this reviewer
    # is expected to comfortably handle. Used as the denominator for
    # load % (e.g. 6 assigned / 5 capacity = 120%). Defaults to 5;
    # adjustable per reviewer later if needed.
    capacity = Column(
        Integer,
        default=5
    )

    last_review_at = Column(
        DateTime,
        nullable=True
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    pr_assignments = relationship(
        "PRReviewer",
        back_populates="reviewer",
        cascade="all, delete-orphan"
    )