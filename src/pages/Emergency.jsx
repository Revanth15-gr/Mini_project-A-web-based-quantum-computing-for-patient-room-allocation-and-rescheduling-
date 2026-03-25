import { useContext, useEffect, useMemo, useState } from 'react'
import { HospitalContext } from '../state/HospitalContext.jsx'
import EmergencyMap from '../components/EmergencyMap.jsx'

const BASE_LAT = 17.6868
const BASE_LNG = 83.2185

const CASE_NAMES = [
  'Emergency Case A',
  'Emergency Case B',
  'Emergency Case C',
  'Emergency Case D',
  'Emergency Case E',
]

const LOCATIONS = [
  'Downtown Vizag',
  'MVP Colony',
  'Maddilapalem',
  'Dwaraka Nagar',
  'Gajuwaka',
]

const SEVERITIES = ['Low', 'Medium', 'High', 'Critical']

const FALLBACK_HOSPITALS = [
  { name: 'Vizag City Care Hospital', lat: 17.723, lng: 83.301, icu_available: 8, doctors_available: 15 },
  { name: 'Apollo Vizag', lat: 17.705, lng: 83.299, icu_available: 6, doctors_available: 12 },
  { name: 'KGH Emergency', lat: 17.7125, lng: 83.3136, icu_available: 7, doctors_available: 10 },
  { name: 'Care Hospitals Vizag', lat: 17.7313, lng: 83.3059, icu_available: 5, doctors_available: 11 },
]

const DISTRICT_COORDS = [
  { district: 'Visakhapatnam', keywords: ['vizag', 'visakhapatnam', 'kgh'], lat: 17.6868, lng: 83.2185 },
  { district: 'Vijayawada', keywords: ['vijayawada'], lat: 16.5062, lng: 80.648 },
  { district: 'Guntur', keywords: ['guntur'], lat: 16.3067, lng: 80.4365 },
  { district: 'Kakinada', keywords: ['kakinada'], lat: 16.9891, lng: 82.2475 },
  { district: 'Rajahmundry', keywords: ['rajahmundry'], lat: 17.0005, lng: 81.804 },
  { district: 'Machilipatnam', keywords: ['machilipatnam'], lat: 16.1875, lng: 81.1389 },
  { district: 'Eluru', keywords: ['eluru'], lat: 16.7107, lng: 81.0952 },
  { district: 'Amalapuram', keywords: ['amalapuram'], lat: 16.5787, lng: 82.0061 },
  { district: 'Ongole', keywords: ['ongole'], lat: 15.5057, lng: 80.0499 },
  { district: 'Nellore', keywords: ['nellore'], lat: 14.4426, lng: 79.9865 },
  { district: 'Tirupati', keywords: ['tirupati'], lat: 13.6288, lng: 79.4192 },
  { district: 'Anantapur', keywords: ['anantapur'], lat: 14.6819, lng: 77.6006 },
  { district: 'Kurnool', keywords: ['kurnool'], lat: 15.8281, lng: 78.0373 },
  { district: 'Kadapa', keywords: ['kadapa'], lat: 14.4673, lng: 78.8242 },
  { district: 'Chittoor', keywords: ['chittoor'], lat: 13.2172, lng: 79.1003 },
  { district: 'Nandyal', keywords: ['nandyal'], lat: 15.477, lng: 78.4836 },
  { district: 'Proddatur', keywords: ['proddatur'], lat: 14.7502, lng: 78.5481 },
]

function resolveHospitalGeo(name, index = 0) {
  const lowerName = String(name || '').toLowerCase()
  const match = DISTRICT_COORDS.find((entry) => entry.keywords.some((keyword) => lowerName.includes(keyword)))

  if (!match) {
    const fallback = FALLBACK_HOSPITALS[index % FALLBACK_HOSPITALS.length]
    return {
      district: 'Visakhapatnam',
      lat: Number((fallback.lat + index * 0.002).toFixed(6)),
      lng: Number((fallback.lng + index * 0.0015).toFixed(6)),
    }
  }

  return {
    district: match.district,
    lat: Number((match.lat + ((index % 3) - 1) * 0.01).toFixed(6)),
    lng: Number((match.lng + ((index % 3) - 1) * 0.008).toFixed(6)),
  }
}

