import requests

from app.config.settings import settings


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

        url = (
            f"{self.BASE_URL}"
            f"/repos/{owner}/{repo}/pulls"
        )

        response = requests.get(
            url,
            headers=self._headers()
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
