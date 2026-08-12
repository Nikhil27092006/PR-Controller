from app.database.session import SessionLocal
from app.models.pull_request import PullRequest
from app.models.repository import Repository


class DashboardService:

    def get_dashboard(self):

        db = SessionLocal()

        try:

            total_prs = db.query(
                PullRequest
            ).count()

            critical_prs = db.query(
                PullRequest
            ).filter(
                PullRequest.priority_level == "Critical"
            ).count()

            blocked_prs = db.query(
                PullRequest
            ).filter(
                PullRequest.status == "Blocked"
            ).count()

            repositories = db.query(
                Repository
            ).count()

            return {
                "total_prs": total_prs,
                "critical_prs_count": critical_prs,
                "blocked_prs_count": blocked_prs,
                "repositories_count": repositories
            }

        finally:
            db.close()