import React, { useState, useEffect } from 'react';
import DoctorScheduleBoard from '../components/DoctorScheduleBoard';
import EmergencyPanel from '../components/EmergencyPanel';
import WorkloadChart from '../components/WorkloadChart';
import ExplainabilityCard from '../components/ExplainabilityCard';
import '../styles/QuantumDoctor.css';

/**
 * Quantum Doctor Scheduler Page
 * Main interface for quantum-optimized doctor shift scheduling
 */
const QuantumScheduler = () => {
  const [doctors, setDoctors] = useState([]);
  const [schedule, setSchedule] = useState({});
  const [workload, setWorkload] = useState({});
  const [explanations, setExplanations] = useState({});
  const [emergencyDoctors, setEmergencyDoctors] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState('Hospital_A');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [algorithmUsed, setAlgorithmUsed] = useState('');
  const [optimizationScore, setOptimizationScore] = useState(0);
  const [executionTime, setExecutionTime] = useState(0);

  // Sample hospitals and shifts
  const hospitals = ['Hospital_A', 'Hospital_B', 'Hospital_C'];

  const shiftRequirements = {
    morning: { ICU: 2, Surgery: 1, Cardiology: 1 },
    afternoon: { ICU: 2, Neurology: 1, Surgery: 1 },
    night: { ICU: 1, Emergency: 2, Cardiology: 1 }
  };

  // Load sample doctors on mount
  useEffect(() => {
    loadSampleDoctors();
  }, []);

  const loadSampleDoctors = () => {
    const sampleDoctors = [
      {
        id: 1,
        name: 'Dr. Aryan Kumar',
        specialization: 'Cardiology',
        experience: 10,
        availability: ['morning', 'afternoon'],
        max_hours: 12,
        emergency_eligible: true,
        fatigue_score: 0.1,
        hospital_id: 'Hospital_A'
      },
      {
        id: 2,
        name: 'Dr. Priya Sharma',
        specialization: 'Neurology',
        experience: 8,
        availability: ['afternoon', 'night'],
        max_hours: 12,
        emergency_eligible: false,
        fatigue_score: 0.2,
        hospital_id: 'Hospital_B'
      },
      {
        id: 3,
        name: 'Dr. Raj Patel',
        specialization: 'Surgery',
        experience: 12,
        availability: ['morning', 'afternoon', 'night'],
        max_hours: 14,
        emergency_eligible: true,
        fatigue_score: 0.3,
        hospital_id: 'Hospital_A'
      },
      {
        id: 4,
        name: 'Dr. Amit Singh',
        specialization: 'ICU',
        experience: 7,
        availability: ['morning', 'night', 'emergency'],
        max_hours: 12,
        emergency_eligible: true,
        fatigue_score: 0.4,
        hospital_id: 'Hospital_C'
      },
      {
        id: 5,
        name: 'Dr. Neha Verma',
        specialization: 'Emergency',
        experience: 9,
        availability: ['morning', 'afternoon', 'night', 'emergency'],
        max_hours: 14,
        emergency_eligible: true,
        fatigue_score: 0.5,
        hospital_id: 'Hospital_B'
      }
    ];

    setDoctors(sampleDoctors);
  };

  const handleRunOptimization = async () => {
    setIsLoading(true);

    try {
      const payload = {
        doctors,
        shift_requirements: shiftRequirements,
        hospitals: [selectedHospital],
        emergency_mode: isEmergencyMode,
        date: selectedDate
      };

      // Call FastAPI backend
      const response = await fetch('/api/quantum/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Optimization failed');
      }

      const result = await response.json();

      if (result.success || result.data) {
        const data = result.data || result;
        setSchedule(data.schedule || {});
        setWorkload(data.workload_distribution || {});
        setExplanations(data.explanations || {});
        setAlgorithmUsed(data.algorithm_used || 'QAOA + VQE');
        setOptimizationScore(data.optimization_score || 0.85);
        setExecutionTime(data.execution_time_ms || 0);
        setEmergencyDoctors(data.emergency_doctors || []);
      }
    } catch (error) {
      console.error('Error:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmergencyAlert = async () => {
    try {
      const response = await fetch('/api/quantum/emergency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctors,
          emergency_slots: 3
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.data) {
          setEmergencyDoctors(result.data.emergency_doctors || []);
        }
      }
    } catch (error) {
      console.error('Emergency alert error:', error);
    }
  };

  return (
    <div className="quantum-scheduler-page">
      <div className="scheduler-header">
        <h1>⚛️ Quantum Doctor Scheduler</h1>
        <p>AI-Powered Quantum Shift Optimization</p>
      </div>

      <div className="scheduler-controls">
        <div className="control-group">
          <label>Hospital:</label>
          <select 
            value={selectedHospital}
            onChange={(e) => setSelectedHospital(e.target.value)}
          >
            {hospitals.map(h => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label>Date:</label>
          <input 
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>

        <div className="control-group checkbox">
          <label>
            <input 
              type="checkbox"
              checked={isEmergencyMode}
              onChange={(e) => setIsEmergencyMode(e.target.checked)}
            />
            Emergency Mode
          </label>
        </div>

        <button 
          className={`btn btn-quantum-primary ${isLoading ? 'loading' : ''}`}
          onClick={handleRunOptimization}
          disabled={isLoading}
        >
          {isLoading ? '⚛ Optimizing...' : '⚛ Generate Schedule'}
        </button>
      </div>

      {algorithmUsed && (
        <div className="algorithm-badge">
          <span>Algorithm: {algorithmUsed}</span>
          <span>Score: {(optimizationScore * 100).toFixed(1)}%</span>
          <span>Time: {executionTime.toFixed(0)}ms</span>
        </div>
      )}

      <div className="scheduler-layout">
        <div className="left-pane">
          <DoctorScheduleBoard 
            schedule={schedule}
            doctors={doctors}
            onRunOptimization={handleRunOptimization}
          />
        </div>

        <div className="right-pane">
          <WorkloadChart 
            workloadDistribution={workload}
            doctors={doctors}
          />
        </div>
      </div>

      <EmergencyPanel 
        emergencyDoctors={emergencyDoctors}
        isEmergencyMode={isEmergencyMode}
        onEmergencyAlert={handleEmergencyAlert}
      />

      <ExplainabilityCard 
        explanations={explanations}
      />

      <div className="scheduler-info">
        <h3>ℹ️ About Quantum Doctor Scheduling</h3>
        <p>
          This system uses hybrid quantum algorithms (QAOA, Grover, VQE, Quantum Annealing)
          to optimize doctor shift allocation while considering specialization, availability,
          workload balance, and fatigue levels. The quantum advantage provides faster,
          more optimal solutions compared to classical algorithms.
        </p>
      </div>
    </div>
  );
};

export default QuantumScheduler;
