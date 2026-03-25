from __future__ import annotations

from typing import Any, Dict, List, Optional


def _pick_best(items: List[Dict[str, Any]], scorer) -> Optional[Dict[str, Any]]:
    if not items:
        return None
    return max(items, key=scorer)


def search_hospital(hospitals: List[Dict[str, Any]], severity: str = "medium") -> Optional[Dict[str, Any]]:
    severity_boost = {"critical": 1.8, "high": 1.4, "medium": 1.0, "low": 0.8}.get(str(severity).lower(), 1.0)

    def score(hospital: Dict[str, Any]) -> float:
        icu = float(hospital.get("icu_available", 0))
        doctors = float(hospital.get("doctors_available", 0))
        distance = float(hospital.get("distance_km", hospital.get("distance", 10)) or 10)
        return (icu * 2.0 + doctors * 1.2) * severity_boost - distance

    return _pick_best(hospitals, score)


def search_room(rooms: List[Dict[str, Any]], needs_icu: bool = False) -> Optional[Dict[str, Any]]:
    candidates = [room for room in rooms if room.get("available", False)]
    if needs_icu:
        icu_candidates = [room for room in candidates if str(room.get("type", "")).lower() == "icu"]
        if icu_candidates:
            candidates = icu_candidates

    def score(room: Dict[str, Any]) -> float:
        room_type = str(room.get("type", "general")).lower()
        base = 2.0 if room_type == "icu" else 1.0
        return base + float(room.get("priority_score", 0))

    return _pick_best(candidates, score)


def search_doctor(doctors: List[Dict[str, Any]], specialization: str = "") -> Optional[Dict[str, Any]]:
    required = str(specialization or "").strip().lower()

    def score(doctor: Dict[str, Any]) -> float:
        exp = float(doctor.get("experience", 0))
        fatigue = float(doctor.get("fatigue_score", 0))
        available = 1.0 if doctor.get("available", True) else 0.0
        spec_match = 2.0 if required and str(doctor.get("specialization", "")).lower() == required else 0.0
        return exp * 0.5 + spec_match + available - fatigue

    candidates = [d for d in doctors if d.get("available", True)]
    return _pick_best(candidates or doctors, score)
