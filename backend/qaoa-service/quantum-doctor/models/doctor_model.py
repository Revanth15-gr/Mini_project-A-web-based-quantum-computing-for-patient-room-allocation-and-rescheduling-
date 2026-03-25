"""Doctor data model for quantum shift scheduling system."""
from pydantic import BaseModel, Field
from typing import List, Optional


class Doctor(BaseModel):
    """Represents a doctor in the healthcare system."""
    
    id: int
    name: str
    specialization: str  # e.g. "Cardiology", "Neurology", "ICU", "Surgery", "Emergency"
    experience: int      # years, range 1-40
    availability: List[str]  # values: "morning", "afternoon", "night", "emergency"
    max_hours: int = 12  # default 12 per day
    emergency_eligible: bool  # True if experience >= 5 or specialization in ["Emergency","ICU"]
    hospital_id: Optional[str] = None  # which hospital they belong to
    fatigue_score: float = 0.0  # default 0.0, increases with shifts assigned
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": 1,
                "name": "Dr. Aryan Kumar",
                "specialization": "Cardiology",
                "experience": 10,
                "availability": ["morning", "afternoon"],
                "max_hours": 12,
                "emergency_eligible": True,
                "hospital_id": "Hospital_A",
                "fatigue_score": 0.1
            }
        }


class ShiftRequirement(BaseModel):
    """Represents a shift requirement."""
    
    shift_name: str  # "morning", "afternoon", "night"
    department: str  # "ICU", "Surgery", "Emergency"
    doctors_needed: int
    hospital_id: str


class ScheduleRequest(BaseModel):
    """Request object for quantum doctor scheduling."""
    
    doctors: List[Doctor]
    shift_requirements: dict  # Dict[str, Dict[str, int]]
    hospitals: List[str]
    emergency_mode: bool = False
    date: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "doctors": [
                    {
                        "id": 1,
                        "name": "Dr. Aryan",
                        "specialization": "Cardiology",
                        "availability": ["morning", "night"],
                        "experience": 10,
                        "max_hours": 12,
                        "emergency_eligible": True,
                        "fatigue_score": 0.1
                    }
                ],
                "shift_requirements": {
                    "morning": {"ICU": 1, "Emergency": 1},
                    "afternoon": {"ICU": 1},
                    "night": {"ICU": 1, "Emergency": 2}
                },
                "hospitals": ["Hospital_A", "Hospital_B"],
                "emergency_mode": False
            }
        }


class ScheduleResult(BaseModel):
    """Result of quantum doctor scheduling."""
    
    schedule: dict  # Dict[str, List[str]]
    workload_distribution: dict  # Dict[str, int]
    algorithm_used: str
    explanations: dict  # Dict[str, str]
    quantum_circuit_depth: int
    optimization_score: float
    execution_time_ms: float = 0.0
    hospital_allocation: Optional[dict] = None
    emergency_doctors: Optional[List[str]] = None
    timestamp: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "schedule": {
                    "morning": ["Dr. Aryan - ICU", "Dr. Raj - Emergency"],
                    "afternoon": ["Dr. Priya - Surgery"],
                    "night": ["Dr. Aryan - Emergency"]
                },
                "workload_distribution": {
                    "Dr. Aryan": 2,
                    "Dr. Priya": 1,
                    "Dr. Raj": 1
                },
                "algorithm_used": "QAOA + VQE + Quantum Annealing",
                "explanations": {
                    "1:morning:ICU": "Dr. Aryan assigned to ICU (Morning) because..."
                },
                "quantum_circuit_depth": 24,
                "optimization_score": 0.87,
                "execution_time_ms": 1234.5
            }
        }
