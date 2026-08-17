from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.models.dependency import Dependency
from app.models.pull_request import PullRequest
from app.models.repository import Repository
from app.models.user import User
from app.utils.logger import get_logger

logger = get_logger(__name__)

NODE_X_SPACING = 260
NODE_Y_SPACING = 120

PRIORITY_COLORS = {
    "Critical": "#fbbf24",
    "High": "#60a5fa",
    "Medium": "#a855f7",
    "Low": "#34d399"
}


class DependencyGraphService:

    def get_graph_for_user(self, db: Session, user: User):
        """
        Returns { nodes: [...], edges: [...] } describing every PR
        dependency chain across this user's repositories, in the
        shape reactflow expects directly.
        """

        try:

            dependencies = (
                db.query(Dependency)
                .join(
                    PullRequest,
                    PullRequest.id == Dependency.source_pr_id
                )
                .join(
                    Repository,
                    Repository.id == PullRequest.repository_id
                )
                .filter(Repository.user_id == user.id)
                .all()
            )

            if not dependencies:
                return {"nodes": [], "edges": []}

            pr_ids = set()
            for dep in dependencies:
                pr_ids.add(dep.source_pr_id)
                pr_ids.add(dep.target_pr_id)

            prs = (
                db.query(PullRequest)
                .filter(PullRequest.id.in_(pr_ids))
                .all()
            )

            pr_by_id = {pr.id: pr for pr in prs}

            levels = self._compute_levels(dependencies, pr_ids)

            nodes = []
            level_counts: dict[int, int] = {}

            for pr_id in pr_ids:

                pr = pr_by_id.get(pr_id)

                if not pr:
                    continue

                level = levels.get(pr_id, 0)
                row = level_counts.get(level, 0)
                level_counts[level] = row + 1

                nodes.append({
                    "id": str(pr_id),
                    "position": {
                        "x": level * NODE_X_SPACING,
                        "y": row * NODE_Y_SPACING
                    },
                    "data": {
                        "label": f"#{pr.github_pr_number} {pr.title}",
                        "prNumber": pr.github_pr_number,
                        "title": pr.title,
                        "status": pr.status,
                        "priorityLevel": pr.priority_level,
                        "priorityScore": pr.priority_score,
                        "color": PRIORITY_COLORS.get(
                            pr.priority_level, "#94a3b8"
                        ),
                        "repositoryId": pr.repository_id
                    }
                })

            edges = [
                {
                    "id": f"e{dep.id}",
                    "source": str(dep.source_pr_id),
                    "target": str(dep.target_pr_id),
                    "animated": (
                        pr_by_id.get(dep.source_pr_id) is not None
                        and pr_by_id[dep.source_pr_id].status != "merged"
                    )
                }
                for dep in dependencies
            ]

            return {"nodes": nodes, "edges": edges}

        except SQLAlchemyError:
            logger.error(
                "Database error building dependency graph for "
                "user_id=%s", user.id, exc_info=True
            )
            raise

    def _compute_levels(self, dependencies, pr_ids) -> dict[int, int]:
        """
        Assigns each PR a "level" = longest chain of dependencies
        leading into it (0 for a PR with no unmerged prerequisites
        in this set). Used purely for left-to-right visual layout.
        Guards against cycles (shouldn't happen, but bad data or a
        sync glitch could theoretically create one) by tracking the
        current recursion path instead of looping forever.
        """

        incoming: dict[int, list[int]] = {pr_id: [] for pr_id in pr_ids}

        for dep in dependencies:
            incoming[dep.target_pr_id].append(dep.source_pr_id)

        levels: dict[int, int] = {}

        def resolve(pr_id, visiting):

            if pr_id in levels:
                return levels[pr_id]

            if pr_id in visiting:
                # Cycle detected — treat as level 0 rather than
                # recursing forever.
                return 0

            visiting.add(pr_id)

            prereqs = incoming.get(pr_id, [])

            if not prereqs:
                level = 0
            else:
                level = 1 + max(
                    resolve(p, visiting) for p in prereqs
                )

            visiting.discard(pr_id)
            levels[pr_id] = level

            return level

        for pr_id in pr_ids:
            resolve(pr_id, set())

        return levels
