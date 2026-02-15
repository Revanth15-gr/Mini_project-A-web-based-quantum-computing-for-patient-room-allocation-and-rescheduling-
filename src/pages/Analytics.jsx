const hospitalLocations = {
  'Vizag City Care Hospital': { lat: 17.6869, lng: 83.2185, district: 'Coastal Andhra' },
  'Vijayawada Heart Institute': { lat: 16.5062, lng: 80.6480, district: 'Coastal Andhra' },
  'Guntur Neuro Center': { lat: 16.3067, lng: 80.4365, district: 'Coastal Andhra' },
  'Kakinada Coastal Medical': { lat: 16.9891, lng: 82.2475, district: 'Coastal Andhra' },
  'Rajahmundry River Hospital': { lat: 17.0689, lng: 81.7771, district: 'Coastal Andhra' },
  'Machilipatnam Port Medical': { lat: 15.7497, lng: 80.1489, district: 'Coastal Andhra' },
  'Eluru District Hospital': { lat: 16.3131, lng: 81.0994, district: 'Coastal Andhra' },
  'Amalapuram Regional Care': { lat: 16.5778, lng: 82.0415, district: 'Coastal Andhra' },
  'Ongole Medical Institute': { lat: 14.6349, lng: 79.9789, district: 'Rayalaseema' },
  'Nellore Emergency & Critical Care': { lat: 14.4426, lng: 79.9864, district: 'Rayalaseema' },
  'Tirupati Ortho & Trauma Hospital': { lat: 13.1939, lng: 79.8965, district: 'Rayalaseema' },
  'Anantapur Heart Center': { lat: 13.1887, lng: 77.6051, district: 'Rayalaseema' },
  'Kurnool Multi-Specialty Hospital': { lat: 15.8281, lng: 78.8353, district: 'Rayalaseema' },
  'Kadapa Regional Medical': { lat: 14.4697, lng: 79.1367, district: 'Rayalaseema' },
  'Chittoor Women & Child Care': { lat: 13.1939, lng: 79.1059, district: 'Rayalaseema' },
  'Nandyal District Hospital': { lat: 14.4838, lng: 78.4867, district: 'Rayalaseema' },
  'Proddatur Eye & ENT Center': { lat: 14.7505, lng: 78.5750, district: 'Rayalaseema' },
  'Hindupur Community Hospital': { lat: 13.8298, lng: 79.4900, district: 'Rayalaseema' },
  'Dharmavaram Diabetes Center': { lat: 13.7465, lng: 79.1267, district: 'Rayalaseema' },
  'Madanapalle Maternity Hospital': { lat: 13.3400, lng: 79.1366, district: 'Rayalaseema' },
}

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

function Emergency() {
  const pushAction = (message) => {
    window.dispatchEvent(new CustomEvent('app-action', { detail: message }))
  }

  // Calculate map coordinates (Andhra Pradesh bounds: roughly 12°N to 19°N, 77°E to 84°E)
  const getMapPosition = (lat, lng) => {
    const mapWidth = 600
    const mapHeight = 500
    const minLat = 12
    const maxLat = 19
    const minLng = 77
    const maxLng = 84
    
    const x = ((lng - minLng) / (maxLng - minLng)) * mapWidth
    const y = mapHeight - ((lat - minLat) / (maxLat - minLat)) * mapHeight
    return { x, y }
  }

  return (
    <div className="emergency-page">
      <div className="emergency-header">
        <div>
          <h2>Emergency Management</h2>
          <p className="panel-subtitle">Real-time hospital location mapping & response</p>
        </div>
        <div className="emergency-search">
          <span className="search-icon" aria-hidden="true" />
          <input type="search" placeholder="Search hospitals..." aria-label="Search" />
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
          <div className="map-canvas" style={{ position: 'relative', width: '100%', height: '500px', background: 'linear-gradient(135deg, #e8f4f8 0%, #f0fbff 100%)', borderRadius: '8px', overflow: 'hidden' }}>
            <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
              {/* Andhra Pradesh map outline (simplified) */}
              <defs>
                <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="2" dy="2" stdDeviation="3" floodOpacity="0.3" />
                </filter>
              </defs>
              
              {/* Coastal Andhra region */}
              <g opacity="0.1" fill="lightblue">
                <path d="M 100 50 L 400 80 L 450 300 L 300 350 Z" />
              </g>
              
              {/* Rayalaseema region */}
              <g opacity="0.1" fill="lightyellow">
                <path d="M 100 50 L 300 350 L 500 400 L 550 200 L 400 80 Z" />
              </g>
              
              {/* Hospital markers */}
              {Object.entries(hospitalLocations).map(([name, coords], idx) => {
                const { x, y } = getMapPosition(coords.lat, coords.lng)
                const isNearby = idx < 5 // First 5 are "nearby" for this example
                
                return (
                  <g key={name}>
                    {/* Hospital location circle */}
                    <circle
                      cx={x}
                      cy={y}
                      r={isNearby ? '8' : '6'}
                      fill={isNearby ? '#ef4444' : '#3b82f6'}
                      stroke="white"
                      strokeWidth="2"
                      filter="url(#shadow)"
                      opacity="0.9"
                    />
                    {/* Hospital label */}
                    <text
                      x={x}
                      y={y - 12}
                      textAnchor="middle"
                      fontSize="11"
                      fill="#0f2241"
                      fontWeight="bold"
                      pointerEvents="none"
                    >
                      {name.split(' ')[0]}
                    </text>
                  </g>
                )
              })}
              
              {/* Ambulance location (emergency marker) */}
              <g>
                <circle cx="250" cy="200" r="12" fill="#fbbf24" stroke="#f59e0b" strokeWidth="2" filter="url(#shadow)" />
                <text x="250" y="206" textAnchor="middle" fontSize="12" fill="white" fontWeight="bold" pointerEvents="none">🚑</text>
              </g>
            </svg>
            
            {/* Map legend */}
            <div style={{ position: 'absolute', bottom: '10px', left: '10px', background: 'white', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444' }} />
                  <span>Nearby Hospital</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#3b82f6' }} />
                  <span>Other Hospital</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ fontSize: '16px' }}>🚑</div>
                  <span>Ambulance</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="panel-header">
            <div>
              <h3>Andhra Pradesh Hospital Network Map</h3>
              <p className="panel-subtitle">20 hospitals across Coastal Andhra & Rayalaseema</p>
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

export default Emergency
