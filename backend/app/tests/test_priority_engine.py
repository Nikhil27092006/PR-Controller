from datetime import datetime, timedelta

from app.analyzers.priority_engine import calculate_priority


def test_low_priority_pr():

    pr_data = {
        "created_at": datetime.utcnow(),
        "pending_reviews": 0,
        "merge_conflict": False,
        "failing_checks": False,
        "is_blocking": False,
        "labels": []
    }

    result = calculate_priority(pr_data)

    assert result["priority_level"] == "Low"


def test_high_priority_pr():

    pr_data = {
        "created_at": datetime.utcnow() - timedelta(days=8),
        "pending_reviews": 3,
        "merge_conflict": True,
        "failing_checks": False,
        "is_blocking": False,
        "labels": ["bug"]
    }

    result = calculate_priority(pr_data)

    assert result["priority_score"] > 100


def test_critical_priority_pr():

    pr_data = {
        "created_at": datetime.utcnow() - timedelta(days=20),
        "pending_reviews": 5,
        "merge_conflict": True,
        "failing_checks": True,
        "is_blocking": True,
        "labels": ["security"]
    }

    result = calculate_priority(pr_data)

    assert result["priority_level"] == "Critical"