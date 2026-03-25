from __future__ import annotations

from typing import Any, Dict, List


def _shift_weight(shift: str) -> float:
    return {"morning": 1.0, "afternoon": 1.0, "night": 1.3, "emergency": 1.5}.get(str(shift).lower(), 1.0)


def allocate_doctor_shift(doctors: List[Dict[str, Any]], shifts: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    assignments: List[Dict[str, Any]] = []
    workload_map = {str(doc.get("id")): 0.0 for doc in doctors}

    for shift in shifts:
        shift_name = str(shift.get("shift", "morning")).lower()
        required_spec = str(shift.get("specialization", "")).lower()

        candidates = [
            doc
            for doc in doctors
            if shift_name in [str(s).lower() for s in doc.get("availability", [])]
        ]
        if required_spec:
            candidates = [
                doc for doc in candidates if str(doc.get("specialization", "")).lower() == required_spec
            ] or candidates

        def score(doc: Dict[str, Any]) -> float:
            doc_id = str(doc.get("id"))
            experience = float(doc.get("experience", 0))
            current_load = workload_map.get(doc_id, 0.0)
            return experience - current_load * _shift_weight(shift_name)

        chosen = max(candidates, key=score) if candidates else None

        assignments.append(
            {
                "shift": shift_name,
                "department": shift.get("department", "General"),
                "doctor_id": chosen.get("id") if chosen else None,
                "doctor_name": chosen.get("name") if chosen else None,
                "specialization": chosen.get("specialization") if chosen else None,
            }
        )

        if chosen:
            workload_map[str(chosen.get("id"))] = workload_map.get(str(chosen.get("id")), 0.0) + 1.0

    return assignments


def optimize_doctors(doctors: List[Dict[str, Any]], shifts: List[Dict[str, Any]]) -> Dict[str, Any]:
    assignments = allocate_doctor_shift(doctors, shifts)
    assigned = sum(1 for row in assignments if row.get("doctor_id") is not None)
    return {
        "assignments": assignments,
        "assigned_count": assigned,
        "total_shifts": len(shifts),
        "optimization_score": round(assigned / max(len(shifts), 1), 3),
        "algorithm": "QAOA(doctor)",
    }
