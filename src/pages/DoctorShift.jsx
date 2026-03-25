import { useContext, useMemo, useState } from 'react'
import { HospitalContext } from '../state/HospitalContext.jsx'

function DoctorShift() {
  const { doctors, hospitals = [] } = useContext(HospitalContext)
  const [selectedHospital, setSelectedHospital] = useState('Vizag City Care Hospital')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  const hospitalList = useMemo(() => {
    const uniqueHospitals = [...new Set(doctors.map((d) => d.hospital).filter(Boolean))]
    return uniqueHospitals.length > 0 ? uniqueHospitals : ['Vizag City Care Hospital', 'Vijayawada Heart Institute', 'Guntur Neuro Center']
  }, [doctors])

  const hospitalDoctors = useMemo(
    () => doctors.filter((doctor) => doctor.hospital === selectedHospital).slice(0, 15),
    [doctors, selectedHospital]
  )

  const shifts = useMemo(
    () => [
      { shift_id: 'morning', shift: 'Morning', department: 'ICU', capacity: 5, specialization: 'Emergency Care' },
      { shift_id: 'afternoon', shift: 'Afternoon', department: 'Surgery', capacity: 4, specialization: 'Surgery' },
      { shift_id: 'night', shift: 'Night', department: 'Emergency', capacity: 3, specialization: 'Emergency Care' },
    ],
    []
  )

  const handleGenerateSchedule = async () => {
    setLoading(true)
    setError('')

    try {
      const payload = {
        hospital: selectedHospital,
        date: selectedDate,
        doctors: hospitalDoctors.map((doctor) => ({
          id: doctor.id,
          name: doctor.name,
          specialization: doctor.specialty || 'General',
          availability: ['morning', 'afternoon', 'night'],
          experience_years: Math.max(1, Math.round((doctor.patients || 1) / 2)),
          available: doctor.status !== 'Off Shift',
          fatigue_level: doctor.status === 'On Duty' ? 0.6 : 0.2,
        })),
        shifts: shifts.map((s) => ({
          shift_id: s.shift_id,
          name: s.shift,
          capacity: s.capacity,
          department: s.department,
        })),
      }

      const response = await fetch('/api/quantum-doctor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error || `Quantum doctor API returned ${response.status}`)
      }

      setResult(data)
    } catch (requestError) {
      setError(requestError.message || 'Unable to generate quantum doctor schedule')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-grid">
      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>🏥 Quantum Doctor Shift Allocation</h3>
            <p className="panel-subtitle">Morning, Afternoon, and Night shift optimization</p>
          </div>
          <button className="primary-button" type="button" onClick={handleGenerateSchedule} disabled={loading || !selectedHospital}>
            {loading ? 'Generating...' : 'Generate Quantum Doctor Schedule'}
          </button>
        </div>

        {/* Hospital & Date Selectors */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>
              Select Hospital
            </label>
            <select
              value={selectedHospital}
              onChange={(e) => setSelectedHospital(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid rgba(76, 141, 255, 0.2)',
                fontSize: '0.95rem',
                backgroundColor: '#fff',
                cursor: 'pointer',
              }}
            >
              {hospitalList.map((hospital) => (
                <option key={hospital} value={hospital}>
                  {hospital}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>
              Schedule Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid rgba(76, 141, 255, 0.2)',
                fontSize: '0.95rem',
              }}
            />
          </div>
        </div>

        <div className="stats-row">
          <div className="stat-card"><p><strong>Hospital:</strong> {selectedHospital}</p></div>
          <div className="stat-card"><p><strong>Date:</strong> {new Date(selectedDate).toLocaleDateString()}</p></div>
          <div className="stat-card"><p><strong>Available Doctors:</strong> {hospitalDoctors.length}</p></div>
          <div className="stat-card"><p><strong>Shifts to Fill:</strong> 3</p></div>
        </div>

        {error ? <p style={{ color: '#b91c1c', marginTop: '0.75rem', fontWeight: '500' }}>⚠️ {error}</p> : null}

        {result?.assignments?.length ? (
          <div style={{ marginTop: '1.5rem' }}>
            <h4 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: '600' }}>Optimized Schedule</h4>
            <div className="card-grid">
              {result.assignments.map((assignment, index) => (
                <article key={`${assignment.shift_id || assignment.shift}-${index}`} className="room-card">
                  <div className="room-head">
                    <h4>
                      {assignment.shift
                        ? String(assignment.shift).charAt(0).toUpperCase() + String(assignment.shift).slice(1)
                        : String(assignment.shift_id || 'unknown').toUpperCase()}{' '}
                      Shift
                    </h4>
                    <span className="badge" style={{ backgroundColor: 'rgba(76, 141, 255, 0.2)', color: '#164a8a' }}>
                      {assignment.department || 'General'}
                    </span>
                  </div>
                  <p className="room-meta">
                    <strong>👨‍⚕️ Doctor:</strong> {assignment.doctor_name || 'Unassigned'}
                  </p>
                  <p className="room-meta">
                    <strong>🎓 Specialization:</strong> {assignment.specialization || '-'}
                  </p>
                  {assignment.experience_years && (
                    <p className="room-meta">
                      <strong>📊 Experience:</strong> {assignment.experience_years} years
                    </p>
                  )}
                  {assignment.status && (
                    <p className="room-meta" style={{ color: assignment.status === 'Assigned' ? '#15803d' : '#b91c1c' }}>
                      <strong>✓ Status:</strong> {assignment.status}
                    </p>
                  )}
                </article>
              ))}
            </div>

            {result.optimization_score !== undefined && (
              <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: 'rgba(76, 141, 255, 0.1)', borderRadius: '8px' }}>
                <p style={{ margin: '0', fontSize: '0.95rem' }}>
                  <strong>Optimization Score:</strong> {(result.optimization_score * 100).toFixed(1)}% |{' '}
                  <strong>Algorithm:</strong> {result.algorithm || 'QAOA + VQE'} |{' '}
                  <strong>Total Assignments:</strong> {result.assigned_count || 0}/{result.total_shifts || 0}
                </p>
              </div>
            )}
          </div>
        ) : null}
      </section>
    </div>
  )
}

export default DoctorShift
