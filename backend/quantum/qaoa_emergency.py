from __future__ import annotations

import sys
from pathlib import Path
from typing import Any, Dict, List

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from grover_search import search_hospital
from utils.distance import haversine_distance, find_nearest_hospitals
from utils.email_service import send_email_notification


def assign_emergency_hospital(emergency_case: Dict[str, Any], hospitals: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Assign an emergency case to the best hospital using quantum optimization.
    
    Considers:
    - Distance to hospital
    - ICU availability
    - Doctor availability
    - Emergency severity
    """
    severity = str(emergency_case.get("severity", "high")).lower()
    
    # Get hospital coordinates for distance calculation
    emergency_lat = float(emergency_case.get("latitude", 17.6868))
    emergency_lng = float(emergency_case.get("longitude", 83.2185))
    
    # Find nearby hospitals first
    nearby = find_nearest_hospitals(emergency_lat, emergency_lng, hospitals, limit=5)
    
    # Apply Grover search optimization
    selected = search_hospital(nearby, severity=severity)
    
    if selected:
        # Calculate distance if not already present
        if 'distance' not in selected:
            selected['distance'] = haversine_distance(
                emergency_lat, 
                emergency_lng, 
                selected.get('lat', 17.6868), 
                selected.get('lng', 83.2185)
            )
        
        # Send email notification to assigned hospital
        hospital_email = f"admin@{selected.get('name', 'hospital').lower().replace(' ', '')}.com"
        send_email_notification(
            hospital_name=selected.get("name", "Unknown Hospital"),
            hospital_email=hospital_email,
            patient_name=emergency_case.get("patient_name", "Emergency Patient"),
            severity=severity.upper(),
            location=emergency_case.get("location", "Unknown Location"),
            distance_km=selected.get("distance", 0)
        )
    
    return {
        "patient_id": emergency_case.get("patient_id") or emergency_case.get("id"),
        "patient_name": emergency_case.get("patient_name", "Emergency Patient"),
        "hospital": selected.get("name") if selected else None,
        "distance_km": selected.get("distance") if selected else None,
        "icu_available": selected.get("icu_available") if selected else 0,
        "doctor_support": selected.get("doctors_available") if selected else 0,
        "severity": severity,
        "location": emergency_case.get("location", "Unknown"),
        "algorithm_used": "QAOA(emergency) + Grover Search",
    }


def optimize_emergency(cases: List[Dict[str, Any]], hospitals: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Optimize emergency case assignments across multiple hospitals using quantum algorithms.
    
    Returns:
    - assignments: List of hospital assignments for each emergency case
    - assigned_count: Number of successfully assigned cases
    - total_cases: Total number of emergency cases
    - optimization_score: Quality of optimization (0-1)
    - algorithm: Algorithm used for optimization
    """
    assignments = [assign_emergency_hospital(case, hospitals) for case in cases]
    assigned = sum(1 for row in assignments if row.get("hospital"))
    
    return {
        "assignments": assignments,
        "assigned_count": assigned,
        "total_cases": len(cases),
        "optimization_score": round(assigned / max(len(cases), 1), 3),
        "algorithm": "QAOA(emergency) + Grover Search + Distance Optimization",
        "nearby_hospitals_considered": len(hospitals),
    }
