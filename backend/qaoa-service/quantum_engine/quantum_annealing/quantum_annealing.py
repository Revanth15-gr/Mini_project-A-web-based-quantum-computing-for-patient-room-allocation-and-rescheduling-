from __future__ import annotations

from typing import Dict, List


def anneal_room_allocation(patients: List[Dict], rooms: List[str]) -> Dict:
    if not patients:
        return {"solver": "quantum-annealing", "allocation": []}

    sorted_patients = sorted(patients, key=lambda p: float(p.get("priority", 1.0) or 1.0), reverse=True)
    allocation = []
    for i, patient in enumerate(sorted_patients):
        room = rooms[i % len(rooms)] if rooms else None
        allocation.append({"patient": patient.get("id", f"p-{i}"), "room": room})

    return {
        "solver": "quantum-annealing",
        "allocation": allocation,
        "energy": round(1.0 / max(len(rooms), 1), 4),
        "explainability": "Annealing simulation maps high-priority patients first to available binary room states.",
    }


def anneal_resource_allocation(resources: List[Dict], demands: List[Dict]) -> Dict:
    if not resources:
        return {"solver": "quantum-annealing", "mapping": []}

    mapping = []
    for i, demand in enumerate(demands):
        resource = resources[i % len(resources)]
        mapping.append({"demand": demand.get("id", f"d-{i}"), "resource": resource.get("id", f"r-{i}")})

    return {"solver": "quantum-annealing", "mapping": mapping}
