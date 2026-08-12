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


class Dependency(Base):
    __tablename__ = "dependencies"

    id = Column(Integer, primary_key=True, index=True)

    source_pr_id = Column(
        Integer,
        ForeignKey("pull_requests.id"),
        nullable=False
    )

    target_pr_id = Column(
        Integer,
        ForeignKey("pull_requests.id"),
        nullable=False
    )

    dependency_type = Column(
        String(50),
        default="manual"
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    source_pr = relationship(
        "PullRequest",
        foreign_keys=[source_pr_id],
        back_populates="outgoing_dependencies"
    )

    target_pr = relationship(
        "PullRequest",
        foreign_keys=[target_pr_id],
        back_populates="incoming_dependencies"
    )