import { useContext, useMemo, useState } from 'react'
import { HospitalContext } from '../state/HospitalContext.jsx'

function DoctorShift() {
  const { doctors, selectedHospital } = useContext(HospitalContext)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  const hospitalDoctors = useMemo(
    () => doctors.filter((doctor) => doctor.hospital === selectedHospital).slice(0, 15),
    [doctors, selectedHospital]
  )

  const shifts = useMemo(
    () => [
      { shift: 'morning', department: 'ICU', specialization: 'Emergency Care' },
      { shift: 'afternoon', department: 'Surgery', specialization: 'Surgery' },
      { shift: 'night', department: 'Emergency', specialization: 'Emergency Care' },
    ],
    []
  )

  const handleGenerateSchedule = async () => {
    setLoading(true)
    setError('')

    try {
      const payload = {
        doctors: hospitalDoctors.map((doctor) => ({
          id: doctor.id,
          name: doctor.name,
          specialization: doctor.specialty,
          availability: ['morning', 'afternoon', 'night'],
          experience: Math.max(1, Math.round((doctor.patients || 1) / 2)),
          available: doctor.status !== 'Off Shift',
          fatigue_score: doctor.status === 'On Duty' ? 0.6 : 0.2,
        })),
        shifts,
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
            <h3>Quantum Doctor Shift Allocation</h3>
            <p className="panel-subtitle">Morning, Afternoon, and Night shift optimization</p>
          </div>
          <button className="primary-button" type="button" onClick={handleGenerateSchedule} disabled={loading}>
            {loading ? 'Generating...' : 'Generate Quantum Doctor Schedule'}
          </button>
        </div>

        <div className="stats-row">
          <div className="stat-card"><p>Hospital: {selectedHospital}</p></div>
          <div className="stat-card"><p>Doctors considered: {hospitalDoctors.length}</p></div>
          <div className="stat-card"><p>Shifts: 3 (Morning/Afternoon/Night)</p></div>
        </div>

        {error ? <p style={{ color: '#b91c1c', marginTop: '0.75rem' }}>{error}</p> : null}

        {result?.assignments?.length ? (
          <div className="card-grid" style={{ marginTop: '1rem' }}>
            {result.assignments.map((assignment, index) => (
              <article key={`${assignment.shift}-${index}`} className="room-card">
                <div className="room-head">
                  <h4>{String(assignment.shift || 'unknown').toUpperCase()} Shift</h4>
                  <span className="badge">{assignment.department || 'General'}</span>
                </div>
                <p className="room-meta"><strong>Doctor:</strong> {assignment.doctor_name || 'Unassigned'}</p>
                <p className="room-meta"><strong>Specialization:</strong> {assignment.specialization || '-'}</p>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  )
}

export default DoctorShift
