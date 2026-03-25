"""Quantum Amplitude Amplification for priority-based doctor selection."""
import numpy as np
from typing import List, Dict
import logging
import math
from datetime import datetime

logger = logging.getLogger(__name__)


class AmplitudeDoctorSelector:
    """Amplitude amplification for high-priority doctor selection."""
    
    def __init__(self):
        """Initialize amplitude amplification selector."""
        pass
    
    def amplify_experience(self, doctors: List, target_experience_threshold: int = 7) -> List:
        """Amplify selection probability of experienced doctors.
        
        Uses amplitude amplification to boost probability of selecting doctors
        with experience >= threshold.
        
        Args:
            doctors: List of Doctor objects
            target_experience_threshold: Minimum experience level
            
        Returns:
            List of doctors sorted by amplified priority
        """
        try:
            start_time = datetime.now()
            
            # Filter doctors meeting threshold
            meeting_threshold = [d for d in doctors if d.experience >= target_experience_threshold]
            not_meeting = [d for d in doctors if d.experience < target_experience_threshold]
            
            if not meeting_threshold:
                logger.warning("No doctors meet experience threshold")
                return sorted(doctors, key=lambda d: d.experience, reverse=True)
            
            # Calculate amplification iterations
            N = len(doctors)  # Total doctors
            M = len(meeting_threshold)  # Favorable doctors
            
            if M > 0:
                iterations = int(math.pi / 4 * math.sqrt(N / M))
            else:
                iterations = 1
            
            # Simulate amplitude amplification
            # After k iterations, probability of measuring favorable state is:
            # P(favorable) ≈ sin^2((2k+1) * arcsin(sqrt(M/N)))
            
            angle = math.asin(math.sqrt(M / N)) if M > 0 else 0
            favorable_prob = math.sin((2 * iterations + 1) * angle) ** 2 * M / N
            
            # Create result list with amplified probabilities
            result = []
            
            for doctor in meeting_threshold:
                # Score = experience * amplified_probability
                amplified_score = doctor.experience * favorable_prob
                result.append((doctor, amplified_score))
            
            # Add non-meeting doctors with reduced scores
            remaining_prob = 1.0 - favorable_prob
            for doctor in not_meeting:
                amplified_score = doctor.experience * remaining_prob / max(len(not_meeting), 1)
                result.append((doctor, amplified_score))
            
            # Sort by amplitude score
            result.sort(key=lambda x: x[1], reverse=True)
            
            execution_time = (datetime.now() - start_time).total_seconds() * 1000
            
            logger.info(f"Experience amplification completed in {execution_time:.2f}ms. "
                       f"Amplification iterations: {iterations}, favorable probability: {favorable_prob:.3f}")
            
            return [d for d, _ in result]
        
        except Exception as e:
            logger.error(f"Experience amplification failed: {str(e)}")
            return sorted(doctors, key=lambda d: d.experience, reverse=True)
    
    def amplify_emergency_priority(self, doctors: List) -> List:
        """Amplify selection probability of emergency-capable doctors.
        
        Args:
            doctors: List of Doctor objects
            
        Returns:
            List of emergency doctors with amplified priorities
        """
        try:
            start_time = datetime.now()
            
            # Filter emergency-eligible doctors
            eligible = [
                d for d in doctors
                if d.emergency_eligible 
                and d.experience >= 5 
                and d.fatigue_score < 0.6
                and "emergency" in d.availability
            ]
            
            if not eligible:
                logger.warning("No eligible emergency doctors")
                return []
            
            # Calculate amplification
            N = len(doctors)
            M = len(eligible)
            
            if M > 0:
                iterations = int(math.pi / 4 * math.sqrt(N / M))
            else:
                iterations = 1
            
            angle = math.asin(math.sqrt(M / N)) if M > 0 else 0
            favorable_prob = math.sin((2 * iterations + 1) * angle) ** 2 * M / N
            
            # Calculate priority scores
            result = []
            for doctor in eligible:
                priority_score = (
                    favorable_prob * 
                    doctor.experience * 
                    (1 - doctor.fatigue_score)
                )
                result.append({
                    "doctor": doctor,
                    "priority_score": priority_score,
                    "iterations": iterations
                })
            
            # Sort by priority score
            result.sort(key=lambda x: x["priority_score"], reverse=True)
            
            execution_time = (datetime.now() - start_time).total_seconds() * 1000
            
            # Return top 3 emergency doctors
            top_3 = result[:min(3, len(result))]
            
            logger.info(f"Emergency priority amplification completed in {execution_time:.2f}ms. "
                       f"Found {len(top_3)} top emergency doctors.")
            
            return [d["doctor"] for d in top_3]
        
        except Exception as e:
            logger.error(f"Emergency amplification failed: {str(e)}")
            return []
    
    def amplify_availability(self, doctors: List, required_shift: str) -> List:
        """Amplify selection of doctors available for specific shift.
        
        Args:
            doctors: List of Doctor objects
            required_shift: Required shift ("morning", "afternoon", "night")
            
        Returns:
            List of available doctors sorted by amplified priority
        """
        try:
            start_time = datetime.now()
            
            # Filter available doctors
            available = [d for d in doctors if required_shift in d.availability]
            unavailable = [d for d in doctors if required_shift not in d.availability]
            
            if not available:
                logger.warning(f"No doctors available for {required_shift} shift")
                return []
            
            N = len(doctors)
            M = len(available)
            
            # Amplitude amplification
            if M > 0:
                iterations = int(math.pi / 4 * math.sqrt(N / M))
            else:
                iterations = 1
            
            angle = math.asin(math.sqrt(M / N)) if M > 0 else 0
            favorable_prob = math.sin((2 * iterations + 1) * angle) ** 2 * M / N
            
            # Score and sort
            result = []
            for doctor in available:
                amplified_score = (
                    favorable_prob * 
                    (1 - doctor.fatigue_score) * 
                    (doctor.experience / 40)  # Normalize by max experience
                )
                result.append((doctor, amplified_score))
            
            result.sort(key=lambda x: x[1], reverse=True)
            
            execution_time = (datetime.now() - start_time).total_seconds() * 1000
            logger.info(f"Availability amplification completed in {execution_time:.2f}ms")
            
            return [d for d, _ in result]
        
        except Exception as e:
            logger.error(f"Availability amplification failed: {str(e)}")
            return sorted([d for d in doctors if required_shift in d.availability],
                         key=lambda d: d.experience, reverse=True)
    
    def amplify_specialization(self, doctors: List, required_specialization: str) -> List:
        """Amplify selection of doctors with required specialization.
        
        Args:
            doctors: List of Doctor objects
            required_specialization: Required specialization
            
        Returns:
            List of matching doctors sorted by amplified priority
        """
        try:
            start_time = datetime.now()
            
            # Filter by specialization
            matching = [d for d in doctors if d.specialization == required_specialization]
            
            if not matching:
                logger.warning(f"No doctors with {required_specialization} specialization")
                # Return closest match
                return sorted(doctors, key=lambda d: d.experience, reverse=True)
            
            N = len(doctors)
            M = len(matching)
            
            # Amplitude amplification
            if M > 0:
                iterations = int(math.pi / 4 * math.sqrt(N / M))
            else:
                iterations = 1
            
            angle = math.asin(math.sqrt(M / N)) if M > 0 else 0
            favorable_prob = math.sin((2 * iterations + 1) * angle) ** 2 * M / N
            
            # Calculate scores
            result = []
            for doctor in matching:
                amplified_score = favorable_prob * doctor.experience * (1 - doctor.fatigue_score)
                result.append((doctor, amplified_score))
            
            result.sort(key=lambda x: x[1], reverse=True)
            
            execution_time = (datetime.now() - start_time).total_seconds() * 1000
            logger.info(f"Specialization amplification completed in {execution_time:.2f}ms")
            
            return [d for d, _ in result]
        
        except Exception as e:
            logger.error(f"Specialization amplification failed: {str(e)}")
            return sorted(matching, key=lambda d: d.experience, reverse=True)
    
    def amplify_multi_criteria(self, doctors: List, criteria: Dict) -> List:
        """Amplify based on multiple criteria using composite scoring.
        
        Args:
            doctors: List of Doctor objects
            criteria: Dict of criteria weights, e.g., {
                "experience_threshold": 7,
                "max_fatigue": 0.6,
                "required_shift": "morning",
                "preferred_specializations": ["ICU", "Emergency"]
            }
            
        Returns:
            Sorted list of doctors by composite amplified score
        """
        try:
            start_time = datetime.now()
            
            result = []
            
            for doctor in doctors:
                composite_score = 1.0
                
                # Experience criterion
                if "experience_threshold" in criteria:
                    exp_score = min(1.0, doctor.experience / criteria["experience_threshold"])
                    composite_score *= exp_score ** 0.3
                
                # Fatigue criterion
                if "max_fatigue" in criteria:
                    fatigue_mult = 1.0 - (doctor.fatigue_score / criteria["max_fatigue"]) if doctor.fatigue_score > 0 else 1.0
                    fatigue_mult = max(0, min(1, fatigue_mult))
                    composite_score *= fatigue_mult ** 0.3
                
                # Availability criterion
                if "required_shift" in criteria:
                    if criteria["required_shift"] in doctor.availability:
                        composite_score *= 1.2  # Boost for availability
                
                # Specialization criterion
                if "preferred_specializations" in criteria:
                    if doctor.specialization in criteria["preferred_specializations"]:
                        composite_score *= 1.3  # Boost for preferred specialization
                
                result.append((doctor, composite_score))
            
            # Sort by composite score
            result.sort(key=lambda x: x[1], reverse=True)
            
            execution_time = (datetime.now() - start_time).total_seconds() * 1000
            logger.info(f"Multi-criteria amplification completed in {execution_time:.2f}ms")
            
            return [d for d, _ in result]
        
        except Exception as e:
            logger.error(f"Multi-criteria amplification failed: {str(e)}")
            return doctors
