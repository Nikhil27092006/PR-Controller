"""
GitHub OAuth login flow.

Two endpoints:

  GET /auth/github/login
    Builds a short-lived signed JWT (the OAuth `state`) and redirects
    the user to GitHub's authorize URL. The state is self-contained
    — it round-trips through GitHub as a query param, so it does
    NOT depend on the browser session cookie surviving the cross-site
    redirect from github.com back to localhost.

  GET /auth/github/callback
    GitHub redirects the user back here after they authorize (or
    deny) the app. We verify the state JWT, exchange the code for an
    access token, fetch the GitHub profile, find-or-create the local
    user, mint a JWT, and redirect to the React callback page with
    ?token=…&user_id=… in the query string.
"""

import secrets
import time
from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode

import requests
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import RedirectResponse
from jose import JWTError, jwt
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.config.settings import settings
from app.database.session import get_db
from app.models.repository import Repository
from app.services.auth_service import auth_service
from app.services.github_service import GitHubService
from app.services.sync_service import SyncService
from app.services.github_exceptions import GitHubServiceError
from app.utils.logger import get_logger

router = APIRouter(
    prefix="/auth/github",
    tags=["GitHub OAuth"]
)

logger = get_logger(__name__)

# How long the OAuth `state` JWT is valid. Must be long enough for a
# user to complete GitHub's consent (and any 2FA prompt), but short
# enough that a leaked state can't be replayed.
OAUTH_STATE_TTL_MINUTES = 10


def _frontend_callback_url() -> str:
    """Where the React app expects to receive the post-OAuth redirect."""
    # FRONTEND_URL now includes the full callback path (e.g. /github-callback)
    return settings.FRONTEND_URL.rstrip("/")


def _build_oauth_state() -> str:
    """
    Mint a signed JWT to use as the OAuth `state` parameter.

    Embedding the CSRF nonce in a signed, time-bounded token (rather
    than stashing it in the session cookie) means the validation on
    the callback side does not depend on the browser sending the
    session cookie back to us. That matters because the
    github.com -> localhost redirect is cross-site, and many browser
    configurations silently drop cookies on that boundary.
    """

    nonce = secrets.token_urlsafe(32)
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=OAUTH_STATE_TTL_MINUTES
    )
    return jwt.encode(
        {"nonce": nonce, "type": "oauth_state", "exp": expire},
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )


def _verify_oauth_state(token: str) -> bool:
    """Returns True if the state token was minted by us and hasn't expired."""
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
        if payload.get("type") == "oauth_state" and "nonce" in payload:
            return True
        # Backwards compatibility if payload has nonce and exp without explicit type
        if "nonce" in payload and "exp" in payload:
            return True
        return False
    except JWTError:
        return False


def _github_request_with_retry(
    method: str,
    url: str,
    headers: dict,
    data: dict | None = None,
    retries: int = 3,
    timeout: int = 12
) -> requests.Response:
    """
    Executes an HTTP request to GitHub API with automatic retries on
    transient errors (500, 502, 503, 504, 429, or network timeouts).
    """
    last_exc = None
    last_resp = None
    for attempt in range(retries):
        try:
            resp = requests.request(
                method,
                url,
                headers=headers,
                data=data,
                timeout=timeout
            )
            last_resp = resp
            if resp.status_code == 200:
                return resp
            # If server error or rate limited, backoff and retry
            if resp.status_code in (500, 502, 503, 504, 429) and attempt < retries - 1:
                logger.warning(
                    "GitHub %s %s returned %d (attempt %d/%d), retrying in %.1fs...",
                    method, url, resp.status_code, attempt + 1, retries, 0.6 * (attempt + 1)
                )
                time.sleep(0.6 * (attempt + 1))
                continue
            return resp
        except requests.RequestException as exc:
            last_exc = exc
            if attempt < retries - 1:
                logger.warning(
                    "GitHub %s %s network error (%s) (attempt %d/%d), retrying...",
                    method, url, exc, attempt + 1, retries
                )
                time.sleep(0.6 * (attempt + 1))
                continue
    if last_exc:
        raise last_exc
    return last_resp


