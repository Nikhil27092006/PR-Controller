from sqlalchemy import create_engine
from app.config.settings import settings

db_url = settings.DB_CONNECTION
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

engine = create_engine(db_url)
