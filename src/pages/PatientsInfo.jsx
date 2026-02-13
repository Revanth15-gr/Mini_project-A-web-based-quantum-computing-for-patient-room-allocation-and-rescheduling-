import { useContext, useMemo, useState } from 'react'
import { HospitalContext } from '../state/HospitalContext.jsx'

function PatientsInfo() {
  const pushAction = (message) => {
    window.dispatchEvent(new CustomEvent('app-action', { detail: message }))
  }

  const [showForm, setShowForm] = useState(false)
  const { rooms, patients, addPatient } = useContext(HospitalContext)
  const [formData, setFormData] = useState({
    name: '',
    status: 'Stable',
    care: 'General Medicine',
    next: '9:30 AM',
  })

  const availableRooms = useMemo(() => {
    const occupied = new Set(patients.map((patient) => patient.room))
    return rooms.filter((room) => !occupied.has(room.name))
  }, [patients, rooms])

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = (event) => {
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
    }

    const assignedRoom = addPatient(newPatient)
    setFormData({ name: '', status: 'Stable', care: 'General Medicine', next: '9:30 AM' })
    setShowForm(false)
    pushAction(`Added ${newPatient.name} • Room: ${assignedRoom}`)
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
                  `Patient: ${patient.name} | Status: ${patient.status} | Room: ${patient.room}`
                )
              }
              style={{ cursor: 'pointer' }}
            >
              <span className="table-strong">{patient.name}</span>
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
            <p className="panel-subtitle">Prioritized by acuity and distance</p>
          </div>
          <button
            className="outline-button"
            type="button"
            onClick={() => pushAction('Running quantum rescheduling queue...')}
          >
            Run Queue
          </button>
        </div>
        <div className="queue-list">
          {['Imaging conflict', 'Isolation transfer', 'Procedure prep'].map(
            (item) => (
              <div key={item} className="queue-item">
                <div className="queue-pulse" aria-hidden="true" />
                <div>
                  <p className="queue-title">{item}</p>
                  <p className="queue-meta">2 constraints active</p>
                </div>
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() => pushAction(`Reviewing queue item: ${item}`)}
                >
                  Review
                </button>
              </div>
            ),
          )}
        </div>
      </section>
    </div>
  )
}

export default PatientsInfo