def _auto_populate_repositories(
    db: Session,
    user,
    access_token: str,
) -> None:
    """
    On first GitHub OAuth login, fetch every repo the user can
    see on GitHub (their own repos + repos they collaborate on)
    and create a local Repository row for each one we don't
    already track.

    Why: the dashboard, alerts, and PR list are all scoped to
    `Repository.user_id == user.id`. Without this, a brand-new
    OAuth user lands on the dashboard and sees zeros everywhere
    until they manually add each repo. That's a terrible first
    impression — the user just gave us GitHub access, so we
    should use it.

    Failures here are logged but do NOT block the sign-in: a
    flaky GitHub list call shouldn't 500 the OAuth callback.
    The user can still add repos manually via the Repositories
    page.
    """

    try:
        github = GitHubService(access_token=access_token)
        repos_data = github.fetch_repositories()
    except GitHubServiceError as exc:
        logger.warning(
            "Could not auto-populate repos for user_id=%s after "
            "GitHub login (%s). They can add repos manually.",
            user.id, exc,
        )
        return

    if not repos_data:
        return

    # Build a set of github_repo_ids this user already has so we
    # can skip them quickly without an extra DB roundtrip per
    # repo. Also keep a set of "full_name" for the duplicate-
    # within-this-user check below.
    existing_repo_ids = {
        row.github_repo_id
        for row in db.query(Repository.github_repo_id).filter(
            Repository.user_id == user.id
        ).all()
        if row.github_repo_id is not None
    }
    existing_full_names = {
        (row.owner, row.name)
        for row in db.query(Repository.owner, Repository.name).filter(
            Repository.user_id == user.id
        ).all()
    }

    sync_service = SyncService()

    added = 0
    for repo_data in repos_data:
        github_repo_id = repo_data.get("id")
        full_name = repo_data.get("full_name") or ""

        if not github_repo_id or "/" not in full_name:
            continue

        owner, name = full_name.split("/", 1)

        # Skip if we already track this repo (by GitHub id or by
        # owner/name) for this user. The pre-loop DB query above
        # builds these sets, but a concurrent OAuth callback for
        # the same user could insert in between — the
        # IntegrityError handler below is the actual safety net.
        if (
            github_repo_id in existing_repo_ids
            or (owner, name) in existing_full_names
        ):
            continue

        # Insert this repo's row, then trigger a sync in a
        # *separate* database session so the request's session
        # isn't torn apart by sync_pull_requests' internal
        # db.commit(). The sync helper opens its own short-lived
        # SessionLocal, commits/rollbacks on its own, and closes
        # cleanly — failures here don't affect the OAuth response.
        try:
            db_repo = Repository(
                user_id=user.id,
                github_repo_id=github_repo_id,
                owner=owner,
                name=name,
                full_name=full_name,
                description=(repo_data.get("description") or None),
                default_branch=repo_data.get("default_branch") or "main",
            )
            db.add(db_repo)
            db.commit()
            db.refresh(db_repo)
            new_repo_id = db_repo.id
            added += 1
            existing_repo_ids.add(github_repo_id)
            existing_full_names.add((owner, name))

        except IntegrityError as exc:
            # Composite unique (user_id, github_repo_id) fired —
            # another OAuth callback for the same user added the
            # same repo between our pre-loop query and this
            # insert. Treat as "skip", not a fatal error.
            db.rollback()
            logger.info(
                "Skipping %s for user_id=%s during auto-populate: "
                "already tracked (%s)",
                full_name, user.id, exc.orig,
            )
            continue

        except SQLAlchemyError as exc:
            db.rollback()
            logger.warning(
                "Failed to auto-add repo %s for user_id=%s: %s",
                full_name, user.id, exc,
            )
            continue

        except Exception as exc:
            db.rollback()
            logger.warning(
                "Unexpected error auto-adding %s for user_id=%s: %s",
                full_name, user.id, exc,
            )
            continue

        # Sync in a fresh session so a sync failure can't poison
        # the OAuth request's transaction. Failure is logged but
        # does NOT undo the repo insert above — the next scheduled
        # sync will retry it.
        try:
            sync_service.sync_repository_in_new_session(new_repo_id)
        except Exception as exc:
            logger.warning(
                "Auto-sync crashed for %s (will retry on next "
                "scheduled sync): %s",
                full_name, exc,
            )

    if added:
        logger.info(
            "Auto-populated %d repositories for user_id=%s after "
            "GitHub OAuth login",
            added, user.id,
        )


@router.get("/login")
def github_login(request: Request):
    """
    Step 1: redirect the user to GitHub's authorize URL with a CSRF
    `state` that we can verify on the way back.
    """

    if not settings.GITHUB_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="GitHub OAuth is not configured (GITHUB_CLIENT_ID is empty)."
        )

    state = _build_oauth_state()

    params = {
        "client_id": settings.GITHUB_CLIENT_ID,
        "redirect_uri": settings.GITHUB_REDIRECT_URI,
        # `repo` scope is what makes /user/repos return the user's
        # private repos in addition to the public ones they own.
        # Without it, OAuth users see only public repos and the
        # dashboard shows zero data for their private work, which
        # is the whole point of signing in with GitHub.
        # `read:user user:email` keeps profile/email access for the
        # existing find-or-create flow.
        "scope": "read:user user:email repo",
        "state": state,
        "allow_signup": "true",
    }
    authorize_url = "https://github.com/login/oauth/authorize?" + urlencode(params)
    return RedirectResponse(authorize_url)


