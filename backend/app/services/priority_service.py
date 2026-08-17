from app.analyzers.priority_engine import calculate_priority


class PriorityService:

    def score_pr(self, pr_data: dict):
        return calculate_priority(pr_data)

    def score_multiple_prs(self, prs: list):

        results = []

        for pr in prs:

            analysis = calculate_priority(pr)

            pr["priority_score"] = analysis["priority_score"]
            pr["priority_level"] = analysis["priority_level"]
            pr["priority_breakdown"] = analysis["priority_breakdown"]

            results.append(pr)

        return results