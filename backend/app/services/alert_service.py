from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.models.alert import Alert
from app.models.pull_request import PullRequest
from app.models.repository import Repository
from app.models.dependency import Dependency
from app.models.user import User
from app.services.reviewer_service import ReviewerService
from app.utils.logger import get_logger

logger = get_logger(__name__)


class AlertService:

    def __init__(self):
        self.reviewer_service = ReviewerService()

    def generate_alerts_for_user(self, db: Session, user: User):
        """
        Recomputes alerts from current data for this user's repos.
        Idempotent: won't create duplicate alerts for a condition
        that's already flagged, and clears alerts whose underlying
        condition no longer holds (e.g. a critical PR that merged,
        a reviewer who's no longer overloaded).

        Called after each sync so alerts stay current; also safe to
        call on-demand from the alerts route.
        """

        try:
            self._generate_critical_pr_alerts(db, user)
            self._generate_merge_conflict_alerts(db, user)
            self._generate_blocked_dependency_alerts(db, user)
            self._generate_reviewer_overload_alerts(db, user)

            db.commit()

        except SQLAlchemyError:
            db.rollback()
            logger.error(
                "Database error generating alerts for user_id=%s",
                user.id, exc_info=True
            )
            raise

    def get_alerts_for_user(
        self,
        db: Session,
        user: User,
        unread_only: bool = False
    ):

        try:
            query = (
                db.query(Alert)
                .filter(Alert.user_id == user.id)
            )

            if unread_only:
                query = query.filter(Alert.is_read.is_(False))

            return query.order_by(Alert.created_at.desc()).all()

        except SQLAlchemyError:
            logger.error(
                "Database error fetching alerts for user_id=%s",
                user.id, exc_info=True
            )
            raise

    def mark_read(self, db: Session, user: User, alert_id: int):

        try:
            alert = (
                db.query(Alert)
                .filter(Alert.id == alert_id)
                .filter(Alert.user_id == user.id)
                .first()
            )

            if not alert:
                return None

            alert.is_read = True
            db.commit()

            return alert

        except SQLAlchemyError:
            db.rollback()
            logger.error(
                "Database error marking alert_id=%s read (user_id=%s)",
                alert_id, user.id, exc_info=True
            )
            raise

    def mark_all_read(self, db: Session, user: User):

        try:
            (
                db.query(Alert)
                .filter(Alert.user_id == user.id)
                .filter(Alert.is_read.is_(False))
                .update({"is_read": True})
            )
            db.commit()

        except SQLAlchemyError:
            db.rollback()
            logger.error(
                "Database error marking all alerts read for "
                "user_id=%s", user.id, exc_info=True
            )
            raise

    # ---- individual alert generators ----

    def _existing_open_alert(
        self,
        db: Session,
        user: User,
        alert_type: str,
        pull_request_id: int | None = None,
        reviewer_id: int | None = None
    ):

        query = (
            db.query(Alert)
            .filter(Alert.user_id == user.id)
            .filter(Alert.alert_type == alert_type)
        )

        if pull_request_id is not None:
            query = query.filter(Alert.pull_request_id == pull_request_id)

        if reviewer_id is not None:
            query = query.filter(Alert.reviewer_id == reviewer_id)

        return query.first()

    def _generate_critical_pr_alerts(self, db: Session, user: User):

        critical_prs = (
            db.query(PullRequest)
            .join(Repository)
            .filter(Repository.user_id == user.id)
            .filter(PullRequest.priority_level == "Critical")
            .filter(PullRequest.status != "merged")
            .filter(PullRequest.status != "closed")
            .all()
        )

        active_pr_ids = {pr.id for pr in critical_prs}

        for pr in critical_prs:

            if self._existing_open_alert(
                db, user, "critical_pr", pull_request_id=pr.id
            ):
                continue

            db.add(Alert(
                user_id=user.id,
                alert_type="critical_pr",
                severity="critical",
                title=f"Critical PR needs attention: #{pr.github_pr_number}",
                message=f'"{pr.title}" has a priority score of {pr.priority_score}.',
                pull_request_id=pr.id
            ))

        self._clear_stale(
            db, user, "critical_pr", still_valid_pr_ids=active_pr_ids
        )

    def _generate_merge_conflict_alerts(self, db: Session, user: User):

        conflicted_prs = (
            db.query(PullRequest)
            .join(Repository)
            .filter(Repository.user_id == user.id)
            .filter(PullRequest.merge_conflict.is_(True))
            .filter(PullRequest.status != "merged")
            .filter(PullRequest.status != "closed")
            .all()
        )

        active_pr_ids = {pr.id for pr in conflicted_prs}

        for pr in conflicted_prs:

            if self._existing_open_alert(
                db, user, "merge_conflict", pull_request_id=pr.id
            ):
                continue

            db.add(Alert(
                user_id=user.id,
                alert_type="merge_conflict",
                severity="warning",
                title=f"Merge conflict: #{pr.github_pr_number}",
                message=f'"{pr.title}" has a merge conflict with its base branch.',
                pull_request_id=pr.id
            ))

        self._clear_stale(
            db, user, "merge_conflict", still_valid_pr_ids=active_pr_ids
        )

    def _generate_blocked_dependency_alerts(self, db: Session, user: User):

        # A PR is blocked if it has an incoming dependency (something
        # it depends on) that hasn't merged yet.
        blocked_links = (
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
            .all()
        )

        active_pr_ids = set()

        for dep in blocked_links:

            blocking_pr = dep.source_pr
            blocked_pr = dep.target_pr

            if blocking_pr.status == "merged":
                continue

            active_pr_ids.add(blocked_pr.id)

            if self._existing_open_alert(
                db, user, "blocked_dependency",
                pull_request_id=blocked_pr.id
            ):
                continue

            db.add(Alert(
                user_id=user.id,
                alert_type="blocked_dependency",
                severity="warning",
                title=f"PR #{blocked_pr.github_pr_number} is blocked",
                message=(
                    f'Waiting on #{blocking_pr.github_pr_number} '
                    f'("{blocking_pr.title}") to merge first.'
                ),
                pull_request_id=blocked_pr.id
            ))

        self._clear_stale(
            db, user, "blocked_dependency", still_valid_pr_ids=active_pr_ids
        )

    def _generate_reviewer_overload_alerts(self, db: Session, user: User):

        workload = self.reviewer_service.get_workload_for_user(db, user)

        overloaded = [r for r in workload if r["is_overloaded"]]

        active_reviewer_ids = {r["reviewer_id"] for r in overloaded}

        for reviewer_data in overloaded:

            reviewer_id = reviewer_data["reviewer_id"]

            if self._existing_open_alert(
                db, user, "reviewer_overload", reviewer_id=reviewer_id
            ):
                continue

            db.add(Alert(
                user_id=user.id,
                alert_type="reviewer_overload",
                severity="warning",
                title=(
                    f'{reviewer_data["username"]} is overloaded '
                    f'({reviewer_data["load_percent"]}%)'
                ),
                message=(
                    f'{reviewer_data["assigned_count"]} PRs assigned '
                    f'against a capacity of {reviewer_data["capacity"]}.'
                ),
                reviewer_id=reviewer_id
            ))

        self._clear_stale(
            db, user, "reviewer_overload",
            still_valid_reviewer_ids=active_reviewer_ids
        )

    def _clear_stale(
        self,
        db: Session,
        user: User,
        alert_type: str,
        still_valid_pr_ids: set | None = None,
        still_valid_reviewer_ids: set | None = None
    ):
        """
        Deletes alerts of this type whose underlying condition no
        longer holds (PR merged, conflict resolved, dependency
        cleared, reviewer no longer overloaded).
        """

        existing_alerts = (
            db.query(Alert)
            .filter(Alert.user_id == user.id)
            .filter(Alert.alert_type == alert_type)
            .all()
        )

        for alert in existing_alerts:

            if still_valid_pr_ids is not None:
                if alert.pull_request_id not in still_valid_pr_ids:
                    db.delete(alert)
                    continue

            if still_valid_reviewer_ids is not None:
                if alert.reviewer_id not in still_valid_reviewer_ids:
                    db.delete(alert)
                    continue
