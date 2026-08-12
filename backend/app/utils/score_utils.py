from app.constants.priorities import (
    LOW,
    MEDIUM,
    HIGH,
    CRITICAL
)

from app.constants.priority_rules import (
    LOW_THRESHOLD,
    MEDIUM_THRESHOLD,
    HIGH_THRESHOLD
)


def score_to_priority(
    score: int
):

    if score <= LOW_THRESHOLD:
        return LOW

    if score <= MEDIUM_THRESHOLD:
        return MEDIUM

    if score <= HIGH_THRESHOLD:
        return HIGH

    return CRITICAL