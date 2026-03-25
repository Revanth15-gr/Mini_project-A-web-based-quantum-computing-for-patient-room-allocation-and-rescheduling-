from __future__ import annotations

from typing import Dict, List


def _argmax_index(scores: List[float]) -> int:
    return max(range(len(scores)), key=lambda idx: scores[idx]) if scores else -1


def search_hospital(hospitals: List[Dict], target: Dict) -> Dict:
    if not hospitals:
        return {"best_hospital": None, "score": 0.0}

    severity = float(target.get("severity_score", 1.0) or 1.0)
    scores = []
    for hospital in hospitals:
        capacity = float(hospital.get("capacity", 1.0) or 1.0)
        distance = float(hospital.get("distance", 1.0) or 1.0)
        specialist = float(hospital.get("specialist_match", 1.0) or 1.0)
        score = (capacity * specialist * severity) / max(distance, 0.1)
        scores.append(score)

    best_idx = _argmax_index(scores)
    return {
        "best_hospital": hospitals[best_idx],
        "score": round(scores[best_idx], 4),
        "explainability": "Grover-inspired oracle score favors high capacity and low distance hospitals.",
    }


def search_room(rooms: List[Dict], target: Dict) -> Dict:
    if not rooms:
        return {"best_room": None, "score": 0.0}

    priority = float(target.get("priority", 1.0) or 1.0)
    scores = []
    for room in rooms:
        availability = 1.0 if room.get("available", True) else 0.1
        icu_fit = 1.2 if target.get("needs_icu") and room.get("icu", False) else 1.0
        distance = float(room.get("distance", 1.0) or 1.0)
        scores.append((availability * icu_fit * priority) / max(distance, 0.1))

    best_idx = _argmax_index(scores)
    return {"best_room": rooms[best_idx], "score": round(scores[best_idx], 4)}


def search_doctor(doctors: List[Dict], target: Dict) -> Dict:
    if not doctors:
        return {"best_doctor": None, "score": 0.0}

    required_specialty = str(target.get("specialty", "")).lower()
    scores = []
    for doctor in doctors:
        specialty = str(doctor.get("specialty", "")).lower()
        specialty_score = 1.5 if required_specialty and required_specialty in specialty else 1.0
        load = float(doctor.get("active_cases", 0.0) or 0.0)
        availability = 1.0 if doctor.get("available", True) else 0.2
        score = specialty_score * availability / (1.0 + load)
        scores.append(score)

    best_idx = _argmax_index(scores)
    return {"best_doctor": doctors[best_idx], "score": round(scores[best_idx], 4)}
