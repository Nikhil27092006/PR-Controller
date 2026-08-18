from fastapi import HTTPException, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.models.repository import Repository
from app.models.pull_request import PullRequest
from app.models.reviewer import Reviewer
from app.models.pr_reviewer import PRReviewer
from app.models.alert import Alert
from app.models.user import User
from app.services.github_service import GitHubService
from app.services.github_exceptions import (
    GitHubAuthError,
    GitHubRateLimitError,
    GitHubNotFoundError,
    GitHubNetworkError,
    GitHubServiceError
)
from app.services.sync_service import SyncService
from app.utils.logger import get_logger

logger = get_logger(__name__)


class RepositoryService:

    def __init__(self):

        self.github = GitHubService()
        self.sync_service = SyncService()

    def get_repositories(
        self,
        db: Session,
        user: User
    ):
        """
        Lists repositories the given user has added, read from the
        database (not a live GitHub call on every request).
        """

        try:
            return (
                db.query(Repository)
                .filter(Repository.user_id == user.id)
                .all()
            )

        except SQLAlchemyError:
            logger.error(
                "Database error listing repositories for user_id=%s",
                user.id, exc_info=True
            )
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Could not load your repositories right now. Please try again."
            )

    def add_repository(
        self,
        db: Session,
        user: User,
        owner: str,
        name: str
    ) -> Repository:

        try:
            existing = (
                db.query(Repository)
                .filter(Repository.user_id == user.id)
                .filter(Repository.owner == owner)
                .filter(Repository.name == name)
                .first()
            )
        except SQLAlchemyError:
            logger.error(
                "Database error checking for existing repo %s/%s "
                "(user_id=%s)", owner, name, user.id, exc_info=True
            )
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="A database error occurred. Please try again."
            )

        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"{owner}/{name} is already added"
            )

        # Each GitHub error type gets its own accurate response
        # instead of a blanket "not found" — a rate-limited or
        # unauthorized request is a very different problem for the
        # user than a repo that genuinely doesn't exist.
        #
        # Use the user's own OAuth token (if they have one) to
        # validate the repo — the server-wide token may not have
        # access to their private repos. Falls back to the
        # server-wide token when the user has no OAuth token
        # (password-only account).
        per_user_github = GitHubService(
            access_token=user.github_access_token
        )

        try:
            repo_data = per_user_github.fetch_repository(owner, name)

        except GitHubNotFoundError:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=(
                    f"Could not find {owner}/{name} on GitHub, or "
                    "it isn't accessible with the configured token"
                )
            )

        except GitHubAuthError as exc:
            logger.error("GitHub auth error adding %s/%s: %s", owner, name, exc)
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=(
                    "The server's GitHub token is invalid or lacks "
                    "access. Contact your administrator."
                )
            )

        except GitHubRateLimitError as exc:
            logger.warning("GitHub rate limit adding %s/%s: %s", owner, name, exc)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="GitHub API rate limit reached. Please try again shortly."
            )

        except GitHubNetworkError as exc:
            logger.error("GitHub network error adding %s/%s: %s", owner, name, exc)
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Could not reach GitHub right now. Please try again."
            )

        except GitHubServiceError as exc:
            logger.error("GitHub error adding %s/%s: %s", owner, name, exc)
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="GitHub returned an unexpected error. Please try again."
            )

        try:
            db_repo = Repository(
                user_id=user.id,
                github_repo_id=repo_data["id"],
                owner=owner,
                name=name,
                full_name=repo_data["full_name"],
                description=repo_data.get("description"),
                default_branch=repo_data.get("default_branch", "main")
            )

            db.add(db_repo)
            db.commit()
            db.refresh(db_repo)

        except SQLAlchemyError:
            db.rollback()
            logger.error(
                "Database error saving new repo %s/%s (user_id=%s)",
                owner, name, user.id, exc_info=True
            )
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Could not save the repository. Please try again."
            )

        # Sync immediately so the repo isn't empty until the next
        # scheduled background sync runs. Failures here are logged
        # but don't fail the add — the repo is already saved and
        # will pick up data on the next scheduled sync.
        try:
            self.sync_service.sync_repository(db, db_repo)

        except GitHubServiceError as exc:
            logger.warning(
                "Initial sync failed for %s (will retry on next "
                "scheduled sync): %s", db_repo.full_name, exc
            )

        except SQLAlchemyError:
            db.rollback()
            logger.error(
                "Database error during initial sync of %s",
                db_repo.full_name, exc_info=True
            )

        return db_repo

    def delete_repository(
        self,
        db: Session,
        user: User,
        repository_id: int
    ):

        try:
            db_repo = (
                db.query(Repository)
                .filter(Repository.id == repository_id)
                .filter(Repository.user_id == user.id)
                .first()
            )

            if not db_repo:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Repository not found"
                )

            full_name = db_repo.full_name

            db.delete(db_repo)
            db.commit()

            return {"message": f"{full_name} removed"}

        except HTTPException:
            raise

        except SQLAlchemyError:
            db.rollback()
            logger.error(
                "Database error deleting repository_id=%s "
                "(user_id=%s)", repository_id, user.id, exc_info=True
            )
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Could not remove the repository. Please try again."
            )

    def get_repository_detail(
        self,
        db: Session,
        user: User,
        repository_id: int
    ):
        try:
            db_repo = (
                db.query(Repository)
                .filter(Repository.id == repository_id)
                .filter(Repository.user_id == user.id)
                .first()
            )

            if not db_repo:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Repository not found"
                )

            prs = (
                db.query(PullRequest)
                .filter(PullRequest.repository_id == db_repo.id)
                .order_by(PullRequest.priority_score.desc(), PullRequest.created_at.desc())
                .all()
            )

            total_prs = len(prs)
            open_prs = sum(1 for p in prs if p.status in ('open', 'blocked'))
            merged_prs = sum(1 for p in prs if p.status == 'merged')
            closed_prs = sum(1 for p in prs if p.status == 'closed')
            blocked_prs = sum(1 for p in prs if p.status == 'blocked' or p.is_blocking)
            merge_conflicts_count = sum(1 for p in prs if p.merge_conflict)
            failing_checks_count = sum(1 for p in prs if p.failing_checks)

            critical_prs = sum(1 for p in prs if p.priority_level == 'Critical')
            high_prs = sum(1 for p in prs if p.priority_level == 'High')
            medium_prs = sum(1 for p in prs if p.priority_level == 'Medium')
            low_prs = sum(1 for p in prs if p.priority_level == 'Low')

            turnaround_hours = []
            for p in prs:
                if p.merged_at and p.created_at:
                    diff = (p.merged_at - p.created_at).total_seconds() / 3600.0
                    turnaround_hours.append(diff)
                elif p.first_review_at and p.created_at:
                    diff = (p.first_review_at - p.created_at).total_seconds() / 3600.0
                    turnaround_hours.append(diff)

            avg_turnaround = round(sum(turnaround_hours) / len(turnaround_hours), 1) if turnaround_hours else None
            merge_rate = round((merged_prs / total_prs * 100), 1) if total_prs > 0 else 0.0

            base_score = 100
            if total_prs > 0:
                base_score -= min(35, blocked_prs * 12)
                base_score -= min(30, merge_conflicts_count * 10)
                base_score -= min(20, failing_checks_count * 8)
                if critical_prs > 0 and open_prs > 0:
                    crit_ratio = critical_prs / open_prs
                    if crit_ratio > 0.5:
                        base_score -= 15
                    elif crit_ratio > 0.25:
                        base_score -= 8
            health_score = max(15, min(100, base_score))

            if health_score >= 90:
                health_grade = 'A+'
                health_status = 'Optimal Health'
            elif health_score >= 80:
                health_grade = 'A'
                health_status = 'Good Standing'
            elif health_score >= 70:
                health_grade = 'B'
                health_status = 'Minor Bottlenecks'
            elif health_score >= 50:
                health_grade = 'C'
                health_status = 'Action Required'
            else:
                health_grade = 'D'
                health_status = 'Critical Attention'

            pr_ids = [p.id for p in prs]
            repo_reviewers = []
            if pr_ids:
                assignments = (
                    db.query(PRReviewer, Reviewer)
                    .join(Reviewer, PRReviewer.reviewer_id == Reviewer.id)
                    .filter(PRReviewer.pull_request_id.in_(pr_ids))
                    .all()
                )
                reviewer_map = {}
                for pr_rev, rev in assignments:
                    if rev.id not in reviewer_map:
                        reviewer_map[rev.id] = {
                            "id": rev.id,
                            "username": rev.username,
                            "pending_reviews": rev.pending_reviews,
                            "completed_reviews": rev.completed_reviews,
                            "capacity": rev.capacity or 5,
                            "assigned_count": 0,
                            "status": pr_rev.status
                        }
                    reviewer_map[rev.id]["assigned_count"] += 1
                repo_reviewers = list(reviewer_map.values())

            repo_alerts = []
            if pr_ids:
                db_alerts = (
                    db.query(Alert)
                    .filter(Alert.user_id == user.id)
                    .filter(Alert.pull_request_id.in_(pr_ids))
                    .order_by(Alert.created_at.desc())
                    .limit(20)
                    .all()
                )
                repo_alerts = [
                    {
                        "id": a.id,
                        "title": a.title,
                        "message": a.message,
                        "severity": a.severity,
                        "alert_type": a.alert_type,
                        "is_read": a.is_read,
                        "created_at": a.created_at.isoformat() if a.created_at else None,
                        "pull_request_id": a.pull_request_id
                    }
                    for a in db_alerts
                ]

            formatted_prs = [
                {
                    "id": p.id,
                    "github_pr_number": p.github_pr_number,
                    "title": p.title,
                    "author": p.author,
                    "status": p.status,
                    "priority_score": p.priority_score,
                    "priority_level": p.priority_level,
                    "created_at": p.created_at.isoformat() if p.created_at else None,
                    "merged_at": p.merged_at.isoformat() if p.merged_at else None,
                    "closed_at": p.closed_at.isoformat() if p.closed_at else None,
                    "merge_conflict": p.merge_conflict,
                    "failing_checks": p.failing_checks,
                    "is_blocking": p.is_blocking,
                    "review_count": p.review_count,
                    "blocked_count": p.blocked_count,
                    "priority_breakdown": p.priority_breakdown or []
                }
                for p in prs
            ]

            return {
                "id": db_repo.id,
                "github_repo_id": db_repo.github_repo_id,
                "owner": db_repo.owner,
                "name": db_repo.name,
                "full_name": db_repo.full_name,
                "default_branch": db_repo.default_branch or "main",
                "description": db_repo.description,
                "created_at": db_repo.created_at,
                "last_synced_at": db_repo.last_synced_at,
                "total_prs": total_prs,
                "open_prs": open_prs,
                "merged_prs": merged_prs,
                "closed_prs": closed_prs,
                "blocked_prs": blocked_prs,
                "merge_conflicts_count": merge_conflicts_count,
                "failing_checks_count": failing_checks_count,
                "critical_prs": critical_prs,
                "high_prs": high_prs,
                "medium_prs": medium_prs,
                "low_prs": low_prs,
                "health_score": health_score,
                "health_grade": health_grade,
                "health_status": health_status,
                "avg_turnaround_hours": avg_turnaround,
                "merge_rate_pct": merge_rate,
                "pull_requests": formatted_prs,
                "reviewers": repo_reviewers,
                "alerts": repo_alerts
            }

        except HTTPException:
            raise
        except SQLAlchemyError:
            logger.error("Database error retrieving repo detail %s (user_id=%s)", repository_id, user.id, exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Could not load repository detail right now."
            )

    def sync_single_repo(
        self,
        db: Session,
        user: User,
        repository_id: int
    ):
        db_repo = (
            db.query(Repository)
            .filter(Repository.id == repository_id)
            .filter(Repository.user_id == user.id)
            .first()
        )
        if not db_repo:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Repository not found"
            )

        try:
            self.sync_service.sync_repository(db, db_repo)
            return self.get_repository_detail(db, user, repository_id)
        except GitHubServiceError as exc:
            logger.error("GitHub sync failed for %s: %s", db_repo.full_name, exc)
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"GitHub sync failed: {str(exc)}"
            )
        except SQLAlchemyError:
            db.rollback()
            logger.error("Database error during sync for %s", db_repo.full_name, exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database error while syncing repository."
            )

