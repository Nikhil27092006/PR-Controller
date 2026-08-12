from app.services.github_service import GitHubService

github = GitHubService()

print("\nFetching repositories...\n")

repos = github.fetch_repositories()

print(f"Found {len(repos)} repositories")

if repos:
    print(
        "First Repository:",
        repos[0]["full_name"]
    )