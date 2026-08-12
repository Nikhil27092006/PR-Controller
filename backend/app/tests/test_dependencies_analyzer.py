from app.analyzers.dependency_analyzer import extract_dependencies


def test_single_dependency():

    pr_body = """
    This feature depends on #15
    """

    result = extract_dependencies(pr_body)

    assert result == [15]


def test_multiple_dependencies():

    pr_body = """
    Depends on #10
    Blocked by #20
    Requires #30
    """

    result = extract_dependencies(pr_body)

    assert set(result) == {10, 20, 30}


def test_no_dependencies():

    pr_body = """
    Normal PR with no dependency.
    """

    result = extract_dependencies(pr_body)

    assert result == []


def test_empty_body():

    result = extract_dependencies("")

    assert result == []