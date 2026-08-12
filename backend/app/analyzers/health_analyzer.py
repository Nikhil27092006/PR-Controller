from datetime import datetime


def calculate_repository_health(prs):
    total_prs = len(prs)

    if total_prs == 0:
        return {
            "health_score": 100,
            "status": "Healthy"
        }

    open_prs = 0
    stale_prs = 0
    critical_prs = 0

    for pr in prs:

        if pr.status == "open":
            open_prs += 1

        if pr.priority_level == "Critical":
            critical_prs += 1

        age = (
            datetime.utcnow() - pr.created_at
        ).days

        if age > 30:
            stale_prs += 1

    score = 100

    score -= critical_prs * 5
    score -= stale_prs * 3
    score -= open_prs * 1

    score = max(score, 0)

    if score >= 80:
        status = "Healthy"
    elif score >= 50:
        status = "Warning"
    else:
        status = "Critical"

    return {
        "health_score": score,
        "status": status,
        "open_prs": open_prs,
        "stale_prs": stale_prs,
        "critical_prs": critical_prs
    }