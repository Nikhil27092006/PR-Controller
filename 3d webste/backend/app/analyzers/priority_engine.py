from datetime import datetime


def calculate_priority(pr_data: dict) -> dict:
    score = 0

    created_at = pr_data.get("created_at")

    if created_at:
        age_days = (datetime.utcnow() - created_at).days

        if age_days <= 2:
            score += 10
        elif age_days <= 5:
            score += 20
        elif age_days <= 10:
            score += 40
        else:
            score += 60

    pending_reviews = pr_data.get("pending_reviews", 0)

    if pending_reviews == 1:
        score += 10
    elif pending_reviews == 2:
        score += 20
    elif pending_reviews >= 3:
        score += 30

    if pr_data.get("merge_conflict"):
        score += 50

    if pr_data.get("failing_checks"):
        score += 40

    if pr_data.get("is_blocking"):
        score += 100

    labels = pr_data.get("labels", [])

    if "urgent" in labels:
        score += 80

    if "bug" in labels:
        score += 50

    if "security" in labels:
        score += 100

    if score <= 40:
        level = "Low"
    elif score <= 80:
        level = "Medium"
    elif score <= 120:
        level = "High"
    else:
        level = "Critical"

    return {
        "priority_score": score,
        "priority_level": level
    }