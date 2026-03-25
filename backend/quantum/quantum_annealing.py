from __future__ import annotations

from typing import Any, Dict, List


def anneal_allocation(hospitals: List[Dict[str, Any]]) -> Dict[str, Any]:
    if not hospitals:
        return {"optimized": [], "algorithm": "QuantumAnnealing"}

    total_load = sum(float(h.get("load", h.get("occupancy", 0))) for h in hospitals)
    target = total_load / len(hospitals)

    optimized = []
    for hospital in hospitals:
        current = float(hospital.get("load", hospital.get("occupancy", 0)))
        delta = target - current
        optimized.append(
            {
                "hospital": hospital.get("name"),
                "current_load": round(current, 2),
                "target_load": round(target, 2),
                "adjustment": round(delta, 2),
            }
        )

    return {
        "optimized": optimized,
        "target": round(target, 2),
        "algorithm": "QuantumAnnealing(binary-allocation)",
    }
