from datetime import datetime

from sqlalchemy.orm import Session

from app.models.repository import Repository
from app.models.pull_request import PullRequest
from app.services.github_service import GitHubService
from app.services.priority_service import PriorityService


class SyncService:

    def __init__(self):

        self.github = GitHubService()
        self.priority = PriorityService()

    def sync_all(self, db: Session):

        repositories = self.github.fetch_repositories()

        for repo in repositories:

            db_repo = (
                db.query(Repository)
                .filter(
                    Repository.github_repo_id
                    == repo["id"]
                )
                .first()
            )

            if not db_repo:

                db_repo = Repository(
                    github_repo_id=repo["id"],
                    owner=repo["owner"]["login"],
                    name=repo["name"],
                    full_name=repo["full_name"],
                    description=repo.get(
                        "description"
                    ),
                    default_branch=repo[
                        "default_branch"
                    ]
                )

                db.add(db_repo)
                db.commit()
                db.refresh(db_repo)

            self.sync_pull_requests(
                db,
                db_repo
            )

    def sync_pull_requests(
        self,
        db,
        repository
    ):

        prs = self.github.fetch_pull_requests(
            repository.owner,
            repository.name
        )

        ranked_prs = (
            self.priority.score_multiple_prs(
                prs
            )
        )

        for pr in ranked_prs:

            existing = (
                db.query(PullRequest)
                .filter(
                    PullRequest.github_pr_number
                    == pr["number"]
                )
                .filter(
                    PullRequest.repository_id
                    == repository.id
                )
                .first()
            )

            if existing:
                continue

            db_pr = PullRequest(
                repository_id=repository.id,
                github_pr_number=pr["number"],
                title=pr["title"],
                description=pr.get("body"),
                author=pr["user"]["login"],
                status=pr["state"],
                priority_score=pr[
                    "priority_score"
                ],
                priority_level=pr[
                    "priority_level"
                ],
                review_count=0
            )

            db.add(db_pr)

        repository.last_synced_at = (
            datetime.utcnow()
        )

        db.commit()