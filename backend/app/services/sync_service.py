from datetime import datetime

from dateutil import parser
from sqlalchemy.orm import Session

from app.models.repository import Repository
from app.models.pull_request import PullRequest
from app.models.dependency import Dependency
from app.services.github_service import GitHubService
from app.services.priority_service import PriorityService
from app.analyzers.dependency_analyzer import extract_dependencies


def _parse_dt(value):
    """Parses a GitHub ISO 8601 timestamp string, or returns None."""

    if not value:
        return None

    if isinstance(value, datetime):
        return value

    return parser.parse(value).replace(tzinfo=None)


class SyncService:

    def __init__(self):

        self.github = GitHubService()
        self.priority = PriorityService()

    def sync_all(self, db: Session):
        """
        Syncs every repository currently stored in the database
        (i.e. repositories a user has explicitly added via the
        Repository Management API). This no longer pulls every
        repo the GitHub token has access to.
        """

        repositories = db.query(Repository).all()

        for db_repo in repositories:
            self.sync_pull_requests(db, db_repo)

    def sync_repository(
        self,
        db: Session,
        db_repo: Repository
    ):
        """Syncs a single repository. Used right after a repo is added."""

        self.sync_pull_requests(db, db_repo)

    def sync_pull_requests(
        self,
        db: Session,
        repository: Repository
    ):

        prs = self.github.fetch_pull_requests(
            repository.owner,
            repository.name
        )

        ranked_prs = self.priority.score_multiple_prs(prs)

        # Track PR number -> internal DB id for this repo so we can
        # resolve dependency references in a second pass below.
        pr_number_to_id = {}

        for pr in ranked_prs:

            existing = (
                db.query(PullRequest)
                .filter(
                    PullRequest.github_pr_number == pr["number"]
                )
                .filter(
                    PullRequest.repository_id == repository.id
                )
                .first()
            )

            merged_at = _parse_dt(pr.get("merged_at"))
            closed_at = _parse_dt(pr.get("closed_at"))

            # GitHub represents a merged PR with state="closed" plus
            # a merged_at timestamp. Normalize that into a clearer
            # "merged" status for our own status field.
            if merged_at:
                status = "merged"
            else:
                status = pr.get("state", "open")

            if existing:

                existing.title = pr["title"]
                existing.description = pr.get("body")
                existing.author = pr.get("user", {}).get("login")
                existing.status = status
                existing.priority_score = pr["priority_score"]
                existing.priority_level = pr["priority_level"]
                existing.merged_at = merged_at
                existing.closed_at = closed_at

                pr_number_to_id[pr["number"]] = existing.id

            else:

                db_pr = PullRequest(
                    repository_id=repository.id,
                    github_pr_number=pr["number"],
                    title=pr["title"],
                    description=pr.get("body"),
                    author=pr.get("user", {}).get("login"),
                    status=status,
                    priority_score=pr["priority_score"],
                    priority_level=pr["priority_level"],
                    review_count=0,
                    merged_at=merged_at,
                    closed_at=closed_at
                )

                db.add(db_pr)
                db.flush()  # assigns db_pr.id without a full commit

                pr_number_to_id[pr["number"]] = db_pr.id

        repository.last_synced_at = datetime.utcnow()

        db.commit()

        # Second pass: extract "depends on #N" style references from
        # each PR body and store them as Dependency rows, now that
        # every PR in this repo has a known internal id.
        self._sync_dependencies(db, repository, ranked_prs, pr_number_to_id)

    def _sync_dependencies(
        self,
        db: Session,
        repository: Repository,
        prs: list,
        pr_number_to_id: dict
    ):

        for pr in prs:

            source_id = pr_number_to_id.get(pr["number"])

            if not source_id:
                continue

            referenced_numbers = extract_dependencies(pr.get("body"))

            for target_number in referenced_numbers:

                target_id = pr_number_to_id.get(target_number)

                # The referenced PR isn't in this repo (or hasn't been
                # synced yet) — skip it rather than guess.
                if not target_id:
                    continue

                already_exists = (
                    db.query(Dependency)
                    .filter(Dependency.source_pr_id == target_id)
                    .filter(Dependency.target_pr_id == source_id)
                    .first()
                )

                if already_exists:
                    continue

                # "PR #source depends on #target" means target must
                # merge first, i.e. target -> source in the graph.
                dependency = Dependency(
                    source_pr_id=target_id,
                    target_pr_id=source_id,
                    dependency_type="auto"
                )

                db.add(dependency)

        db.commit()
