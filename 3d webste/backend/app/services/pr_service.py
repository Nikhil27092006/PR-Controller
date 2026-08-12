from app.services.github_service import GitHubService
from app.services.priority_service import PriorityService


class PRService:

    def __init__(self):

        self.github = GitHubService()
        self.priority = PriorityService()

    def get_ranked_prs(self,owner: str, repo: str):

        prs = self.github.fetch_pull_requests(
            owner,
            repo
        )

        ranked_prs = self.priority.score_multiple_prs(prs)

        ranked_prs.sort(
            key=lambda x: x["priority_score"],
            reverse=True
        )

        return ranked_prs