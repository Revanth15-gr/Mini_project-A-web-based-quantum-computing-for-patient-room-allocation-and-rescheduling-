"""Tests for QAOA doctor scheduler."""
import pytest
from models.doctor_model import Doctor
from algorithms.qaoa_doctor_scheduler import QAOADoctorScheduler


@pytest.fixture
def sample_doctors():
    """Create sample doctors for testing."""
    return [
        Doctor(
            id=1,
            name="Dr. Aryan",
            specialization="Cardiology",
            experience=10,
            availability=["morning", "afternoon"],
            emergency_eligible=True,
            fatigue_score=0.1
        ),
        Doctor(
            id=2,
            name="Dr. Priya",
            specialization="Neurology",
            experience=5,
            availability=["afternoon", "night"],
            emergency_eligible=False,
            fatigue_score=0.2
        ),
        Doctor(
            id=3,
            name="Dr. Raj",
            specialization="Emergency",
            experience=8,
            availability=["morning", "night", "emergency"],
            emergency_eligible=True,
            fatigue_score=0.3
        )
    ]


@pytest.fixture
def sample_shifts():
    """Create sample shift requirements."""
    return {
        "morning": {"ICU": 1, "Surgery": 1},
        "afternoon": {"ICU": 1},
        "night": {"Emergency": 1}
    }


def test_qaoa_initialization():
    """Test QAOA scheduler initialization."""
    scheduler = QAOADoctorScheduler(shots=512, p=1)
    assert scheduler.shots == 512
    assert scheduler.p == 1


def test_optimize_doctor_shifts(sample_doctors, sample_shifts):
    """Test QAOA shift optimization."""
    scheduler = QAOADoctorScheduler()
    result = scheduler.optimize_doctor_shifts(sample_doctors, sample_shifts)
    
    assert "schedule" in result
    assert "algorithm" in result
    assert "optimization_score" in result
    assert result["optimization_score"] >= 0
    assert result["optimization_score"] <= 1


def test_allocate_emergency_doctors(sample_doctors):
    """Test emergency doctor allocation."""
    scheduler = QAOADoctorScheduler()
    results = scheduler.allocate_emergency_doctors(sample_doctors, 2)
    
    assert isinstance(results, list)
    assert len(results) <= 2
    # All returned doctors should be emergency eligible
    for doctor in results:
        assert doctor.emergency_eligible


def test_balance_workload(sample_doctors, sample_shifts):
    """Test workload balancing."""
    scheduler = QAOADoctorScheduler()
    
    # Create initial schedule
    initial_schedule = {
        "morning": ["Dr. Aryan - ICU", "Dr. Aryan - Surgery"],
        "afternoon": ["Dr. Priya - ICU"],
        "night": ["Dr. Raj - Emergency"]
    }
    
    result = scheduler.balance_workload(initial_schedule, sample_doctors)
    
    assert "schedule" in result
    assert "algorithm" in result


def test_qaoa_with_small_problem(sample_doctors, sample_shifts):
    """Test QAOA with small problem size."""
    scheduler = QAOADoctorScheduler(shots=256, p=1)
    
    # Use small subset
    small_doctors = sample_doctors[:2]
    small_shifts = {"morning": {"ICU": 1}}
    
    result = scheduler.optimize_doctor_shifts(small_doctors, small_shifts)
    
    assert result is not None
    assert "optimization_score" in result
    assert len(result.get("schedule", {})) >= 0


def test_qaoa_classical_fallback(sample_doctors, sample_shifts):
    """Test QAOA classical fallback for large problems."""
    scheduler = QAOADoctorScheduler()
    
    # Create large problem (should trigger fallback)
    large_doctors = sample_doctors * 8  # 24 doctors
    
    result = scheduler.optimize_doctor_shifts(large_doctors, sample_shifts)
    
    # Should still return valid result (from classical fallback)
    assert "schedule" in result
    assert "algorithm" in result
