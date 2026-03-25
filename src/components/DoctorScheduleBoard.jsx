import React, { useState, useEffect } from 'react';
import '../styles/QuantumDoctor.css';

/**
 * Doctor Schedule Board Component
 * Displays shift assignments in a table format
 */
const DoctorScheduleBoard = ({ schedule = {}, doctors = [], onRunOptimization }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedShift, setSelectedShift] = useState(null);
  const [fatigue, setFatigue] = useState({});

  useEffect(() => {
    // Build fatigue map from doctors
    const fatigueMap = {};
    doctors.forEach(doc => {
      fatigueMap[doc.name] = doc.fatigue_score || 0;
    });
    setFatigue(fatigueMap);
  }, [doctors]);

  const getWorkloadColor = (doctorName) => {
    const fatigueScore = fatigue[doctorName] || 0;
    if (fatigueScore > 0.8) return 'high-fatigue';
    if (fatigueScore > 0.5) return 'medium-fatigue';
    return 'normal-fatigue';
  };

  const shifts = Object.keys(schedule);

  return (
    <div className="doctor-schedule-board">
      <div className="schedule-header">
        <h2>⚕️ Doctor Shift Schedule</h2>
        <button 
          className={`btn btn-quantum ${isLoading ? 'loading' : ''}`}
          onClick={onRunOptimization}
          disabled={isLoading}
        >
          {isLoading ? '⚛ Optimizing...' : '⚛ Run Quantum Optimizer'}
        </button>
      </div>

      <div className="schedule-table-wrapper">
        <table className="schedule-table doctor-schedule-table">
          <thead>
            <tr>
              <th>Shift</th>
              <th>Morning</th>
              <th>Afternoon</th>
              <th>Night</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Assigned Doctors</td>
              {shifts.map(shift => (
                <td key={shift} className="shift-cell">
                  <div className="doctors-list">
                    {(schedule[shift] || []).map((doc, idx) => (
                      <div 
                        key={idx} 
                        className={`doctor-badge ${getWorkloadColor(doc.split(' - ')[0])}`}
                        title={`Fatigue: ${(fatigue[doc.split(' - ')[0]] || 0).toFixed(2)}`}
                      >
                        {doc}
                      </div>
                    ))}
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="schedule-legend">
        <span><span className="legend-green"></span> Normal Workload</span>
        <span><span className="legend-orange"></span> Medium Fatigue</span>
        <span><span className="legend-red"></span> High Fatigue</span>
      </div>
    </div>
  );
};

export default DoctorScheduleBoard;
