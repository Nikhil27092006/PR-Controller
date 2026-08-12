from datetime import datetime

from app.services.sync_service import SyncService
from app.database.session import SessionLocal

sync_service = SyncService()


def full_sync():

    print(
        f"[{datetime.utcnow()}] Full Sync Started"
    )

    db = SessionLocal()

    try:

        sync_service.sync_all(db)

        print(
            f"[{datetime.utcnow()}] Full Sync Completed"
        )

    except Exception as e:

        print(
            f"[{datetime.utcnow()}] "
            f"Full Sync Failed: {e}"
        )

    finally:

        db.close()