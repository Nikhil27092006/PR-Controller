import requests

from app.constants.github_constants import (
    GITHUB_API_BASE_URL
)


def build_headers(token: str):

    return {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json"
    }


def build_repo_url(owner: str, repo: str):

    return (
        f"{GITHUB_API_BASE_URL}"
        f"/repos/{owner}/{repo}"
    )


def make_request(url: str, headers: dict):

    response = requests.get(
        url,
        headers=headers
    )

    response.raise_for_status()

    return response.json()