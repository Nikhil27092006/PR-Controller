from app.analyzers.dependency_analyzer import extract_dependencies


class DependencyService:

    def analyze_pr_dependencies(self, pr_body: str):

        return extract_dependencies(pr_body)
    