import secrets

import requests
from fastapi import HTTPException, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.config.settings import settings
from app.models.user import User
from app.utils.logger import get_logger

logger = get_logger(__name__)

GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize"
GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token"
GITHUB_USER_URL = "https://api.github.com/user"
GITHUB_USER_EMAILS_URL = "https://api.github.com/user/emails"

REQUEST_TIMEOUT_SECONDS = 15


class GitHubOAuthService:

    def build_authorize_url(self, state: str) -> str:
        """
        Builds the URL the user's browser is redirected to, where
        they approve access on GitHub's side.
        """

        params = {
            "client_id": settings.GITHUB_OAUTH_CLIENT_ID,
            "redirect_uri": settings.GITHUB_OAUTH_REDIRECT_URI,
            "scope": "read:user user:email",
            "state": state
        }

        query = "&".join(f"{k}={v}" for k, v in params.items())

        return f"{GITHUB_AUTHORIZE_URL}?{query}"

    def generate_state(self) -> str:
        """
        A random value to protect against CSRF on the OAuth redirect.
        Stored in a short-lived cookie and compared on callback.
        """

        return secrets.token_urlsafe(24)

    def exchange_code_for_token(self, code: str) -> str:

        try:
            response = requests.post(
                GITHUB_TOKEN_URL,
                headers={"Accept": "application/json"},
                data={
                    "client_id": settings.GITHUB_OAUTH_CLIENT_ID,
                    "client_secret": settings.GITHUB_OAUTH_CLIENT_SECRET,
                    "code": code,
                    "redirect_uri": settings.GITHUB_OAUTH_REDIRECT_URI
                },
                timeout=REQUEST_TIMEOUT_SECONDS
            )
            response.raise_for_status()
        except requests.exceptions.RequestException as exc:
            logger.error("GitHub OAuth token exchange failed: %s", exc)
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Could not reach GitHub to complete login. Please try again."
            ) from exc

        data = response.json()

        access_token = data.get("access_token")

        if not access_token:
            logger.warning(
                "GitHub OAuth exchange returned no token: %s",
                data.get("error_description", "unknown error")
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "GitHub did not return an access token: "
                    f"{data.get('error_description', 'unknown error')}"
                )
            )

        return access_token

    def fetch_github_profile(self, github_access_token: str) -> dict:

        headers = {
            "Authorization": f"Bearer {github_access_token}",
            "Accept": "application/vnd.github+json"
        }

        try:
            profile_response = requests.get(
                GITHUB_USER_URL,
                headers=headers,
                timeout=REQUEST_TIMEOUT_SECONDS
            )
            profile_response.raise_for_status()
        except requests.exceptions.RequestException as exc:
            logger.error("Failed to fetch GitHub profile: %s", exc)
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Could not fetch your GitHub profile. Please try again."
            ) from exc

        profile = profile_response.json()

        email = profile.get("email")

        # Public email is often null — GitHub users can hide it. Fall
        # back to the emails endpoint and use the verified primary.
        if not email:
            try:
                emails_response = requests.get(
                    GITHUB_USER_EMAILS_URL,
                    headers=headers,
                    timeout=REQUEST_TIMEOUT_SECONDS
                )
            except requests.exceptions.RequestException as exc:
                logger.warning(
                    "Failed to fetch GitHub emails, continuing "
                    "without one: %s", exc
                )
                emails_response = None

            if emails_response is not None and emails_response.ok:
                emails = emails_response.json()

                primary = next(
                    (e for e in emails if e.get("primary") and e.get("verified")),
                    None
                )

                if primary:
                    email = primary["email"]
                elif emails:
                    email = emails[0].get("email")

        profile["email"] = email

        return profile

    def find_or_create_user(
        self,
        db: Session,
        github_profile: dict
    ) -> User:

        github_id = github_profile["id"]
        github_username = github_profile.get("login")
        avatar_url = github_profile.get("avatar_url")
        email = github_profile.get("email")

        try:

            existing_by_github_id = (
                db.query(User)
                .filter(User.github_id == github_id)
                .first()
            )

            if existing_by_github_id:
                # Keep profile info fresh in case it changed on GitHub.
                existing_by_github_id.github_username = github_username
                existing_by_github_id.avatar_url = avatar_url
                db.commit()
                db.refresh(existing_by_github_id)
                return existing_by_github_id

            # If this GitHub email matches an existing email/password
            # account, link the GitHub identity to it instead of
            # creating a duplicate account.
            if email:
                existing_by_email = (
                    db.query(User)
                    .filter(User.email == email)
                    .first()
                )

                if existing_by_email:
                    existing_by_email.github_id = github_id
                    existing_by_email.github_username = github_username
                    existing_by_email.avatar_url = avatar_url
                    db.commit()
                    db.refresh(existing_by_email)
                    return existing_by_email

            if not email:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        "Your GitHub account has no public or verified "
                        "email available. Please make an email public "
                        "on GitHub, or verify one, and try again."
                    )
                )

            username = self._unique_username(
                db, github_username or f"user{github_id}"
            )

            new_user = User(
                username=username,
                email=email,
                password_hash=None,
                github_id=github_id,
                github_username=github_username,
                avatar_url=avatar_url
            )

            db.add(new_user)
            db.commit()
            db.refresh(new_user)

            return new_user

        except SQLAlchemyError as exc:
            db.rollback()
            logger.error("Database error during GitHub login: %s", exc)
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="A database error occurred while signing you in. Please try again."
            ) from exc

    def _unique_username(self, db: Session, base_username: str) -> str:
        """
        GitHub usernames can collide with existing local usernames.
        Appends a short suffix until it finds a free one.
        """

        candidate = base_username
        suffix = 1

        while db.query(User).filter(User.username == candidate).first():
            suffix += 1
            candidate = f"{base_username}{suffix}"

        return candidate
