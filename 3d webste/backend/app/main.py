from fastapi import FastAPI

from fastapi.middleware.cors import CORSMiddleware

from app.database.db import engine
from app.database.base import Base

from app.models.reviewer import Reviewer
from app.models.repository import Repository
from app.models.pull_request import PullRequest
from app.models.dependency import Dependency
from app.models.user import User

from app.routes.auth_routes import router as auth_router
from app.routes.pr_routes import router as pr_router
from app.routes.dashboard_routes import router as dashboard_router
from app.routes.repository_routes import router as repository_router
from app.routes.reviewer_routes import router as reviewer_router
from app.routes.dependency_routes import router as dependency_router
from app.routes.bottleneck_routes import router as bottleneck_router
from app.routes.settings_routes import router as settings_router

Base.metadata.create_all(bind=engine)


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

app.include_router(auth_router)
app.include_router(pr_router)
app.include_router(dashboard_router)
app.include_router(repository_router)
app.include_router(reviewer_router)
app.include_router(dependency_router)
app.include_router(bottleneck_router)
app.include_router(settings_router)