import { useEffect, useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'

const REPORT_STORAGE_KEY = 'optimizationReportData'

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/hospitals', label: 'Hospitals' },
  { to: '/patients', label: 'Patients' },
  { to: '/rooms', label: 'Rooms' },
  { to: '/doctors', label: 'Doctors' },
  { to: '/emergency', label: 'Emergency' },
  { to: '/doctor-shift', label: 'Doctor Shift' },
  { to: '/operations', label: 'OP & OR + Bell' },
  { to: '/discharges', label: 'Discharge History' },
  { to: '/settings', label: 'Settings' },
]

function readReport() {
  try {
    return JSON.parse(localStorage.getItem(REPORT_STORAGE_KEY) || 'null')
  } catch {
    return null
  }
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function toSafeNumber(value, fallback = 0) {
  return Number.isFinite(Number(value)) ? Number(value) : fallback
}

function computeQueueStability(report) {
  if (!report) {
    return 96
  }

  const satisfaction = clamp(toSafeNumber(report.satisfactionScore, 0), 0, 100)
  const fairness = clamp(toSafeNumber(report.fairnessIndex, 0), 0, 1) * 100
  const throughputScore = clamp(toSafeNumber(report.throughput, 0) * 8, 0, 100)

  // Weighted stability score derived from optimization quality metrics.
  return Math.round(clamp(satisfaction * 0.5 + fairness * 0.3 + throughputScore * 0.2, 0, 100))
}

function getRelativeSyncLabel(timestamp) {
  if (!timestamp) {
    return 'Last sync unavailable'
  }

  const parsed = new Date(timestamp).getTime()
  if (!Number.isFinite(parsed)) {
    return 'Last sync unavailable'
  }

  const diffMs = Date.now() - parsed
  const diffMin = Math.max(0, Math.floor(diffMs / 60000))

  if (diffMin <= 0) {
    return 'Last sync just now'
  }
  if (diffMin === 1) {
    return 'Last sync 1 min ago'
  }
  if (diffMin < 60) {
    return `Last sync ${diffMin} mins ago`
  }

  const hours = Math.floor(diffMin / 60)
  if (hours === 1) {
    return 'Last sync 1 hour ago'
  }

  return `Last sync ${hours} hours ago`
}

function SideNav() {
  const [report, setReport] = useState(() => readReport())

  useEffect(() => {
    const sync = () => {
      setReport(readReport())
    }

    const onStorage = (event) => {
      if (event.key === REPORT_STORAGE_KEY) {
        sync()
      }
    }

    const timer = setInterval(sync, 2500)
    window.addEventListener('storage', onStorage)

    return () => {
      clearInterval(timer)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  const stability = useMemo(() => computeQueueStability(report), [report])
  const syncLabel = useMemo(() => getRelativeSyncLabel(report?.generatedAt), [report?.generatedAt])

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
          <p className="side-card-value">{stability}% stability</p>
          <p className="side-card-meta">{syncLabel}</p>
        </div>
      </div>
    </aside>
  )
}

export default SideNav
