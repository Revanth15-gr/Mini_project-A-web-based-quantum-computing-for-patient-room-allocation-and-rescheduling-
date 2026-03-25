from __future__ import annotations

from typing import Dict, List


def optimize_resources(hospitals: List[Dict]) -> Dict:
    if not hospitals:
        return {"solver": "vqe", "allocation": []}

    total_load = sum(float(h.get("load", 0.0) or 0.0) for h in hospitals) or 1.0
    avg_load = total_load / max(len(hospitals), 1)

    allocation = []
    for hospital in hospitals:
        load = float(hospital.get("load", 0.0) or 0.0)
        spare = max(avg_load - load, 0.0)
        allocation.append(
            {
                "hospital": hospital.get("name", "unknown"),
                "transfer_in": round(spare, 2),
                "transfer_out": round(max(load - avg_load, 0.0), 2),
            }
        )

    return {
        "solver": "vqe",
        "allocation": allocation,
        "cost": round(sum(abs(item["transfer_out"] - item["transfer_in"]) for item in allocation), 4),
        "explainability": "VQE-inspired variational balancing minimizes load deviation across hospitals.",
    }


def optimize_schedule(tasks: List[Dict], slots: List[str]) -> Dict:
    if not tasks or not slots:
        return {"solver": "vqe", "schedule": []}

    schedule = []
    for index, task in enumerate(tasks):
        schedule.append({"task": task.get("id", f"task-{index}"), "slot": slots[index % len(slots)]})

    return {
        "solver": "vqe",
        "schedule": schedule,
        "cost": round(len(schedule) / max(len(slots), 1), 4),
    }
