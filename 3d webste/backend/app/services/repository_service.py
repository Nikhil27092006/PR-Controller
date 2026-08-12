from app.services.github_service import GitHubService


class RepositoryService:

    def __init__(self):

        self.github = GitHubService()

    def get_repositories(self):

        return self.github.fetch_repositories()