import re


DEPENDENCY_PATTERNS = [
    r"depends on #(\d+)",
    r"blocked by #(\d+)",
    r"requires #(\d+)"
]


def extract_dependencies(pr_body: str):
    dependencies = []

    if not pr_body:
        return dependencies

    body = pr_body.lower()

    for pattern in DEPENDENCY_PATTERNS:
        matches = re.findall(pattern, body)

        for match in matches:
            dependencies.append(int(match))

    return list(set(dependencies))