@router.get("/callback")
def github_callback(
    request: Request,
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
    db: Session = Depends(get_db),
):
    """
    Step 2: handle GitHub's redirect back to us.
    """

    frontend_callback = _frontend_callback_url()

    # User clicked "Cancel" on github.com — surface that to the UI
    # instead of raising a 400.
    if error:
        return RedirectResponse(
            f"{frontend_callback}?error={error}"
        )

    if not code or not state:
        logger.warning("Missing code or state in GitHub callback")
        return RedirectResponse(f"{frontend_callback}?error=missing_callback_params")

    # CSRF: the `state` query param is a short-lived JWT we minted
    # in /login. Decoding it verifies that this callback really came
    # from a /login we issued recently.
    if not _verify_oauth_state(state):
        logger.warning("Invalid or expired OAuth state token: %s", state)
        return RedirectResponse(f"{frontend_callback}?error=invalid_state")

    # Exchange the authorization code for an access token.
    token_headers = {
        "Accept": "application/json",
        "User-Agent": "PRFlow-Intelligence/1.0",
    }
    try:
        token_resp = _github_request_with_retry(
            "POST",
            "https://github.com/login/oauth/access_token",
            headers=token_headers,
            data={
                "client_id": settings.GITHUB_CLIENT_ID,
                "client_secret": settings.GITHUB_CLIENT_SECRET,
                "code": code,
                "redirect_uri": settings.GITHUB_REDIRECT_URI,
            },
            retries=3,
        )
    except requests.RequestException as exc:
        logger.error("Failed to reach GitHub token endpoint: %s", exc)
        return RedirectResponse(f"{frontend_callback}?error=github_unavailable")

    if not token_resp or token_resp.status_code != 200:
        logger.error("GitHub token exchange failed with status: %s", getattr(token_resp, "status_code", "None"))
        return RedirectResponse(f"{frontend_callback}?error=token_exchange_failed")

    token_json = token_resp.json()
    gh_access_token = token_json.get("access_token")
    if not gh_access_token:
        err_msg = token_json.get("error_description") or token_json.get("error") or "no_access_token"
        logger.error("GitHub did not return access token: %s", token_json)
        return RedirectResponse(f"{frontend_callback}?error={err_msg}")

    auth_headers = {
        "Authorization": f"Bearer {gh_access_token}",
        "Accept": "application/vnd.github+json",
        "User-Agent": "PRFlow-Intelligence/1.0",
    }

    # Fetch the GitHub profile with retries for transient 503 errors.
    try:
        profile_resp = _github_request_with_retry(
            "GET",
            "https://api.github.com/user",
            headers=auth_headers,
            retries=3,
        )
    except requests.RequestException as exc:
        logger.error("Failed to fetch GitHub profile: %s", exc)
        return RedirectResponse(f"{frontend_callback}?error=github_unavailable")

    if not profile_resp or profile_resp.status_code != 200:
        logger.error(
            "GitHub profile API returned status %s: %s",
            getattr(profile_resp, "status_code", "None"),
            getattr(profile_resp, "text", "")
        )
        return RedirectResponse(f"{frontend_callback}?error=profile_fetch_failed")

    profile = profile_resp.json()
    github_id = str(profile.get("id") or "").strip()
    github_username = profile.get("login")
    avatar_url = profile.get("avatar_url")
    email = profile.get("email")

    if not github_id:
        logger.error("GitHub profile missing ID: %s", profile)
        return RedirectResponse(f"{frontend_callback}?error=missing_github_id")

    # Email is often private on GitHub. If the public profile didn't
    # include it, fall back to the /user/emails endpoint and pick the
    # primary + verified one.
    if not email:
        try:
            emails_resp = _github_request_with_retry(
                "GET",
                "https://api.github.com/user/emails",
                headers=auth_headers,
                retries=3,
            )
        except requests.RequestException:
            emails_resp = None

        if emails_resp is not None and emails_resp.status_code == 200:
            for entry in emails_resp.json():
                if entry.get("primary") and entry.get("verified"):
                    email = entry.get("email")
                    break

    if not email:
        # Without an email we cannot auto-link or even identify the
        # user uniquely; bounce to the frontend with a clear error.
        return RedirectResponse(f"{frontend_callback}?error=no_email")

    try:
        user = auth_service.find_or_create_github_user(
            db=db,
            email=email,
            github_id=github_id,
            github_username=github_username,
            avatar_url=avatar_url,
        )

        # Persist the OAuth access token on the user row so subsequent
        # sync / repo-validate calls can authenticate as this user
        # (needed for private repos the server-wide token can't see).
        user.github_access_token = gh_access_token
        db.commit()
        db.refresh(user)

        # Auto-populate the user's repositories on first sign-in so
        # the dashboard isn't empty until the user manually adds each
        # repo one by one. We fetch every repo the OAuth token can
        # see (public + the user's own private), and insert any we
        # don't already track. Existing rows (matched on
        # github_repo_id) are left alone.
        _auto_populate_repositories(db, user, gh_access_token)

        jwt_token = auth_service.create_token_for_user(user)

        # Hand the JWT to the React app via a 302. The token is short-lived
        # (1 day by default — see ACCESS_TOKEN_EXPIRE_MINUTES) and we
        # immediately drop the bearer in localStorage on the frontend.
        redirect_to = (
            f"{frontend_callback}"
            f"?token={jwt_token}"
            f"&user_id={user.id}"
        )
        return RedirectResponse(redirect_to)
    except Exception as e:
        # Log the actual error for debugging
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal error during user creation: {str(e)}"
        ) from e
