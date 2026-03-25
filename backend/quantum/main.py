from __future__ import annotations

from typing import Any, Dict, List

from fastapi import FastAPI
from pydantic import BaseModel, Field

from hybrid_optimizer import HybridQuantumOptimizer


class RoomRequest(BaseModel):
    patients: List[Dict[str, Any]] = Field(default_factory=list)
    rooms: List[Dict[str, Any]] = Field(default_factory=list)


class EmergencyRequest(BaseModel):
    emergencies: List[Dict[str, Any]] = Field(default_factory=list)
    hospitals: List[Dict[str, Any]] = Field(default_factory=list)


class DoctorRequest(BaseModel):
    doctors: List[Dict[str, Any]] = Field(default_factory=list)
    shifts: List[Dict[str, Any]] = Field(default_factory=list)


app = FastAPI(title="Advanced Quantum Healthcare Engine")
optimizer = HybridQuantumOptimizer()


@app.post("/quantum/room")
def quantum_room(request: RoomRequest) -> Dict[str, Any]:
    return optimizer.optimize_room_allocation(request.patients, request.rooms)


@app.post("/quantum/emergency")
def quantum_emergency(request: EmergencyRequest) -> Dict[str, Any]:
    return optimizer.optimize_emergency_allocation(request.emergencies, request.hospitals)


@app.post("/quantum/doctor")
def quantum_doctor(request: DoctorRequest) -> Dict[str, Any]:
    return optimizer.optimize_doctor_shifts(request.doctors, request.shifts)


@app.get("/quantum/status")
def quantum_status() -> Dict[str, Any]:
    return {
        "service": "advanced-quantum-healthcare",
        "algorithms": ["QAOA", "Grover", "VQE", "QuantumAnnealing", "Hybrid"],
        "status": "ok",
    }
