from app.database.db import engine
from app.database.base import Base

# Import all models here so Base knows about every table
from app.models.repository import Repository
from app.models.pull_request import PullRequest
from app.models.reviewer import Reviewer
from app.models.dependency import Dependency
from app.models.user import User


def init_db():
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully.")


if __name__ == "__main__":
    init_db()
