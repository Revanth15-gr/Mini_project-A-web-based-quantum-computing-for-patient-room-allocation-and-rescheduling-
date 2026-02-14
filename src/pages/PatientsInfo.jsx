import { useContext, useEffect, useMemo, useState } from 'react'
import { HospitalContext } from '../state/HospitalContext.jsx'

function PatientsInfo() {
  const pushAction = (message) => {
    window.dispatchEvent(new CustomEvent('app-action', { detail: message }))
  }

  const [showForm, setShowForm] = useState(false)
  const [isRescheduling, setIsRescheduling] = useState(false)
  const [reschedulingResult, setReschedulingResult] = useState(null)
  const { rooms, patients, addPatient, hospitals, selectedHospital, setSelectedHospital, addNotification } = useContext(HospitalContext)
  const [formData, setFormData] = useState({
    name: '',
    status: 'Stable',
    care: 'General Medicine',
    next: '9:30 AM',
    hospital: selectedHospital,
  })

  // Sync form hospital with global selected hospital
  useEffect(() => {
    setFormData((current) => ({ ...current, hospital: selectedHospital }))
  }, [selectedHospital])

  const availableRooms = useMemo(() => {
    const occupied = new Set(
      patients
        .filter((p) => p.hospital === formData.hospital)
        .map((p) => `${p.hospital}-${p.room}`)
    )
    return rooms.filter(
      (room) =>
        room.hospital === formData.hospital &&
        !occupied.has(`${room.hospital}-${room.name}`)
    )
  }, [patients, rooms, formData.hospital])

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
    // Sync hospital selection with global state
    if (name === 'hospital') {
      setSelectedHospital(value)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!formData.name.trim()) {
      pushAction('Patient name is required')
      return
    }

    const newPatient = {
      name: formData.name.trim(),
      status: formData.status,
      care: formData.care,
      next: formData.next,
      hospital: formData.hospital,
    }

    const assignedRoom = await addPatient(newPatient)
    setFormData({
      name: '',
      status: 'Stable',
      care: 'General Medicine',
      next: '9:30 AM',
      hospital: selectedHospital,
    })
    setShowForm(false)
    pushAction(
      `Added ${newPatient.name} • ${formData.hospital} • Room: ${assignedRoom}`
    )
  }

  const handleRescheduling = async () => {
    setIsRescheduling(true)
    setReschedulingResult(null)
    pushAction('Starting quantum optimization rescheduling...')
    addNotification('Running QAOA optimization for patient rescheduling...', 'info')

    try {
      // Get patients for the selected hospital
      const hospitalPatients = patients.filter((p) => p.hospital === selectedHospital)
      const hospitalRooms = rooms.filter((r) => r.hospital === selectedHospital)

      if (hospitalPatients.length === 0) {
        addNotification(`No patients found in ${selectedHospital}`, 'error')
        setIsRescheduling(false)
        return
      }

      // QAOA quantum simulation limited to 8 patients/rooms due to memory constraints
      const maxQaoaSize = 8
      const patientsForQaoa = hospitalPatients.slice(0, maxQaoaSize).map((p, i) => ({
        id: p.name || `patient-${i}`,
        priority: 1.2 - i * 0.05,
      }))
      const roomsForQaoa = hospitalRooms.slice(0, maxQaoaSize).map((r) => r.name)
      
      if (hospitalPatients.length > maxQaoaSize) {
        addNotification(
          `Optimizing first ${maxQaoaSize} of ${hospitalPatients.length} patients (quantum simulation limit)`,
          'info'
        )
      }

      console.log('QAOA Rescheduling Request:', { patients: patientsForQaoa, rooms: roomsForQaoa })

      const response = await fetch('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patients: patientsForQaoa,
          rooms: roomsForQaoa,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('QAOA Rescheduling Error:', errorData)
        throw new Error(errorData.detail || `API returned ${response.status}`)
      }

      const result = await response.json()
      console.log('QAOA Rescheduling Result:', result)
      setReschedulingResult(result)
      addNotification('QAOA rescheduling completed successfully', 'success')
      pushAction(
        `Rescheduling complete: ${hospitalPatients.length} patients optimized`
      )
    } catch (error) {
      console.error('Rescheduling error:', error)
      addNotification(`Rescheduling failed: ${error.message}`, 'error')
      pushAction(`Rescheduling error: ${error.message}`)
    } finally {
      setIsRescheduling(false)
    }
  }

  return (
    <div className="page-grid">
      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>Patient Overview</h3>
            <p className="panel-subtitle">Live census with quantum priority tags</p>
          </div>
          <button
            className="primary-button"
            type="button"
            onClick={() => setShowForm((current) => !current)}
          >
            {showForm ? 'Close Form' : 'Add Patient'}
          </button>
        </div>
        {showForm ? (
          <form className="patient-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <label>
                Hospital
                <select name="hospital" value={formData.hospital} onChange={handleChange}>
                  {hospitals.map((hospital) => (
                    <option key={hospital} value={hospital}>
                      {hospital}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Patient Name
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter patient name"
                  required
                />
              </label>
              <label>
                Status
                <select name="status" value={formData.status} onChange={handleChange}>
                  <option>Stable</option>
                  <option>Observation</option>
                  <option>Imaging</option>
                  <option>Recovering</option>
                  <option>Critical</option>
                </select>
              </label>
              <label>
                Care Path
                <select name="care" value={formData.care} onChange={handleChange}>
                  <option>General Medicine</option>
                  <option>Cardiology</option>
                  <option>Neurology</option>
                  <option>Orthopedics</option>
                  <option>Radiology</option>
                </select>
              </label>
              <label>
                Next Check
                <input
                  type="text"
                  name="next"
                  value={formData.next}
                  onChange={handleChange}
                  placeholder="9:30 AM"
                />
              </label>
            </div>
            <div className="form-footer">
              <p className="panel-subtitle">
                Auto-assigning room: {availableRooms[0]?.name || 'No rooms available'}
              </p>
              <button className="primary-button" type="submit">
                Save & Allocate
              </button>
            </div>
          </form>
        ) : null}
        <div className="table">
          <div className="table-row table-head">
            <span>Patient</span>
            <span>Hospital</span>
            <span>Status</span>
            <span>Room</span>
            <span>Care Path</span>
            <span>Next Check</span>
          </div>
          {patients.map((patient) => (
            <div
              key={patient.name}
              className="table-row"
              onClick={() =>
                pushAction(
                  `Patient: ${patient.name} | Hospital: ${patient.hospital} | Status: ${patient.status} | Room: ${patient.room}`
                )
              }
              style={{ cursor: 'pointer' }}
            >
              <span className="table-strong">{patient.name}</span>
              <span style={{ fontSize: '0.85rem' }}>{patient.hospital}</span>
              <span className="badge">{patient.status}</span>
              <span>{patient.room}</span>
              <span>{patient.care}</span>
              <span>{patient.next}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>Quantum Rescheduling Queue</h3>
            <p className="panel-subtitle">
              Optimize patient assignments for {selectedHospital}
            </p>
          </div>
          <button
            className="outline-button"
            type="button"
            onClick={handleRescheduling}
            disabled={isRescheduling || patients.filter((p) => p.hospital === selectedHospital).length === 0}
          >
            {isRescheduling ? 'Optimizing...' : 'Run Optimization'}
          </button>
        </div>
        {isRescheduling ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <div
              style={{
                display: 'inline-block',
                width: '40px',
                height: '40px',
                border: '4px solid rgba(15, 34, 65, 0.1)',
                borderTopColor: '#0f2241',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }}
            />
            <p style={{ marginTop: '1rem', color: '#666' }}>
              Running QAOA optimization...
            </p>
          </div>
        ) : reschedulingResult ? (
          <div style={{ padding: '1.5rem' }}>
            <div
              style={{
                background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                color: '#fff',
                padding: '1rem',
                borderRadius: '8px',
                marginBottom: '1rem',
              }}
            >
              <strong>Optimization Complete</strong>
              <p style={{ fontSize: '0.9rem', marginTop: '0.5rem', opacity: 0.95 }}>
                {reschedulingResult.message || 'Patient assignments optimized successfully'}
              </p>
            </div>
            {reschedulingResult.assignments && (
              <div>
                <h4 style={{ marginBottom: '0.75rem', fontSize: '0.95rem' }}>
                  Optimized Assignments:
                </h4>
                <div className="queue-list">
                  {Object.entries(reschedulingResult.assignments).slice(0, 5).map(([patient, room]) => (
                    <div key={patient} className="queue-item">
                      <div className="queue-pulse" aria-hidden="true" />
                      <div>
                        <p className="queue-title">{patient}</p>
                        <p className="queue-meta">Assigned to {room}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="queue-list">
            {patients.filter((p) => p.hospital === selectedHospital).length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                No patients in {selectedHospital} to optimize
              </div>
            ) : (
              <div style={{ padding: '1.5rem', color: '#666' }}>
                <p>
                  {patients.filter((p) => p.hospital === selectedHospital).length} patients ready for optimization
                </p>
                <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
                  Click "Run Optimization" to use quantum algorithms for optimal room assignments
                </p>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  )
}

export default PatientsInfo
