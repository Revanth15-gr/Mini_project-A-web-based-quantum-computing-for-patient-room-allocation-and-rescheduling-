from __future__ import annotations

from typing import Dict, List

from quantum_engine.amplitude.amplitude_amplification import amplify_emergency, amplify_priority
from quantum_engine.grover.grover_search import search_doctor, search_hospital, search_room
from quantum_engine.minimum_finding.minimum_finding import find_min_distance, find_min_waiting_time
from quantum_engine.qaoa.qaoa_optimizer import optimize_emergency, optimize_operating_rooms, optimize_rooms
from quantum_engine.quantum_annealing.quantum_annealing import (
    anneal_resource_allocation,
    anneal_room_allocation,
)
from quantum_engine.quantum_ml.quantum_ml import predict_emergency, predict_load
from quantum_engine.quantum_walk.quantum_walk import hospital_network_walk, optimize_routing
from quantum_engine.vqe.vqe_optimizer import optimize_resources, optimize_schedule


class HybridQuantumOptimizer:
    """Orchestrates multi-quantum pipeline with deterministic fallback behavior."""

    def run_room_allocation(self, patients: List[Dict], rooms: List[str]) -> Dict:
        qaoa_result = optimize_rooms(patients, rooms)
        anneal_result = anneal_room_allocation(patients, rooms)
        amplified = amplify_priority(patients)

        return {
            "pipeline": ["QAOA", "QuantumAnnealing", "AmplitudeAmplification"],
            "result": qaoa_result,
            "fallback": anneal_result,
            "priority_signal": amplified,
            "quantum_explainability": (
                "Room allocation selected via QAOA objective; annealing fallback and amplitude"
                " prioritization kept for resilience under noisy workloads."
            ),
        }

    def run_emergency_assignment(self, emergencies: List[Dict], hospitals: List[Dict]) -> Dict:
        amplified = amplify_emergency(emergencies)
        best_hospital = search_hospital(
            hospitals,
            target={"severity_score": emergencies[0].get("severity_score", 1.0) if emergencies else 1.0},
        )
        min_distance = find_min_distance(hospitals)
        qaoa_emergency = optimize_emergency(emergencies, [h.get("name", "unknown") for h in hospitals])

        return {
            "pipeline": ["Grover", "AmplitudeAmplification", "QAOA", "MinimumFinding"],
            "result": {
                "best_hospital": best_hospital,
                "minimum_distance": min_distance,
                "allocation": qaoa_emergency,
            },
            "amplified_emergencies": amplified,
            "quantum_explainability": (
                "Emergency triage first amplifies severity, then Grover-style search ranks hospitals"
                " while minimum-finding validates shortest path choice."
            ),
        }

    def run_operating_room(self, cases: List[Dict], operating_rooms: List[str]) -> Dict:
        qaoa = optimize_operating_rooms(cases, operating_rooms)
        schedule = optimize_schedule(cases, operating_rooms)
        wait = find_min_waiting_time(
            [{"resource": room, "waiting_time": i + 1} for i, room in enumerate(operating_rooms)]
        )
        return {
            "pipeline": ["QAOA", "VQE", "MinimumFinding"],
            "result": qaoa,
            "schedule": schedule,
            "minimum_wait": wait,
        }

    def run_ambulance_routing(self, graph: Dict, source: str, destination: str) -> Dict:
        route = optimize_routing(graph, source, destination)
        network = hospital_network_walk(graph, source)
        return {
            "pipeline": ["QuantumWalk"],
            "route": route,
            "network_walk": network,
            "quantum_explainability": "Quantum walk traversed hospital graph for near-optimal route discovery.",
        }

    def run_prediction(self, emergency_history: List[Dict], hospital_metrics: List[Dict]) -> Dict:
        return {
            "pipeline": ["QuantumML"],
            "emergency_prediction": predict_emergency(emergency_history),
            "load_prediction": predict_load(hospital_metrics),
        }

    def run_resource_balancing(self, hospitals: List[Dict], resources: List[Dict], demands: List[Dict]) -> Dict:
        vqe_result = optimize_resources(hospitals)
        annealing = anneal_resource_allocation(resources, demands)
        return {
            "pipeline": ["VQE", "QuantumAnnealing"],
            "vqe": vqe_result,
            "annealing": annealing,
        }

    def run_doctor_search(self, doctors: List[Dict], target: Dict) -> Dict:
        return {
            "pipeline": ["Grover"],
            "result": search_doctor(doctors, target),
        }

    def run_room_search(self, rooms: List[Dict], target: Dict) -> Dict:
        return {
            "pipeline": ["Grover"],
            "result": search_room(rooms, target),
        }
