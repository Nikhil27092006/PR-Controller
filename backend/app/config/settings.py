## This file is used to load environment variables from the .env file and provide them to the application(in FastAPI)
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    GITHUB_TOKEN: str
    DB_CONNECTION: str

    # JWT auth settings.
    # IMPORTANT: set a real, random SECRET_KEY in your .env for production.
    # The default below only exists so the app doesn't crash if it's
    # missing during local development.
    SECRET_KEY: str = "dev-only-change-this-secret-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day

    # GitHub OAuth (per-user login flow).
    # Register an OAuth App at https://github.com/settings/developers and
    # set these in backend/.env. They are empty by default so the app
    # still boots when OAuth is not configured (the /auth/github/* routes
    # will respond with a 500 if hit without GITHUB_CLIENT_ID).
    GITHUB_CLIENT_ID: str = ""
    GITHUB_CLIENT_SECRET: str = ""
    GITHUB_REDIRECT_URI: str = "http://localhost:8000/auth/github/callback"

    # Frontend base URL — the backend redirects here after a successful
    # GitHub OAuth callback, appending ?token=…&user_id=…
    FRONTEND_URL: str = "http://localhost:3001/github-callback"

    # CORS origin for the frontend (base URL only, no path)
    CORS_ORIGIN: str = "http://localhost:3001"

    # Signs the signed cookie used by starlette SessionMiddleware to
    # carry the OAuth `state` across the GitHub round-trip. Should be
    # at least 32 random bytes in production; reusing SECRET_KEY is OK
    # for local dev.
    SESSION_SECRET_KEY: str = "dev-only-change-this-session-secret"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
