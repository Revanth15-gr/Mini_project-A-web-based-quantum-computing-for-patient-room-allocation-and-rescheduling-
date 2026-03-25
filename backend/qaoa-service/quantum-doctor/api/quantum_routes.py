"""FastAPI routes for quantum doctor scheduling."""
import logging
from typing import Dict, List, Optional
from fastapi import APIRouter, HTTPException, status
from datetime import datetime
import motor.motor_asyncio

from models.doctor_model import Doctor, ScheduleRequest, ScheduleResult
from quantum_doctor_master import QuantumDoctorMaster
from utils.result_formatter import ResultFormatter

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/quantum", tags=["quantum-doctor"])

# Initialize quantum master
quantum_master = QuantumDoctorMaster()
formatter = ResultFormatter()

# MongoDB client (to be initialized externally)
db = None


def set_database(database):
    """Set MongoDB database connection.
    
    Args:
        database: Motor async database instance
    """
    global db
    db = database


@router.post("/doctor-shift", response_model=ScheduleResult, status_code=200)
async def schedule_doctor_shifts(request: ScheduleRequest) -> Dict:
    """Generate optimized doctor shift schedule using quantum algorithms.
    
    Request body: ScheduleRequest
    - doctors: List of Doctor objects with experience, availability, etc.
    - shift_requirements: Dict of shifts and department requirements
    - hospitals: List of hospital IDs for allocation
    - emergency_mode: Boolean for emergency scheduling
    
    Response: ScheduleResult with optimized assignments and explanations
    """
    try:
        # Validate input
        if not request.doctors or len(request.doctors) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one doctor is required"
            )
        
        if not request.shift_requirements:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Shift requirements are required"
            )
        
        logger.info(f"Quantum doctor scheduling request: {len(request.doctors)} doctors, "
                   f"{len(request.shift_requirements)} shifts")
        
        # Run quantum orchestration
        result = await quantum_master.run(request)
        
        # Store result in MongoDB if available
        if db:
            try:
                await db["quantum_schedules"].insert_one({
                    "timestamp": datetime.utcnow(),
                    "request": request.dict(),
                    "result": result.dict(),
                    "hospital_ids": request.hospitals,
                    "emergency_mode": request.emergency_mode
                })
            except Exception as e:
                logger.warning(f"Failed to store result in MongoDB: {str(e)}")
        
        return result.dict()
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Doctor shift scheduling failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Quantum scheduling error: {str(e)}"
        )


@router.post("/emergency-doctor", status_code=200)
async def allocate_emergency_doctors(request: Dict) -> Dict:
    """Find and allocate emergency-eligible doctors.
    
    Request body:
    {
        "doctors": List[Doctor],
        "emergency_slots": int
    }
    
    Response: List of top emergency doctors with priority scores
    """
    try:
        doctors = [Doctor(**d) if isinstance(d, dict) else d for d in request.get("doctors", [])]
        emergency_slots = request.get("emergency_slots", 3)
        
        if not doctors:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Doctors list is required"
            )
        
        logger.info(f"Emergency allocation: finding {emergency_slots} emergency doctors from {len(doctors)} candidates")
        
        # Run amplitude amplification for emergency doctors
        emergency_docs = await quantum_master.amplitude.amplify_emergency_priority(doctors)
        
        # Calculate priority scores
        priority_scores = [
            float((e.experience * (1 - e.fatigue_score)) / 40)  # Normalize
            for e in emergency_docs
        ]
        
        result = formatter.format_emergency_result(emergency_docs[:emergency_slots], priority_scores[:emergency_slots])
        
        # Store in MongoDB if available
        if db:
            try:
                await db["emergency_allocations"].insert_one({
                    "timestamp": datetime.utcnow(),
                    "emergency_doctors": [d.dict() for d in emergency_docs],
                    "allocation_size": emergency_slots
                })
            except Exception as e:
                logger.warning(f"Failed to store emergency allocation: {str(e)}")
        
        return result
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Emergency allocation failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Emergency allocation error: {str(e)}"
        )


@router.get("/doctor-schedule", status_code=200)
async def get_doctor_schedule(
    hospital_id: Optional[str] = None,
    shift: Optional[str] = None,
    date: Optional[str] = None,
    limit: int = 10
) -> Dict:
    """Retrieve stored doctor schedules.
    
    Query parameters:
    - hospital_id: Filter by hospital
    - shift: Filter by shift (morning, afternoon, night)
    - date: Filter by date
    - limit: Max results (default 10)
    
    Response: List of ScheduleResult objects from MongoDB
    """
    try:
        if not db:
            return {
                "schedules": [],
                "message": "Database not configured",
                "timestamp": datetime.utcnow().isoformat()
            }
        
        # Build query filter
        query_filter = {}
        
        if hospital_id:
            query_filter["hospital_ids"] = hospital_id
        
        if shift:
            query_filter["result.schedule"] = {shift: {"$exists": True}}
        
        if date:
            query_filter["timestamp"] = {"$regex": date}
        
        logger.info(f"Retrieving schedules with filter: {query_filter}")
        
        # Query MongoDB
        cursor = db["quantum_schedules"].find(query_filter).limit(limit).sort("timestamp", -1)
        schedules = []
        
        async for doc in cursor:
            doc.pop("_id", None)  # Remove MongoDB ID
            schedules.append(doc)
        
        return {
            "schedules": schedules,
            "count": len(schedules),
            "timestamp": datetime.utcnow().isoformat()
        }
    
    except Exception as e:
        logger.error(f"Schedule retrieval failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Schedule retrieval error: {str(e)}"
        )


