"""Tests for master orchestrator."""
import pytest
import asyncio
from models.doctor_model import Doctor, ScheduleRequest
from quantum_doctor_master import QuantumDoctorMaster


@pytest.fixture
def sample_request():
    """Create sample scheduling request."""
    doctors = [
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
            availability=["afternoon"],
            emergency_eligible=False,
            fatigue_score=0.0
        )
    ]
    
    return ScheduleRequest(
        doctors=doctors,
        shift_requirements={
            "morning": {"ICU": 1},
            "afternoon": {"Surgery": 1}
        },
        hospitals=["Hospital_A"],
        emergency_mode=False
    )


@pytest.mark.asyncio
async def test_master_orchestrator_initialization():
    """Test master orchestrator initialization."""
    master = QuantumDoctorMaster()
    assert master.qaoa is not None
    assert master.grover is not None
    assert master.vqe is not None
    assert master.annealing is not None


@pytest.mark.asyncio
async def test_quantum_orchestration(sample_request):
    """Test quantum orchestration."""
    master = QuantumDoctorMaster()
    
    result = await master.run(sample_request)
    
    assert result is not None
    assert hasattr(result, 'schedule')
    assert hasattr(result, 'optimization_score')
    assert result.algorithm_used is not None


def test_algorithm_info():
    """Test algorithm info retrieval."""
    master = QuantumDoctorMaster()
    info = master.get_algorithm_info()
    
    assert "algorithms" in info
    assert len(info["algorithms"]) >= 4
    assert any("QAOA" in alg["name"] for alg in info["algorithms"])


def test_workload_calculation(sample_request):
    """Test workload calculation."""
    master = QuantumDoctorMaster()
    
    schedule = {
        "morning": ["Dr. Aryan - ICU"],
        "afternoon": ["Dr. Priya - Surgery"]
    }
    
    workload = master._calculate_workload(sample_request.doctors, schedule)
    
    assert "Dr. Aryan" in workload
    assert "Dr. Priya" in workload
    assert workload["Dr. Aryan"] == 1
    assert workload["Dr. Priya"] == 1


def test_optimization_score(sample_request):
    """Test optimization score calculation."""
    master = QuantumDoctorMaster()
    
    schedule = {
        "morning": ["Dr. Aryan - ICU"],
        "afternoon": ["Dr. Priya - Surgery"]
    }
    
    workload = master._calculate_workload(sample_request.doctors, schedule)
    score = master._calculate_optimization_score(sample_request, schedule, workload)
    
    assert 0 <= score <= 1
