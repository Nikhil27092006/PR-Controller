import logging
import os
from logging.handlers import RotatingFileHandler

# Resolve logs/ relative to the backend project root (two levels up
# from app/utils/), so it works the same whether the app is started
# from the backend/ folder or elsewhere.
_BACKEND_ROOT = os.path.dirname(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
)
LOGS_DIR = os.path.join(_BACKEND_ROOT, "logs")

os.makedirs(LOGS_DIR, exist_ok=True)

LOG_FILE = os.path.join(LOGS_DIR, "app.log")

LOG_FORMAT = "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s"
DATE_FORMAT = "%Y-%m-%d %H:%M:%S"


def _build_logger() -> logging.Logger:

    logger = logging.getLogger("prflow")
    logger.setLevel(logging.INFO)

    # Guard against duplicate handlers if this module gets imported
    # more than once (e.g. by the reloader in `uvicorn --reload`).
    if logger.handlers:
        return logger

    formatter = logging.Formatter(LOG_FORMAT, datefmt=DATE_FORMAT)

    # Rotates at 5MB, keeps 5 old files, so logs/ doesn't grow forever.
    file_handler = RotatingFileHandler(
        LOG_FILE,
        maxBytes=5 * 1024 * 1024,
        backupCount=5,
        encoding="utf-8"
    )
    file_handler.setFormatter(formatter)
    file_handler.setLevel(logging.INFO)

    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    console_handler.setLevel(logging.INFO)

    logger.addHandler(file_handler)
    logger.addHandler(console_handler)

    return logger


logger = _build_logger()


def get_logger(name: str) -> logging.Logger:
    """
    Returns a child logger namespaced under "prflow", e.g.
    get_logger("sync_service") logs as "prflow.sync_service" while
    still writing to the same file/console handlers.

    Usage:
        from app.utils.logger import get_logger
        logger = get_logger(__name__)
        logger.info("Sync started")
        logger.warning("Rate limit approaching")
        logger.error("Sync failed: %s", err)
    """

    return logging.getLogger(f"prflow.{name}")
