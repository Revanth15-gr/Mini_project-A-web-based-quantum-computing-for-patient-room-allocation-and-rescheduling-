"""Shift requirement models."""
from pydantic import BaseModel
from typing import Optional, Dict, List


class ShiftRequirement(BaseModel):
    """Represents a shift requirement in the hospital."""
    
    shift_name: str  # "morning", "afternoon", "night"
    department: str  # "ICU", "Surgery", "Emergency", "Cardiology", "Neurology"
    doctors_needed: int
    hospital_id: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "shift_name": "morning",
                "department": "ICU",
                "doctors_needed": 2,
                "hospital_id": "Hospital_A"
            }
        }
