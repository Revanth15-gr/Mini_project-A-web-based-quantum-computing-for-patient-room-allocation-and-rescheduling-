import React, { useState, useEffect } from 'react';
import '../styles/QuantumDoctor.css';

/**
 * Emergency Panel Component
 * Shows emergency doctor allocation and real-time alerts
 */
const EmergencyPanel = ({ emergencyDoctors = [], isEmergencyMode = false, onEmergencyAlert }) => {
  const [expanded, setExpanded] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      // Trigger refresh every 10 seconds
      onEmergencyAlert?.();
    }, 10000);

    return () => clearInterval(interval);
  }, [autoRefresh, onEmergencyAlert]);

  if (!isEmergencyMode) {
    return null;
  }

  return (
    <div className={`emergency-panel ${isEmergencyMode ? 'active' : ''}`}>
      <div className="emergency-header">
        <div className="alert-badge">
          <span className="alert-icon">🚨</span>
          <span className="alert-text">EMERGENCY MODE ACTIVE</span>
        </div>
        <button 
          className="btn-expand"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? '▼' : '▶'}
        </button>
      </div>

      {expanded && (
        <div className="emergency-content">
          <div className="emergency-doctors">
            <h3>Priority Emergency Doctors</h3>
            {emergencyDoctors.map((doctor, idx) => (
              <div key={idx} className="emergency-doctor-card">
                <div className="doctor-info">
                  <span className="rank">#{idx + 1}</span>
                  <span className="name">{doctor.name}</span>
                  <span className="specialization">{doctor.specialization}</span>
                </div>
                <div className="priority-bar">
                  <div 
                    className="priority-fill"
                    style={{ width: `${(doctor.priority_score || 0.7) * 100}%` }}
                  ></div>
                </div>
                <div className="doctor-stats">
                  <span>Experience: {doctor.experience}y</span>
                  <span>Fatigue: {(doctor.fatigue_score || 0).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="emergency-actions">
            <button className="btn btn-primary">
              ✓ Deploy Emergency Team
            </button>
            <label className="auto-refresh">
              <input 
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
              Auto-refresh every 10s
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmergencyPanel;
