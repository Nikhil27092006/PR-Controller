from collections import defaultdict


def build_dependency_graph(
    dependencies
):
    """
    Example:

    [
        (15, 20),
        (15, 21),
        (20, 30)
    ]
    """

    graph = defaultdict(list)

    for source, target in dependencies:
        graph[source].append(target)

    return dict(graph)


def count_dependencies(
    graph: dict
):

    results = {}

    for node, edges in graph.items():

        results[node] = len(edges)

    return results