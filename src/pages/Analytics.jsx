import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css'
import 'leaflet-defaulticon-compatibility'

const hospitalLocations = {
  'Vizag City Care Hospital': { lat: 17.6869, lng: 83.2185, district: 'Coastal Andhra', beds: 6, doctors: 4 },
  'Vijayawada Heart Institute': { lat: 16.5062, lng: 80.6480, district: 'Coastal Andhra', beds: 3, doctors: 2 },
  'Guntur Neuro Center': { lat: 16.3067, lng: 80.4365, district: 'Coastal Andhra', beds: 2, doctors: 2 },
  'Kakinada Coastal Medical': { lat: 16.9891, lng: 82.2475, district: 'Coastal Andhra', beds: 4, doctors: 3 },
  'Rajahmundry River Hospital': { lat: 17.0689, lng: 81.7771, district: 'Coastal Andhra', beds: 5, doctors: 3 },
  'Machilipatnam Port Medical': { lat: 15.7497, lng: 80.1489, district: 'Coastal Andhra', beds: 3, doctors: 2 },
  'Eluru District Hospital': { lat: 16.3131, lng: 81.0994, district: 'Coastal Andhra', beds: 4, doctors: 3 },
  'Amalapuram Regional Care': { lat: 16.5778, lng: 82.0415, district: 'Coastal Andhra', beds: 3, doctors: 2 },
  'Ongole Medical Institute': { lat: 14.6349, lng: 79.9789, district: 'Rayalaseema', beds: 2, doctors: 2 },
  'Nellore Emergency & Critical Care': { lat: 14.4426, lng: 79.9864, district: 'Rayalaseema', beds: 5, doctors: 4 },
  'Tirupati Ortho & Trauma Hospital': { lat: 13.1939, lng: 79.8965, district: 'Rayalaseema', beds: 1, doctors: 1 },
  'Anantapur Heart Center': { lat: 13.1887, lng: 77.6051, district: 'Rayalaseema', beds: 6, doctors: 4 },
  'Kurnool Multi-Specialty Hospital': { lat: 15.8281, lng: 78.8353, district: 'Rayalaseema', beds: 3, doctors: 2 },
  'Kadapa Regional Medical': { lat: 14.4697, lng: 79.1367, district: 'Rayalaseema', beds: 4, doctors: 3 },
  'Chittoor Women & Child Care': { lat: 13.1939, lng: 79.1059, district: 'Rayalaseema', beds: 2, doctors: 2 },
  'Nandyal District Hospital': { lat: 14.4838, lng: 78.4867, district: 'Rayalaseema', beds: 3, doctors: 2 },
  'Proddatur Eye & ENT Center': { lat: 14.7505, lng: 78.5750, district: 'Rayalaseema', beds: 2, doctors: 1 },
  'Hindupur Community Hospital': { lat: 13.8298, lng: 79.4900, district: 'Rayalaseema', beds: 4, doctors: 3 },
  'Dharmavaram Diabetes Center': { lat: 13.7465, lng: 79.1267, district: 'Rayalaseema', beds: 3, doctors: 2 },
  'Madanapalle Maternity Hospital': { lat: 13.3400, lng: 79.1366, district: 'Rayalaseema', beds: 2, doctors: 1 },
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
  const mapRef = useRef(null)
  const googleMapRef = useRef(null)
  const [selectedHospital, setSelectedHospital] = useState(null)

  const pushAction = (message) => {
    window.dispatchEvent(new CustomEvent('app-action', { detail: message }))
  }

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapRef.current || googleMapRef.current) return

    const andhraPradeshCenter = [15.4909, 78.6569] // [lat, lng]
    
    // Create map
    const map = L.map(mapRef.current).setView(andhraPradeshCenter, 8)
    
    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map)
    
    googleMapRef.current = map
    
    // Create custom icon for hospitals
    const createHospitalIcon = (district) => {
      const color = district === 'Coastal Andhra' ? '#ef4444' : '#3b82f6'
      return L.divIcon({
        html: `
          <div style="
            background: ${color};
            border: 3px solid white;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            font-weight: bold;
            color: white;
            font-size: 12px;
          ">🏥</div>
        `,
        iconSize: [24, 24],
        className: 'hospital-icon',
      })
    }
    
    // Add hospital markers
    Object.entries(hospitalLocations).forEach(([name, coords]) => {
      const marker = L.marker([coords.lat, coords.lng], {
        icon: createHospitalIcon(coords.district),
      }).addTo(map)
      
      const popupContent = `
        <div style="font-family: Arial; font-size: 12px; min-width: 180px;">
          <h4 style="margin: 0 0 8px 0; color: #0f2241; font-size: 14px;">${name}</h4>
          <div style="border-top: 1px solid #ddd; padding-top: 8px;">
            <p style="margin: 4px 0; color: #555;"><strong>District:</strong> ${coords.district}</p>
            <p style="margin: 4px 0; color: #555;"><strong>Available Beds:</strong> ${coords.beds}</p>
            <p style="margin: 4px 0; color: #555;"><strong>ER Doctors:</strong> ${coords.doctors}</p>
          </div>
        </div>
      `
      
      marker.bindPopup(popupContent, { 
        maxWidth: 280,
        className: 'hospital-popup'
      })
      
      marker.on('click', () => {
        setSelectedHospital(name)
        pushAction(`Selected hospital: ${name}`)
      })
    })
    
    // Add ambulance marker
    const ambulanceIcon = L.divIcon({
      html: `
        <div style="
          background: #fbbf24;
          border: 3px solid #f59e0b;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 10px rgba(0,0,0,0.4);
          font-size: 18px;
          animation: pulse 2s infinite;
        ">🚑</div>
      `,
      iconSize: [32, 32],
      className: 'ambulance-icon',
    })
    
    const ambulanceMarker = L.marker([15.8243, 78.6783], {
      icon: ambulanceIcon,
    }).addTo(map)
    
    ambulanceMarker.bindPopup(`
      <div style="font-family: Arial; font-size: 12px; min-width: 200px;">
        <h4 style="margin: 0 0 8px 0; color: #0f2241; font-size: 14px;">🚑 Emergency Ambulance</h4>
        <div style="border-top: 1px solid #ddd; padding-top: 8px;">
          <p style="margin: 4px 0; color: #555;"><strong>Case:</strong> #108</p>
          <p style="margin: 4px 0; color: #555;"><strong>Incident:</strong> Severe Car Accident</p>
          <p style="margin: 4px 0; color: #555;"><strong>Location:</strong> RTC Complex & MVP Colony</p>
          <p style="margin: 4px 0; color: #555;"><strong>ETA:</strong> 4 Minutes</p>
          <p style="margin: 4px 0; color: #f59e0b;"><strong>Status:</strong> In Transit</p>
        </div>
      </div>
    `, {
      maxWidth: 280,
      className: 'ambulance-popup'
    })
    
    ambulanceMarker.on('click', () => {
      pushAction('Emergency ambulance case #108 - Severe car accident')
    })
    
    // Add custom CSS for animations
    if (!document.querySelector('style[data-map-animations]')) {
      const style = document.createElement('style')
      style.setAttribute('data-map-animations', 'true')
      style.textContent = `
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.8; }
        }
        .ambulance-icon { animation: pulse 2s infinite; }
        .hospital-popup h4 { font-weight: bold; }
        .ambulance-popup h4 { font-weight: bold; }
      `
      document.head.appendChild(style)
    }
    
    return () => {
      map.remove()
      googleMapRef.current = null
    }
  }, [])

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
          <div 
            ref={mapRef}
            className="map-canvas" 
            style={{ 
              width: '100%', 
              height: '500px', 
              borderRadius: '8px', 
              overflow: 'hidden', 
              border: '1px solid #d1e9f6',
              background: '#f0fbff'
            }}
          />
          
          <div className="panel-header">
            <div>
              <h3>Andhra Pradesh Hospital Network Map</h3>
              <p className="panel-subtitle">20 hospitals across Coastal Andhra & Rayalaseema districts {selectedHospital && `- Selected: ${selectedHospital}`}</p>
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
