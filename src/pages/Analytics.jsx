import { useEffect, useRef, useState } from 'react'

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

  // Initialize Google Map
  useEffect(() => {
    const loadGoogleMap = async () => {
      // Load Google Maps API
      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyDZlTKZF6lPSKnPyEQQHJqFhKDU-jN4Z0g`
      script.async = true
      script.defer = true
      
      script.onload = () => {
        if (mapRef.current && window.google) {
          const andhraPradeshCenter = { lat: 15.4909, lng: 78.6569 }
          
          const map = new window.google.maps.Map(mapRef.current, {
            zoom: 8,
            center: andhraPradeshCenter,
            mapTypeId: 'roadmap',
            styles: [
              {
                featureType: 'all',
                elementType: 'labels.text.fill',
                stylers: [{ color: '#0f2241' }],
              },
              {
                featureType: 'water',
                elementType: 'geometry',
                stylers: [{ color: '#c6e4f0' }],
              },
              {
                featureType: 'land',
                elementType: 'geometry',
                stylers: [{ color: '#f5f5f5' }],
              },
            ],
          })
          
          googleMapRef.current = map
          
          // Add hospital markers
          Object.entries(hospitalLocations).forEach(([name, coords]) => {
            const markerIcon = {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: coords.district === 'Coastal Andhra' ? '#ef4444' : '#3b82f6',
              fillOpacity: 0.8,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            }
            
            const marker = new window.google.maps.Marker({
              position: { lat: coords.lat, lng: coords.lng },
              map: map,
              title: name,
              icon: markerIcon,
            })
            
            // Add info window
            const infoWindow = new window.google.maps.InfoWindow({
              content: `
                <div style="padding: 10px; font-family: Arial; font-size: 12px;">
                  <h4 style="margin: 0 0 8px 0; color: #0f2241;">${name}</h4>
                  <p style="margin: 4px 0; color: #555;">District: ${coords.district}</p>
                  <p style="margin: 4px 0; color: #555;">Available Beds: ${coords.beds}</p>
                  <p style="margin: 4px 0; color: #555;">ER Doctors: ${coords.doctors}</p>
                </div>
              `,
            })
            
            marker.addListener('click', () => {
              infoWindow.open(map, marker)
              setSelectedHospital(name)
              pushAction(`Selected hospital: ${name}`)
            })
          })
          
          // Add ambulance marker
          const ambulanceIcon = {
            path: 'M 0 0 L -2 4 L -0.5 6 L 0.5 6 L 2 4 Z',
            scale: 3,
            fillColor: '#fbbf24',
            fillOpacity: 1,
            strokeColor: '#f59e0b',
            strokeWeight: 1,
            rotation: 0,
          }
          
          const ambulanceMarker = new window.google.maps.Marker({
            position: { lat: 15.8243, lng: 78.6783 },
            map: map,
            title: 'Ambulance - Case #108',
            icon: ambulanceIcon,
          })
          
          const ambulanceInfoWindow = new window.google.maps.InfoWindow({
            content: `
              <div style="padding: 10px; font-family: Arial; font-size: 12px;">
                <h4 style="margin: 0 0 8px 0; color: #0f2241;">🚑 Ambulance - Case #108</h4>
                <p style="margin: 4px 0; color: #555;">Status: Arriving in 4 Min</p>
                <p style="margin: 4px 0; color: #555;">Case: Severe Car Accident</p>
                <p style="margin: 4px 0; color: #555;">Location: RTC Complex & MVP Colony</p>
              </div>
            `,
          })
          
          ambulanceMarker.addListener('click', () => {
            ambulanceInfoWindow.open(map, ambulanceMarker)
          })
        }
      }
      
      document.head.appendChild(script)
    }

    loadGoogleMap()

    return () => {
      // Cleanup
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
              position: 'relative', 
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
