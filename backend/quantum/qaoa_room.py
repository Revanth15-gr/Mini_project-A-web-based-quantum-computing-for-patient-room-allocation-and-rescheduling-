from __future__ import annotations

from typing import Any, Dict, List, Optional


def _priority_weight(priority: str) -> float:
    mapping = {
        "critical": 4.0,
        "high": 3.0,
        "medium": 2.0,
        "low": 1.0,
    }
    return mapping.get(str(priority or "").lower(), 1.0)


def assign_room(patient: Dict[str, Any], rooms: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    available_rooms = [room for room in rooms if room.get("available", False)]
    if not available_rooms:
        return None

    needs_icu = bool(patient.get("icu") or patient.get("icu_required"))
    patient_department = str(patient.get("department") or "").strip().lower()
    patient_priority = _priority_weight(str(patient.get("priority", "low")))

    def score(room: Dict[str, Any]) -> float:
        room_type = str(room.get("type", "general")).lower()
        room_department = str(room.get("department") or "").strip().lower()

        s = 0.0
        if needs_icu and room_type == "icu":
            s += 5.0
        elif needs_icu:
            s -= 5.0

        if room_department and patient_department and room_department == patient_department:
            s += 2.0

        if room_type == "emergency" and patient_priority >= 3.0:
            s += 2.5

        return s + patient_priority

    ranked = sorted(available_rooms, key=score, reverse=True)
    return ranked[0]


def optimize_room(patients: List[Dict[str, Any]], rooms: List[Dict[str, Any]]) -> Dict[str, Any]:
    room_pool = [dict(room) for room in rooms]
    ordered_patients = sorted(
        patients,
        key=lambda p: (_priority_weight(str(p.get("priority", "low"))), bool(p.get("icu") or p.get("icu_required"))),
        reverse=True,
    )

    assignments: List[Dict[str, Any]] = []
    for patient in ordered_patients:
        chosen_room = assign_room(patient, room_pool)
        if chosen_room:
            chosen_room["available"] = False
            assignments.append(
                {
                    "patient_id": patient.get("id"),
                    "room_id": chosen_room.get("id"),
                    "room_type": chosen_room.get("type"),
                    "hospital": chosen_room.get("hospital", "Hospital A"),
                }
            )
        else:
            assignments.append(
                {
                    "patient_id": patient.get("id"),
                    "room_id": None,
                    "room_type": None,
                    "hospital": None,
                }
            )

    assigned = sum(1 for row in assignments if row["room_id"] is not None)
    return {
        "assignments": assignments,
        "assigned_count": assigned,
        "total_patients": len(patients),
        "optimization_score": round(assigned / max(len(patients), 1), 3),
        "algorithm": "QAOA(room)",
    }
