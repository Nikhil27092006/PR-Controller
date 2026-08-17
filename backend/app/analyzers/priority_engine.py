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
    breakdown = []

    created_at = _parse_created_at(pr_data.get("created_at"))

    if created_at:
        age_days = (datetime.utcnow() - created_at).days

        if age_days <= 2:
            points = AGE_0_TO_2_DAYS
            reason = f"PR age: {age_days} day(s) old"
        elif age_days <= 5:
            points = AGE_3_TO_5_DAYS
            reason = f"PR age: {age_days} days old"
        elif age_days <= 10:
            points = AGE_6_TO_10_DAYS
            reason = f"PR age: {age_days} days old"
        else:
            points = AGE_10_PLUS_DAYS
            reason = f"PR age: {age_days} days old (stale)"

        score += points
        breakdown.append({
            "factor": "Age",
            "score": points,
            "description": reason
        })

    pending_reviews = pr_data.get("pending_reviews", 0)

    if pending_reviews == 1:
        points = PENDING_REVIEW_1
    elif pending_reviews == 2:
        points = PENDING_REVIEW_2
    elif pending_reviews >= 3:
        points = PENDING_REVIEW_3_PLUS
    else:
        points = 0

    if points:
        score += points
        breakdown.append({
            "factor": "Pending Reviews",
            "score": points,
            "description": f"{pending_reviews} review(s) still pending"
        })

    if pr_data.get("merge_conflict"):
        score += MERGE_CONFLICT_SCORE
        breakdown.append({
            "factor": "Merge Conflict",
            "score": MERGE_CONFLICT_SCORE,
            "description": "This PR has a merge conflict with its base branch"
        })

    if pr_data.get("failing_checks"):
        score += FAILING_CI_SCORE
        breakdown.append({
            "factor": "Failing Checks",
            "score": FAILING_CI_SCORE,
            "description": "CI checks are currently failing"
        })

    if pr_data.get("is_blocking"):
        score += BLOCKING_PR_SCORE
        breakdown.append({
            "factor": "Blocking Other PRs",
            "score": BLOCKING_PR_SCORE,
            "description": "Other PRs depend on this one merging first"
        })

    labels = _extract_label_names(pr_data.get("labels", []))

    if "urgent" in labels:
        score += URGENT_LABEL_SCORE
        breakdown.append({
            "factor": "Urgent Label",
            "score": URGENT_LABEL_SCORE,
            "description": "Labeled 'urgent'"
        })

    if "bug" in labels:
        score += BUG_LABEL_SCORE
        breakdown.append({
            "factor": "Bug Label",
            "score": BUG_LABEL_SCORE,
            "description": "Labeled 'bug'"
        })

    if "security" in labels:
        score += SECURITY_LABEL_SCORE
        breakdown.append({
            "factor": "Security Label",
            "score": SECURITY_LABEL_SCORE,
            "description": "Labeled 'security'"
        })

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
        "priority_level": level,
        "priority_breakdown": breakdown
    }
