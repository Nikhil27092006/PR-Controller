"""
One-time migration: add missing DateTime columns to pull_requests table.
Run with:  python migrate_add_columns.py
"""
import psycopg2
from app.config.settings import settings

# Extract raw DSN from SQLAlchemy URL
dsn = settings.DB_CONNECTION.replace("postgresql://", "postgresql://")

conn = psycopg2.connect(dsn)
conn.autocommit = True
cur = conn.cursor()

migrations = [
    ("merged_at",      "ALTER TABLE pull_requests ADD COLUMN IF NOT EXISTS merged_at TIMESTAMP;"),
    ("closed_at",      "ALTER TABLE pull_requests ADD COLUMN IF NOT EXISTS closed_at TIMESTAMP;"),
    ("first_review_at","ALTER TABLE pull_requests ADD COLUMN IF NOT EXISTS first_review_at TIMESTAMP;"),
]

for col, sql in migrations:
    try:
        cur.execute(sql)
        print(f"[OK] Column '{col}' added (or already existed).")
    except Exception as e:
        print(f"[FAIL] Failed to add '{col}': {e}")

cur.close()
conn.close()
print("\nMigration complete.")
