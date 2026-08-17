from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.models.pull_request import PullRequest
from app.models.repository import Repository
from app.models.dependency import Dependency
from app.models.user import User
from app.services.reviewer_service import ReviewerService
from app.utils.logger import get_logger

logger = get_logger(__name__)


class DashboardService:

    def __init__(self):
        self.reviewer_service = ReviewerService()

    def get_dashboard(
        self,
        db: Session,
        user: User
    ):

        try:

            # Every query below is scoped to repositories this user
            # has added, via a join on Repository.user_id.
            base_query = (
                db.query(PullRequest)
                .join(Repository)
                .filter(Repository.user_id == user.id)
            )

            total_prs = base_query.count()

            critical_prs = base_query.filter(
                PullRequest.priority_level == "Critical"
            ).count()

            repositories_count = (
                db.query(Repository)
                .filter(Repository.user_id == user.id)
                .count()
            )

            blocked_prs_count = self._count_blocked_prs(db, user)

            avg_review_time_hours = self._avg_first_review_hours(db, user)

            avg_merge_time_days = self._avg_merge_time_days(db, user)

            reviewer_load = self.reviewer_service.get_workload_for_user(
                db, user
            )

            overloaded_reviewers_count = sum(
                1 for r in reviewer_load if r["is_overloaded"]
            )

            return {
                "total_prs": total_prs,
                "critical_prs_count": critical_prs,
                "blocked_prs_count": blocked_prs_count,
                "repositories_count": repositories_count,
                "avg_review_time_hours": avg_review_time_hours,
                "avg_merge_time_days": avg_merge_time_days,
                "reviewer_load": reviewer_load,
                "overloaded_reviewers_count": overloaded_reviewers_count
            }

        except SQLAlchemyError:
            logger.error(
                "Database error building dashboard for user_id=%s",
                user.id, exc_info=True
            )
            raise

    def _count_blocked_prs(
        self,
        db: Session,
        user: User
    ) -> int:
        """
        A PR counts as blocked if it has at least one incoming
        dependency (something it depends on) whose source PR has
        not yet merged.
        """

        blocked_target_ids = (
            db.query(Dependency.target_pr_id)
            .join(
                PullRequest,
                PullRequest.id == Dependency.source_pr_id
            )
            .filter(PullRequest.status != "merged")
            .join(
                Repository,
                Repository.id == PullRequest.repository_id
            )
            .filter(Repository.user_id == user.id)
            .distinct()
            .all()
        )

        return len(blocked_target_ids)

    def _avg_first_review_hours(
        self,
        db: Session,
        user: User
    ) -> float | None:
        """
        Average hours between a PR being opened and its first
        submitted review. Populated from real GitHub review data
        during sync (open PRs only — see SyncService._sync_reviews).
        Returns None rather than a fabricated number if no open PRs
        have received a review yet.
        """

        prs = (
            db.query(PullRequest)
            .join(Repository)
            .filter(Repository.user_id == user.id)
            .filter(PullRequest.first_review_at.isnot(None))
            .all()
        )

        if not prs:
            return None

        total_hours = sum(
            (pr.first_review_at - pr.created_at).total_seconds() / 3600
            for pr in prs
        )

        return round(total_hours / len(prs), 1)

    def _avg_merge_time_days(
        self,
        db: Session,
        user: User
    ) -> float | None:
        """
        Average days between a PR being opened and merged.
        Returns None if no PRs have merged yet.
        """

        prs = (
            db.query(PullRequest)
            .join(Repository)
            .filter(Repository.user_id == user.id)
            .filter(PullRequest.merged_at.isnot(None))
            .all()
        )

        if not prs:
            return None

        total_days = sum(
            (pr.merged_at - pr.created_at).total_seconds() / 86400
            for pr in prs
        )

        return round(total_days / len(prs), 1)