@router.post("/realtime-update", status_code=200)
async def handle_realtime_update(request: Dict) -> Dict:
    """Handle real-time scheduling updates.
    
    Request body:
    {
        "event_type": "doctor_unavailable" | "emergency_alert" | "high_fatigue",
        "doctor_id": int,
        "hospital_id": str
    }
    
    Response: Updated ScheduleResult
    """
    try:
        event_type = request.get("event_type")
        doctor_id = request.get("doctor_id")
        hospital_id = request.get("hospital_id")
        
        if not event_type:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="event_type is required"
            )
        
        valid_events = ["doctor_unavailable", "emergency_alert", "high_fatigue"]
        if event_type not in valid_events:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"event_type must be one of: {valid_events}"
            )
        
        logger.info(f"Real-time update: {event_type} for doctor {doctor_id} at hospital {hospital_id}")
        
        # Handle the update
        result = await quantum_master.handle_realtime_update(request)
        
        # Store event in MongoDB
        if db:
            try:
                await db["realtime_events"].insert_one({
                    "timestamp": datetime.utcnow(),
                    "event": request,
                    "result": result.dict() if result else None
                })
            except Exception as e:
                logger.warning(f"Failed to store realtime event: {str(e)}")
        
        return {
            "status": "processed",
            "event": request,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Real-time update failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Real-time update error: {str(e)}"
        )


@router.get("/algorithms", status_code=200)
async def get_algorithm_info() -> Dict:
    """Get information about quantum algorithms.
    
    Response: Dict with algorithm descriptions and parameters
    """
    try:
        info = quantum_master.get_algorithm_info()
        return info
    
    except Exception as e:
        logger.error(f"Algorithm info retrieval failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error: {str(e)}"
        )


@router.get("/stats", status_code=200)
async def get_system_stats() -> Dict:
    """Get system statistics.
    
    Response: Stats on schedules, emergency allocations, realtime events
    """
    try:
        if not db:
            return {"message": "Database not configured"}
        
        total_schedules = await db["quantum_schedules"].count_documents({})
        total_emergencies = await db["emergency_allocations"].count_documents({})
        total_events = await db["realtime_events"].count_documents({})
        
        return {
            "total_schedules": total_schedules,
            "total_emergency_allocations": total_emergencies,
            "total_realtime_events": total_events,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    except Exception as e:
        logger.error(f"Stats retrieval failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error: {str(e)}"
        )


@router.post("/comparison", status_code=200)
async def compare_quantum_vs_classical(request: ScheduleRequest) -> Dict:
    """Compare quantum vs classical scheduling.
    
    Runs both quantum and classical algorithms for comparison.
    
    Response: Comparison dict with metrics
    """
    try:
        logger.info("Running quantum vs classical comparison")
        
        # Run quantum
        quantum_result = await quantum_master.run(request)
        
        # Run classical greedy as baseline
        classical_schedule = quantum_master.qaoa._classical_greedy_schedule(
            request.doctors,
            request.shift_requirements
        )
        classical_result = classical_schedule
        
        # Create comparison
        comparison = formatter.format_comparison_result(
            quantum_result.dict(),
            classical_result
        )
        
        return comparison
    
    except Exception as e:
        logger.error(f"Comparison failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Comparison error: {str(e)}"
        )


@router.post("/search", status_code=200)
async def search_doctors(request: Dict) -> Dict:
    """Search for doctors matching criteria.
    
    Request body:
    {
        "doctors": List[Doctor],
        "specialization": str,
        "shift": str,
        "department": str
    }
    
    Response: List of matching doctors
    """
    try:
        doctors = [Doctor(**d) if isinstance(d, dict) else d for d in request.get("doctors", [])]
        specialization = request.get("specialization")
        shift = request.get("shift", "morning")
        
        if not doctors:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Doctors list is required"
            )
        
        logger.info(f"Searching for doctors: specialization={specialization}, shift={shift}")
        
        # Use Grover search
        if specialization:
            results = quantum_master.grover.find_specialist(doctors, specialization, shift)
        else:
            results = quantum_master.grover.find_available_doctor(doctors, shift, "")
            results = [results] if results else []
        
        return {
            "doctors": [d.dict() for d in results],
            "count": len(results),
            "timestamp": datetime.utcnow().isoformat()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Doctor search failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Search error: {str(e)}"
        )
