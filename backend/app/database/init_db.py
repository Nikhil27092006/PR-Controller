from app.database.db import engine
from app.database.base import Base
from app.utils.logger import get_logger

# Import all models here so Base knows about every table
from app.models.repository import Repository
from app.models.pull_request import PullRequest
from app.models.reviewer import Reviewer
from app.models.dependency import Dependency
from app.models.user import User
from app.models.pr_reviewer import PRReviewer
from app.models.pr_review import PRReview
from app.models.alert import Alert

logger = get_logger(__name__)


def init_db():
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created successfully.")


if __name__ == "__main__":
    init_db()
