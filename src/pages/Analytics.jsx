const hospitalStatus = [
  {
    name: 'Vizag City Care Hospital',
    available: '6 Beds',
    doctors: '4',
    readiness: 'Ready',
    distance: '1.4 km',
    statusTone: 'ready',
  },
  {
    name: 'Vijayawada Heart Institute',
    available: '3 Beds',
    doctors: '2',
    readiness: 'Limited',
    distance: '2.6 km',
    statusTone: 'limited',
  },
  {
    name: 'Guntur Neuro Center',
    available: '2 Beds',
    doctors: '2',
    readiness: 'Limited',
    distance: '3.3 km',
    statusTone: 'limited',
  },
  {
    name: 'Tirupati Ortho & Trauma Hospital',
    available: '1 Bed',
    doctors: '1',
    readiness: 'Full',
    distance: '4.2 km',
    statusTone: 'full',
  },
  {
    name: 'Kakinada Coastal Medical',
    available: '4 Beds',
    doctors: '3',
    readiness: 'Ready',
    distance: '5.1 km',
    statusTone: 'ready',
  },
]

const quickActions = [
  'Prepare ER Team',
  'Share Patient Info',
  'Assign Hospital',
  'Dismiss Alert',
]

function Analytics() {
  const pushAction = (message) => {
    window.dispatchEvent(new CustomEvent('app-action', { detail: message }))
  }

  return (
    <div className="emergency-page">
      <div className="emergency-header">
        <div>
          <h2>Analytics</h2>
          <p className="panel-subtitle">Quantum-Based Patient Room Allocation</p>
        </div>
        <div className="emergency-search">
          <span className="search-icon" aria-hidden="true" />
          <input type="search" placeholder="Search" aria-label="Search" />
        </div>
      </div>

      <section className="alert-banner">
        <div className="alert-left">
          <span className="alert-badge">Emergency Alert</span>
          <h3>Ambulance Reported Case: Nearby Hospitals Alert</h3>
          <div className="alert-meta">
            <span>Case #108</span>
            <span>Severe Car Accident</span>
            <span>RTC Complex & MVP Colony</span>
            <span>Ambulance ID: AMB-5241</span>
            <span>Arriving in 4 Min</span>
          </div>
        </div>
        <div className="alert-actions">
          <button
            className="outline-button"
            type="button"
            onClick={() => pushAction('Opening live ambulance feed')}
          >
            View Live Feed
          </button>
          <button
            className="primary-button"
            type="button"
            onClick={() => pushAction('Sending emergency alert to nearest hospitals')}
          >
            Send Alert
          </button>
        </div>
      </section>

      <div className="emergency-grid">
        <section className="panel map-panel">
          <div className="map-canvas">
            <div className="map-route" />
            <div className="map-ambulance">AMB 108</div>
            <div className="map-pin pin-1">Vizag City • 1.4 km</div>
            <div className="map-pin pin-2">Vijayawada • 2.6 km</div>
            <div className="map-pin pin-3">Guntur • 3.3 km</div>
            <div className="map-pin pin-4">Tirupati • 4.2 km</div>
          </div>
          <div className="panel-header">
            <div>
              <h3>Hospital Status Overview</h3>
              <p className="panel-subtitle">Live status and ETA details</p>
            </div>
          </div>
          <div className="status-table">
            <div className="status-row status-head">
              <span>Hospital</span>
              <span>Available</span>
              <span>ER Doctors</span>
              <span>ER Readiness</span>
              <span>Distance</span>
              <span></span>
            </div>
            {hospitalStatus.map((hospital) => (
              <div key={hospital.name} className="status-row">
                <span>{hospital.name}</span>
                <span>{hospital.available}</span>
                <span>{hospital.doctors}</span>
                <span className={`status-pill ${hospital.statusTone}`}>
                  {hospital.readiness}
                </span>
                <span>{hospital.distance}</span>
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() => pushAction(`Viewing details for ${hospital.name}`)}
                >
                  View Details
                </button>
              </div>
            ))}
          </div>
        </section>

        <aside className="emergency-side">
          <section className="panel">
            <div className="panel-header">
              <div>
                <h3>Incoming Emergency Case</h3>
                <p className="panel-subtitle">Case #108</p>
              </div>
              <span className="alert-chip">Arriving • 4 Min</span>
            </div>
            <div className="incoming-card">
              <p>Severe Car Accident</p>
              <p>RTC Complex & MVP Colony</p>
              <div className="incoming-photo" />
              <div className="incoming-actions">
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() => pushAction('Marked case as red entry')}
                >
                  Red Entry
                </button>
                <button
                  className="outline-button"
                  type="button"
                  onClick={() => pushAction('Dismissed incoming case alert')}
                >
                  Dismiss
                </button>
              </div>
            </div>
          </section>

          <section className="panel quick-actions">
            <div className="panel-header">
              <div>
                <h3>Quick Actions</h3>
                <p className="panel-subtitle">Emergency protocol steps</p>
              </div>
            </div>
            <div className="quick-list">
              {quickActions.map((action) => (
                <button
                  key={action}
                  className="ghost-button"
                  type="button"
                  onClick={() => pushAction(`${action} triggered`)}
                >
                  {action}
                </button>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}

export default Analytics
