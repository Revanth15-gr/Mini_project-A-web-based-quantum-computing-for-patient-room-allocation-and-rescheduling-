import { useContext, useMemo, useState } from 'react'
import { HospitalContext } from '../state/HospitalContext.jsx'

function Rooms() {
  const pushAction = (message) => {
    window.dispatchEvent(new CustomEvent('app-action', { detail: message }))
  }

  const { rooms, patients, hospitals, selectedHospital, setSelectedHospital } = useContext(HospitalContext)

  const roomView = useMemo(() => {
    return rooms
      .filter((room) => room.hospital === selectedHospital)
      .map((room) => {
        const patient = patients.find(
          (p) => p.room === room.name && p.hospital === room.hospital
        )
        const isOccupied = !!patient
        return {
          ...room,
          status: isOccupied ? 'Occupied' : 'Available',
          patient: patient || null,
        }
      })
  }, [rooms, patients, selectedHospital])

  return (
    <div className="page-grid">
      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>Room Availability</h3>
            <p className="panel-subtitle">
              {selectedHospital} - {roomView.filter((r) => r.status === 'Available').length} of{' '}
              {roomView.length} available
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <select
              value={selectedHospital}
              onChange={(e) => setSelectedHospital(e.target.value)}
              style={{
                padding: '0.5rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid rgba(15, 34, 65, 0.1)',
                fontSize: '0.9rem',
              }}
            >
              {hospitals.map((hospital) => (
                <option key={hospital} value={hospital}>
                  {hospital}
                </option>
              ))}
            </select>
            <button
              className="primary-button"
              type="button"
              onClick={() => pushAction('Updating room inventory...')}
            >
              Update Inventory
            </button>
          </div>
        </div>
        <div className="card-grid">
          {roomView.map((room) => (
            <article
              key={room.name}
              className="room-card"
              onClick={() =>
                pushAction(
                  room.patient
                    ? `${room.name} | Patient: ${room.patient.name} | Care: ${room.patient.care} | Status: ${room.patient.status}`
                    : `${room.name} | Status: Available | Equipment: ${room.equipment}`
                )
              }
              style={{ cursor: 'pointer' }}
            >
              <div className="room-head">
                <h4>{room.name}</h4>
                <span className="badge">{room.status}</span>
              </div>
              {room.patient ? (
                <>
                  <p className="room-meta"><strong>Patient:</strong> {room.patient.name}</p>
                  <p className="room-meta"><strong>Care:</strong> {room.patient.care}</p>
                  <p className="room-meta"><strong>Status:</strong> {room.patient.status}</p>
                  <p className="room-meta"><strong>Next:</strong> {room.patient.next}</p>
                </>
              ) : (
                <>
                  <p className="room-meta"><strong>Equipment:</strong> {room.equipment}</p>
                  <p className="room-meta" style={{ color: '#4c8dff' }}>Ready for assignment</p>
                </>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>Constraint Coverage</h3>
            <p className="panel-subtitle">Rooms matched to care pathways</p>
          </div>
          <button
            className="outline-button"
            type="button"
            onClick={() => pushAction('Reviewing constraint conflicts...')}
          >
            Review Conflicts
          </button>
        </div>
        <div className="stats-row">
          {['Equipment match 92%', 'Isolation fit 88%', 'Distance fit 79%'].map(
            (item) => (
              <div key={item} className="stat-card">
                <p>{item}</p>
              </div>
            ),
          )}
        </div>
      </section>
    </div>
  )
}

export default Rooms
