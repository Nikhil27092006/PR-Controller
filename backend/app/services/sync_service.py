from datetime import datetime

from dateutil import parser
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.models.repository import Repository
from app.models.pull_request import PullRequest
from app.models.dependency import Dependency
from app.models.reviewer import Reviewer
from app.models.pr_reviewer import PRReviewer
from app.models.pr_review import PRReview
from app.models.user import User
from app.services.github_service import GitHubService
from app.services.github_exceptions import (
    GitHubAuthError,
    GitHubRateLimitError,
    GitHubNotFoundError,
    GitHubNetworkError,
    GitHubServiceError
)
from app.services.priority_service import PriorityService
from app.services.alert_service import AlertService
from app.analyzers.dependency_analyzer import extract_dependencies
from app.utils.logger import get_logger

logger = get_logger(__name__)


def _parse_dt(value):
    """Parses a GitHub ISO 8601 timestamp string, or returns None."""

    if not value:
        return None

    if isinstance(value, datetime):
        return value

    return parser.parse(value).replace(tzinfo=None)


class SyncService:

    def __init__(self, default_access_token: str | None = None):
        """
        `default_access_token` is the per-user GitHub OAuth token
        used as a fallback when a repository's owner user hasn't
        stored their own token yet (e.g. the scheduled background
        sync running before any OAuth login has happened, or for
        password-only users who never OAuth'd). When None, falls
        back to the server-wide GITHUB_TOKEN setting inside
        GitHubService.
        """

        self.github = GitHubService(access_token=default_access_token)
        self.priority = PriorityService()
        self.alert_service = AlertService()

    def sync_all(self, db: Session):
        """
        Syncs every repository currently stored in the database
        (i.e. repositories a user has explicitly added via the
        Repository Management API). This no longer pulls every
        repo the GitHub token has access to.

        One repository failing (bad token, repo deleted on GitHub,
        rate limit, etc) does not stop the others from syncing —
        each repo is isolated and logged independently.
        """

        repositories = db.query(Repository).all()

        if not repositories:
            logger.info(
                "Skipping sync: no repositories are connected. "
                "Add a repository to start syncing pull requests."
            )
            return

        logger.info("Starting sync for %d repositories", len(repositories))

        succeeded = 0
        failed = 0

        for db_repo in repositories:

            try:
                self.sync_pull_requests(db, db_repo)
                succeeded += 1

            except GitHubRateLimitError as exc:
                # Rate limit affects every subsequent repo too (same
                # token), so stop the batch here instead of burning
                # through remaining repos and getting the same error
                # repeatedly.
                logger.warning(
                    "Rate limit hit syncing %s — stopping batch "
                    "early: %s", db_repo.full_name, exc
                )
                failed += 1
                break

            except GitHubServiceError as exc:
                logger.error(
                    "GitHub error syncing %s: %s",
                    db_repo.full_name, exc
                )
                failed += 1
                continue

            except SQLAlchemyError as exc:
                logger.error(
                    "Database error syncing %s: %s",
                    db_repo.full_name, exc
                )
                db.rollback()
                failed += 1
                continue

        logger.info(
            "Sync batch finished: %d succeeded, %d failed",
            succeeded, failed
        )

        self._refresh_alerts_for_affected_users(db, repositories)

    def _refresh_alerts_for_affected_users(
        self,
        db: Session,
        repositories: list[Repository]
    ):
        """
        Regenerates alerts for every user whose repos were part of
        this sync batch, so alerts (critical PR, blocked dependency,
        reviewer overload, merge conflict) reflect the data that was
        just synced rather than going stale until the next manual
        refresh.
        """

        user_ids = {
            repo.user_id for repo in repositories if repo.user_id
        }

        for user_id in user_ids:

            user = db.query(User).filter(User.id == user_id).first()

            if not user:
                continue

            try:
                self.alert_service.generate_alerts_for_user(db, user)

            except SQLAlchemyError as exc:
                logger.error(
                    "Failed to refresh alerts for user_id=%s "
                    "after sync: %s", user_id, exc
                )
                db.rollback()

    def sync_repository(
        self,
        db: Session,
        db_repo: Repository
    ):
        """Syncs a single repository. Used right after a repo is added."""

        self.sync_pull_requests(db, db_repo)

        if db_repo.user_id:

            user = (
                db.query(User)
                .filter(User.id == db_repo.user_id)
                .first()
            )

            if user:
                try:
                    self.alert_service.generate_alerts_for_user(db, user)
                except SQLAlchemyError as exc:
                    logger.error(
                        "Failed to refresh alerts after adding %s: %s",
                        db_repo.full_name, exc
                    )
                    db.rollback()

    def sync_repository_in_new_session(
        self,
        repository_id: int
    ) -> bool:
        """
        Sync a single repository in its own short-lived database
        session, so the caller (which might be running inside a
        request handler with its own session) doesn't have its
        transaction torn apart by the inner sync's commits /
        rollbacks.

        Returns True if the sync succeeded, False otherwise.
        Failure is non-fatal: callers (e.g. OAuth auto-populate)
        just want to know PRs are queued; a partial failure here
        means the next scheduled sync will retry.

        Why this exists:
            sync_pull_requests does db.commit() internally. Calling
            it from inside a savepoint on the request's session
            commits the OUTER transaction, leaving the session
            closed for the next operation. Doing it in a fresh
            session sidesteps that entirely.
        """

        from app.database.session import SessionLocal

        db = SessionLocal()
        try:
            db_repo = (
                db.query(Repository)
                .filter(Repository.id == repository_id)
                .first()
            )
            if not db_repo:
                logger.warning(
                    "sync_repository_in_new_session: no repo with "
                    "id=%s",
                    repository_id,
                )
                return False

            self.sync_repository(db, db_repo)
            return True

        except GitHubServiceError as exc:
            logger.warning(
                "Initial sync failed for repository_id=%s "
                "(will retry on next scheduled sync): %s",
                repository_id, exc
            )
            try:
                db.rollback()
            except Exception:
                pass
            return False

        except SQLAlchemyError as exc:
            logger.error(
                "Database error syncing repository_id=%s: %s",
                repository_id, exc, exc_info=True,
            )
            try:
                db.rollback()
            except Exception:
                pass
            return False

        except Exception as exc:
            logger.error(
                "Unexpected error syncing repository_id=%s: %s",
                repository_id, exc, exc_info=True,
            )
            try:
                db.rollback()
            except Exception:
                pass
            return False

        finally:
            db.close()

    def sync_pull_requests(
        self,
        db: Session,
        repository: Repository
    ):

        logger.info("Syncing pull requests for %s", repository.full_name)

        # If this repo belongs to a user who logged in via GitHub
        # OAuth, use their access token — it has access to their
        # private repos, while the server-wide token may not. If
        # the user has no token (password-only user, or the column
        # wasn't populated for some reason) the GitHubService
        # falls back to the server-wide token.
        owner_token = None

        if repository.user_id:
            owner_user = (
                db.query(User)
                .filter(User.id == repository.user_id)
                .first()
            )
            if owner_user:
                owner_token = owner_user.github_access_token

        # Build a per-call GitHubService so we don't mutate the
        # shared one (which would leak the user's token into the
        # next sync's headers).
        per_repo_github = GitHubService(access_token=owner_token)

        prs = per_repo_github.fetch_pull_requests(
            repository.owner,
            repository.name
        )

        # Enrich the raw GitHub PR dicts with the three signals
        # the priority engine reads but GitHub's PR-list endpoint
        # doesn't return directly:
        #   - pending_reviews:    count of PRReviewer rows for this PR
        #                         whose status is still "requested"
        #   - failing_checks:     True if the PR's head SHA has any
        #                         failing GitHub Actions / status
        #                         checks (per-PR API call, but only
        #                         for open PRs to limit cost)
        #   - is_blocking:        True if any other PR in this repo
        #                         has a Dependency row pointing AT
        #                         this PR (meaning someone is
        #                         waiting on this PR to merge)
        #
        # We do this enrichment BEFORE priority scoring so the
        # score reflects reality. Without it, "Pending Reviews",
        # "Failing Checks", and "Blocking Other PRs" factors are
        # always 0 and the priority score underestimates real risk.
        self._enrich_prs_for_priority(
            db=db,
            repository=repository,
            prs=prs,
            github=per_repo_github,
        )

        ranked_prs = self.priority.score_multiple_prs(prs)

        # Track PR number -> internal DB id for this repo so we can
        # resolve dependency references in a second pass below.
        pr_number_to_id = {}

        try:

            for pr in ranked_prs:

                existing = (
                    db.query(PullRequest)
                    .filter(
                        PullRequest.github_pr_number == pr["number"]
                    )
                    .filter(
                        PullRequest.repository_id == repository.id
                    )
                    .first()
                )

                merged_at = _parse_dt(pr.get("merged_at"))
                closed_at = _parse_dt(pr.get("closed_at"))

                # GitHub represents a merged PR with state="closed"
                # plus a merged_at timestamp. Normalize that into a
                # clearer "merged" status for our own status field.
                if merged_at:
                    status = "merged"
                else:
                    status = pr.get("state", "open")

                if existing:

                    existing.title = pr["title"]
                    existing.description = pr.get("body")
                    existing.author = pr.get("user", {}).get("login")
                    existing.status = status
                    existing.priority_score = pr["priority_score"]
                    existing.priority_level = pr["priority_level"]
                    existing.priority_breakdown = pr.get("priority_breakdown")
                    existing.merge_conflict = (
                        pr.get("mergeable") is False
                    )
                    existing.merged_at = merged_at
                    existing.closed_at = closed_at

                    pr_number_to_id[pr["number"]] = existing.id

                else:

                    db_pr = PullRequest(
                        repository_id=repository.id,
                        github_pr_number=pr["number"],
                        title=pr["title"],
                        description=pr.get("body"),
                        author=pr.get("user", {}).get("login"),
                        status=status,
                        priority_score=pr["priority_score"],
                        priority_level=pr["priority_level"],
                        priority_breakdown=pr.get("priority_breakdown"),
                        review_count=0,
                        merge_conflict=pr.get("mergeable") is False,
                        merged_at=merged_at,
                        closed_at=closed_at
                    )

                    db.add(db_pr)
                    db.flush()  # assigns db_pr.id without a full commit

                    pr_number_to_id[pr["number"]] = db_pr.id

            repository.last_synced_at = datetime.utcnow()

            db.commit()

        except SQLAlchemyError:
            db.rollback()
            logger.error(
                "Database error while saving PRs for %s",
                repository.full_name, exc_info=True
            )
            raise

        logger.info(
            "Synced %d pull requests for %s",
            len(ranked_prs), repository.full_name
        )

        # Second pass: extract "depends on #N" style references from
        # each PR body and store them as Dependency rows, now that
        # every PR in this repo has a known internal id.
        try:
            self._sync_dependencies(db, repository, ranked_prs, pr_number_to_id)
        except Exception as exc:
            logger.error("Error syncing dependencies for %s: %s", repository.full_name, exc, exc_info=True)

        # Third pass: sync requested reviewers for each PR.
        try:
            self._sync_reviewers(db, repository, ranked_prs, pr_number_to_id)
        except Exception as exc:
            logger.error("Error syncing reviewers for %s: %s", repository.full_name, exc, exc_info=True)

        # Fourth pass: fetch actual submitted reviews (with real
        # timestamps) for open PRs, to compute first_review_at and
        # power the PR detail timeline. Pass per_repo_github so
        # the user's OAuth token (not the server-wide token) is
        # used.
        try:
            self._sync_reviews(
                db, repository, ranked_prs, pr_number_to_id, per_repo_github
            )
        except Exception as exc:
            logger.error("Error syncing reviews for %s: %s", repository.full_name, exc, exc_info=True)

        try:
            repository.last_synced_at = datetime.utcnow()
            db.commit()
        except Exception:
            pass


    def _enrich_prs_for_priority(
        self,
        db: Session,
        repository: Repository,
        prs: list,
        github: "GitHubService",
    ) -> None:
        """
        Populate the three priority-engine signals that GitHub's
        PR-list response doesn't return directly:
          - pending_reviews   (count of currently-requested reviewers)
          - failing_checks    (True if CI is red on this PR's head SHA)
          - is_blocking       (True if some other PR in this repo
                               depends on this one merging first)

        Runs BEFORE priority scoring, so the score reflects real
        conditions rather than always evaluating to 0 for these
        three factors.

        Failures here are isolated per-PR: one failing API call
        doesn't stop the others from being enriched. A repo with
        no signals (e.g. no CI, no dependencies) simply gets
        zeros, which the priority engine treats as "no
        contribution from this factor".
        """

        if not prs:
            return

        # ---- is_blocking ----
        # Build a set of PR numbers that some OTHER PR in this
        # repo's body references with "depends on #N". If N is in
        # that set, the PR with number N is currently blocking
        # someone else. Cheap: O(n) scan over the bodies.
        import re

        dependency_ref_re = re.compile(
            r"(?:depends on|blocked by|requires)\s*#(\d+)",
            re.IGNORECASE,
        )

        referenced_numbers = set()
        pr_bodies = {}

        for pr in prs:
            body = pr.get("body") or ""
            pr_bodies[pr["number"]] = body
            for match in dependency_ref_re.findall(body):
                referenced_numbers.add(int(match))

        for pr in prs:
            pr_number = pr.get("number")
            pr["is_blocking"] = (
                pr_number is not None
                and pr_number in referenced_numbers
            )

        # ---- pending_reviews ----
        # GitHub's PR-list response DOES include a
        # `requested_reviewers` array inline. Count those directly
        # rather than doing another API call.
        for pr in prs:
            requested = pr.get("requested_reviewers") or []
            pr["pending_reviews"] = len(requested)

        # ---- failing_checks ----
        # One API call per open PR's head SHA. Limit to top 20 open PRs
        # so large repositories do not exhaust GitHub API rate limits or
        # cause request timeouts.
        open_prs_for_checks = [p for p in prs if p.get("state") == "open"][:20]
        for pr in prs:
            if pr.get("state") != "open" or pr not in open_prs_for_checks:
                pr["failing_checks"] = False
                continue

            head = pr.get("head") or {}
            sha = head.get("sha")

            if not sha:
                pr["failing_checks"] = False
                continue

            try:
                checks = github.fetch_pull_request_checks(
                    repository.owner,
                    repository.name,
                    sha,
                )
                pr["failing_checks"] = bool(checks.get("failing"))

            except (GitHubRateLimitError, GitHubAuthError):
                logger.warning(
                    "Rate limit hit fetching CI checks for %s — "
                    "skipping remaining checks for this repo",
                    repository.full_name,
                )
                break

            except Exception as exc:
                logger.warning(
                    "Failed to fetch CI checks for %s#%s: %s",
                    repository.full_name, pr.get("number"), exc,
                )
                pr["failing_checks"] = False
                continue

    def _sync_dependencies(
        self,
        db: Session,
        repository: Repository,
        prs: list,
        pr_number_to_id: dict
    ):

        try:

            created = 0

            for pr in prs:

                source_id = pr_number_to_id.get(pr["number"])

                if not source_id:
                    continue

                referenced_numbers = extract_dependencies(pr.get("body"))

                for target_number in referenced_numbers:

                    target_id = pr_number_to_id.get(target_number)

                    # The referenced PR isn't in this repo (or hasn't
                    # been synced yet) — skip it rather than guess.
                    if not target_id:
                        continue

                    already_exists = (
                        db.query(Dependency)
                        .filter(Dependency.source_pr_id == target_id)
                        .filter(Dependency.target_pr_id == source_id)
                        .first()
                    )

                    if already_exists:
                        continue

                    # "PR #source depends on #target" means target
                    # must merge first, i.e. target -> source in the
                    # graph.
                    dependency = Dependency(
                        source_pr_id=target_id,
                        target_pr_id=source_id,
                        dependency_type="auto"
                    )

                    db.add(dependency)
                    created += 1

            db.commit()

            if created:
                logger.info(
                    "Created %d new dependency links for %s",
                    created, repository.full_name
                )

        except SQLAlchemyError:
            db.rollback()
            logger.error(
                "Database error while syncing dependencies for %s",
                repository.full_name, exc_info=True
            )
            raise

    def _sync_reviewers(
        self,
        db: Session,
        repository: Repository,
        prs: list,
        pr_number_to_id: dict
    ):
        """
        GitHub's pull-list response includes `requested_reviewers`
        inline (no extra API call needed). This creates/updates a
        Reviewer row per unique reviewer username, and a PRReviewer
        link per (PR, reviewer) pair currently requested.

        Note: GitHub drops a user from requested_reviewers once they
        submit a review, so this reflects who is *currently* pending
        review, not full review history.
        """

        try:

            for pr in prs:

                pr_id = pr_number_to_id.get(pr["number"])

                if not pr_id:
                    continue

                requested_reviewers = pr.get("requested_reviewers") or []

                current_usernames = set()

                for reviewer_data in requested_reviewers:

                    username = reviewer_data.get("login")

                    if not username:
                        continue

                    current_usernames.add(username)

                    reviewer = (
                        db.query(Reviewer)
                        .filter(Reviewer.username == username)
                        .first()
                    )

                    if not reviewer:
                        reviewer = Reviewer(username=username)
                        db.add(reviewer)
                        db.flush()

                    existing_link = (
                        db.query(PRReviewer)
                        .filter(PRReviewer.pull_request_id == pr_id)
                        .filter(PRReviewer.reviewer_id == reviewer.id)
                        .first()
                    )

                    if not existing_link:
                        db.add(PRReviewer(
                            pull_request_id=pr_id,
                            reviewer_id=reviewer.id,
                            status="requested"
                        ))

                # Any existing "requested" links for this PR whose
                # reviewer is no longer in requested_reviewers has
                # presumably completed their review (or been
                # unassigned) — mark them reviewed rather than
                # leaving stale "requested" rows behind.
                stale_links = (
                    db.query(PRReviewer)
                    .filter(PRReviewer.pull_request_id == pr_id)
                    .filter(PRReviewer.status == "requested")
                    .all()
                )

                for link in stale_links:
                    if link.reviewer.username not in current_usernames:
                        link.status = "reviewed"

            db.commit()

            # Recompute pending_reviews per reviewer in a single query
            from sqlalchemy import func
            counts = (
                db.query(PRReviewer.reviewer_id, func.count(PRReviewer.id))
                .filter(PRReviewer.status == "requested")
                .group_by(PRReviewer.reviewer_id)
                .all()
            )
            count_map = dict(counts)
            reviewers = db.query(Reviewer).all()
            for reviewer in reviewers:
                reviewer.pending_reviews = count_map.get(reviewer.id, 0)

            db.commit()

        except SQLAlchemyError:
            db.rollback()
            logger.error(
                "Database error while syncing reviewers for %s",
                repository.full_name, exc_info=True
            )
            raise

    def _sync_reviews(
        self,
        db: Session,
        repository: Repository,
        prs: list,
        pr_number_to_id: dict,
        github: GitHubService | None = None,
    ):
        """
        Fetches actual submitted reviews (not just requested
        reviewers) for open PRs, so first_review_at can be computed
        from a real timestamp and the PR detail page can show a real
        timeline of who reviewed and when.

        This is one extra GitHub API call per PR, so it's
        deliberately limited to open PRs only — merged/closed PRs
        already have their review history and don't need refreshing
        every sync cycle, which keeps this from scaling linearly
        with a repo's entire PR history.

        A rate limit here stops fetching further reviews for this
        repo (not the whole sync batch — that's handled one level up
        in sync_all) since the PR/dependency/reviewer data already
        synced is still valid and worth keeping.

        `github` is a per-call GitHubService already configured with
        the right access token (per-user OAuth token if available,
        server-wide token otherwise). Defaults to self.github for
        backwards compatibility — callers that have a per-repo
        service should pass it explicitly so the user's OAuth token
        is actually used.
        """

        if github is None:
            github = self.github

        open_prs = [pr for pr in prs if pr.get("state") == "open"][:25]

        for pr in open_prs:

            pr_id = pr_number_to_id.get(pr["number"])

            if not pr_id:
                continue

            try:
                reviews_data = github.fetch_pull_request_reviews(
                    repository.owner,
                    repository.name,
                    pr["number"]
                )

            except (GitHubRateLimitError, GitHubAuthError):
                logger.warning(
                    "Rate limit hit fetching reviews for %s — "
                    "stopping review sync for this repo early",
                    repository.full_name
                )
                break

            except Exception as exc:
                logger.warning(
                    "Failed to fetch reviews for %s#%s: %s",
                    repository.full_name, pr["number"], exc
                )
                continue

            try:

                # Replace this PR's stored reviews with the current
                # set rather than trying to diff — review lists are
                # small (typically single digits) so this is cheap
                # and avoids duplicate-detection complexity.
                db.query(PRReview).filter(
                    PRReview.pull_request_id == pr_id
                ).delete()

                earliest_submitted = None

                for review in reviews_data:

                    submitted_at = _parse_dt(review.get("submitted_at"))

                    if submitted_at and (
                        earliest_submitted is None
                        or submitted_at < earliest_submitted
                    ):
                        earliest_submitted = submitted_at

                    db.add(PRReview(
                        pull_request_id=pr_id,
                        reviewer_username=(
                            review.get("user", {}).get("login")
                        ),
                        state=review.get("state"),
                        submitted_at=submitted_at
                    ))

                if earliest_submitted:
                    pull_request = (
                        db.query(PullRequest)
                        .filter(PullRequest.id == pr_id)
                        .first()
                    )
                    if pull_request:
                        pull_request.first_review_at = earliest_submitted

                db.commit()

            except SQLAlchemyError:
                db.rollback()
                logger.error(
                    "Database error saving reviews for %s#%s",
                    repository.full_name, pr["number"], exc_info=True
                )
                continue
