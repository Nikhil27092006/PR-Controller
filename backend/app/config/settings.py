## This file is used to load environment variables from the .env file and provide them to the application(in FastAPI)
from pydantic_settings import BaseSettings,SettingsConfigDict
class Settings(BaseSettings):
    GITHUB_TOKEN: str
    DB_CONNECTION: str
    model_config = SettingsConfigDict(env_file=".env",extra="ignore")
settings = Settings()