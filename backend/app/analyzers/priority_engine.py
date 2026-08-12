from datetime import datetime, timezone

from dateutil import parser

from app.constants.priorities import (
    LOW,
    MEDIUM,
    HIGH,
    CRITICAL
)
from app.constants.priority_rules import (
    AGE_0_TO_2_DAYS,
    AGE_3_TO_5_DAYS,
    AGE_6_TO_10_DAYS,
    AGE_10_PLUS_DAYS,
    PENDING_REVIEW_1,
    PENDING_REVIEW_2,
    PENDING_REVIEW_3_PLUS,
    MERGE_CONFLICT_SCORE,
    FAILING_CI_SCORE,
    BLOCKING_PR_SCORE,
    URGENT_LABEL_SCORE,
    BUG_LABEL_SCORE,
    SECURITY_LABEL_SCORE,
    LOW_THRESHOLD,
    MEDIUM_THRESHOLD,
    HIGH_THRESHOLD
)


def _parse_created_at(created_at):
    """
    GitHub's API returns created_at as an ISO 8601 string
    (e.g. "2024-01-15T10:00:00Z"), not a datetime object.
    This normalizes either a string or a datetime into a
    timezone-naive UTC datetime so it can be safely subtracted
    from datetime.utcnow().
    """

    if not created_at:
        return None

    if isinstance(created_at, str):
        created_at = parser.parse(created_at)

    if created_at.tzinfo is not None:
        created_at = created_at.astimezone(timezone.utc).replace(tzinfo=None)

    return created_at


def _extract_label_names(labels):
    """
    GitHub's API returns labels as a list of objects:
    [{"name": "urgent", "color": "..."}, ...]
    This normalizes them into a lowercase list of names so it
    also works if plain strings are passed in (e.g. from tests).
    """

    names = []

    for label in labels or []:
        if isinstance(label, dict):
            name = label.get("name", "")
        else:
            name = str(label)

        names.append(name.lower())

    return names


def calculate_priority(pr_data: dict) -> dict:
    score = 0

    created_at = _parse_created_at(pr_data.get("created_at"))

    if created_at:
        age_days = (datetime.utcnow() - created_at).days

        if age_days <= 2:
            score += AGE_0_TO_2_DAYS
        elif age_days <= 5:
            score += AGE_3_TO_5_DAYS
        elif age_days <= 10:
            score += AGE_6_TO_10_DAYS
        else:
            score += AGE_10_PLUS_DAYS

    pending_reviews = pr_data.get("pending_reviews", 0)

    if pending_reviews == 1:
        score += PENDING_REVIEW_1
    elif pending_reviews == 2:
        score += PENDING_REVIEW_2
    elif pending_reviews >= 3:
        score += PENDING_REVIEW_3_PLUS

    if pr_data.get("merge_conflict"):
        score += MERGE_CONFLICT_SCORE

    if pr_data.get("failing_checks"):
        score += FAILING_CI_SCORE

    if pr_data.get("is_blocking"):
        score += BLOCKING_PR_SCORE

    labels = _extract_label_names(pr_data.get("labels", []))

    if "urgent" in labels:
        score += URGENT_LABEL_SCORE

    if "bug" in labels:
        score += BUG_LABEL_SCORE

    if "security" in labels:
        score += SECURITY_LABEL_SCORE

    if score <= LOW_THRESHOLD:
        level = LOW
    elif score <= MEDIUM_THRESHOLD:
        level = MEDIUM
    elif score <= HIGH_THRESHOLD:
        level = HIGH
    else:
        level = CRITICAL

    return {
        "priority_score": score,
        "priority_level": level
    }
