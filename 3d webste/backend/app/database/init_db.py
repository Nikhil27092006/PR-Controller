from database.db import engine
from database.base import Base

# Import all models here
from models.repository import Repository
from models.pull_request import PullRequest
from models.reviewer import Reviewer
from models.dependency import Dependency
from models.user import User


def init_db():
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully.")


if __name__ == "__main__":
    init_db()