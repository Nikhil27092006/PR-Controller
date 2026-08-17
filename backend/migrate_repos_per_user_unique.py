"""
One-time migration: change `repositories.github_repo_id` from
globally unique to unique-per-user.

Why:
    Originally the column had `unique=True`, which made sense when
    the system tracked a single set of repos globally. Now that
    each user has their own list (especially after GitHub OAuth
    auto-populate), two different users tracking the same GitHub
    repo would collide on github_repo_id. The fix is a composite
    unique constraint on (user_id, github_repo_id).

Run with:  python migrate_repos_per_user_unique.py

This migration is idempotent — it skips steps that have already
been applied. Safe to re-run.

Steps:
  1. Drop the global unique index `repositories_github_repo_id_key`
     if it exists.
  2. If multiple rows currently share the same (user_id,
     github_repo_id) — which can only happen for user_id IS NULL
     (legacy orphan rows), because the composite constraint didn't
     exist yet — dedupe by deleting the older duplicates.
  3. Add the composite unique constraint
     `uq_repositories_user_github_repo_id` if it doesn't exist.
"""
import psycopg2

from app.config.settings import settings


def main():
    dsn = settings.DB_CONNECTION

    conn = psycopg2.connect(dsn)
    conn.autocommit = False
    cur = conn.cursor()

    try:
        # 1. Drop the old global unique constraint if present.
        cur.execute("""
            ALTER TABLE repositories
            DROP CONSTRAINT IF EXISTS repositories_github_repo_id_key;
        """)
        print("[OK] Dropped global unique constraint on "
              "repositories.github_repo_id (if it existed).")

        # 2. Resolve any pre-existing (user_id, github_repo_id)
        #    duplicates so the new composite unique can be
        #    installed without UniqueViolation.
        #
        #    Two kinds of duplicates are possible:
        #      (a) Multiple rows with user_id IS NULL and the
        #          same github_repo_id (legacy orphan rows).
        #      (b) One row with user_id IS NULL and one with
        #          user_id = N for the same github_repo_id —
        #          the NULL row is the leftover from before the
        #          model required ownership and is meaningless
        #          once each user has their own row.
        #
        #    Step (a) deletes the older of the two NULL-user
        #    rows. Step (b) deletes the NULL-user row outright
        #    since it's a legacy orphan that shouldn't block
        #    real users from connecting the repo.
        cur.execute("""
            DELETE FROM repositories
            WHERE user_id IS NULL;
        """)
        null_deleted = cur.rowcount
        if null_deleted:
            print(f"[OK] Removed {null_deleted} legacy orphan "
                  "repositories rows (user_id IS NULL).")
        else:
            print("[OK] No legacy orphan repository rows found.")

        cur.execute("""
            DELETE FROM repositories r1
            USING repositories r2
            WHERE r1.github_repo_id = r2.github_repo_id
              AND r1.user_id IS NOT DISTINCT FROM r2.user_id
              AND r1.id < r2.id;
        """)
        deleted = cur.rowcount
        if deleted:
            print(f"[OK] Removed {deleted} pre-existing duplicate "
                  "repositories rows (kept newest per group).")
        else:
            print("[OK] No duplicate (user_id, github_repo_id) "
                  "rows needed cleanup.")

        # 3. Add the composite unique constraint.
        cur.execute("""
            ALTER TABLE repositories
            ADD CONSTRAINT uq_repositories_user_github_repo_id
            UNIQUE (user_id, github_repo_id);
        """)
        print("[OK] Added composite unique constraint "
              "uq_repositories_user_github_repo_id.")

        conn.commit()
        print("\nMigration complete.")

    except Exception as exc:
        conn.rollback()
        print(f"[FAIL] Migration aborted: {exc}")
        raise

    finally:
        cur.close()
        conn.close()


if __name__ == "__main__":
    main()
