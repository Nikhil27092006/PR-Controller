from contextlib import asynccontextmanager
import sys

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler

from app.database.db import engine
from app.database.base import Base

from app.models.reviewer import Reviewer
from app.models.repository import Repository
from app.models.pull_request import PullRequest
from app.models.dependency import Dependency
from app.models.user import User
from app.models.pr_reviewer import PRReviewer
from app.models.pr_review import PRReview
from app.models.alert import Alert

from app.routes.auth_routes import router as auth_router
from app.routes.github_auth_routes import router as github_auth_router
from app.routes.pr_routes import router as pr_router
from app.routes.dashboard_routes import router as dashboard_router
from app.routes.repository_routes import router as repository_router
from app.routes.reviewer_routes import router as reviewer_router
from app.routes.dependency_routes import router as dependency_router
from app.routes.bottleneck_routes import router as bottleneck_router
from app.routes.settings_routes import router as settings_router
from app.routes.alert_routes import router as alert_router
from app.routes.analytics_routes import router as analytics_router

from app.scheduler.sync_jobs import full_sync
from app.constants.github_constants import SYNC_INTERVAL_MINUTES
from app.config.settings import settings
from app.services.github_service import GitHubService
from app.services.github_exceptions import (
    GitHubAuthError,
    GitHubNetworkError,
    GitHubRateLimitError,
)
from app.utils.logger import get_logger

logger = get_logger(__name__)

Base.metadata.create_all(bind=engine)

scheduler = BackgroundScheduler()


def _verify_github_token():
    """
    Validates GITHUB_TOKEN before the app starts syncing. Without
    this check a missing/invalid token would surface as 401s for
    every repository on every sync, drowning the logs. Instead we
    fail fast with a single clear error pointing at the .env.
    """

    token = (settings.GITHUB_TOKEN or "").strip()
    if not token or token == "PASTE_YOUR_NEW_TOKEN_HERE":
        logger.error(
            "GITHUB_TOKEN is missing from backend/.env. "
            "Copy backend/.env.example to backend/.env and add a "
            "valid token (https://github.com/settings/tokens)."
        )
        sys.exit(1)

    try:
        me = GitHubService().validate_token()
        login = me.get("login", "<unknown>")
        logger.info("GitHub token OK — authenticated as %s", login)
    except GitHubAuthError as exc:
        logger.error("GITHUB_TOKEN is invalid or expired: %s", exc)
        sys.exit(1)
    except Exception as exc:
        # Catch any transient error (network blip, GitHub 503/504, rate limit,
        # etc.) without killing the server. The scheduler will retry on the
        # next sync interval.
        logger.warning(
            "Could not validate GITHUB_TOKEN on startup (%s: %s). "
            "The app will start anyway and retry on the next sync.",
            type(exc).__name__, exc,
        )


import threading

@asynccontextmanager
async def lifespan(app: FastAPI):

    _verify_github_token()

    scheduler.add_job(
        full_sync,
        "interval",
        minutes=SYNC_INTERVAL_MINUTES,
        id="full_sync_job",
        replace_existing=True
    )
    scheduler.start()

    # Run initial sync in background so it doesn't block startup
    threading.Thread(target=full_sync, daemon=True).start()

    yield

    scheduler.shutdown(wait=False)


app = FastAPI(
    title="PR Controller",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

app.include_router(auth_router)
app.include_router(github_auth_router)
app.include_router(pr_router)
app.include_router(dashboard_router)
app.include_router(repository_router)
app.include_router(reviewer_router)
app.include_router(dependency_router)
app.include_router(bottleneck_router)
app.include_router(settings_router)
app.include_router(alert_router)
app.include_router(analytics_router)


@app.get("/")
def root():
    return {
        "message": "PR Controller API Running"
    }
