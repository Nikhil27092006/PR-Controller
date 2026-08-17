from app.services.sync_service import SyncService
from app.database.session import SessionLocal
from app.utils.logger import get_logger

logger = get_logger(__name__)

sync_service = SyncService()


def full_sync():

    logger.info("Full sync started")

    db = SessionLocal()

    try:

        sync_service.sync_all(db)

        logger.info("Full sync completed")

    except Exception as e:

        # Roll back any partially-applied changes from this sync
        # attempt so a failure halfway through doesn't leave the DB
        # in an inconsistent state for the next scheduled run.
        db.rollback()

        logger.error("Full sync failed: %s", e, exc_info=True)

    finally:

        db.close()
