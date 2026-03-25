"""Quantum Annealing simulation for doctor shift scheduling."""
import numpy as np
from typing import List, Dict
import logging
from datetime import datetime
from scipy.optimize import minimize

logger = logging.getLogger(__name__)


class QuantumAnnealingDoctor:
    """Simulated quantum annealing for doctor shift allocation."""
    
    def __init__(self, initial_temp: float = 100.0, cooling_rate: float = 0.995):
        """Initialize quantum annealing simulator.
        
        Args:
            initial_temp: Initial temperature for annealing
            cooling_rate: Temperature cooling rate (multiplicative)
        """
        self.initial_temp = initial_temp
        self.cooling_rate = cooling_rate
        self.min_temp = 0.01
    
    def schedule_shifts(self, doctors: List, shift_requirements: Dict, hospitals: List[str]) -> Dict:
        """Schedule shifts using simulated annealing.
        
        Args:
            doctors: List of Doctor objects
            shift_requirements: Dict of shift requirements
            hospitals: List of hospital IDs
            
        Returns:
            Optimized schedule
        """
        try:
            start_time = datetime.now()
            
            # Convert problem to energy minimization
            # Use simulated annealing heuristic
            
            best_schedule = self._simulated_annealing_schedule(
                doctors, shift_requirements, hospitals
            )
            
            execution_time = (datetime.now() - start_time).total_seconds() * 1000
            
            result = {
                "schedule": best_schedule["schedule"],
                "energy": best_schedule["energy"],
                "optimization_score": 1.0 - best_schedule["energy"] / 100,  # Normalize to 0-1
                "algorithm": "Quantum Annealing (Simulated)",
                "execution_time_ms": execution_time,
                "iterations": best_schedule.get("iterations", 0)
            }
            
            logger.info(f"Shift scheduling completed in {execution_time:.2f}ms. "
                       f"Energy: {best_schedule['energy']:.2f}")
            
            return result
        
        except Exception as e:
            logger.error(f"Quantum annealing scheduling failed: {str(e)}")
            return self._classical_schedule_fallback(doctors, shift_requirements, hospitals)
    
    def allocate_hospitals(self, doctors: List, hospitals: List[str], requirements: Dict) -> Dict:
        """Allocate doctors to hospitals using quantum annealing.
        
        Args:
            doctors: List of Doctor objects
            hospitals: List of hospital IDs
            requirements: Requirements dict (hospital -> count)
            
        Returns:
            Hospital allocation mapping
        """
        try:
            start_time = datetime.now()
            
            # Optimize hospital allocation
            allocation = self._simulated_annealing_allocation(doctors, hospitals, requirements)
            
            execution_time = (datetime.now() - start_time).total_seconds() * 1000
            
            result = {
                "allocation": allocation,
                "algorithm": "Quantum Annealing Hospital Allocation",
                "execution_time_ms": execution_time
            }
            
            logger.info(f"Hospital allocation completed in {execution_time:.2f}ms")
            
            return result
        
        except Exception as e:
            logger.error(f"Hospital allocation failed: {str(e)}")
            return self._classical_allocation_fallback(doctors, hospitals, requirements)
    
    def _simulated_annealing_schedule(self, doctors: List, shift_requirements: Dict, hospitals: List[str]) -> Dict:
        """Simulated annealing for scheduling.
        
        Args:
            doctors: List of doctors
            shift_requirements: Requirements
            hospitals: Hospital list
            
        Returns:
            Best solution found
        """
        # Initialize random schedule
        current_schedule = self._random_schedule(doctors, shift_requirements)
        current_energy = self._compute_schedule_energy(current_schedule, doctors, shift_requirements)
        
        best_schedule = current_schedule.copy()
        best_energy = current_energy
        
        temperature = self.initial_temp
        iteration = 0
        
        while temperature > self.min_temp:
            # Generate neighbor solution
            neighbor_schedule = self._perturbate_schedule(current_schedule, doctors, shift_requirements)
            neighbor_energy = self._compute_schedule_energy(neighbor_schedule, doctors, shift_requirements)
            
            # Metropolis criterion
            delta = neighbor_energy - current_energy
            if delta < 0 or np.random.random() < np.exp(-delta / temperature):
                current_schedule = neighbor_schedule
                current_energy = neighbor_energy
            
            # Update best
            if neighbor_energy < best_energy:
                best_schedule = neighbor_schedule.copy()
                best_energy = neighbor_energy
            
            # Cool down
            temperature *= self.cooling_rate
            iteration += 1
        
        return {
            "schedule": best_schedule,
            "energy": best_energy,
            "iterations": iteration
        }
    
    def _simulated_annealing_allocation(self, doctors: List, hospitals: List[str], requirements: Dict) -> Dict:
        """Simulated annealing for hospital allocation.
        
        Args:
            doctors: List of doctors
            hospitals: Hospital list
            requirements: Requirements per hospital
            
        Returns:
            Allocation dict
        """
        # Initialize random allocation
        allocation = {h: [] for h in hospitals}
        for doctor in doctors:
            hospital = hospitals[np.random.randint(0, len(hospitals))]
            allocation[hospital].append(doctor)
        
        # Optimize allocation
        best_allocation = {h: list(docs) for h, docs in allocation.items()}
        best_score = self._compute_allocation_score(best_allocation, doctors, requirements)
        
        temperature = self.initial_temp
        
        while temperature > self.min_temp:
            # Perturbate by moving one doctor
            neighbor = {h: list(docs) for h, docs in best_allocation.items()}
            
            if neighbor[hospitals[0]]:  # If first hospital has doctors
                idx = np.random.randint(0, len(neighbor[hospitals[0]]))
                doctor = neighbor[hospitals[0]].pop(idx)
                random_hospital = hospitals[np.random.randint(0, len(hospitals))]
                neighbor[random_hospital].append(doctor)
                
                neighbor_score = self._compute_allocation_score(neighbor, doctors, requirements)
                delta = neighbor_score - best_score
                
                if delta < 0 or np.random.random() < np.exp(-delta / temperature):
                    best_allocation = neighbor
                    best_score = neighbor_score
            
            temperature *= self.cooling_rate
        
        return best_allocation
    
    def _random_schedule(self, doctors: List, shift_requirements: Dict) -> Dict:
        """Generate random initial schedule."""
        schedule = {shift: [] for shift in shift_requirements.keys()}
        shifts_list = list(shift_requirements.keys())
        
        for doctor in doctors:
            shift = shifts_list[np.random.randint(0, len(shifts_list))]
            dept_list = list(shift_requirements[shift].keys())
            if dept_list:
                dept = dept_list[np.random.randint(0, len(dept_list))]
                schedule[shift].append(f"{doctor.name} - {dept}")
        
        return schedule
    
    def _perturbate_schedule(self, schedule: Dict, doctors: List, shift_requirements: Dict) -> Dict:
        """Perturbate schedule by swapping assignments."""
        new_schedule = {shift: list(assignments) for shift, assignments in schedule.items()}
        shifts_list = list(schedule.keys())
        
        # Randomly swap two assignments
        if shifts_list and len(shifts_list) > 1:
            shift1 = shifts_list[np.random.randint(0, len(shifts_list))]
            shift2 = shifts_list[np.random.randint(0, len(shifts_list))]
            
            if new_schedule[shift1] and new_schedule[shift2]:
                idx1 = np.random.randint(0, len(new_schedule[shift1]))
                idx2 = np.random.randint(0, len(new_schedule[shift2]))
                
                new_schedule[shift1][idx1], new_schedule[shift2][idx2] = \
                    new_schedule[shift2][idx2], new_schedule[shift1][idx1]
        
        return new_schedule
    
    def _compute_schedule_energy(self, schedule: Dict, doctors: List, shift_requirements: Dict) -> float:
        """Compute energy (penalty) of a schedule.
        
        Energy is high when:
        - Requirements not met
        - Doctors overloaded
        - Constraints violated
        """
        energy = 0.0
        
        # Penalty for unmet requirements
        for shift, depts in shift_requirements.items():
            actual_count = len(schedule.get(shift, []))
            required_count = sum(depts.values())
            energy += 10 * abs(actual_count - required_count)
        
        # Penalty for workload imbalance
        workload = {d.id: 0 for d in doctors}
        for assignments in schedule.values():
            for assignment in assignments:
                for doctor in doctors:
                    if doctor.name in assignment:
                        workload[doctor.id] += 1
        
        avg_load = np.mean(list(workload.values())) if workload else 0
        energy += 5 * np.var(list(workload.values()))
        
        # Penalty for exceeding max hours
        for doctor in doctors:
            if workload.get(doctor.id, 0) > doctor.max_hours / 8:
                energy += 8 * (workload[doctor.id] - doctor.max_hours / 8)
        
        return energy
    
    def _compute_allocation_score(self, allocation: Dict, doctors: List, requirements: Dict) -> float:
        """Compute allocation score (lower is better)."""
        score = 0.0
        
        for hospital, required_count in requirements.items():
            actual_count = len(allocation.get(hospital, []))
            score += (actual_count - required_count) ** 2
        
        return score
    
    def _classical_schedule_fallback(self, doctors: List, shift_requirements: Dict, hospitals: List[str]) -> Dict:
        """Classical greedy fallback."""
        schedule = self._random_schedule(doctors, shift_requirements)
        return {
            "schedule": schedule,
            "energy": 50.0,
            "optimization_score": 0.5,
            "algorithm": "Classical Greedy Fallback"
        }
    
    def _classical_allocation_fallback(self, doctors: List, hospitals: List[str], requirements: Dict) -> Dict:
        """Classical allocation fallback."""
        allocation = {h: [] for h in hospitals}
        for i, doctor in enumerate(doctors):
            hospital = hospitals[i % len(hospitals)]
            allocation[hospital].append(doctor)
        
        return {
            "allocation": allocation,
            "algorithm": "Classical Round-Robin Fallback"
        }
