from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.models.reviewer import Reviewer
from app.models.pr_reviewer import PRReviewer
from app.models.pull_request import PullRequest
from app.models.repository import Repository
from app.models.user import User
from app.analyzers.reviewer_analyzer import calculate_workload
from app.utils.logger import get_logger

logger = get_logger(__name__)


class ReviewerService:

    def get_workload_for_user(self, db: Session, user: User):
        """
        Returns reviewer workload data scoped to the given user's
        repositories only — a reviewer who only appears on another
        user's repos won't show up here, and a reviewer shared
        across repos only counts PRs from this user's repos toward
        their load.
        """

        try:

            # Every currently-requested (pending) PR-reviewer link,
            # restricted to PRs in repos this user owns.
            links = (
                db.query(PRReviewer)
                .join(
                    PullRequest,
                    PullRequest.id == PRReviewer.pull_request_id
                )
                .join(
                    Repository,
                    Repository.id == PullRequest.repository_id
                )
                .filter(Repository.user_id == user.id)
                .filter(PRReviewer.status == "requested")
                .all()
            )

            reviewer_ids = {link.reviewer_id for link in links}

            if not reviewer_ids:
                return []

            reviewers = (
                db.query(Reviewer)
                .filter(Reviewer.id.in_(reviewer_ids))
                .all()
            )

            assigned_prs_by_reviewer: dict[int, list] = {
                r.id: [] for r in reviewers
            }

            for link in links:

                pr = link.pull_request

                assigned_prs_by_reviewer[link.reviewer_id].append({
                    "id": pr.id,
                    "github_pr_number": pr.github_pr_number,
                    "title": pr.title,
                    "priority_level": pr.priority_level,
                    "repository_id": pr.repository_id
                })

            return calculate_workload(reviewers, assigned_prs_by_reviewer)

        except SQLAlchemyError:
            logger.error(
                "Database error computing reviewer workload for "
                "user_id=%s", user.id, exc_info=True
            )
            raise

    def analyze_reviewers(self, reviewers):
        """
        Legacy path (no DB-backed assigned-PR data) — kept for any
        caller that only has a plain list of Reviewer rows and no
        user scoping. Prefer get_workload_for_user() where possible.
        """

        return calculate_workload(reviewers)

    def update_capacity(
        self,
        db: Session,
        user: User,
        reviewer_id: int,
        capacity: int
    ) -> Reviewer | None:
        """
        Updates how many concurrent PR reviews a reviewer is
        expected to comfortably handle (used as the load %
        denominator). A reviewer isn't owned by a single user — the
        same GitHub username can show up across different users'
        repos — so this only allows the change if the requesting
        user actually has at least one PR assigned to this reviewer
        in their own repositories. Returns None if the reviewer
        doesn't exist or isn't visible to this user (same response
        either way, so a user can't probe for reviewers on repos
        they don't own).
        """

        try:

            reviewer = (
                db.query(Reviewer)
                .filter(Reviewer.id == reviewer_id)
                .first()
            )

            if not reviewer:
                return None

            has_access = (
                db.query(PRReviewer)
                .join(
                    PullRequest,
                    PullRequest.id == PRReviewer.pull_request_id
                )
                .join(
                    Repository,
                    Repository.id == PullRequest.repository_id
                )
                .filter(Repository.user_id == user.id)
                .filter(PRReviewer.reviewer_id == reviewer_id)
                .first()
            )

            if not has_access:
                return None

            reviewer.capacity = capacity
            db.commit()
            db.refresh(reviewer)

            return reviewer

        except SQLAlchemyError:
            db.rollback()
            logger.error(
                "Database error updating capacity for reviewer_id=%s "
                "(user_id=%s)", reviewer_id, user.id, exc_info=True
            )
            raise
