import { useContext, useMemo, useState } from 'react'
import { HospitalContext } from '../state/HospitalContext.jsx'

function Emergency() {
  const { hospitals, selectedHospital } = useContext(HospitalContext)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  const hospitalPayload = useMemo(
    () =>
      hospitals.slice(0, 3).map((name, index) => ({
        name,
        icu_available: 5 + (2 - index) * 2,
        doctors_available: 12 - index * 2,
        distance_km: 3 + index * 4,
      })),
    [hospitals]
  )

  const handleAssignEmergencyHospital = async () => {
    setLoading(true)
    setError('')

    try {
      const payload = {
        emergencies: [
          {
            patient_id: `EM-${Date.now()}`,
            location: 'Urban Zone',
            severity: 'high',
            required_department: 'Emergency',
            preferred_hospital: selectedHospital,
          },
        ],
        hospitals: hospitalPayload,
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
    } catch (requestError) {
      setError(requestError.message || 'Unable to assign emergency hospital')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-grid">
      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>Quantum Emergency Allocation</h3>
            <p className="panel-subtitle">Assign emergency cases to the best-fit hospital</p>
          </div>
          <button className="primary-button" type="button" onClick={handleAssignEmergencyHospital} disabled={loading}>
            {loading ? 'Assigning...' : 'Assign Emergency Hospital'}
          </button>
        </div>

        <div className="stats-row">
          <div className="stat-card"><p>Hospitals considered: {hospitalPayload.length}</p></div>
          <div className="stat-card"><p>Selected hub: {selectedHospital}</p></div>
          <div className="stat-card"><p>Mode: Quantum Emergency Routing</p></div>
        </div>

        {error ? <p style={{ color: '#b91c1c', marginTop: '0.75rem' }}>{error}</p> : null}

        {result?.assignments?.length ? (
          <div className="card-grid" style={{ marginTop: '1rem' }}>
            {result.assignments.map((item, index) => (
              <article key={`${item.patient_id || index}`} className="room-card">
                <div className="room-head">
                  <h4>Emergency Case #{index + 1}</h4>
                  <span className="badge">{item.hospital || 'Unassigned'}</span>
                </div>
                <p className="room-meta"><strong>Distance:</strong> {item.distance_km ?? '-'} km</p>
                <p className="room-meta"><strong>ICU Available:</strong> {item.icu_available ?? '-'}</p>
                <p className="room-meta"><strong>Doctor Support:</strong> {item.doctor_support ?? '-'}</p>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  )
}

export default Emergency
