import { useContext } from 'react'
import { HospitalContext } from '../state/HospitalContext.jsx'
import './Notifications.css'

function Notifications() {
  const { notifications } = useContext(HospitalContext)

  return (
    <div className="notifications-container">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`notification notification-${notification.type}`}
        >
          <span className="notification-icon">⚠</span>
          <span className="notification-message">{notification.message}</span>
        </div>
      ))}
    </div>
  )
}

export default Notifications
