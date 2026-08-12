print("TEST STARTED")
from app.services.sync_service import SyncService
from app.database.session import SessionLocal
from app.models import *
db = SessionLocal()

SyncService().sync_all(db)