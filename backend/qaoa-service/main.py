from typing import List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from qiskit.primitives import Sampler
from qiskit_algorithms import QAOA
from qiskit_algorithms.optimizers import COBYLA
from qiskit_optimization import QuadraticProgram
from qiskit_optimization.algorithms import MinimumEigenOptimizer

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Patient(BaseModel):
    id: str
    label: Optional[str] = None
    priority: float = Field(default=1.0, ge=0.1)


class OptimizeRequest(BaseModel):
    rooms: List[str]
    patients: List[Patient]
    costMatrix: Optional[List[List[float]]] = None


def solve_classical(cost_matrix: List[List[float]], patients: List[Patient], rooms: List[str]):
    # Greedy fallback: assign each patient to the lowest-cost unassigned room.
    available_rooms = set(range(len(rooms)))
    assignments = []
    total_cost = 0.0

    for i, patient in enumerate(patients):
        best_room_index = None
        best_cost = None

        for j in available_rooms:
            candidate_cost = cost_matrix[i][j]
            if best_cost is None or candidate_cost < best_cost:
                best_cost = candidate_cost
                best_room_index = j

        if best_room_index is None:
            assignments.append({
                "patient": patient.label or patient.id,
                "patientId": patient.id,
                "patientName": patient.label or patient.id,
                "room": None,
            })
            continue

        assignments.append({
            "patient": patient.label or patient.id,
            "patientId": patient.id,
            "patientName": patient.label or patient.id,
            "room": rooms[best_room_index],
        })
        total_cost += float(best_cost)
        available_rooms.remove(best_room_index)

    return {
        "cost": float(total_cost),
        "assignments": assignments,
        "probabilities": [],
        "solver": "classical-fallback",
        "message": "Used classical fallback because quantum solver failed for this workload.",
    }


def build_cost_matrix(patients: List[Patient], rooms: List[str]) -> List[List[float]]:
    matrix = []
    for i, patient in enumerate(patients):
        row = []
        for j, _room in enumerate(rooms):
            base_cost = abs(i - j) + 1
            row.append(base_cost / patient.priority)
        matrix.append(row)
    return matrix


def solve_qaoa(cost_matrix: List[List[float]], patients: List[Patient], rooms: List[str]):
    qp = QuadraticProgram()
    for i in range(len(patients)):
        for j in range(len(rooms)):
            qp.binary_var(name=f"x_{i}_{j}")

    linear = {f"x_{i}_{j}": cost_matrix[i][j] for i in range(len(patients)) for j in range(len(rooms))}
    qp.minimize(linear=linear)

    for i in range(len(patients)):
        qp.linear_constraint(
            linear={f"x_{i}_{j}": 1 for j in range(len(rooms))},
            sense="==",
            rhs=1,
            name=f"assign_{i}",
        )

    for j in range(len(rooms)):
        qp.linear_constraint(
            linear={f"x_{i}_{j}": 1 for i in range(len(patients))},
            sense="<=",
            rhs=1,
            name=f"cap_{j}",
        )

    sampler = Sampler()
    qaoa = QAOA(sampler=sampler, optimizer=COBYLA(maxiter=5), reps=1)
    optimizer = MinimumEigenOptimizer(qaoa)
    result = optimizer.solve(qp)

    var_names = [var.name for var in qp.variables]
    solution = {name: int(round(val)) for name, val in zip(var_names, result.x)}

    assignments = []
    for i, patient in enumerate(patients):
        assigned_room = None
        for j, room in enumerate(rooms):
            if solution.get(f"x_{i}_{j}") == 1:
                assigned_room = room
                break
        assignments.append({
            "patient": patient.label or patient.id,
            "patientId": patient.id,
            "patientName": patient.label or patient.id,
            "room": assigned_room,
        })

    probabilities = []
    if getattr(result, "samples", None):
        for sample in result.samples[:3]:
            sample_solution = {
                name: int(round(val)) for name, val in zip(var_names, sample.x)
            }
            sample_assignments = []
            for i, patient in enumerate(patients):
                assigned_room = None
                for j, room in enumerate(rooms):
                    if sample_solution.get(f"x_{i}_{j}") == 1:
                        assigned_room = room
                        break
                sample_assignments.append({
                    "patient": patient.label or patient.id,
                    "patientId": patient.id,
                    "patientName": patient.label or patient.id,
                    "room": assigned_room,
                })
            probabilities.append(
                {
                    "probability": float(sample.probability),
                    "assignments": sample_assignments,
                }
            )

    return {
        "cost": float(result.fval),
        "assignments": assignments,
        "probabilities": probabilities,
    }


@app.post("/optimize")
def optimize(payload: OptimizeRequest):
    if not payload.rooms or not payload.patients:
        raise HTTPException(status_code=400, detail="Rooms and patients are required")

    # QAOA simulation has exponential memory requirements
    # Limit to 8 patients/rooms to avoid memory errors (2^64 states)
    if len(payload.patients) > 8 or len(payload.rooms) > 8:
        raise HTTPException(
            status_code=400,
            detail="QAOA quantum simulation supports up to 8 patients and 8 rooms due to memory constraints. For larger optimizations, use classical algorithms.",
        )

    if payload.costMatrix is not None:
        if len(payload.costMatrix) != len(payload.patients):
            raise HTTPException(status_code=400, detail="Invalid costMatrix rows")
        for row in payload.costMatrix:
            if len(row) != len(payload.rooms):
                raise HTTPException(status_code=400, detail="Invalid costMatrix columns")
        cost_matrix = payload.costMatrix
    else:
        cost_matrix = build_cost_matrix(payload.patients, payload.rooms)

    # QAOA quantum simulation is only feasible for very small inputs (≤ 3 patients).
    # For larger inputs use the fast classical solver directly to keep the UI responsive.
    n = max(len(payload.patients), len(payload.rooms))
    if n <= 3:
        try:
            result = solve_qaoa(cost_matrix, payload.patients, payload.rooms)
            result["solver"] = "qaoa"
            return result
        except Exception:
            pass

    return solve_classical(cost_matrix, payload.patients, payload.rooms)
