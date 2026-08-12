from datetime import datetime


def calculate_age_days(created_at: datetime) -> int:
    """
    Calculate PR age in days.
    """

    return (datetime.utcnow() - created_at).days


def current_utc():
    """
    Return current UTC datetime.
    """

    return datetime.utcnow()


def format_datetime(dt: datetime) -> str:
    """
    Convert datetime to string.
    """

    return dt.strftime("%Y-%m-%d %H:%M:%S")