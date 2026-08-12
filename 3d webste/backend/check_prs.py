from app.database.session import SessionLocal
from app.models.pull_request import PullRequest

db = SessionLocal()

prs = db.query(PullRequest).all()

print("PR Count:", len(prs))

for pr in prs:
    print(pr.id, pr.title)

db.close()