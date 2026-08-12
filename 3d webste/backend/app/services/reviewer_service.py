from app.analyzers.reviewer_analyzer import calculate_workload


class ReviewerService:

    def analyze_reviewers(self, reviewers):

        return calculate_workload(reviewers)