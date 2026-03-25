import { useContext, useMemo, useState } from 'react'
import { HospitalContext } from '../state/HospitalContext.jsx'
import EmergencyMap from '../components/EmergencyMap.jsx'

function Emergency() {
  const { hospitals: allHospitals } = useContext(HospitalContext)
  
  // State management
  const [selectedSeverity, setSelectedSeverity] = useState('Critical')
  const [patientName, setPatientName] = useState('Emergency Patient')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [assignedHospital, setAssignedHospital] = useState(null)
  const [nearbyHospitals, setNearbyHospitals] = useState([])
  const [emailSent, setEmailSent] = useState(false)

  // Mock emergency data with coordinates
  const emergencies = useMemo(
    () => [
      {
        id: 1,
        patientName,
        lat: 17.6868,
        lng: 83.2185,
        severity: selectedSeverity,
        location: 'Downtown',
      },
    ],
    [patientName, selectedSeverity]
  )

  // Mock hospital data with coordinates
  const hospitalPayload = useMemo(() => {
    const vizagHospitals = [
      { name: 'Vizag City Care Hospital', lat: 17.723, lng: 83.301, icu_available: 8, doctors_available: 15 },
      { name: 'Apollo Vizag', lat: 17.705, lng: 83.299, icu_available: 6, doctors_available: 12 },
      { name: 'Guntur Neuro Center', lat: 17.35, lng: 78.58, icu_available: 5, doctors_available: 10 },
      { name: 'Vijayawada Heart Institute', lat: 16.5062, lng: 80.648, icu_available: 7, doctors_available: 14 },
      { name: 'Kakinada Coastal Medical', lat: 16.9891, lng: 82.2475, icu_available: 4, doctors_available: 8 },
    ]
    return vizagHospitals.slice(0, 5)
  }, [])

  // Calculate distance using Haversine formula (mock implementation)
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371 // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLng = ((lng2 - lng1) * Math.PI) / 180
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return (R * c).toFixed(2)
  }

  // Calculate nearby hospitals
  const calculateNearbyHospitals = () => {
    const em = emergencies[0]
    const nearby = hospitalPayload
      .map((hospital) => ({
        ...hospital,
        distance: calculateDistance(em.lat, em.lng, hospital.lat, hospital.lng),
      }))
      .sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance))
    setNearbyHospitals(nearby)
    return nearby
  }

  const handleAssignEmergencyHospital = async () => {
    setLoading(true)
    setError('')
    setEmailSent(false)

    try {
      // Calculate nearby hospitals first
      const nearby = calculateNearbyHospitals()

      const payload = {
        emergencies: emergencies.map((em) => ({
          patient_id: `EM-${Date.now()}`,
          patient_name: em.patientName,
          location: em.location,
          severity: em.severity.toLowerCase(),
          latitude: em.lat,
          longitude: em.lng,
        })),
        hospitals: nearby,
      }

      const response = await fetch('/api/quantum-emergency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error || `Quantum emergency API returned ${response.status}`)
      }

      setResult(data)

      // Set assigned hospital (first from result or nearest)
      if (data.assignments?.length > 0) {
        setAssignedHospital(data.assignments[0].hospital || nearby[0].name)
      } else {
        setAssignedHospital(nearby[0].name)
      }

      // Simulate email sending
      setTimeout(() => {
        setEmailSent(true)
      }, 1000)
    } catch (requestError) {
      setError(requestError.message || 'Unable to assign emergency hospital')
    } finally {
      setLoading(false)
    }
  }

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return '#dc2626'
      case 'high':
        return '#ea580c'
      case 'medium':
        return '#f59e0b'
      default:
        return '#3b82f6'
    }
  }

  return (
    <div className="page-grid">
      {/* Main Control Panel */}
      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>🚑 Quantum Emergency Allocation Command Center</h3>
            <p className="panel-subtitle">Real-time emergency routing with quantum optimization</p>
          </div>
          <button className="primary-button" type="button" onClick={handleAssignEmergencyHospital} disabled={loading}>
            {loading ? 'Assigning...' : 'Assign Nearest Hospital'}
          </button>
        </div>

        {/* Emergency Input Section */}
        <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'rgba(76, 141, 255, 0.05)', borderRadius: '8px', border: '1px solid rgba(76, 141, 255, 0.2)' }}>
          <h4 style={{ marginBottom: '1rem', fontSize: '0.95rem', fontWeight: '600' }}>Emergency Details</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '500' }}>
                Patient Name
              </label>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="Enter patient name"
                style={{
                  width: '100%',
                  padding: '0.6rem',
                  borderRadius: '6px',
                  border: '1px solid rgba(76, 141, 255, 0.2)',
                  fontSize: '0.9rem',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '500' }}>
                Severity Level
              </label>
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.6rem',
                  borderRadius: '6px',
                  border: '1px solid rgba(76, 141, 255, 0.2)',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                }}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="stats-row">
          <div className="stat-card">
            <p>
              <strong>Severity:</strong> <span style={{ color: getSeverityColor(selectedSeverity) }}>●</span> {selectedSeverity}
            </p>
          </div>
          <div className="stat-card">
            <p>
              <strong>Hospitals Available:</strong> {hospitalPayload.length}
            </p>
          </div>
          <div className="stat-card">
            <p>
              <strong>Nearby Count:</strong> {nearbyHospitals.length}
            </p>
          </div>
          <div className="stat-card">
            <p>
              <strong>Assigned:</strong> {assignedHospital ? '✓ Yes' : '✗ No'}
            </p>
          </div>
        </div>

        {error && <p style={{ color: '#b91c1c', marginTop: '0.75rem', fontWeight: '500' }}>⚠️ {error}</p>}

        {emailSent && (
          <p style={{ color: '#15803d', marginTop: '0.75rem', fontWeight: '500' }}>
            ✓ Email notification sent to assigned hospital
          </p>
        )}
      </section>

      {/* Emergency Map */}
      <section className="panel">
        <h3 style={{ marginBottom: '1rem' }}>📍 Emergency Map & Hospital Locations</h3>
        <EmergencyMap emergencies={emergencies} hospitals={hospitalPayload} assignedHospital={assignedHospital} />
      </section>

      {/* Nearby Hospitals Section */}
      {nearbyHospitals.length > 0 && (
        <section className="panel">
          <h3 style={{ marginBottom: '1rem' }}>🏥 Nearby Hospitals</h3>
          <div className="card-grid">
            {nearbyHospitals.map((hospital, index) => (
              <article key={`hospital-${index}`} className="room-card" style={{
                borderLeft: hospital.name === assignedHospital ? '4px solid #15803d' : '4px solid #e5e7eb',
                backgroundColor: hospital.name === assignedHospital ? 'rgba(21, 128, 61, 0.05)' : '#fff',
              }}>
                <div className="room-head">
                  <h4>{hospital.name}</h4>
                  <span className="badge" style={{ backgroundColor: hospital.name === assignedHospital ? '#15803d' : '#4c8dff', color: '#fff' }}>
                    {hospital.distance} km
                  </span>
                </div>
                <p className="room-meta"><strong>🛏️ ICU Available:</strong> {hospital.icu_available} beds</p>
                <p className="room-meta"><strong>👨‍⚕️ Doctors:</strong> {hospital.doctors_available} available</p>
                {hospital.name === assignedHospital && (
                  <p className="room-meta" style={{ color: '#15803d', fontWeight: 'bold' }}>✓ ASSIGNED HOSPITAL</p>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Optimization Result */}
      {result?.assignments?.length && (
        <section className="panel">
          <h3 style={{ marginBottom: '1rem' }}>⚡ Quantum Optimization Result</h3>
          <div className="card-grid">
            {result.assignments.map((item, index) => (
              <article key={`result-${index}`} className="room-card">
                <div className="room-head">
                  <h4>Emergency Case #{index + 1}</h4>
                  <span className="badge">Optimized</span>
                </div>
                <p className="room-meta"><strong>Hospital:</strong> {item.hospital}</p>
                <p className="room-meta"><strong>Distance:</strong> {item.distance_km ?? '-'} km</p>
                <p className="room-meta"><strong>Algorithm:</strong> {result.algorithm || 'QAOA + Grover'}</p>
                {result.optimization_score !== undefined && (
                  <p className="room-meta"><strong>Optimization Score:</strong> {(result.optimization_score * 100).toFixed(1)}%</p>
                )}
              </article>
            ))}
          </div>

          {result.optimization_score !== undefined && (
            <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'rgba(76, 141, 255, 0.1)', borderRadius: '8px' }}>
              <p style={{ margin: '0', fontSize: '0.9rem' }}>
                <strong>📊 Algorithm:</strong> {result.algorithm || 'QAOA Emergency Optimization'} | <strong>Quality:</strong> {(result.optimization_score * 100).toFixed(1)}% | <strong>Cases:</strong> {result.assigned_count}/{result.total_cases}
              </p>
            </div>
          )}
        </section>
      )}
    </div>
  )
}

export default Emergency
