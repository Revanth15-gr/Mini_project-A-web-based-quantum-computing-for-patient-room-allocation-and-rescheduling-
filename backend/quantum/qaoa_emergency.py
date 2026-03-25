from __future__ import annotations

from typing import Any, Dict, List

from grover_search import search_hospital


def assign_emergency_hospital(emergency_case: Dict[str, Any], hospitals: List[Dict[str, Any]]) -> Dict[str, Any]:
    severity = str(emergency_case.get("severity", "high"))
    selected = search_hospital(hospitals, severity=severity)

    return {
        "patient_id": emergency_case.get("patient_id") or emergency_case.get("id"),
        "hospital": selected.get("name") if selected else None,
        "distance_km": selected.get("distance_km") if selected else None,
        "icu_available": selected.get("icu_available") if selected else 0,
        "doctor_support": selected.get("doctors_available") if selected else 0,
    }


def optimize_emergency(cases: List[Dict[str, Any]], hospitals: List[Dict[str, Any]]) -> Dict[str, Any]:
    assignments = [assign_emergency_hospital(case, hospitals) for case in cases]
    assigned = sum(1 for row in assignments if row.get("hospital"))
    return {
        "assignments": assignments,
        "assigned_count": assigned,
        "total_cases": len(cases),
        "optimization_score": round(assigned / max(len(cases), 1), 3),
        "algorithm": "QAOA(emergency)+Grover",
    }
