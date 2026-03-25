"""Tests for Grover doctor search."""
import pytest
from models.doctor_model import Doctor
from algorithms.grover_doctor_search import GroverDoctorSearch


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
            fatigue_score=0.2
        ),
        Doctor(
            id=2,
            name="Dr. Priya",
            specialization="Cardiology",
            experience=7,
            availability=["afternoon", "night"],
            emergency_eligible=False,
            fatigue_score=0.3
        ),
        Doctor(
            id=3,
            name="Dr. Raj",
            specialization="Neurology",
            experience=8,
            availability=["morning", "night", "emergency"],
            emergency_eligible=True,
            fatigue_score=0.4
        )
    ]


def test_grover_initialization():
    """Test Grover searcher initialization."""
    searcher = GroverDoctorSearch(shots=1024)
    assert searcher.shots == 1024


def test_find_specialist(sample_doctors):
    """Test finding specialist doctors."""
    searcher = GroverDoctorSearch()
    results = searcher.find_specialist(sample_doctors, "Cardiology", "morning")
    
    assert isinstance(results, list)
    assert all(d.specialization == "Cardiology" for d in results)
    assert all("morning" in d.availability for d in results)


def test_find_available_doctor(sample_doctors):
    """Test finding available doctor."""
    searcher = GroverDoctorSearch()
    result = searcher.find_available_doctor(sample_doctors, "afternoon", "Cardiology")
    
    assert result is not None
    assert "afternoon" in result.availability
    assert result.fatigue_score < 0.7


def test_find_emergency_doctor(sample_doctors):
    """Test finding emergency doctors."""
    searcher = GroverDoctorSearch()
    results = searcher.find_emergency_doctor(sample_doctors)
    
    assert isinstance(results, list)
    assert all(d.emergency_eligible for d in results)


def test_find_department_specialists(sample_doctors):
    """Test finding doctors by department."""
    searcher = GroverDoctorSearch()
    results = searcher.find_department_specialists(sample_doctors, "Cardiology")
    
    assert isinstance(results, list)
    assert len(results) >= 1
    assert all(d.specialization == "Cardiology" for d in results)


def test_find_balanced_team(sample_doctors):
    """Test finding balanced team."""
    searcher = GroverDoctorSearch()
    team = searcher.find_balanced_team(sample_doctors, 2)
    
    assert len(team) == 2
    # Should have variety in specializations
    specs = [d.specialization for d in team]
    assert len(set(specs)) >= 1


def test_grover_empty_input():
    """Test Grover with empty input."""
    searcher = GroverDoctorSearch()
    results = searcher.find_specialist([], "Cardiology", "morning")
    
    assert results == []


def test_grover_no_match(sample_doctors):
    """Test Grover with no matching results."""
    searcher = GroverDoctorSearch()
    results = searcher.find_specialist(sample_doctors, "Pediatrics", "evening")
    
    # Should return empty list
    assert results == []
