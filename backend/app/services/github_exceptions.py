class GitHubServiceError(Exception):
    """Base class for all GitHub API errors raised by GitHubService."""


class GitHubAuthError(GitHubServiceError):
    """Raised on 401/403 — invalid, expired, or insufficiently
    scoped GITHUB_TOKEN."""


class GitHubRateLimitError(GitHubServiceError):
    """Raised on 403/429 rate limit responses. Carries the reset
    time (unix timestamp) from GitHub's X-RateLimit-Reset header,
    when available."""

    def __init__(self, message: str, reset_at: int | None = None):
        super().__init__(message)
        self.reset_at = reset_at


class GitHubNotFoundError(GitHubServiceError):
    """Raised on 404 — repository doesn't exist, or the token
    doesn't have access to it."""


class GitHubNetworkError(GitHubServiceError):
    """Raised on connection failures, timeouts, or DNS errors —
    i.e. the request never got a response from GitHub at all."""
