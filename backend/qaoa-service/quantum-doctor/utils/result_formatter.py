"""Result formatter for quantum doctor scheduling."""
import json
import logging
from typing import Dict, List, Optional
from datetime import datetime

logger = logging.getLogger(__name__)


class ResultFormatter:
    """Formats quantum scheduling results for API responses."""
    
    @staticmethod
    def format_result(
        schedule: Dict,
        workload_distribution: Dict,
        algorithm_used: str,
        explanations: Dict,
        quantum_metrics: Dict,
        optimization_score: float,
        execution_time_ms: float,
        hospital_allocation: Optional[Dict] = None,
        emergency_doctors: Optional[List] = None
    ) -> Dict:
        """Format quantum scheduling results.
        
        Args:
            schedule: Shift assignments
            workload_distribution: Doctor workload counts
            algorithm_used: Algorithm name
            explanations: Assignment explanations
            quantum_metrics: Quantum circuit metrics
            optimization_score: Score 0-1
            execution_time_ms: Execution time
            hospital_allocation: Optional hospital allocation
            emergency_doctors: Optional emergency doctor list
            
        Returns:
            Formatted ScheduleResult dict
        """
        
        result = {
            "schedule": schedule,
            "workload_distribution": workload_distribution,
            "algorithm_used": algorithm_used,
            "explanations": explanations,
            "quantum_circuit_depth": quantum_metrics.get("circuit_depth", 24),
            "optimization_score": float(optimization_score),
            "execution_time_ms": float(execution_time_ms),
            "timestamp": datetime.utcnow().isoformat(),
            "status": "success"
        }
        
        # Add optional fields
        if hospital_allocation:
            result["hospital_allocation"] = hospital_allocation
        
        if emergency_doctors:
            result["emergency_doctors"] = emergency_doctors
        
        # Add quantum metrics if available
        if "qubits_used" in quantum_metrics:
            result["qubits_used"] = quantum_metrics["qubits_used"]
        
        if "iterations" in quantum_metrics:
            result["iterations"] = quantum_metrics["iterations"]
        
        return result
    
    @staticmethod
    def format_error_result(error_message: str, fallback_data: Optional[Dict] = None) -> Dict:
        """Format error result.
        
        Args:
            error_message: Error description
            fallback_data: Optional fallback/classical solution
            
        Returns:
            Error response dict
        """
        
        result = {
            "status": "error",
            "error": error_message,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        if fallback_data:
            result["fallback_solution"] = fallback_data
            result["note"] = "Classical fallback solution provided due to quantum error"
        
        return result
    
    @staticmethod
    def format_emergency_result(emergency_doctors: List, priority_scores: List[float]) -> Dict:
        """Format emergency doctor result.
        
        Args:
            emergency_doctors: List of emergency doctors
            priority_scores: List of priority scores
            
        Returns:
            Formatted result
        """
        
        result = {
            "emergency_doctors": [
                {
                    "id": d.id,
                    "name": d.name,
                    "specialization": d.specialization,
                    "experience": d.experience,
                    "fatigue_score": d.fatigue_score,
                    "priority_score": score
                }
                for d, score in zip(emergency_doctors, priority_scores)
            ],
            "timestamp": datetime.utcnow().isoformat(),
            "count": len(emergency_doctors)
        }
        
        return result
    
    @staticmethod
    def format_comparison_result(quantum_result: Dict, classical_result: Dict) -> Dict:
        """Format quantvs-classical comparison.
        
        Args:
            quantum_result: Quantum scheduling result
            classical_result: Classical scheduling result
            
        Returns:
            Comparison dict
        """
        
        quantum_score = quantum_result.get("optimization_score", 0.5)
        classical_score = classical_result.get("optimization_score", 0.3)
        
        speedup = quantum_result.get("execution_time_ms", 1000) / \
                  max(classical_result.get("execution_time_ms", 100), 1)
        
        result = {
            "quantum": quantum_result,
            "classical": classical_result,
            "quantum_advantage": {
                "score_improvement": float(quantum_score - classical_score),
                "speedup_factor": float(1 / speedup) if speedup > 0 else 1.0,
                "recommendation": "Use quantum" if quantum_score > classical_score else "Use classical"
            },
            "timestamp": datetime.utcnow().isoformat()
        }
        
        return result
    
    @staticmethod
    def format_performance_metrics(
        schedule: Dict,
        doctors: List,
        constraints_met: Dict
    ) -> Dict:
        """Format performance metrics for visualization.
        
        Args:
            schedule: Schedule dict
            doctors: List of doctors
            constraints_met: Constraints status dict
            
        Returns:
            Metrics dict
        """
        
        # Calculate workload
        workload = {d.id: 0 for d in doctors}
        for assignments in schedule.values():
            for assignment in assignments:
                for doctor in doctors:
                    if doctor.name in assignment:
                        workload[doctor.id] += 1
        
        # Calculate statistics
        loads = list(workload.values())
        avg_load = sum(loads) / len(doctors) if doctors else 0
        max_load = max(loads) if loads else 0
        min_load = min(loads) if loads else 0
        variance = sum((l - avg_load) ** 2 for l in loads) / len(doctors) if doctors else 0
        
        # Calculate constraint satisfaction
        constraints_satisfied = sum(1 for v in constraints_met.values() if v)
        total_constraints = len(constraints_met)
        
        metrics = {
            "workload_stats": {
                "average": float(avg_load),
                "max": float(max_load),
                "min": float(min_load),
                "variance": float(variance),
                "std_dev": float(variance ** 0.5)
            },
            "constraint_satisfaction": {
                "satisfied": int(constraints_satisfied),
                "total": int(total_constraints),
                "percentage": float(constraints_satisfied / total_constraints * 100) if total_constraints > 0 else 0
            },
            "doctor_utilization": {
                d.name: int(workload.get(d.id, 0))
                for d in doctors
            }
        }
        
        return metrics
    
    @staticmethod
    def format_json(data: Dict) -> str:
        """Format result as pretty JSON.
        
        Args:
            data: Data to format
            
        Returns:
            JSON string
        """
        return json.dumps(data, indent=2, default=str)
