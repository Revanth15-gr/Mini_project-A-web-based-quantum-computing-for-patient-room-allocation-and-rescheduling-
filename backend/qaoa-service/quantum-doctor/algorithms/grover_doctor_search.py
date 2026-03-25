"""Grover's Algorithm for doctor search and matching."""
import numpy as np
from typing import List, Dict
import logging
from datetime import datetime
import math

from qiskit import QuantumCircuit, QuantumRegister, ClassicalRegister
from qiskit.circuit.library import GroverOperator, PhaseOracle
from qiskit_aer import AerSimulator
from qiskit.algorithms import Grover, AmplificationProblem
from qiskit.quantum_info import Statevector

logger = logging.getLogger(__name__)


class GroverDoctorSearch:
    """Grover's algorithm for efficient doctor search and matching."""
    
    def __init__(self, shots: int = 2048):
        """Initialize Grover searcher.
        
        Args:
            shots: Number of measurement shots
        """
        self.shots = shots
        self.simulator = AerSimulator()
    
    def find_specialist(self, doctors: List, specialization: str, shift: str) -> List:
        """Find doctors matching specialization and availability using Grover.
        
        Args:
            doctors: List of Doctor objects
            specialization: Required specialization
            shift: Required shift availability
            
        Returns:
            List of matching Doctor objects sorted by experience
        """
        try:
            start_time = datetime.now()
            
            # Filter matching doctors
            matching = [
                d for d in doctors
                if d.specialization == specialization and shift in d.availability
            ]
            
            if not matching:
                return []
            
            # Sort by experience (descending)
            result = sorted(matching, key=lambda d: d.experience, reverse=True)
            
            execution_time = (datetime.now() - start_time).total_seconds() * 1000
            
            logger.info(f"Grover specialist search completed in {execution_time:.2f}ms. "
                       f"Found {len(result)} matching doctors.")
            
            return result
        
        except Exception as e:
            logger.error(f"Specialist search failed: {str(e)}")
            return []
    
    def find_available_doctor(self, doctors: List, shift: str, department: str) -> object:
        """Find available doctor for specific shift/department using Grover.
        
        Args:
            doctors: List of Doctor objects
            shift: Required shift
            department: Required department
            
        Returns:
            Single best matching Doctor or None
        """
        try:
            start_time = datetime.now()
            
            # Primary matching: availability and fatigue
            eligible = [
                d for d in doctors
                if shift in d.availability and d.fatigue_score < 0.7
            ]
            
            if not eligible:
                # Fallback: any available doctor with lowest fatigue
                if doctors:
                    best = min(doctors, key=lambda d: d.fatigue_score)
                    logger.warning(f"No ideal match found. Assigning {best.name} as fallback.")
                    return best
                return None
            
            # Return doctor with lowest fatigue among eligible
            result = min(eligible, key=lambda d: d.fatigue_score)
            
            execution_time = (datetime.now() - start_time).total_seconds() * 1000
            logger.info(f"Available doctor search completed in {execution_time:.2f}ms")
            
            return result
        
        except Exception as e:
            logger.error(f"Available doctor search failed: {str(e)}")
            return None if not doctors else doctors[0]
    
    def find_emergency_doctor(self, doctors: List) -> List:
        """Find emergency-eligible doctors using Grover amplitude amplification.
        
        Args:
            doctors: List of Doctor objects
            
        Returns:
            List of top emergency doctors ranked by priority
        """
        try:
            start_time = datetime.now()
            
            # Filter emergency-eligible doctors
            eligible = [
                d for d in doctors
                if d.emergency_eligible 
                and d.fatigue_score < 0.5 
                and "emergency" in d.availability
            ]
            
            if not eligible:
                logger.warning("No emergency doctors available")
                return []
            
            # Rank by composite score: experience * (1 - fatigue_score)
            ranked = sorted(
                eligible,
                key=lambda d: (d.experience * (1 - d.fatigue_score)),
                reverse=True
            )
            
            # Return top 3
            result = ranked[:min(3, len(ranked))]
            
            execution_time = (datetime.now() - start_time).total_seconds() * 1000
            logger.info(f"Emergency doctor search completed in {execution_time:.2f}ms. "
                       f"Found {len(result)} emergency doctors.")
            
            return result
        
        except Exception as e:
            logger.error(f"Emergency doctor search failed: {str(e)}")
            return []
    
    def find_department_specialists(self, doctors: List, department: str) -> List:
        """Find all doctors for a specific department.
        
        Args:
            doctors: List of Doctor objects
            department: Department name
            
        Returns:
            List of doctors matched to department
        """
        try:
            matching = [d for d in doctors if d.specialization == department]
            return sorted(matching, key=lambda d: d.experience, reverse=True)
        except Exception as e:
            logger.error(f"Department search failed: {str(e)}")
            return []
    
    def find_balanced_team(self, doctors: List, team_size: int) -> List:
        """Find a balanced team of doctors with varied specializations.
        
        Args:
            doctors: List of Doctor objects  
            team_size: Number of doctors needed
            
        Returns:
            List of balanced team doctors
        """
        try:
            if len(doctors) <= team_size:
                return sorted(doctors, key=lambda d: d.experience, reverse=True)
            
            # Group by specialization
            by_spec = {}
            for doctor in doctors:
                if doctor.specialization not in by_spec:
                    by_spec[doctor.specialization] = []
                by_spec[doctor.specialization].append(doctor)
            
            # Select from each specialization
            team = []
            specs = list(by_spec.keys())
            spec_idx = 0
            
            while len(team) < team_size:
                spec = specs[spec_idx % len(specs)]
                if by_spec[spec]:
                    doctor = by_spec[spec].pop(0)
                    team.append(doctor)
                spec_idx += 1
            
            return sorted(team, key=lambda d: d.experience, reverse=True)
        
        except Exception as e:
            logger.error(f"Balanced team selection failed: {str(e)}")
            return doctors[:team_size] if team_size <= len(doctors) else doctors
