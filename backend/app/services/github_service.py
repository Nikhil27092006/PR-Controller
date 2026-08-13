import requests

from app.config.settings import settings
from app.constants.github_constants import (
    ALL_STATE,
    DEFAULT_PER_PAGE
)


class GitHubService:

    BASE_URL = "https://api.github.com"

    def _headers(self):

        return {
            "Authorization": f"Bearer {settings.GITHUB_TOKEN}",
            "Accept": "application/vnd.github+json"
        }

    def fetch_pull_requests(
        self,
        owner: str,
        repo: str
    ):
        """
        Fetches pull requests for a repo. Uses state=all so merged
        and closed PRs come back too (GitHub defaults to open-only),
        which is needed for merge-time / review-time metrics.
        """

        url = (
            f"{self.BASE_URL}"
            f"/repos/{owner}/{repo}/pulls"
        )

        response = requests.get(
            url,
            headers=self._headers(),
            params={
                "state": ALL_STATE,
                "per_page": DEFAULT_PER_PAGE
            }
        )

        response.raise_for_status()

        return response.json()

    def fetch_repositories(self):

        url = f"{self.BASE_URL}/user/repos"

        response = requests.get(
            url,
            headers=self._headers()
        )

        response.raise_for_status()

        return response.json()

    def fetch_repository(
        self,
        owner: str,
        repo: str
    ):
        """
        Fetches metadata for a single repository by owner/name.
        Used when a user adds a new repository so we can validate
        it exists and pull its real GitHub id, description, and
        default branch.
        """

        url = f"{self.BASE_URL}/repos/{owner}/{repo}"

        response = requests.get(
            url,
            headers=self._headers()
        )

        response.raise_for_status()

        return response.json()
