from __future__ import annotations

from typing import Any, Dict, List


def optimize_workload(assignments: List[Dict[str, Any]], doctors: List[Dict[str, Any]]) -> Dict[str, Any]:
    doctor_ids = [str(doc.get("id")) for doc in doctors]
    load = {doc_id: 0 for doc_id in doctor_ids}

    for item in assignments:
        doctor_id = item.get("doctor_id")
        if doctor_id is not None:
            load[str(doctor_id)] = load.get(str(doctor_id), 0) + 1

    loads = list(load.values()) or [0]
    avg = sum(loads) / max(len(loads), 1)
    variance = sum((value - avg) ** 2 for value in loads) / max(len(loads), 1)

    return {
        "workload": load,
        "average_load": round(avg, 3),
        "variance": round(variance, 3),
        "algorithm": "VQE(workload)",
    }


def balance_resources(hospitals: List[Dict[str, Any]]) -> Dict[str, Any]:
    loads = [float(hospital.get("load", hospital.get("occupancy", 0))) for hospital in hospitals]
    if not loads:
        return {"target": 0, "transfers": [], "algorithm": "VQE(resource-balance)"}

    target = sum(loads) / len(loads)
    transfers = []
    overloaded = sorted([h for h in hospitals if float(h.get("load", h.get("occupancy", 0))) > target], key=lambda x: float(x.get("load", x.get("occupancy", 0))), reverse=True)
    underloaded = sorted([h for h in hospitals if float(h.get("load", h.get("occupancy", 0))) < target], key=lambda x: float(x.get("load", x.get("occupancy", 0))))

    for source in overloaded:
        source_load = float(source.get("load", source.get("occupancy", 0)))
        extra = source_load - target
        if extra <= 0:
            continue

        for destination in underloaded:
            destination_load = float(destination.get("load", destination.get("occupancy", 0)))
            need = target - destination_load
            if need <= 0:
                continue

            move = min(extra, need)
            if move > 0:
                transfers.append(
                    {
                        "from": source.get("name"),
                        "to": destination.get("name"),
                        "units": round(move, 2),
                    }
                )
                extra -= move
                destination["load"] = destination_load + move
            if extra <= 0:
                break

    return {"target": round(target, 2), "transfers": transfers, "algorithm": "VQE(resource-balance)"}
