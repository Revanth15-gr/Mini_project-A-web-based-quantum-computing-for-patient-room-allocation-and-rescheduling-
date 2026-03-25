import React, { useState } from 'react';
import '../styles/QuantumDoctor.css';

/**
 * ExplainabilityCard Component
 * Shows human-readable explanations for doctor assignments
 */
const ExplainabilityCard = ({ explanations = {}, selectedDoctor = null }) => {
  const [expandedExplanation, setExpandedExplanation] = useState(null);

  if (!explanations || Object.keys(explanations).length === 0) {
    return (
      <div className="explainability-card empty">
        <p>No explanations available</p>
      </div>
    );
  }

  const explanationEntries = Object.entries(explanations);

  return (
    <div className="explainability-container">
      <h3>ℹ️ Assignment Explanations</h3>
      
      <div className="explanations-list">
        {explanationEntries.map(([key, explanation], idx) => (
          <div 
            key={idx}
            className={`explanation-card ${expandedExplanation === idx ? 'expanded' : ''}`}
          >
            <button 
              className="explanation-header"
              onClick={() => setExpandedExplanation(expandedExplanation === idx ? null : idx)}
            >
              <span className="expand-icon">{expandedExplanation === idx ? '▼' : '▶'}</span>
              <span className="explanation-key">{key}</span>
            </button>

            {expandedExplanation === idx && (
              <div className="explanation-content">
                <pre className="explanation-text">
                  {explanation}
                </pre>

                <div className="explanation-indicators">
                  <div className="indicator">
                    <span className="icon">✅</span>
                    <span>Specialization Match</span>
                  </div>
                  <div className="indicator">
                    <span className="icon">➖</span>
                    <span>Experience Level</span>
                  </div>
                  <div className="indicator">
                    <span className="icon">✓</span>
                    <span>Availability Confirmed</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="explainability-info">
        <p>Click on any assignment to see detailed explanation of why this doctor was selected.</p>
      </div>
    </div>
  );
};

export default ExplainabilityCard;
