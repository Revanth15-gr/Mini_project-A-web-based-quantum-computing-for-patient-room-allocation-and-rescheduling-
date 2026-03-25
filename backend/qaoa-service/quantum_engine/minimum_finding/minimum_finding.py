from __future__ import annotations

from typing import Dict, List


def find_min_distance(hospitals: List[Dict]) -> Dict:
    if not hospitals:
        return {"hospital": None, "distance": None}
    best = min(hospitals, key=lambda h: float(h.get("distance", 1e9) or 1e9))
    return {"hospital": best, "distance": float(best.get("distance", 0.0) or 0.0)}


def find_min_waiting_time(queues: List[Dict]) -> Dict:
    if not queues:
        return {"resource": None, "waiting_time": None}
    best = min(queues, key=lambda q: float(q.get("waiting_time", 1e9) or 1e9))
    return {
        "resource": best,
        "waiting_time": float(best.get("waiting_time", 0.0) or 0.0),
    }
