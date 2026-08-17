OVERLOAD_THRESHOLD_PERCENT = 100
BUSY_THRESHOLD_PERCENT = 70


def _status_for_load(load_percent: float) -> str:

    if load_percent > OVERLOAD_THRESHOLD_PERCENT:
        return "overloaded"

    if load_percent >= BUSY_THRESHOLD_PERCENT:
        return "busy"

    return "available"


def calculate_workload(reviewers, assigned_prs_by_reviewer: dict | None = None):
    """
    reviewers: list of Reviewer model instances.
    assigned_prs_by_reviewer: optional dict of
        {reviewer_id: [ {id, title, priority_level, github_pr_number,
        repository_id}, ... ]}
    used to attach the actual list of assigned PRs per reviewer. If
    omitted, only pending_reviews (a count) is used for the load
    calculation and "assigned_prs" comes back as an empty list.
    """

    assigned_prs_by_reviewer = assigned_prs_by_reviewer or {}

    results = []

    for reviewer in reviewers:

        assigned_prs = assigned_prs_by_reviewer.get(reviewer.id, [])

        # Prefer the real assigned-PR count when available (more
        # accurate — reflects current state), fall back to the
        # stored pending_reviews counter otherwise.
        active_count = (
            len(assigned_prs) if reviewer.id in assigned_prs_by_reviewer
            else reviewer.pending_reviews
        )

        capacity = reviewer.capacity or 1  # guard against div by zero

        load_percent = round((active_count / capacity) * 100)

        status = _status_for_load(load_percent)

        results.append({
            "reviewer_id": reviewer.id,
            "username": reviewer.username,
            "assigned_prs": assigned_prs,
            "assigned_count": active_count,
            "capacity": capacity,
            "load_percent": load_percent,
            "status": status,
            "is_overloaded": status == "overloaded",
            "completed_reviews": reviewer.completed_reviews,
            "avg_review_time_hours": reviewer.avg_review_time_hours
        })

    results.sort(
        key=lambda x: x["load_percent"],
        reverse=True
    )

    return results
