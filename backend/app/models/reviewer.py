from datetime import datetime

from sqlalchemy import (
    Column,
    DateTime,
    Integer,
    String
)

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

    last_review_at = Column(
        DateTime,
        nullable=True
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )