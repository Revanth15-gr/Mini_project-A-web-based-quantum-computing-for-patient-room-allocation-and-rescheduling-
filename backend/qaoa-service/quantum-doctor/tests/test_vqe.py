"""Tests for VQE doctor optimizer."""
import pytest
from models.doctor_model import Doctor
from algorithms.vqe_doctor_optimizer import VQEDoctorOptimizer


@pytest.fixture
def sample_doctors():
    """Create sample doctors."""
    return [
        Doctor(
            id=1,
            name="Dr. A",
            specialization="ICU",
            experience=10,
            availability=["morning"],
            emergency_eligible=True,
            fatigue_score=0.1
        ),
        Doctor(
            id=2,
            name="Dr. B",
            specialization="Surgery",
            experience=8,
            availability=["afternoon"],
            emergency_eligible=False,
            fatigue_score=0.2
        ),
        Doctor(
            id=3,
            name="Dr. C",
            specialization="ER",
            experience=6,
            availability=["night"],
            emergency_eligible=True,
            fatigue_score=0.9
        )
    ]


@pytest.fixture
def sample_schedule():
    """Create sample schedule."""
    return {
        "morning": ["Dr. A - ICU"],
        "afternoon": ["Dr. B - Surgery"],
        "night": ["Dr. C - ER"]
    }


def test_vqe_initialization():
    """Test VQE optimizer initialization."""
    optimizer = VQEDoctorOptimizer(shots=512)
    assert optimizer.shots == 512


def test_optimize_workload(sample_doctors, sample_schedule):
    """Test workload optimization."""
    optimizer = VQEDoctorOptimizer()
    result = optimizer.optimize_workload(sample_doctors, sample_schedule)
    
    assert "schedule" in result or "optimization_score" in result
    assert isinstance(result, dict)


def test_minimize_fatigue(sample_doctors, sample_schedule):
    """Test fatigue minimization."""
    optimizer = VQEDoctorOptimizer()
    result = optimizer.minimize_fatigue(sample_doctors, sample_schedule)
    
    assert "optimized_schedule" in result or "total_fatigue" in result
    assert "fatigue_per_doctor" in result


def test_fatigue_calculation(sample_doctors):
    """Test fatigue score calculation."""
    optimizer = VQEDoctorOptimizer()
    
    # All doctors should have fatigue_scores
    for doctor in sample_doctors:
        assert 0 <= doctor.fatigue_score <= 1.0
