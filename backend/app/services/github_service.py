import requests

from app.config.settings import settings
from app.constants.github_constants import (
    ALL_STATE,
    DEFAULT_PER_PAGE
)
from app.services.github_exceptions import (
    GitHubAuthError,
    GitHubRateLimitError,
    GitHubNotFoundError,
    GitHubNetworkError,
    GitHubServiceError
)
from app.utils.logger import get_logger

logger = get_logger(__name__)

# Every GitHub call gets a timeout so a hung connection can't block
# the sync job (or a request handler) forever.
REQUEST_TIMEOUT_SECONDS = 15

# Safety cap on pull-request pagination: 5 pages x 100 per page =
# 500 PRs max per repo per sync. Prevents one very large/old repo
# from making a single sync run unboundedly long or exhausting memory/rate limits.
MAX_PR_PAGES = 5


class GitHubService:

    BASE_URL = "https://api.github.com"

    def __init__(self, access_token: str | None = None):
        self._access_token = access_token

    def _headers(self):
        token = self._access_token or settings.GITHUB_TOKEN
        return {
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github+json",
            "User-Agent": "PRFlow-Intelligence/1.0"
        }

    def _request(self, method: str, url: str, **kwargs):
        """
        Central request wrapper. Every GitHubService method routes
        through here so error handling (auth, rate limit, not
        found, network failure) only has to be written once.
        """

        try:

            response = requests.request(
                method,
                url,
                headers=self._headers(),
                timeout=REQUEST_TIMEOUT_SECONDS,
                **kwargs
            )

        except requests.exceptions.Timeout as exc:
            logger.error("GitHub request timed out: %s", url)
            raise GitHubNetworkError(
                f"GitHub API request to {url} timed out"
            ) from exc

        except requests.exceptions.ConnectionError as exc:
            logger.error("GitHub connection failed: %s (%s)", url, exc)
            raise GitHubNetworkError(
                "Could not reach GitHub — check your internet "
                "connection or GitHub's status"
            ) from exc

        except requests.exceptions.RequestException as exc:
            logger.error("GitHub request failed: %s (%s)", url, exc)
            raise GitHubNetworkError(str(exc)) from exc

        if response.status_code == 401:
            logger.error("GitHub auth failed (401) for %s", url)
            raise GitHubAuthError(
                "GitHub rejected the configured GITHUB_TOKEN "
                "(invalid or expired). Update it in your .env."
            )

        if response.status_code == 403:
            remaining = response.headers.get("X-RateLimit-Remaining")
            if remaining == "0":
                reset_at = response.headers.get("X-RateLimit-Reset")
                logger.warning(
                    "GitHub rate limit hit, resets at %s", reset_at
                )
                raise GitHubRateLimitError(
                    "GitHub API rate limit exceeded",
                    reset_at=int(reset_at) if reset_at else None
                )
            logger.error("GitHub returned 403 for %s", url)
            raise GitHubAuthError(
                "GitHub denied access — the token may lack the "
                "required scope for this repository."
            )

        if response.status_code == 404:
            logger.warning("GitHub 404 for %s", url)
            raise GitHubNotFoundError(
                "Repository not found on GitHub, or the token "
                "doesn't have access to it"
            )

        if response.status_code == 429:
            logger.warning("GitHub secondary rate limit for %s", url)
            raise GitHubRateLimitError(
                "GitHub secondary rate limit hit — too many "
                "requests too quickly"
            )

        if not response.ok:
            logger.error(
                "GitHub returned unexpected status %s for %s",
                response.status_code, url
            )
            raise GitHubServiceError(
                f"GitHub API returned {response.status_code} "
                f"for {url}"
            )

        return response

    def fetch_pull_requests(
        self,
        owner: str,
        repo: str
    ):
        """
        Fetches pull requests for a repo. Uses state=all so merged
        and closed PRs come back too (GitHub defaults to open-only),
        which is needed for merge-time / review-time metrics.

        Follows GitHub's Link-header pagination rather than silently
        truncating at the first page (100 results) — a repo with
        more than 100 PRs would otherwise only ever sync its most
        recent 100. Capped at MAX_PR_PAGES pages (2,000 PRs) as a
        safety limit so one huge, long-lived repo can't make a
        single sync run indefinitely or exhaust the rate limit on
        its own.
        """

        url = f"{self.BASE_URL}/repos/{owner}/{repo}/pulls"

        params = {
            "state": ALL_STATE,
            "per_page": DEFAULT_PER_PAGE
        }

        all_prs = []
        page_count = 0

        while url and page_count < MAX_PR_PAGES:

            response = self._request("GET", url, params=params)

            all_prs.extend(response.json())
            page_count += 1

            url = self._next_page_url(response)
            params = None  # already encoded in the Link header's URL

        if url:
            logger.warning(
                "Stopped paginating pull requests for %s/%s after "
                "%d pages (%d PRs) — repo may have more PRs than "
                "were fetched this sync",
                owner, repo, page_count, len(all_prs)
            )

        return all_prs

    def _next_page_url(self, response) -> str | None:
        """
        Parses the "next" URL out of GitHub's Link response header,
        e.g. '<https://api.github.com/...&page=2>; rel="next", ...'
        Returns None when there's no next page (last page reached).
        """

        link_header = response.headers.get("Link")

        if not link_header:
            return None

        for part in link_header.split(","):
            section = part.split(";")
            if len(section) < 2:
                continue
            url_part = section[0].strip().strip("<>")
            rel_part = section[1].strip()
            if rel_part == 'rel="next"':
                return url_part

        return None

    def fetch_repositories(self):

        url = f"{self.BASE_URL}/user/repos"

        response = self._request("GET", url)

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

        response = self._request("GET", url)

        return response.json()

    def validate_token(self) -> dict:
        """
        Hits /user with the configured GITHUB_TOKEN and returns the
        JSON response (login, id, scopes, etc.). Raises GitHubAuthError
        on 401, GitHubNetworkError on connectivity issues, and
        GitHubRateLimitError if the token is already exhausted.
        Used by the FastAPI startup hook so a missing or bad token
        fails the app boot loudly instead of silently logging 401s
        for every repository on every sync.
        """

        url = f"{self.BASE_URL}/user"
        response = self._request("GET", url)
        return response.json()

    def fetch_pull_request_reviews(
        self,
        owner: str,
        repo: str,
        pr_number: int
    ):
        """
        Fetches all submitted reviews for a single PR, in
        chronological order. Each review includes `submitted_at`,
        `user.login`, and `state` (APPROVED / CHANGES_REQUESTED /
        COMMENTED / DISMISSED). Used to compute first_review_at and
        to build a real activity timeline for the PR detail page.

        Note: pending (not-yet-submitted) reviews are excluded by
        GitHub and won't have a submitted_at.
        """

        url = (
            f"{self.BASE_URL}/repos/{owner}/{repo}"
            f"/pulls/{pr_number}/reviews"
        )

        response = self._request(
            "GET",
            url,
            params={"per_page": DEFAULT_PER_PAGE}
        )

        return response.json()
