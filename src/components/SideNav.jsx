import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/hospitals', label: 'Hospitals' },
  { to: '/patients', label: 'Patients' },
  { to: '/rooms', label: 'Rooms' },
  { to: '/doctors', label: 'Doctors' },
  { to: '/analytics', label: 'Emergency' },
  { to: '/discharges', label: 'Discharge History' },
  { to: '/settings', label: 'Settings' },
]

function SideNav() {
  return (
    <aside className="side-nav">
      <div className="brand">
        <div className="brand-icon" aria-hidden="true">
          <span className="brand-dot" />
          <span className="brand-dot" />
          <span className="brand-dot" />
        </div>
        <div>
          <p className="brand-title">Quantum Ward</p>
          <p className="brand-subtitle">Room Allocation</p>
        </div>
      </div>
      <nav className="nav-links">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            className={({ isActive }) =>
              isActive ? 'nav-link nav-link-active' : 'nav-link'
            }
          >
            <span className="nav-pill" aria-hidden="true" />
            {link.label}
          </NavLink>
        ))}
      </nav>
      <div className="side-footer">
        <div className="side-card">
          <p className="side-card-title">Quantum Queue</p>
          <p className="side-card-value">96% stability</p>
          <p className="side-card-meta">Last sync 3 mins ago</p>
        </div>
      </div>
    </aside>
  )
}

export default SideNav
