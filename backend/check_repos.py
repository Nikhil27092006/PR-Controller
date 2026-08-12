from app.database.session import SessionLocal
from app.models.repository import Repository

db = SessionLocal()

repos = db.query(Repository).all()

print("Repositories:", len(repos))

for repo in repos:
    print(repo.id, repo.full_name)

db.close()