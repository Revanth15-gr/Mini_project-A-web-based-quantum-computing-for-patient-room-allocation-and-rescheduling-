import { useContext, useMemo } from 'react'
import { HospitalContext } from '../state/HospitalContext.jsx'

function Rooms() {
  const pushAction = (message) => {
    window.dispatchEvent(new CustomEvent('app-action', { detail: message }))
  }

  const { rooms, patients } = useContext(HospitalContext)

  const roomView = useMemo(() => {
    const occupied = new Set(patients.map((patient) => patient.room))
    return rooms.map((room, index) => {
      const isOccupied = occupied.has(room.name)
      const utilization = isOccupied ? 78 + (index % 3) * 6 : 35 + (index % 2) * 7
      return {
        ...room,
        status: isOccupied ? 'Occupied' : 'Available',
        utilization: `${utilization}%`,
      }
    })
  }, [rooms, patients])

  return (
    <div className="page-grid">
      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>Room Availability</h3>
            <p className="panel-subtitle">Quantum model confidence: 93%</p>
          </div>
          <button
            className="primary-button"
            type="button"
            onClick={() => pushAction('Updating room inventory...')}
          >
            Update Inventory
          </button>
        </div>
        <div className="card-grid">
          {roomView.map((room) => (
            <article
              key={room.name}
              className="room-card"
              onClick={() =>
                pushAction(
                  `${room.name} | Status: ${room.status} | Equipment: ${room.equipment}`
                )
              }
              style={{ cursor: 'pointer' }}
            >
              <div className="room-head">
                <h4>{room.name}</h4>
                <span className="badge">{room.status}</span>
              </div>
              <p className="room-meta">Utilization {room.utilization}</p>
              <p className="room-meta">{room.equipment}</p>
              <div className="room-progress">
                <span style={{ width: room.utilization }} />
              </div>
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
