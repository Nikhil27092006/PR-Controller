from app.analyzers.reviewer_analyzer import calculate_workload


class MockReviewer:

    def __init__(
        self,
        username,
        pending_reviews,
        completed_reviews,
        avg_review_time_hours
    ):
        self.username = username
        self.pending_reviews = pending_reviews
        self.completed_reviews = completed_reviews
        self.avg_review_time_hours = avg_review_time_hours


def test_reviewer_workload_sorting():

    reviewers = [

        MockReviewer(
            "Nikhil Singh",
            10,
            50,
            6
        ),

        MockReviewer(
            "Anshul Katkar",
            2,
            40,
            2
        )
    ]

    result = calculate_workload(reviewers)

    assert result[0]["username"] == "Nikhil Singh"


def test_single_reviewer():

    reviewers = [

        MockReviewer(
            "Nikhil Singh",
            5,
            20,
            3
        )
    ]

    result = calculate_workload(reviewers)

    assert len(result) == 1

    assert result[0]["username"] == "Nikhil Singh"


def test_empty_reviewer_list():

    result = calculate_workload([])

    assert result == []