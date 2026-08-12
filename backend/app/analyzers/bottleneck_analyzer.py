from collections import defaultdict


def find_bottlenecks(dependencies):
    """
    dependencies format:

    [
        (15, 20),
        (15, 21),
        (15, 22),
        (30, 40)
    ]
    """

    blocked_count = defaultdict(int)

    for source_pr, target_pr in dependencies:
        blocked_count[source_pr] += 1

    results = []

    for pr_id, count in blocked_count.items():
        results.append({
            "pr_id": pr_id,
            "blocked_prs": count
        })

    results.sort(
        key=lambda x: x["blocked_prs"],
        reverse=True
    )

    return results