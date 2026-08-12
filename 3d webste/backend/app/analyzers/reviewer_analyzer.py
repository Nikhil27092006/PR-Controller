def calculate_workload(reviewers):
    results = []

    for reviewer in reviewers:

        workload = (
            reviewer.pending_reviews * 5
            +
            reviewer.avg_review_time_hours
        )

        results.append({
            "username": reviewer.username,
            "pending_reviews": reviewer.pending_reviews,
            "completed_reviews": reviewer.completed_reviews,
            "workload_score": workload
        })

    results.sort(
        key=lambda x: x["workload_score"],
        reverse=True
    )

    return results