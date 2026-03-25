from __future__ import annotations

import random
from typing import Dict, List


def generate_random_patients(count: int = 10) -> List[Dict]:
    patients = []
    for i in range(count):
        patients.append(
            {
                "id": f"P-{i+1:03d}",
                "priority": round(random.uniform(0.8, 2.0), 2),
                "distance": round(random.uniform(0.5, 15.0), 2),
            }
        )
    return patients


def generate_random_emergencies(count: int = 5) -> List[Dict]:
    emergencies = []
    for i in range(count):
        emergencies.append(
            {
                "id": f"E-{i+1:03d}",
                "severity_score": round(random.uniform(0.9, 2.2), 2),
                "distance": round(random.uniform(0.5, 20.0), 2),
            }
        )
    return emergencies


def generate_hospital_load(hospitals: List[str]) -> List[Dict]:
    return [
        {
            "hospital": name,
            "current_load": round(random.uniform(45, 95), 2),
            "trend": round(random.uniform(-8, 12), 2),
        }
        for name in hospitals
    ]


def benchmark_quantum_vs_classical(quantum_cost: float, classical_cost: float) -> Dict:
    if classical_cost <= 0:
        gain = 0.0
    else:
        gain = ((classical_cost - quantum_cost) / classical_cost) * 100.0

    return {
        "quantum_cost": round(quantum_cost, 4),
        "classical_cost": round(classical_cost, 4),
        "improvement_percent": round(gain, 2),
    }
