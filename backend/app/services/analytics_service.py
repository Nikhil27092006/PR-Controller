from collections import defaultdict
from datetime import datetime, timedelta

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.models.pull_request import PullRequest
from app.models.repository import Repository
from app.models.dependency import Dependency
from app.models.user import User
from app.utils.logger import get_logger

logger = get_logger(__name__)

RANGE_TO_WEEKS = {
    "2W": 2,
    "4W": 4,
    "6W": 6,
    "3M": 13  # ~3 months
}


def _week_start(dt: datetime) -> datetime:
    """Normalizes a datetime to the Monday of its week, midnight."""
    d = dt.date() - timedelta(days=dt.weekday())
    return datetime(d.year, d.month, d.day)


def _week_label(week_start: datetime) -> str:
    # Deliberately avoids %-d / %#d (platform-specific "no leading
    # zero" format codes — %-d is POSIX-only, %#d is Windows-only,
    # neither works on both). This is portable everywhere.
    return f"{week_start.strftime('%b')} {week_start.day}"


class AnalyticsService:

    def get_engineering_analytics(
        self,
        db: Session,
        user: User,
        range_key: str = "6W",
        repository_id: int | None = None
    ):
        """
        Real weekly trend data computed from stored PR and
        dependency timestamps — no fabricated numbers, and no new
        GitHub API calls (this is pure aggregation over data that's
        already synced).

        Note on "Bottleneck Frequency": a PR's blocked status is a
        live/current condition, not something timestamped in the
        database, so it can't be reconstructed historically (we
        don't know how many PRs were blocked in week 3 after the
        fact). This uses "dependency links created per week" as a
        real, timestamped proxy instead — every value here is
        genuine data, just a different (and honestly labeled)
        measure than a literal historical blocked-PR count.
        """

        try:

            weeks = RANGE_TO_WEEKS.get(range_key, 6)
            range_start = _week_start(
                datetime.utcnow() - timedelta(weeks=weeks)
            )

            pr_query = (
                db.query(PullRequest)
                .join(Repository)
                .filter(Repository.user_id == user.id)
                .filter(PullRequest.created_at >= range_start)
            )

            if repository_id is not None:
                pr_query = pr_query.filter(
                    PullRequest.repository_id == repository_id
                )

            prs = pr_query.all()

            dep_query = (
                db.query(Dependency)
                .join(
                    PullRequest,
                    PullRequest.id == Dependency.target_pr_id
                )
                .join(
                    Repository,
                    Repository.id == PullRequest.repository_id
                )
                .filter(Repository.user_id == user.id)
                .filter(Dependency.created_at >= range_start)
            )

            if repository_id is not None:
                dep_query = dep_query.filter(
                    PullRequest.repository_id == repository_id
                )

            dependencies = dep_query.all()

            week_starts = [
                range_start + timedelta(weeks=i)
                for i in range(weeks)
            ]

            review_time_by_week = defaultdict(list)
            merge_time_by_week = defaultdict(list)
            created_by_week = defaultdict(int)
            closed_by_week = defaultdict(int)
            blockers_by_week = defaultdict(int)

            for pr in prs:

                created_week = _week_start(pr.created_at)
                created_by_week[created_week] += 1

                if pr.first_review_at:
                    hours = (
                        pr.first_review_at - pr.created_at
                    ).total_seconds() / 3600
                    review_time_by_week[_week_start(pr.first_review_at)].append(hours)

                if pr.merged_at:
                    hours = (
                        pr.merged_at - pr.created_at
                    ).total_seconds() / 3600
                    merge_time_by_week[_week_start(pr.merged_at)].append(hours)
                    closed_by_week[_week_start(pr.merged_at)] += 1
                elif pr.closed_at:
                    closed_by_week[_week_start(pr.closed_at)] += 1

            for dep in dependencies:
                blockers_by_week[_week_start(dep.created_at)] += 1

            def avg_or_none(values):
                return round(sum(values) / len(values), 1) if values else None

            review_time_trend = [
                {
                    "week": _week_label(w),
                    "value": avg_or_none(review_time_by_week.get(w, []))
                }
                for w in week_starts
            ]

            merge_time_trend = [
                {
                    "week": _week_label(w),
                    "value": avg_or_none(merge_time_by_week.get(w, []))
                }
                for w in week_starts
            ]

            blockers_trend = [
                {
                    "week": _week_label(w),
                    "value": blockers_by_week.get(w, 0)
                }
                for w in week_starts
            ]

            pr_volume_trend = [
                {
                    "week": _week_label(w),
                    "created": created_by_week.get(w, 0),
                    "closed": closed_by_week.get(w, 0)
                }
                for w in week_starts
            ]

            all_review_hours = [
                h for values in review_time_by_week.values() for h in values
            ]
            all_merge_hours = [
                h for values in merge_time_by_week.values() for h in values
            ]

            summary = {
                "avg_review_time_hours": avg_or_none(all_review_hours),
                "avg_merge_time_hours": avg_or_none(all_merge_hours),
                "prs_created": len(prs),
                "blockers_detected": sum(blockers_by_week.values())
            }

            return {
                "range": range_key,
                "summary": summary,
                "review_time_trend": review_time_trend,
                "merge_time_trend": merge_time_trend,
                "blockers_trend": blockers_trend,
                "pr_volume_trend": pr_volume_trend
            }

        except SQLAlchemyError:
            logger.error(
                "Database error building engineering analytics for "
                "user_id=%s", user.id, exc_info=True
            )
            raise
