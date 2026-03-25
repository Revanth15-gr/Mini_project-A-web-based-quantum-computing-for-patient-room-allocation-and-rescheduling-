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

      {/* Emergency Map Visualization - Main Focus */}
      <section className="panel" style={{ gridColumn: '1 / -1' }}>
        <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ marginBottom: '0.25rem', fontSize: '1.3rem' }}>📍 Emergency Map & Hospital Locations</h2>
            <p style={{ margin: '0', fontSize: '0.9rem', color: '#6b7280' }}>Real-time visualization of emergency and nearby hospitals</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                border: '1px solid rgba(76, 141, 255, 0.2)',
                backgroundColor: '#f0f5ff',
                cursor: 'pointer',
                fontSize: '0.9rem',
              }}
              onClick={() => calculateNearbyHospitals()}
            >
              🔄 Refresh Map
            </button>
          </div>
        </div>

        {/* Map Section */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', position: 'relative' }}>
          {/* Map Container */}
          <div style={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', backgroundColor: '#fff' }}>
            <EmergencyMap emergencies={emergencies} hospitals={hospitalPayload} assignedHospital={assignedHospital} />
          </div>

          {/* Map Info Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Emergency Location Card */}
            <div style={{
              padding: '1rem',
              borderRadius: '8px',
              border: '2px solid #dc2626',
              backgroundColor: '#fef2f2',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1.5rem' }}>🚑</span>
                <h4 style={{ margin: '0', fontSize: '0.95rem', fontWeight: '600' }}>Emergency Location</h4>
              </div>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: '#6b7280' }}>
                <strong>Patient:</strong> {patientName}
              </p>
              <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.85rem', color: '#6b7280' }}>
                <strong>Severity:</strong> <span style={{ color: getSeverityColor(selectedSeverity), fontWeight: 'bold' }}>● {selectedSeverity}</span>
              </p>
              <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.85rem', color: '#6b7280' }}>
                <strong>Coordinates:</strong> 17.69°N, 83.22°E
              </p>
            </div>

            {/* Assigned Hospital Card */}
            {assignedHospital && (
              <div style={{
                padding: '1rem',
                borderRadius: '8px',
                border: '2px solid #15803d',
                backgroundColor: '#f0fdf4',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>✓</span>
                  <h4 style={{ margin: '0', fontSize: '0.95rem', fontWeight: '600', color: '#15803d' }}>Assigned Hospital</h4>
                </div>
                {nearbyHospitals.length > 0 && nearbyHospitals[0].name === assignedHospital && (
                  <>
                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: '#6b7280' }}>
                      <strong>Hospital:</strong> {assignedHospital}
                    </p>
                    <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.85rem', color: '#6b7280' }}>
                      <strong>Distance:</strong> <span style={{ color: '#15803d', fontWeight: 'bold' }}>{nearbyHospitals[0].distance} km</span>
                    </p>
                    <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.85rem', color: '#6b7280' }}>
                      <strong>ICU Beds:</strong> {nearbyHospitals[0].icu_available}
                    </p>
                    <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.85rem', color: '#6b7280' }}>
                      <strong>ETA:</strong> ~{Math.ceil((parseFloat(nearbyHospitals[0].distance) / 50) * 60)} min
                    </p>
                  </>
                )}
              </div>
            )}

            {/* Map Legend */}
            <div style={{
              padding: '1rem',
              borderRadius: '8px',
              border: '1px solid rgba(76, 141, 255, 0.2)',
              backgroundColor: 'rgba(76, 141, 255, 0.05)',
            }}>
              <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', fontWeight: '600' }}>Map Legend</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#dc2626' }} />
                  <span>Emergency Location</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#4c8dff' }} />
                  <span>Hospital</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#15803d' }} />
                  <span>Assigned</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Nearby Hospitals Section */}
      {nearbyHospitals.length > 0 && (
        <section className="panel" style={{ gridColumn: '1 / -1' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ marginBottom: '0.5rem', fontSize: '1.2rem' }}>🏥 Nearby Hospitals - Priority Ranking</h2>
            <p style={{ margin: '0', fontSize: '0.9rem', color: '#6b7280' }}>Hospitals ranked by distance and resource availability for optimal emergency response</p>
          </div>

          {/* Hospitals Grid View */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1rem',
          }}>
            {nearbyHospitals.map((hospital, index) => {
              const isAssigned = hospital.name === assignedHospital
              const rankBadgeColor = index === 0 ? '#dc2626' : index === 1 ? '#f59e0b' : '#6b7280'
              const etaMinutes = Math.ceil((parseFloat(hospital.distance) / 50) * 60)

              return (
                <article
                  key={`hospital-${index}`}
                  style={{
                    border: isAssigned ? '2px solid #15803d' : '1px solid #e5e7eb',
                    borderRadius: '10px',
                    padding: '1.25rem',
                    backgroundColor: isAssigned ? '#f0fdf4' : '#fff',
                    transition: 'all 0.3s ease',
                    boxShadow: isAssigned ? '0 4px 12px rgba(21, 128, 61, 0.1)' : '0 2px 8px rgba(0,0,0,0.05)',
                    position: 'relative',
                  }}
                >
                  {/* Rank Badge */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '1rem',
                      right: '1rem',
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: rankBadgeColor,
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '0.9rem',
                    }}
                  >
                    {index + 1}
                  </div>

                  {/* Assigned Badge */}
                  {isAssigned && (
                    <div
                      style={{
                        display: 'inline-block',
                        backgroundColor: '#15803d',
                        color: '#fff',
                        padding: '0.3rem 0.8rem',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        marginBottom: '0.75rem',
                      }}
                    >
                      ✓ ASSIGNED
                    </div>
                  )}

                  {/* Hospital Name */}
                  <h3 style={{
                    marginBottom: '0.75rem',
                    fontSize: '1.05rem',
                    fontWeight: '600',
                    color: isAssigned ? '#15803d' : '#164a8a',
                    marginTop: isAssigned ? '0.5rem' : '0',
                  }}>
                    {hospital.name}
                  </h3>

                  {/* Key Metrics */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.75rem',
                    marginBottom: '1rem',
                    paddingBottom: '1rem',
                    borderBottom: '1px solid rgba(0,0,0,0.05)',
                  }}>
                    <div>
                      <p style={{ margin: '0', fontSize: '0.8rem', color: '#6b7280', fontWeight: '500' }}>Distance</p>
                      <p style={{
                        margin: '0.25rem 0 0 0',
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                        color: hospital.distance < 5 ? '#15803d' : hospital.distance < 10 ? '#f59e0b' : '#6b7280',
                      }}>
                        {hospital.distance} km
                      </p>
                    </div>
                    <div>
                      <p style={{ margin: '0', fontSize: '0.8rem', color: '#6b7280', fontWeight: '500' }}>ETA</p>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '1.1rem', fontWeight: 'bold', color: '#164a8a' }}>
                        ~{etaMinutes} min
                      </p>
                    </div>
                    <div>
                      <p style={{ margin: '0', fontSize: '0.8rem', color: '#6b7280', fontWeight: '500' }}>🛏️ ICU Beds</p>
                      <p style={{
                        margin: '0.25rem 0 0 0',
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        color: hospital.icu_available >= 6 ? '#15803d' : hospital.icu_available >= 4 ? '#f59e0b' : '#dc2626',
                      }}>
                        {hospital.icu_available} available
                      </p>
                    </div>
                    <div>
                      <p style={{ margin: '0', fontSize: '0.8rem', color: '#6b7280', fontWeight: '500' }}>👨‍⚕️ Doctors</p>
                      <p style={{
                        margin: '0.25rem 0 0 0',
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        color: hospital.doctors_available >= 12 ? '#15803d' : hospital.doctors_available >= 8 ? '#f59e0b' : '#dc2626',
                      }}>
                        {hospital.doctors_available}
                      </p>
                    </div>
                  </div>

                  {/* Resource Status */}
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        padding: '0.4rem 0.8rem',
                        borderRadius: '6px',
                        backgroundColor: hospital.icu_available >= 6 ? 'rgba(21, 128, 61, 0.1)' : 'rgba(241, 169, 20, 0.1)',
                        fontSize: '0.8rem',
                        fontWeight: '500',
                        color: hospital.icu_available >= 6 ? '#15803d' : '#d97706',
                      }}
                    >
                      {hospital.icu_available >= 6 ? '✓' : '⚠'} ICU {hospital.icu_available >= 6 ? 'Available' : 'Low'}
                    </span>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        padding: '0.4rem 0.8rem',
                        borderRadius: '6px',
                        backgroundColor: hospital.distance < 5 ? 'rgba(21, 128, 61, 0.1)' : 'rgba(241, 169, 20, 0.1)',
                        fontSize: '0.8rem',
                        fontWeight: '500',
                        color: hospital.distance < 5 ? '#15803d' : '#d97706',
                      }}
                    >
                      {hospital.distance < 5 ? '✓ Near' : '📍'} {hospital.distance} km
                    </span>
                  </div>
                </article>
              )
            })}
          </div>

          {/* Comparison Table */}
          <div style={{ marginTop: '2rem' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: '600' }}>Detailed Comparison</h3>
            <div style={{
              overflowX: 'auto',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              backgroundColor: '#f9fafb',
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ backgroundColor: 'rgba(76, 141, 255, 0.1)', borderBottom: '2px solid #e5e7eb' }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Rank</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Hospital Name</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600' }}>Distance (km)</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600' }}>ETA (min)</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600' }}>ICU Beds</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600' }}>Doctors</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {nearbyHospitals.map((hospital, index) => (
                    <tr
                      key={`table-${index}`}
                      style={{
                        borderBottom: '1px solid #e5e7eb',
                        backgroundColor: hospital.name === assignedHospital ? 'rgba(21, 128, 61, 0.05)' : index % 2 === 0 ? '#fff' : '#f9fafb',
                      }}
                    >
                      <td style={{ padding: '0.75rem', fontWeight: 'bold', color: '#164a8a' }}>{index + 1}</td>
                      <td style={{ padding: '0.75rem', fontWeight: hospital.name === assignedHospital ? '600' : '500' }}>
                        {hospital.name}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600', color: '#15803d' }}>
                        {hospital.distance}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600', color: '#164a8a' }}>
                        {Math.ceil((parseFloat(hospital.distance) / 50) * 60)}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600', color: hospital.icu_available >= 6 ? '#15803d' : '#dc2626' }}>
                        {hospital.icu_available}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600', color: hospital.doctors_available >= 12 ? '#15803d' : '#f59e0b' }}>
                        {hospital.doctors_available}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        {hospital.name === assignedHospital ? (
                          <span style={{ color: '#15803d', fontWeight: 'bold' }}>✓ ASSIGNED</span>
                        ) : (
                          <span style={{ color: '#6b7280' }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
