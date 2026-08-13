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

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
