"""
One-time migration: add `github_access_token` column to the users table.

Run with:  python migrate_add_github_token.py

Why this exists:
    The User model gained a `github_access_token` column so OAuth
    users' access tokens can be persisted and used for per-user
    GitHub API calls (so private repos show up in the dashboard).
    `Base.metadata.create_all()` only creates tables that don't
    already exist — it does NOT add new columns to an existing
    table. Run this once after pulling these changes to bring the
    production / dev database up to date.
"""
import psycopg2

from app.config.settings import settings


def main():
    dsn = settings.DB_CONNECTION

    conn = psycopg2.connect(dsn)
    conn.autocommit = True
    cur = conn.cursor()

    migrations = [
        (
            "github_access_token",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS "
            "github_access_token VARCHAR(500);",
        ),
    ]

    for col, sql in migrations:
        try:
            cur.execute(sql)
            print(f"[OK] Column '{col}' added (or already existed).")
        except Exception as exc:
            print(f"[FAIL] Failed to add '{col}': {exc}")

    cur.close()
    conn.close()
    print("\nMigration complete.")


if __name__ == "__main__":
    main()
