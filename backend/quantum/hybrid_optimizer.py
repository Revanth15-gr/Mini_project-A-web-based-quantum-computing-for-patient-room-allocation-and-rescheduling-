from __future__ import annotations

from typing import Any, Dict, List

from grover_search import search_doctor, search_hospital, search_room
from qaoa_doctor import optimize_doctors
from qaoa_emergency import optimize_emergency
from qaoa_room import optimize_room
from quantum_annealing import anneal_allocation
from vqe_optimizer import optimize_workload


class HybridQuantumOptimizer:
    def optimize_room_allocation(self, patients: List[Dict[str, Any]], rooms: List[Dict[str, Any]]) -> Dict[str, Any]:
        qaoa_result = optimize_room(patients, rooms)
        enriched = []
        for row in qaoa_result["assignments"]:
            if row.get("room_id"):
                enriched.append(row)
                continue

            patient = next((p for p in patients if p.get("id") == row.get("patient_id")), None)
            fallback = search_room(rooms, needs_icu=bool(patient and patient.get("icu")))
            row["room_id"] = fallback.get("id") if fallback else None
            row["room_type"] = fallback.get("type") if fallback else None
            row["hospital"] = fallback.get("hospital") if fallback else None
            enriched.append(row)

        qaoa_result["assignments"] = enriched
        qaoa_result["pipeline"] = ["QAOA", "Grover"]
        return qaoa_result

    def optimize_emergency_allocation(self, cases: List[Dict[str, Any]], hospitals: List[Dict[str, Any]]) -> Dict[str, Any]:
        result = optimize_emergency(cases, hospitals)
        for row in result["assignments"]:
            if row.get("hospital"):
                continue
            fallback = search_hospital(hospitals, severity="critical")
            row["hospital"] = fallback.get("name") if fallback else None
        result["pipeline"] = ["QAOA", "Grover"]
        return result

    def optimize_doctor_shifts(self, doctors: List[Dict[str, Any]], shifts: List[Dict[str, Any]]) -> Dict[str, Any]:
        schedule = optimize_doctors(doctors, shifts)
        workload = optimize_workload(schedule["assignments"], doctors)

        for row in schedule["assignments"]:
            if row.get("doctor_id") is not None:
                continue
            fallback = search_doctor(doctors, specialization=str(row.get("department", "")))
            row["doctor_id"] = fallback.get("id") if fallback else None
            row["doctor_name"] = fallback.get("name") if fallback else None
            row["specialization"] = fallback.get("specialization") if fallback else None

        schedule["workload"] = workload
        schedule["pipeline"] = ["QAOA", "VQE"]
        return schedule

    def optimize_resources(self, hospitals: List[Dict[str, Any]]) -> Dict[str, Any]:
        result = anneal_allocation(hospitals)
        result["pipeline"] = ["QuantumAnnealing"]
        return result
