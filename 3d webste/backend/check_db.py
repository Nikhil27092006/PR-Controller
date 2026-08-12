from app.database.session import SessionLocal
from app.models.repository import Repository
from app.models.pull_request import PullRequest

db = SessionLocal()

print("Repositories:", db.query(Repository).count())
print("Pull Requests:", db.query(PullRequest).count())

db.close()