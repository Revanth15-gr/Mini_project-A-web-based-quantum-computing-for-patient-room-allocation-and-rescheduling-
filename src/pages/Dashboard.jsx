import { useContext, useMemo, useState } from 'react'
import { HospitalContext } from '../state/HospitalContext.jsx'

const rooms = ['Room 101', 'Room 102', 'Room 103', 'Room 104', 'Room 105', 'Room 106']
const times = ['7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '2:00 PM']

const assignments = [
  {
    time: '7:00 AM',
    room: 'Room 101',
    name: 'Alice Harris',
    note: 'Vitals',
    tone: 'cool',
  },
  {
    time: '7:00 AM',
    room: 'Room 102',
    name: 'Dak & Miller',
    note: 'Labs',
    tone: 'ice',
  },
  {
    time: '8:00 AM',
    room: 'Room 101',
    name: 'Sarah Lee',
    note: 'MRI',
    tone: 'warm',
  },
  {
    time: '8:00 AM',
    room: 'Room 103',
    name: 'John Miller',
    note: 'Meds',
    tone: 'cool',
  },
  {
    time: '9:00 AM',
    room: 'Room 103',
    name: 'Sarah Lee',
    note: 'Medications',
    tone: 'mint',
  },
  {
    time: '9:00 AM',
    room: 'Room 104',
    name: 'Sarah Lee',
    note: 'Follow-up',
    tone: 'ice',
  },
  {
    time: '9:00 AM',
    room: 'Room 105',
    name: 'Robert White',
    note: 'Monitoring',
    tone: 'cool',
  },
  {
    time: '10:00 AM',
    room: 'Room 106',
    name: 'Robert White',
    note: 'BEDS',
    tone: 'warm',
  },
  {
    time: '2:00 PM',
    room: 'Room 105',
    name: 'John Miller',
    note: 'Discharge',
    tone: 'ice',
  },
  {
    time: '2:00 PM',
    room: 'Room 106',
    name: 'Emma Rools',
    note: 'Monitoring',
    tone: 'mint',
  },
]

const insights = [
  { label: 'Estimated Cost Savings', value: '$850', delta: '+12%' },
  { label: 'Efficiency Improvement', value: '31%', delta: '+5%' },
  { label: 'Conflicts Resolved', value: '21', delta: '-8%' },
]

const changes = [
  { name: 'Sarah Lee', from: 'Room 104', to: 'Room 101' },
  { name: 'William Brown', from: 'Room 105', to: 'Room 103' },
  { name: 'John Miller', from: 'Room 102', to: 'Room 103' },
]

const metrics = [
  { label: 'Schedule Adjustments', value: '83%', chart: 'ring' },
  { label: 'Latency', value: '1.2s', chart: 'line' },
  { label: 'Fairness Index', value: '0.94', chart: 'bars' },
]

function getAssignment(time, room) {
  return assignments.find((item) => item.time === time && item.room === room)
}

function pushAction(message) {
  window.dispatchEvent(new CustomEvent('app-action', { detail: message }))
}

function Dashboard() {
  const { patients } = useContext(HospitalContext)
  const [optimizing, setOptimizing] = useState(false)
  const [activeTab, setActiveTab] = useState('scheduler')
  const [qaoaResult, setQaoaResult] = useState(null)
  const [qaoaError, setQaoaError] = useState('')

  const qaoaPatients = useMemo(
    () =>
      patients.slice(0, 6).map((patient, index) => ({
        id: patient.name,
        priority: 1.2 - index * 0.05,
      })),
    [patients]
  )

  const dynamicAssignments = useMemo(() => {
    return patients
      .filter((patient) => patient.room && patient.room !== 'Unassigned')
      .map((patient, index) => ({
        time: times[times.length - 1],
        room: patient.room,
        name: patient.name,
        note: patient.care,
        tone: index % 2 === 0 ? 'cool' : 'mint',
      }))
  }, [patients])

  const handleOptimize = async () => {
    setOptimizing(true)
    setQaoaError('')
    try {
      const response = await fetch('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rooms, patients: qaoaPatients }),
      })

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}))
        throw new Error(errorPayload.detail || 'Failed to run QAOA')
      }

      const data = await response.json()
      setQaoaResult(data)
    } catch (error) {
      setQaoaError(error.message || 'Unable to reach QAOA service')
    } finally {
      setOptimizing(false)
    }
  }

  return (
    <div className="dashboard-grid">
      <div className="dashboard-main">
        <section className="hero-card">
          <div>
            <p className="hero-tag">Quantum Optimization</p>
            <h2>Optimizing Hospital Room Assignments with Quantum Computing</h2>
            <p className="hero-subtitle">
              Explore feasible, conflict-free allocations with adaptive rescheduling
              under clinical constraints.
            </p>
          </div>
          <div className="hero-actions">
            <button
              className="primary-button"
              type="button"
              onClick={handleOptimize}
              disabled={optimizing}
            >
              {optimizing ? 'Optimizing...' : 'Optimize Schedule'}
            </button>
            <button
              className="outline-button"
              type="button"
              onClick={() => pushAction('Open reschedule dialog for patient selection')}
            >
              Reschedule Patient
            </button>
          </div>
        </section>

        <section className="panel qaoa-output">
          <div className="panel-header">
            <div>
              <h3>QAOA Output</h3>
              <p className="panel-subtitle">Assignments, cost, and probabilities</p>
            </div>
            <button
              className="ghost-button"
              type="button"
              onClick={handleOptimize}
              disabled={optimizing}
            >
              {optimizing ? 'Running QAOA...' : 'Run QAOA'}
            </button>
          </div>
          {qaoaError ? (
            <p className="qaoa-error">{qaoaError}</p>
          ) : qaoaResult ? (
            <div className="qaoa-grid">
              <div className="qaoa-card">
                <h4>Cost</h4>
                <p>{Number.isFinite(qaoaResult.cost) ? qaoaResult.cost.toFixed(3) : '-'}</p>
              </div>
              <div className="qaoa-card">
                <h4>Assignments</h4>
                <ul className="qaoa-list">
                  {qaoaResult.assignments?.map((item) => (
                    <li key={`${item.patient}-${item.room}`}>
                      {item.patient} → {item.room || 'Unassigned'}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="qaoa-card">
                <h4>Probabilities</h4>
                <ul className="qaoa-list">
                  {qaoaResult.probabilities?.length ? (
                    qaoaResult.probabilities.map((item, index) => (
                      <li key={`prob-${index}`}>
                        {(item.probability * 100).toFixed(1)}% top sample
                      </li>
                    ))
                  ) : (
                    <li>Not available</li>
                  )}
                </ul>
              </div>
            </div>
          ) : (
            <p className="panel-subtitle">Run QAOA to see assignments.</p>
          )}
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <h3>Schedule Overview</h3>
              <p className="panel-subtitle">April 21-23, 2024</p>
            </div>
            <div className="panel-actions">
              <button className="chip" onClick={() => pushAction('Today view selected')}>
                Today
              </button>
              <button
                className="chip chip-active"
                onClick={() => pushAction('This week view selected')}
              >
                This Week
              </button>
              <button className="chip" onClick={() => pushAction('Tomorrow view selected')}>
                Tomorrow
              </button>
              <button
                className="ghost-button"
                type="button"
                onClick={() => pushAction('Date picker opened')}
              >
                April 22, 2024
              </button>
            </div>
          </div>
          <div className="panel-tabs">
            <button
              className={`tab ${activeTab === 'scheduler' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('scheduler')}
            >
              Scheduler
            </button>
            <button
              className={`tab ${activeTab === 'constraints' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('constraints')}
            >
              Constraints & Parameters
            </button>
            <button
              className={`tab ${activeTab === 'history' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              Optimization History
            </button>
            <div className="panel-search">
              <span className="search-icon" aria-hidden="true" />
              <input
                type="search"
                placeholder="Search"
                aria-label="Search"
                onChange={(e) =>
                  e.target.value && pushAction(`Searching: ${e.target.value}`)
                }
              />
            </div>
          </div>

          {activeTab === 'scheduler' && (
            <div className="scheduler">
              <div className="scheduler-row scheduler-head">
                <div className="scheduler-cell time-cell">Time</div>
                {rooms.map((room) => (
                  <div key={room} className="scheduler-cell room-cell">
                    {room}
                  </div>
                ))}
              </div>
              {times.map((time) => (
                <div key={time} className="scheduler-row">
                  <div className="scheduler-cell time-cell">{time}</div>
                  {rooms.map((room) => {
                    const slot = getAssignment(time, room)
                    const liveSlot =
                      slot ||
                      dynamicAssignments.find(
                        (item) => item.time === time && item.room === room
                      )
                    return (
                      <div
                        key={`${time}-${room}`}
                        className="scheduler-cell"
                        onClick={() =>
                          liveSlot
                            ? pushAction(`Selected: ${liveSlot.name} at ${time}`)
                            : pushAction(`Available slot at ${time}`)
                        }
                        style={{ cursor: 'pointer' }}
                      >
                        {liveSlot ? (
                          <div className={`slot slot-${liveSlot.tone}`}>
                            <p className="slot-name">{liveSlot.name}</p>
                            <p className="slot-note">{liveSlot.note}</p>
                          </div>
                        ) : (
                          <div className="slot slot-empty">Available</div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          )}
          {activeTab === 'constraints' && (
            <div style={{ padding: '1rem', textAlign: 'center', color: '#5c6a85' }}>
              Constraints & Parameters view
            </div>
          )}
          {activeTab === 'history' && (
            <div style={{ padding: '1rem', textAlign: 'center', color: '#5c6a85' }}>
              Optimization History view
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <h3>Optimization Insights</h3>
              <p className="panel-subtitle">Adaptive metrics from quantum engine</p>
            </div>
            <button
              className="ghost-button"
              type="button"
              onClick={() => pushAction('Loading full optimization report...')}
            >
              View Full Report
            </button>
          </div>
          <div className="insight-row">
            <div className="insight-graph">
              <div className="bar-chart">
                {[20, 35, 25, 50, 65, 60, 78, 82].map((value, index) => (
                  <span
                    key={`bar-${value}-${index}`}
                    style={{ height: `${value}%` }}
                  />
                ))}
              </div>
              <p className="chart-label">Optimization throughput</p>
            </div>
            <div className="insight-graph">
              <div className="line-chart">
                <span />
                <span />
                <span />
              </div>
              <p className="chart-label">Constraint satisfaction</p>
            </div>
            <div className="insight-metrics">
              {metrics.map((metric) => (
                <div key={metric.label} className="metric-card">
                  <div className={`metric-chart metric-${metric.chart}`} />
                  <div>
                    <p className="metric-value">{metric.value}</p>
                    <p className="metric-label">{metric.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <aside className="dashboard-aside">
        <section className="aside-card">
          <div className="aside-header">
            <div>
              <h3>Optimization Insights</h3>
              <p className="panel-subtitle">Quantum cycle summary</p>
            </div>
            <div className="holo-ring" aria-hidden="true" />
          </div>
          <div className="aside-image" aria-hidden="true">
            <div className="pulse-grid">
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
          </div>
          <div className="insight-stats">
            {insights.map((item) => (
              <div key={item.label} className="stat-row">
                <p className="stat-value">{item.value}</p>
                <div>
                  <p className="stat-label">{item.label}</p>
                  <p className="stat-delta">{item.delta} vs last run</p>
                </div>
              </div>
            ))}
          </div>
          <button
            className="primary-button"
            type="button"
            onClick={() => pushAction('Optimized schedule applied to system')}
          >
            Apply Optimized Schedule
          </button>
        </section>

        <section className="aside-card">
          <div className="panel-header">
            <div>
              <h3>Room Assignment Changes</h3>
              <p className="panel-subtitle">Latest quantum reallocation</p>
            </div>
            <button
              className="ghost-button"
              type="button"
              onClick={() => pushAction('Loading full changes report...')}
            >
              View Full Report
            </button>
          </div>
          <div className="change-list">
            {changes.map((change) => (
              <div
                key={change.name}
                className="change-item"
                onClick={() =>
                  pushAction(
                    `${change.name} reassigned from ${change.from} to ${change.to}`
                  )
                }
                style={{ cursor: 'pointer' }}
              >
                <div className="change-avatar" aria-hidden="true" />
                <div>
                  <p className="change-name">{change.name}</p>
                  <p className="change-note">
                    {change.from} to {change.to}
                  </p>
                </div>
                <span className="change-arrow" aria-hidden="true" />
              </div>
            ))}
          </div>
        </section>
      </aside>
    </div>
  )
}

export default Dashboard
