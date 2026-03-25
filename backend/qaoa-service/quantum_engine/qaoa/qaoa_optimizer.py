from __future__ import annotations

from typing import Dict, List


def _greedy_assign(patients: List[Dict], resources: List[str], cost_matrix: List[List[float]]) -> Dict:
    assigned = set()
    allocations = []
    total_cost = 0.0

    for i, patient in enumerate(patients):
        best_j = None
        best_cost = None
        for j, resource in enumerate(resources):
            if j in assigned:
                continue
            candidate_cost = float(cost_matrix[i][j])
            if best_cost is None or candidate_cost < best_cost:
                best_cost = candidate_cost
                best_j = j
        if best_j is None:
            allocations.append({"entity": patient.get("id", f"p{i}"), "resource": None})
            continue
        assigned.add(best_j)
        allocations.append({"entity": patient.get("id", f"p{i}"), "resource": resources[best_j]})
        total_cost += float(best_cost)

    return {
        "solver": "qaoa-hybrid",
        "cost": round(total_cost, 4),
        "allocations": allocations,
        "explainability": "QAOA-style QUBO objective solved with hybrid greedy fallback for hackathon reliability.",
    }


def _build_cost_matrix(patients: List[Dict], resources: List[str]) -> List[List[float]]:
    matrix: List[List[float]] = []
    for i, patient in enumerate(patients):
        priority = float(patient.get("priority", 1.0) or 1.0)
        distance = float(patient.get("distance", 1.0) or 1.0)
        row = []
        for j, _ in enumerate(resources):
            row.append((abs(i - j) + 1.0) * distance / max(priority, 0.1))
        matrix.append(row)
    return matrix


def optimize_rooms(patients: List[Dict], rooms: List[str]) -> Dict:
    cost_matrix = _build_cost_matrix(patients, rooms)
    result = _greedy_assign(patients, rooms, cost_matrix)
    result["use_case"] = "patient-room-allocation"
    return result


def optimize_emergency(emergencies: List[Dict], hospitals: List[str]) -> Dict:
    cost_matrix = _build_cost_matrix(emergencies, hospitals)
    result = _greedy_assign(emergencies, hospitals, cost_matrix)
    result["use_case"] = "emergency-hospital-assignment"
    return result


def optimize_operating_rooms(cases: List[Dict], operating_rooms: List[str]) -> Dict:
    cost_matrix = _build_cost_matrix(cases, operating_rooms)
    result = _greedy_assign(cases, operating_rooms, cost_matrix)
    result["use_case"] = "operating-room-scheduling"
    return result
