from sqlalchemy.orm import Session

from app.models.pull_request import PullRequest
from app.models.repository import Repository
from app.models.dependency import Dependency
from app.models.reviewer import Reviewer
from app.models.user import User


class DashboardService:

    def get_dashboard(
        self,
        db: Session,
        user: User
    ):

        # Every query below is scoped to repositories this user has
        # added, via a join on Repository.user_id.
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

        reviewer_load = self._reviewer_load(db)

        return {
            "total_prs": total_prs,
            "critical_prs_count": critical_prs,
            "blocked_prs_count": blocked_prs_count,
            "repositories_count": repositories_count,
            "avg_review_time_hours": avg_review_time_hours,
            "avg_merge_time_days": avg_merge_time_days,
            "reviewer_load": reviewer_load
        }

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
        review. Returns None (rather than a fabricated number) if
        no PRs have a recorded first_review_at yet — that field is
        only populated once review-timestamp sync is implemented.
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

    def _reviewer_load(self, db: Session):
        """
        Reviewer workload snapshot. Reflects whatever Reviewer rows
        currently exist in the database — reviewer records aren't
        populated by the sync flow yet, so this returns an empty
        list until that's built.
        """

        reviewers = db.query(Reviewer).all()

        return [
            {
                "username": r.username,
                "pending_reviews": r.pending_reviews,
                "workload_score": r.workload_score
            }
            for r in reviewers
        ]
