from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.models.pull_request import PullRequest
from app.models.repository import Repository
from app.models.user import User
from app.services.github_service import GitHubService
from app.services.priority_service import PriorityService
from app.services.github_exceptions import GitHubServiceError
from app.utils.logger import get_logger

logger = get_logger(__name__)


class PRService:

    def __init__(self):

        self.github = GitHubService()
        self.priority = PriorityService()

    def get_ranked_prs(self, owner: str, repo: str):
        """
        Live GitHub fetch + priority ranking, not backed by the
        database. Useful for a one-off preview of a repo before
        it's added, but not used by the main /prs endpoint (see
        get_prs_for_user below), which reads from the DB so it
        works offline and stays fast.
        """

        try:

            prs = self.github.fetch_pull_requests(owner, repo)

            ranked_prs = self.priority.score_multiple_prs(prs)

            ranked_prs.sort(
                key=lambda x: x["priority_score"],
                reverse=True
            )

            return ranked_prs

        except GitHubServiceError:
            logger.error(
                "Failed to fetch/rank live PRs for %s/%s",
                owner, repo, exc_info=True
            )
            raise

    def get_prs_for_user(
        self,
        db: Session,
        user: User,
        repository_id: int | None = None
    ):
        """
        Lists pull requests scoped to repositories this user has
        added, optionally filtered to one repository, ordered by
        priority score (highest first). This is what GET /prs
        actually uses.
        """

        try:

            query = (
                db.query(PullRequest)
                .join(Repository)
                .filter(Repository.user_id == user.id)
            )

            if repository_id is not None:
                query = query.filter(
                    PullRequest.repository_id == repository_id
                )

            return query.order_by(
                PullRequest.priority_score.desc()
            ).all()

        except SQLAlchemyError:
            logger.error(
                "Database error fetching PRs for user_id=%s "
                "(repository_id=%s)", user.id, repository_id,
                exc_info=True
            )
            raise

    def get_pr_detail(
        self,
        db: Session,
        user: User,
        pr_id: int
    ):
        """
        Assembles the full detail view for a single PR: the PR
        itself, its dependency chain (both directions), assigned
        reviewers, and a real timeline built from PR creation +
        actual submitted review events.

        Returns None if the PR doesn't exist or doesn't belong to
        one of this user's repositories (same not-found response
        either way, so a user can't probe for other users' PR ids).
        """

        try:

            pr = (
                db.query(PullRequest)
                .join(Repository)
                .filter(Repository.user_id == user.id)
                .filter(PullRequest.id == pr_id)
                .first()
            )

            if not pr:
                return None

            blocking = [
                {
                    "id": dep.source_pr.id,
                    "github_pr_number": dep.source_pr.github_pr_number,
                    "title": dep.source_pr.title,
                    "status": dep.source_pr.status,
                    "priority_level": dep.source_pr.priority_level
                }
                for dep in pr.incoming_dependencies
            ]

            blocked_by_this = [
                {
                    "id": dep.target_pr.id,
                    "github_pr_number": dep.target_pr.github_pr_number,
                    "title": dep.target_pr.title,
                    "status": dep.target_pr.status,
                    "priority_level": dep.target_pr.priority_level
                }
                for dep in pr.outgoing_dependencies
            ]

            reviewers = [
                {
                    "reviewer_id": link.reviewer_id,
                    "username": link.reviewer.username,
                    "status": link.status
                }
                for link in pr.reviewer_assignments
            ]

            timeline = self._build_timeline(pr)

            return {
                "id": pr.id,
                "repository_id": pr.repository_id,
                "repository_full_name": pr.repository.full_name,
                "github_pr_number": pr.github_pr_number,
                "title": pr.title,
                "description": pr.description,
                "author": pr.author,
                "status": pr.status,
                "priority_score": pr.priority_score,
                "priority_level": pr.priority_level,
                "priority_breakdown": pr.priority_breakdown or [],
                "merge_conflict": pr.merge_conflict,
                "failing_checks": pr.failing_checks,
                "created_at": pr.created_at,
                "updated_at": pr.updated_at,
                "merged_at": pr.merged_at,
                "closed_at": pr.closed_at,
                "first_review_at": pr.first_review_at,
                "blocking": blocking,
                "blocked_by": blocked_by_this,
                "reviewers": reviewers,
                "timeline": timeline
            }

        except SQLAlchemyError:
            logger.error(
                "Database error fetching PR detail id=%s "
                "(user_id=%s)", pr_id, user.id, exc_info=True
            )
            raise

    def _build_timeline(self, pr: PullRequest):
        """
        Builds a chronological timeline from real events: PR
        creation, each submitted review (with reviewer + state),
        and merge/close if applicable. No fabricated events.
        """

        events = [{
            "type": "created",
            "timestamp": pr.created_at,
            "actor": pr.author,
            "label": "opened this pull request",
            "detail": None
        }]

        for review in pr.reviews:

            if not review.submitted_at:
                continue

            state_labels = {
                "APPROVED": "approved these changes",
                "CHANGES_REQUESTED": "requested changes",
                "COMMENTED": "left a comment review",
                "DISMISSED": "had their review dismissed"
            }

            events.append({
                "type": "review",
                "timestamp": review.submitted_at,
                "actor": review.reviewer_username,
                "label": state_labels.get(
                    review.state, "reviewed this pull request"
                ),
                "detail": None
            })

        if pr.merged_at:
            events.append({
                "type": "merged",
                "timestamp": pr.merged_at,
                "actor": None,
                "label": "merged this pull request",
                "detail": None
            })
        elif pr.closed_at:
            events.append({
                "type": "closed",
                "timestamp": pr.closed_at,
                "actor": None,
                "label": "closed this pull request",
                "detail": None
            })

        events.sort(key=lambda e: e["timestamp"])

        return events
