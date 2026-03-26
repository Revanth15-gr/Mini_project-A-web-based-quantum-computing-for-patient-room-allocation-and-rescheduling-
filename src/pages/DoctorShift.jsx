import { useContext, useEffect, useMemo, useState } from 'react'
import { HospitalContext } from '../state/HospitalContext.jsx'

const DOCTOR_SHIFT_CACHE_KEY = 'quantumDoctorShiftSchedules'

function readDoctorShiftCache() {
  try {
    const parsed = JSON.parse(localStorage.getItem(DOCTOR_SHIFT_CACHE_KEY) || '{}')
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function buildScheduleCacheKey(hospital, date) {
  if (!hospital || !date) {
    return ''
  }
  return `${hospital}::${date}`
}

function isFallbackDoctorResult(payload) {
  const algorithm = String(payload?.algorithm || payload?.solver || '').toLowerCase()
  return algorithm.includes('local-fallback')
}

function DoctorShift() {
  const { doctors, hospitals = [] } = useContext(HospitalContext)
  const [selectedHospital, setSelectedHospital] = useState('Vizag City Care Hospital')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [scheduleSource, setScheduleSource] = useState('')

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

  const cacheKey = useMemo(
    () => buildScheduleCacheKey(selectedHospital, selectedDate),
    [selectedHospital, selectedDate]
  )

  const algorithmUsed = useMemo(() => {
    if (!result) {
      return 'Not generated'
    }

    if (Array.isArray(result.pipeline) && result.pipeline.length) {
      return result.pipeline.join(' + ')
    }

    if (Array.isArray(result.raw?.pipeline) && result.raw.pipeline.length) {
      return result.raw.pipeline.join(' + ')
    }

    if (Array.isArray(result.raw?.result?.pipeline) && result.raw.result.pipeline.length) {
      return result.raw.result.pipeline.join(' + ')
    }

    return result.algorithm || result.solver || 'QAOA + VQE + Quantum Annealing'
  }, [result])

  const totalAssigned = useMemo(() => {
    if (!result?.assignments?.length) {
      return Number(result?.assigned_count || 0)
    }

    if (Number.isFinite(Number(result?.assigned_count))) {
      return Number(result.assigned_count)
    }

    return result.assignments.filter((item) => item?.doctor_id || item?.doctor_name || item?.doctor).length
  }, [result])

  const totalShifts = useMemo(() => {
    if (Number.isFinite(Number(result?.total_shifts))) {
      return Number(result.total_shifts)
    }
    return shifts.length
  }, [result, shifts.length])

  useEffect(() => {
    setError('')

    if (!cacheKey) {
      setResult(null)
      setScheduleSource('')
      return
    }

    const cache = readDoctorShiftCache()
    const cachedItem = cache[cacheKey]

    if (cachedItem?.result && !isFallbackDoctorResult(cachedItem.result)) {
      setResult(cachedItem.result)
      setScheduleSource('cached')
      return
    }

    setResult(null)
    setScheduleSource('')
  }, [cacheKey])

  const handleGenerateSchedule = async () => {
    if (cacheKey) {
      const cache = readDoctorShiftCache()
      const cachedItem = cache[cacheKey]
      if (cachedItem?.result && !isFallbackDoctorResult(cachedItem.result)) {
        setResult(cachedItem.result)
        setScheduleSource('cached')
        setError('')
        return
      }
    }

    setLoading(true)
    setError('')

    try {
      const effectiveDate = selectedDate || new Date().toISOString().split('T')[0]
      const payload = {
        hospital: selectedHospital,
        date: effectiveDate,
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
      if (cacheKey && !isFallbackDoctorResult(data)) {
        const cache = readDoctorShiftCache()
        cache[cacheKey] = {
          generatedAt: new Date().toISOString(),
          result: data,
        }
        localStorage.setItem(DOCTOR_SHIFT_CACHE_KEY, JSON.stringify(cache))
        setScheduleSource('fresh')
      } else {
        setScheduleSource('fresh')
      }
    } catch (requestError) {
      setError(requestError.message || 'Unable to generate quantum doctor schedule')
    } finally {
      setLoading(false)
    }
  }

  const handleResetScheduleForDate = () => {
    if (!cacheKey) {
      setResult(null)
      setScheduleSource('')
      setError('')
      return
    }

    const cache = readDoctorShiftCache()
    if (cache[cacheKey]) {
      delete cache[cacheKey]
      localStorage.setItem(DOCTOR_SHIFT_CACHE_KEY, JSON.stringify(cache))
    }

    setResult(null)
    setScheduleSource('')
    setError('Cached schedule cleared. Click Generate to create a fresh quantum schedule.')
  }

  return (
    <div className="page-grid">
      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>🏥 Quantum Doctor Shift Allocation</h3>
            <p className="panel-subtitle">Morning, Afternoon, and Night shift optimization</p>
          </div>
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <button
              className="outline-button"
              type="button"
              onClick={handleResetScheduleForDate}
              disabled={loading}
            >
              Reset Schedule for this Date
            </button>
            <button className="primary-button" type="button" onClick={handleGenerateSchedule} disabled={loading || !selectedHospital}>
              {loading ? 'Generating...' : 'Generate Quantum Doctor Schedule'}
            </button>
          </div>
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
          <div className="stat-card"><p><strong>Date:</strong> {selectedDate ? new Date(selectedDate).toLocaleDateString() : 'Not selected (fresh each run)'}</p></div>
          <div className="stat-card"><p><strong>Available Doctors:</strong> {hospitalDoctors.length}</p></div>
          <div className="stat-card"><p><strong>Shifts to Fill:</strong> 3</p></div>
        </div>

        {error ? <p style={{ color: '#b91c1c', marginTop: '0.75rem', fontWeight: '500' }}>⚠️ {error}</p> : null}
        {scheduleSource === 'cached' ? (
          <p style={{ color: '#1d4ed8', marginTop: '0.75rem', fontWeight: '500' }}>
            Reusing previously generated schedule for this hospital and date.
          </p>
        ) : null}
        {scheduleSource === 'fresh' ? (
          <p style={{ color: '#15803d', marginTop: '0.75rem', fontWeight: '500' }}>
            Fresh quantum schedule generated.
          </p>
        ) : null}

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

            <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: 'rgba(76, 141, 255, 0.1)', borderRadius: '8px' }}>
              <p style={{ margin: '0', fontSize: '0.95rem' }}>
                {result.optimization_score !== undefined ? (
                  <>
                    <strong>Optimization Score:</strong> {(result.optimization_score * 100).toFixed(1)}% |{' '}
                  </>
                ) : null}
                <strong>Algorithm:</strong> {algorithmUsed} |{' '}
                <strong>Total Assignments:</strong> {totalAssigned}/{totalShifts}
              </p>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  )
}

export default DoctorShift
