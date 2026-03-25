import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import '../styles/QuantumDoctor.css';

/**
 * Workload Chart Component
 * Visualizes doctor workload distribution
 */
const WorkloadChart = ({ workloadDistribution = {}, doctors = [] }) => {
  const [chartData, setChartData] = useState([]);
  const [avgLoad, setAvgLoad] = useState(0);

  useEffect(() => {
    // Transform workload data for chart
    const data = Object.entries(workloadDistribution || {}).map(([doctorName, shifts]) => {
      const doctor = doctors.find(d => d.name === doctorName) || {};
      return {
        name: doctorName.split(' ').pop(), // Last name only
        shifts: shifts,
        maxHours: doctor.max_hours ? Math.ceil(doctor.max_hours / 8) : 12
      };
    });

    setChartData(data);

    // Calculate average
    if (data.length > 0) {
      const avg = data.reduce((sum, item) => sum + item.shifts, 0) / data.length;
      setAvgLoad(avg);
    }
  }, [workloadDistribution, doctors]);

  if (chartData.length === 0) {
    return (
      <div className="workload-chart empty">
        <p>No workload data available</p>
      </div>
    );
  }

  return (
    <div className="workload-chart-container">
      <h3>📊 Doctor Workload Distribution</h3>
      
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip 
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="custom-tooltip">
                    <p>{data.name}: {data.shifts} shifts</p>
                    <p>Max: {data.maxHours} shifts</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend />
          <Bar dataKey="shifts" fill="#0099ff" name="Shifts Assigned" />
          <Bar dataKey="maxHours" fill="#ff006e" name="Max Capacity" />
        </BarChart>
      </ResponsiveContainer>

      <div className="workload-stats">
        <div className="stat-item">
          <span className="stat-label">Average Workload:</span>
          <span className="stat-value">{avgLoad.toFixed(1)} shifts</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Total Shifts:</span>
          <span className="stat-value">{Object.values(workloadDistribution).reduce((a, b) => a + b, 0)}</span>
        </div>
      </div>
    </div>
  );
};

export default WorkloadChart;
