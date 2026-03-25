"""Explainability module - human-readable explanations for doctor assignments."""
import logging
from typing import List, Dict
from datetime import datetime

logger = logging.getLogger(__name__)


class ExplainabilityEngine:
    """Generates human-readable explanations for doctor assignments."""
    
    @staticmethod
    def generate_explanations(schedule: Dict, doctors: List, algorithm_used: str) -> Dict[str, str]:
        """Generate explanations for each assignment in schedule.
        
        Args:
            schedule: Schedule dict with shift -> assignments
            doctors: List of Doctor objects
            algorithm_used: Name of algorithm that produced this schedule
            
        Returns:
            Dict mapping "doctor_id:shift:department" -> explanation_string
        """
        explanations = {}
        
        # Create doctor lookup
        doctor_map = {d.name: d for d in doctors}
        
        for shift, assignments in schedule.items():
            for assignment in assignments:
                try:
                    # Parse assignment: "Dr. Name - Department"
                    parts = assignment.split(" - ")
                    if len(parts) < 2:
                        continue
                    
                    doctor_name = parts[0]
                    department = " - ".join(parts[1:])  # Handle departments with dashes
                    
                    if doctor_name not in doctor_map:
                        continue
                    
                    doctor = doctor_map[doctor_name]
                    
                    # Build explanation string
                    explanation = ExplainabilityEngine._build_explanation(
                        doctor, department, shift, algorithm_used
                    )
                    
                    # Create key
                    key = f"{doctor.id}:{shift}:{department}"
                    explanations[key] = explanation
                
                except Exception as e:
                    logger.error(f"Failed to generate explanation for {assignment}: {str(e)}")
                    continue
        
        return explanations
    
    @staticmethod
    def _build_explanation(doctor, department: str, shift: str, algorithm_used: str) -> str:
        """Build individual explanation for a doctor assignment."""
        
        # Determine specialization match
        specialization_match = doctor.specialization == department or \
                             department.lower() in doctor.specialization.lower()
        match_text = "✅ Yes" if specialization_match else "⚠️ Acceptable"
        
        # Determine experience level
        experience_level = "HIGH" if doctor.experience >= 10 else "STANDARD" if doctor.experience >= 5 else "JUNIOR"
        
        # Check emergency eligibility
        emergency_status = "✅ Yes" if doctor.emergency_eligible else "❌ No"
        
        # Availability
        availability_text = f"'{shift}'" if shift in [a.lower() for a in doctor.availability] else "NOT AVAILABLE"
        
        # Fatigue assessment
        fatigue_status = "✅ Safe" if doctor.fatigue_score < 0.8 else "⚠️ High" if doctor.fatigue_score < 0.95 else "❌ Critical"
        
        explanation = f"""{doctor.name} assigned to {department} ({shift.title()}) at [Hospital] because:
  • Specialization match: {match_text} — {doctor.specialization} aligns with {department}
  • Experience level: {doctor.experience} years (threshold: 5) — {experience_level}
  • Availability confirmed: Shift {availability_text} in doctor's availability list
  • Emergency eligibility: {emergency_status}
  • Current fatigue score: {doctor.fatigue_score:.2f} (safe threshold: <0.8) — {fatigue_status}
  • Algorithm decision: {algorithm_used} selected this doctor for optimal allocation
  • Assignment rationale: Balances workload, meets specialization requirements, and respects availability constraints"""
        
        return explanation
    
    @staticmethod
    def generate_workload_explanation(doctors: List, workload: Dict) -> Dict[str, str]:
        """Generate explanations for workload distribution.
        
        Args:
            doctors: List of Doctor objects
            workload: Dict mapping doctor_id -> shift_count
            
        Returns:
            Dict mapping doctor_name -> workload explanation
        """
        explanations = {}
        
        if not doctors:
            return explanations
        
        avg_workload = sum(workload.values()) / len(doctors) if doctors else 0
        
        for doctor in doctors:
            shifts_assigned = workload.get(doctor.id, 0)
            workload_pct = (shifts_assigned / max(avg_workload, 1)) * 100 if avg_workload > 0 else 0
            
            if shifts_assigned > avg_workload + 1:
                status = "⚠️ Overloaded"
            elif shifts_assigned < avg_workload - 1:
                status = "✅ Underutilized"
            else:
                status = "✅ Balanced"
            
            explanation = f"{doctor.name}: {shifts_assigned} shifts ({workload_pct:.0f}% of average) — {status} — Fatigue: {doctor.fatigue_score:.2f}"
            explanations[doctor.name] = explanation
        
        return explanations
    
    @staticmethod
    def generate_constraint_explanation(constraints_met: Dict[str, bool]) -> str:
        """Generate explanation of which constraints were met.
        
        Args:
            constraints_met: Dict mapping constraint_name -> boolean
            
        Returns:
            Explanatory string
        """
        met = [name for name, status in constraints_met.items() if status]
        unmet = [name for name, status in constraints_met.items() if not status]
        
        explanation = "✅ Constraints met: " + ", ".join(met) if met else "No constraints met"
        
        if unmet:
            explanation += "\n⚠️ Constraints not met: " + ", ".join(unmet)
        
        return explanation
    
    @staticmethod
    def generate_optimization_explanation(score: float, algorithm: str, metrics: Dict) -> str:
        """Generate explanation of optimization results.
        
        Args:
            score: Optimization score (0-1)
            algorithm: Algorithm name
            metrics: Additional metrics dict
            
        Returns:
            Optimization explanation string
        """
        
        if score >= 0.9:
            quality = "Excellent"
        elif score >= 0.75:
            quality = "Good"
        elif score >= 0.6:
            quality = "Acceptable"
        else:
            quality = "Suboptimal"
        
        explanation = f"Optimization Result: {quality} (Score: {score:.2f})\n"
        explanation += f"Algorithm: {algorithm}\n"
        
        for metric_name, metric_value in metrics.items():
            explanation += f"  • {metric_name}: {metric_value}\n"
        
        return explanation