function randomAround(base, maxDelta) {
  return base + (Math.random() * 2 - 1) * maxDelta
}

function generateEmergencyCase(idNumber) {
  const severity = SEVERITIES[Math.floor(Math.random() * SEVERITIES.length)]
  const name = CASE_NAMES[Math.floor(Math.random() * CASE_NAMES.length)]
  const location = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)]

  return {
    id: idNumber,
    caseId: `EM-${idNumber}`,
    patientName: name,
    severity,
    location,
    lat: Number(randomAround(BASE_LAT, 0.05).toFixed(6)),
    lng: Number(randomAround(BASE_LNG, 0.05).toFixed(6)),
    createdAt: new Date().toISOString(),
  }
}

function haversineDistance(lat1, lng1, lat2, lng2) {
  const earthRadiusKm = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Number((earthRadiusKm * c).toFixed(2))
}

function getSeverityColor(severity) {
  switch ((severity || '').toLowerCase()) {
    case 'critical':
      return '#dc2626'
    case 'high':
      return '#ea580c'
    case 'medium':
      return '#d97706'
    default:
      return '#2563eb'
  }
}

function formatCountdown(ms) {
  if (!Number.isFinite(ms) || ms <= 0) {
    return '00:00'
  }

  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

const TRACKING_FLOW = ['requested', 'accepted', 'arrived', 'pickup', 'dropoff']

const TRACKING_STATE_META = {
  requested: { label: 'Requested', color: '#0369a1', bg: '#e0f2fe' },
  accepted: { label: 'Accepted', color: '#1d4ed8', bg: '#dbeafe' },
  arrived: { label: 'Arrived', color: '#7c3aed', bg: '#ede9fe' },
  pickup: { label: 'Pickup', color: '#b45309', bg: '#fef3c7' },
  dropoff: { label: 'Dropoff', color: '#15803d', bg: '#dcfce7' },
}

const AMBULANCE_STATE_META = {
  available: { label: 'Available', color: '#166534', bg: '#dcfce7' },
  requested: { label: 'Requested', color: '#0369a1', bg: '#e0f2fe' },
  accepted: { label: 'Accepted', color: '#1d4ed8', bg: '#dbeafe' },
  arrived: { label: 'Arrived at Patient', color: '#7c3aed', bg: '#ede9fe' },
  pickup: { label: 'Patient Onboard', color: '#b45309', bg: '#fef3c7' },
  dropoff: { label: 'Dropped at Hospital', color: '#15803d', bg: '#dcfce7' },
}

function Emergency() {
  const { hospitals: allHospitals = [] } = useContext(HospitalContext)

  const [caseCounter, setCaseCounter] = useState(2)
  const [incomingCases, setIncomingCases] = useState(() => [generateEmergencyCase(1)])
  const [activeCaseId, setActiveCaseId] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [assignedHospital, setAssignedHospital] = useState(null)
  const [emailSent, setEmailSent] = useState(false)
  const [trackingId, setTrackingId] = useState(null)
  const [trackingLive, setTrackingLive] = useState(null)

  const activeCase = useMemo(
    () => incomingCases.find((item) => item.id === activeCaseId) || incomingCases[0] || null,
    [incomingCases, activeCaseId]
  )

  const hospitalPayload = useMemo(() => {
    if (!allHospitals.length) {
      return FALLBACK_HOSPITALS.map((item, idx) => {
        const geo = resolveHospitalGeo(item.name, idx)
        return {
          ...item,
          district: geo.district,
          lat: geo.lat,
          lng: geo.lng,
        }
      })
    }

    return allHospitals.slice(0, 8).map((name, index) => {
      const geo = resolveHospitalGeo(name, index)
      return {
        name,
        district: geo.district,
        lat: geo.lat,
        lng: geo.lng,
        icu_available: Math.max(2, 10 - index),
        doctors_available: Math.max(4, 16 - index),
      }
    })
  }, [allHospitals])

  const ambulanceUnits = useMemo(() => {
    return hospitalPayload.slice(0, 6).map((hospital, index) => ({
      id: `AMB-${String(index + 1).padStart(2, '0')}`,
      name: `Ambulance ${index + 1}`,
      district: hospital.district,
      lat: Number((hospital.lat + 0.006).toFixed(6)),
      lng: Number((hospital.lng - 0.004).toFixed(6)),
      status: 'available',
    }))
  }, [hospitalPayload])

  const selectedAmbulance = useMemo(() => {
    if (!activeCase || !ambulanceUnits.length) {
      return null
    }

    return [...ambulanceUnits].sort(
      (a, b) =>
        haversineDistance(activeCase.lat, activeCase.lng, a.lat, a.lng) -
        haversineDistance(activeCase.lat, activeCase.lng, b.lat, b.lng)
    )[0]
  }, [activeCase, ambulanceUnits])

  const nearbyHospitals = useMemo(() => {
    if (!activeCase) {
      return []
    }

    return hospitalPayload
      .map((hospital) => ({
        ...hospital,
        distance: haversineDistance(activeCase.lat, activeCase.lng, hospital.lat, hospital.lng),
      }))
      .sort((a, b) => a.distance - b.distance)
  }, [activeCase, hospitalPayload])

  useEffect(() => {
    const intervalId = setInterval(() => {
      setIncomingCases((previous) => {
        const nextCase = generateEmergencyCase(caseCounter)
        setActiveCaseId(nextCase.id)
        setCaseCounter((value) => value + 1)
        return [nextCase, ...previous].slice(0, 8)
      })
    }, 18000)

    return () => clearInterval(intervalId)
  }, [caseCounter])

  const createIncomingCaseNow = () => {
    const nextCase = generateEmergencyCase(caseCounter)
    setCaseCounter((value) => value + 1)
    setIncomingCases((previous) => [nextCase, ...previous].slice(0, 8))
    setActiveCaseId(nextCase.id)
  }

  const handleAssignEmergencyHospital = async () => {
    if (!activeCase) {
      setError('No active emergency case available for assignment')
      return
    }

    setLoading(true)
    setError('')
    setEmailSent(false)

    try {
      const payload = {
        emergencies: [
          {
            patient_id: activeCase.caseId,
            patient_name: activeCase.patientName,
            location: activeCase.location,
            severity: activeCase.severity.toLowerCase(),
            latitude: activeCase.lat,
            longitude: activeCase.lng,
          },
        ],
        hospitals: nearbyHospitals,
      }

      const response = await fetch('/api/quantum-emergency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error || `Quantum emergency API returned ${response.status}`)
      }

      setResult(data)

      const resolvedHospital = data.assignments?.[0]?.hospital || nearbyHospitals[0]?.name || null
      setAssignedHospital(resolvedHospital)
      setTrackingId(data?.tracking?.trackingId || null)
      setTrackingLive(data?.tracking || null)

      setTimeout(() => {
        setEmailSent(true)
      }, 600)
    } catch (requestError) {
      setError(requestError.message || 'Unable to assign emergency hospital')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!trackingId) {
      return undefined
    }

    let active = true
    const pollTracking = async () => {
      try {
        const response = await fetch(`/api/quantum-tracking/${trackingId}`)
        const payload = await response.json().catch(() => ({}))
        if (!response.ok) {
          throw new Error(payload.error || `Tracking API returned ${response.status}`)
        }

        if (active) {
          setTrackingLive(payload)
        }
      } catch {
        // Keep UI stable on intermittent network issues.
      }
    }

    pollTracking()
    const pollId = setInterval(pollTracking, 2000)

    return () => {
      active = false
      clearInterval(pollId)
    }
  }, [trackingId])

  const assignedHospitalDetails = useMemo(
    () => nearbyHospitals.find((hospital) => hospital.name === assignedHospital) || null,
    [nearbyHospitals, assignedHospital]
  )

  const criticalTracking = useMemo(() => {
    if (!activeCase || String(activeCase.severity).toLowerCase() !== 'critical') {
      return null
    }

    const distance = Number(assignedHospitalDetails?.distance || 0)
    const etaMinutes = distance > 0 ? Math.max(3, Math.ceil((distance / 45) * 60)) : '-'
    const backendState = trackingLive?.state || null
    const backendStatus = trackingLive?.statusText || null

    return {
      active: true,
      provider: 'Uber EMS Partner',
      vehicleId: selectedAmbulance?.id || `UB-EMS-${String(activeCase.id).padStart(3, '0')}`,
      status: backendStatus || (assignedHospital ? 'Driver matched, ambulance in transit' : 'Searching nearby ambulances'),
      state: backendState || 'requested',
      etaMinutes: trackingLive?.state === 'dropoff' ? 0 : etaMinutes,
      distance,
      progress: typeof trackingLive?.progress === 'number' ? trackingLive.progress : 0,
      ambulanceDistrict: selectedAmbulance?.district || null,
    }
  }, [activeCase, assignedHospital, assignedHospitalDetails, trackingLive, selectedAmbulance])

  const trackingRemainingMs = useMemo(() => {
    const ttlMs = Number(trackingLive?.ttlMs)
    const elapsedMs = Number(trackingLive?.elapsedMs)

    if (!Number.isFinite(ttlMs) || !Number.isFinite(elapsedMs)) {
      return null
    }

    return Math.max(0, ttlMs - elapsedMs)
  }, [trackingLive])

  const trackingStateIndex = useMemo(() => {
    if (!criticalTracking?.state) {
      return -1
    }
    return TRACKING_FLOW.indexOf(criticalTracking.state)
  }, [criticalTracking])

  const ambulanceLiveList = useMemo(() => {
    return ambulanceUnits.map((unit) => {
      const isSelected = unit.id === (selectedAmbulance?.id || null)
      const currentState = isSelected ? (trackingLive?.state || 'requested') : 'available'
      const meta = AMBULANCE_STATE_META[currentState] || AMBULANCE_STATE_META.available

      return {
        ...unit,
        isSelected,
        stateKey: currentState,
        statusLabel: meta.label,
        statusColor: meta.color,
        statusBg: meta.bg,
      }
    })
  }, [ambulanceUnits, selectedAmbulance, trackingLive])

  return (
    <div className="page-grid">
      <section className="panel" style={{ gridColumn: '1 / -1' }}>
        <div className="panel-header">
          <div>
            <h3>Quantum Emergency Allocation Command Center</h3>
            <p className="panel-subtitle">Incoming cases are auto-detected. No manual case entry required.</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="primary-button" type="button" onClick={createIncomingCaseNow}>
              Simulate Incoming Case
            </button>
            <button className="primary-button" type="button" onClick={handleAssignEmergencyHospital} disabled={loading || !activeCase}>
              {loading ? 'Assigning...' : 'Assign Nearest Hospital'}
            </button>
          </div>
        </div>

        <div className="stats-row">
          <div className="stat-card">
            <p><strong>Auto Incoming Queue:</strong> {incomingCases.length}</p>
          </div>
          <div className="stat-card">
            <p><strong>Hospitals Tracked:</strong> {hospitalPayload.length}</p>
          </div>
          <div className="stat-card">
            <p><strong>Active Severity:</strong> <span style={{ color: getSeverityColor(activeCase?.severity) }}>{activeCase?.severity || '-'}</span></p>
          </div>
          <div className="stat-card">
            <p><strong>Assigned:</strong> {assignedHospital || 'Pending'}</p>
          </div>
        </div>

        <div style={{ marginTop: '1rem', display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          {incomingCases.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveCaseId(item.id)}
              style={{
                textAlign: 'left',
                border: item.id === activeCaseId ? '2px solid #2563eb' : '1px solid #cbd5e1',
                borderRadius: '10px',
                background: item.id === activeCaseId ? '#eff6ff' : '#fff',
                padding: '0.8rem',
                cursor: 'pointer',
              }}
            >
              <div style={{ fontWeight: 700 }}>{item.caseId}</div>
              <div>{item.patientName}</div>
              <div style={{ fontSize: '0.85rem', color: '#475569' }}>{item.location}</div>
              <div style={{ marginTop: '0.25rem', color: getSeverityColor(item.severity), fontWeight: 600 }}>{item.severity}</div>
            </button>
          ))}
        </div>

        {error ? <p style={{ color: '#b91c1c', marginTop: '0.75rem' }}>{error}</p> : null}
        {emailSent ? <p style={{ color: '#15803d', marginTop: '0.75rem' }}>Notification sent to assigned hospital</p> : null}
      </section>

      <section className="panel" style={{ gridColumn: '1 / -1' }}>
        <h3 style={{ marginBottom: '0.5rem' }}>Emergency Map & Hospital Locations</h3>
        <p className="panel-subtitle" style={{ marginBottom: '1rem' }}>Live map view for active emergency case and nearest hospitals</p>

        <EmergencyMap
          emergency={activeCase}
          hospitals={nearbyHospitals}
          assignedHospital={assignedHospital}
          trackingState={trackingLive?.state || null}
          trackingProgress={typeof trackingLive?.progress === 'number' ? trackingLive.progress : null}
          ambulanceUnits={ambulanceUnits}
          selectedAmbulanceId={selectedAmbulance?.id || null}
        />

        <div
          style={{
            marginTop: '1rem',
            border: '1px solid #cbd5e1',
            borderRadius: '10px',
            background: '#f8fafc',
            padding: '0.85rem 0.95rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>Ambulance Live Status</h4>
            <span style={{ fontSize: '0.78rem', color: '#475569' }}>
              Total Units: {ambulanceLiveList.length}
            </span>
          </div>

          <div style={{ display: 'grid', gap: '0.55rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            {ambulanceLiveList.map((unit) => (
              <div
                key={unit.id}
                style={{
                  border: unit.isSelected ? '2px solid #2563eb' : '1px solid #e2e8f0',
                  borderRadius: '9px',
                  background: unit.isSelected ? '#eff6ff' : '#ffffff',
                  padding: '0.65rem 0.75rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.6rem' }}>
                  <div style={{ fontWeight: 700 }}>{unit.id}</div>
                  <span
                    style={{
                      padding: '0.15rem 0.5rem',
                      borderRadius: '999px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: unit.statusColor,
                      background: unit.statusBg,
                    }}
                  >
                    {unit.statusLabel}
                  </span>
                </div>
                <div style={{ marginTop: '0.25rem', fontSize: '0.82rem', color: '#334155' }}>{unit.name}</div>
                <div style={{ marginTop: '0.2rem', fontSize: '0.78rem', color: '#64748b' }}>District: {unit.district || '-'}</div>
                <div style={{ marginTop: '0.2rem', fontSize: '0.78rem', color: '#64748b' }}>
                  Coords: {unit.lat}, {unit.lng}
                </div>
                {unit.isSelected ? (
                  <div style={{ marginTop: '0.35rem', fontSize: '0.78rem', fontWeight: 700, color: '#1d4ed8' }}>
                    Active unit for current emergency
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        {criticalTracking ? (
          <div
            style={{
              marginTop: '1rem',
              border: '1px solid #bfdbfe',
              background: '#eff6ff',
              borderRadius: '10px',
              padding: '0.9rem 1rem',
            }}
          >
            <div style={{ fontWeight: 700, color: '#1d4ed8', marginBottom: '0.35rem' }}>
              Critical Live Tracking: Uber-style Ambulance Dispatch
            </div>
            <div style={{ display: 'grid', gap: '0.35rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
              <div><strong>Provider:</strong> {criticalTracking.provider}</div>
              <div><strong>Vehicle:</strong> {criticalTracking.vehicleId}</div>
              <div><strong>Ambulance District:</strong> {criticalTracking.ambulanceDistrict || '-'}</div>
              <div><strong>Status:</strong> {criticalTracking.status}</div>
              <div><strong>ETA:</strong> {criticalTracking.etaMinutes === '-' ? '-' : `${criticalTracking.etaMinutes} min`}</div>
              <div><strong>Tracking State:</strong> {criticalTracking.state}</div>
              <div><strong>Progress:</strong> {(criticalTracking.progress * 100).toFixed(0)}%</div>
              {trackingRemainingMs !== null ? (
                <div>
                  <strong>Tracking Expires In:</strong>{' '}
                  <span style={{ color: trackingRemainingMs < 5 * 60 * 1000 ? '#b91c1c' : '#0f172a', fontWeight: 700 }}>
                    {formatCountdown(trackingRemainingMs)}
                  </span>
                </div>
              ) : null}
            </div>

            <div style={{ marginTop: '0.8rem', display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
              {TRACKING_FLOW.map((stateKey, idx) => {
                const meta = TRACKING_STATE_META[stateKey]
                const isReached = trackingStateIndex >= idx
                const isCurrent = criticalTracking.state === stateKey

                return (
                  <span
                    key={stateKey}
                    style={{
                      padding: '0.3rem 0.65rem',
                      borderRadius: '999px',
                      fontSize: '0.78rem',
                      fontWeight: isCurrent ? 800 : 600,
                      color: isReached ? meta.color : '#64748b',
                      background: isReached ? meta.bg : '#f1f5f9',
                      border: isCurrent ? `2px solid ${meta.color}` : '1px solid #cbd5e1',
                    }}
                  >
                    {meta.label}
                  </span>
                )
              })}
            </div>
          </div>
        ) : null}
      </section>

      <section className="panel" style={{ gridColumn: '1 / -1' }}>
        <h3 style={{ marginBottom: '1rem' }}>Nearby Hospitals</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#eff6ff' }}>
                <th style={{ textAlign: 'left', padding: '0.7rem' }}>Hospital</th>
                <th style={{ textAlign: 'left', padding: '0.7rem' }}>District</th>
                <th style={{ textAlign: 'left', padding: '0.7rem' }}>Distance (km)</th>
                <th style={{ textAlign: 'left', padding: '0.7rem' }}>ICU</th>
                <th style={{ textAlign: 'left', padding: '0.7rem' }}>Doctors</th>
                <th style={{ textAlign: 'left', padding: '0.7rem' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {nearbyHospitals.map((hospital) => (
                <tr key={hospital.name} style={{ borderTop: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '0.7rem' }}>{hospital.name}</td>
                  <td style={{ padding: '0.7rem' }}>{hospital.district || '-'}</td>
                  <td style={{ padding: '0.7rem' }}>{hospital.distance}</td>
                  <td style={{ padding: '0.7rem' }}>{hospital.icu_available}</td>
                  <td style={{ padding: '0.7rem' }}>{hospital.doctors_available}</td>
                  <td style={{ padding: '0.7rem', color: hospital.name === assignedHospital ? '#15803d' : '#64748b', fontWeight: hospital.name === assignedHospital ? 700 : 500 }}>
                    {hospital.name === assignedHospital ? 'Assigned' : 'Candidate'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {assignedHospitalDetails ? (
          <div style={{ marginTop: '1rem', padding: '0.85rem', borderRadius: '8px', background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
            <strong>Assigned Hospital:</strong> {assignedHospitalDetails.name} | <strong>Distance:</strong> {assignedHospitalDetails.distance} km
          </div>
        ) : null}
      </section>

      {result?.assignments?.length ? (
        <section className="panel" style={{ gridColumn: '1 / -1' }}>
          <h3 style={{ marginBottom: '0.75rem' }}>Quantum Optimization Result</h3>
          <p><strong>Algorithm:</strong> {result.algorithm || 'QAOA + Grover'}</p>
          <p><strong>Score:</strong> {result.optimization_score !== undefined ? `${(result.optimization_score * 100).toFixed(1)}%` : '-'}</p>
          <p><strong>Cases:</strong> {result.assigned_count}/{result.total_cases}</p>
        </section>
      ) : null}
    </div>
  )
}

export default Emergency
