from __future__ import annotations

from typing import Dict, List


def amplify_priority(patients: List[Dict]) -> Dict:
    ranked = sorted(
        patients,
        key=lambda p: float(p.get("priority", 1.0) or 1.0),
        reverse=True,
    )
    amplified = [
        {
            "id": p.get("id"),
            "priority": float(p.get("priority", 1.0) or 1.0),
            "amplified_weight": round(float(p.get("priority", 1.0) or 1.0) ** 1.2, 4),
        }
        for p in ranked
    ]
    return {"solver": "amplitude-amplification", "amplified": amplified}


def amplify_emergency(emergencies: List[Dict]) -> Dict:
    ranked = sorted(
        emergencies,
        key=lambda e: float(e.get("severity_score", 1.0) or 1.0),
        reverse=True,
    )
    return {
        "solver": "amplitude-amplification",
        "ranked_emergencies": ranked,
        "explainability": "Higher severity amplitudes were amplified for triage-first decisioning.",
    }
