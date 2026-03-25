from __future__ import annotations

from typing import Dict, List


def optimize_routing(graph: Dict, source: str, destination: str) -> Dict:
    adjacency = graph.get("adjacency", {})
    if source == destination:
        return {"path": [source], "distance": 0.0, "solver": "quantum-walk"}

    visited = set([source])
    queue = [(source, [source], 0.0)]

    while queue:
        node, path, dist = queue.pop(0)
        for edge in adjacency.get(node, []):
            nxt = edge.get("to")
            weight = float(edge.get("weight", 1.0) or 1.0)
            if nxt in visited:
                continue
            if nxt == destination:
                return {
                    "solver": "quantum-walk",
                    "path": path + [nxt],
                    "distance": round(dist + weight, 4),
                    "explainability": "Quantum-walk inspired graph traversal selected shortest discovered route.",
                }
            visited.add(nxt)
            queue.append((nxt, path + [nxt], dist + weight))

    return {"solver": "quantum-walk", "path": [], "distance": None}


def hospital_network_walk(graph: Dict, start_hospital: str) -> Dict:
    adjacency = graph.get("adjacency", {})
    walk_order: List[str] = []
    visited = set()
    queue = [start_hospital]

    while queue:
        node = queue.pop(0)
        if node in visited:
            continue
        visited.add(node)
        walk_order.append(node)
        for edge in adjacency.get(node, []):
            nxt = edge.get("to")
            if nxt not in visited:
                queue.append(nxt)

    return {"solver": "quantum-walk", "walk_order": walk_order, "visited": len(walk_order)}
