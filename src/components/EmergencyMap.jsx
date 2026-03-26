import { useEffect, useMemo, useState } from 'react'
import L from 'leaflet'
import { CircleMarker, MapContainer, Marker, Polyline, Popup, TileLayer, Tooltip } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-defaulticon-compatibility'
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css'

function EmergencyMap({
  emergency = null,
  hospitals = [],
  assignedHospital = null,
  trackingState = null,
  trackingProgress = null,
  ambulanceUnits = [],
  selectedAmbulanceId = null,
}) {
  const [localTrackProgress, setLocalTrackProgress] = useState(0)

  const mapCenter = useMemo(() => {
    if (emergency?.lat && emergency?.lng) {
      return [emergency.lat, emergency.lng]
    }
    return [17.6868, 83.2185]
  }, [emergency])

  const assigned = useMemo(
    () => hospitals.find((hospital) => hospital.name === assignedHospital) || null,
    [assignedHospital, hospitals]
  )

  const isTrackingEnabled = Boolean(emergency && assigned)

  const selectedAmbulance = useMemo(
    () => ambulanceUnits.find((item) => item.id === selectedAmbulanceId) || ambulanceUnits[0] || null,
    [ambulanceUnits, selectedAmbulanceId]
  )

  const startPoint = useMemo(() => {
    if (!emergency || !selectedAmbulance) {
      return null
    }
    return [selectedAmbulance.lat, selectedAmbulance.lng]
  }, [emergency, selectedAmbulance])

  const trackingPath = useMemo(() => {
    if (!emergency || !assigned || !startPoint) {
      return []
    }

    return [
      startPoint,
      [emergency.lat, emergency.lng],
      [assigned.lat, assigned.lng],
    ]
  }, [assigned, emergency, startPoint])

  const trackProgress = useMemo(() => {
    if (typeof trackingProgress === 'number') {
      return Math.min(1, Math.max(0, trackingProgress))
    }
    return Math.min(1, Math.max(0, localTrackProgress))
  }, [trackingProgress, localTrackProgress])

  useEffect(() => {
    if (typeof trackingProgress === 'number') {
      return undefined
    }

    if (!isTrackingEnabled) {
      setLocalTrackProgress(0)
      return
    }

    const timer = setInterval(() => {
      setLocalTrackProgress((previous) => {
        const next = previous + 0.02
        return next > 1 ? 1 : next
      })
    }, 800)

    return () => clearInterval(timer)
  }, [isTrackingEnabled, assigned, emergency?.id, trackingProgress])

  const ambulanceIcon = useMemo(
    () =>
      L.divIcon({
        className: 'ambulance-live-icon',
        html: '<div style="font-size:22px;line-height:22px">🚑</div>',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      }),
    []
  )

  const ambulanceIdleIcon = useMemo(
    () =>
      L.divIcon({
        className: 'ambulance-idle-icon',
        html: '<div style="font-size:18px;line-height:18px">🚑</div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      }),
    []
  )

  const ambulancePosition = useMemo(() => {
    if (!trackingPath.length) {
      return null
    }

    const [start, pickup, destination] = trackingPath

    if (trackProgress <= 0.5) {
      const local = trackProgress / 0.5
      return [
        start[0] + (pickup[0] - start[0]) * local,
        start[1] + (pickup[1] - start[1]) * local,
      ]
    }

    const local = (trackProgress - 0.5) / 0.5
    return [
      pickup[0] + (destination[0] - pickup[0]) * local,
      pickup[1] + (destination[1] - pickup[1]) * local,
    ]
  }, [trackProgress, trackingPath])

  const trackingLabel = useMemo(() => {
    if (trackingState === 'requested') {
      return 'Ambulance requested'
    }
    if (trackingState === 'accepted') {
      return 'Driver accepted, moving to patient'
    }
    if (trackingState === 'arrived') {
      return 'Ambulance arrived at emergency location'
    }
    if (trackingState === 'pickup') {
      return 'Patient picked up, moving to hospital'
    }
    if (trackingState === 'dropoff') {
      return 'Patient dropped at assigned hospital'
    }

    if (!isTrackingEnabled) {
      return 'Tracking inactive'
    }

    if (trackProgress < 0.5) {
      return 'Ambulance en route to emergency location'
    }
    if (trackProgress < 1) {
      return 'Patient onboard: transporting to assigned hospital'
    }
    return 'Ambulance arrived at assigned hospital'
  }, [assigned, isTrackingEnabled, trackProgress, trackingState])

  return (
    <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(76, 141, 255, 0.2)' }}>
      <MapContainer
        center={mapCenter}
        zoom={11}
        style={{ height: '520px', width: '100%' }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {emergency ? (
          <>
            <CircleMarker
              center={[emergency.lat, emergency.lng]}
              radius={12}
              pathOptions={{ color: '#dc2626', fillColor: '#ef4444', fillOpacity: 0.85, weight: 2 }}
            >
              <Popup>
                <div>
                  <strong>Emergency Case</strong>
                  <div>Patient: {emergency.patientName}</div>
                  <div>Severity: {emergency.severity}</div>
                  <div>Location: {emergency.location}</div>
                </div>
              </Popup>
              <Tooltip direction="top" offset={[0, -8]} permanent>
                Emergency
              </Tooltip>
            </CircleMarker>

            <CircleMarker
              center={[emergency.lat, emergency.lng]}
              radius={22}
              pathOptions={{ color: '#dc2626', fillOpacity: 0, opacity: 0.45, weight: 2 }}
            />
          </>
        ) : null}

        {hospitals.map((hospital) => {
          const isAssigned = assignedHospital === hospital.name
          return (
            <Marker key={hospital.name} position={[hospital.lat, hospital.lng]}>
              <Popup>
                <div>
                  <strong>{hospital.name}</strong>
                  <div>ICU: {hospital.icu_available}</div>
                  <div>Doctors: {hospital.doctors_available}</div>
                  <div>{isAssigned ? 'Assigned Hospital' : 'Available Hospital'}</div>
                </div>
              </Popup>
              <Tooltip direction="top" offset={[0, -8]}>
                {isAssigned ? `Assigned: ${hospital.name}` : hospital.name}
              </Tooltip>
            </Marker>
          )
        })}

        {ambulanceUnits.map((unit) => {
          const isSelected = unit.id === selectedAmbulanceId
          return (
            <Marker key={unit.id} position={[unit.lat, unit.lng]} icon={ambulanceIdleIcon}>
              <Popup>
                <div>
                  <strong>{unit.name}</strong>
                  <div>ID: {unit.id}</div>
                  <div>District: {unit.district || '-'}</div>
                  <div>Status: {isSelected ? 'Assigned for current emergency' : unit.status || 'available'}</div>
                </div>
              </Popup>
              <Tooltip direction="top" offset={[0, -8]}>
                {isSelected ? `Assigned ${unit.id}` : unit.id}
              </Tooltip>
            </Marker>
          )
        })}

        {emergency && assigned ? (
          <Polyline
            positions={[
              [emergency.lat, emergency.lng],
              [assigned.lat, assigned.lng],
            ]}
            pathOptions={{ color: '#15803d', weight: 4, opacity: 0.85 }}
          >
            <Tooltip sticky>
              Route to assigned hospital
            </Tooltip>
          </Polyline>
        ) : null}

        {isTrackingEnabled && trackingPath.length ? (
          <Polyline
            positions={trackingPath}
            pathOptions={{ color: '#2563eb', weight: 3, opacity: 0.75, dashArray: '8 8' }}
          >
            <Tooltip sticky>
              Live ambulance route (Uber-style)
            </Tooltip>
          </Polyline>
        ) : null}

        {isTrackingEnabled && startPoint ? (
          <CircleMarker
            center={startPoint}
            radius={7}
            pathOptions={{ color: '#1e3a8a', fillColor: '#2563eb', fillOpacity: 0.85, weight: 1 }}
          >
            <Tooltip direction="top" offset={[0, -8]} permanent>
              Ambulance Start
            </Tooltip>
          </CircleMarker>
        ) : null}

        {isTrackingEnabled && ambulancePosition ? (
          <Marker position={ambulancePosition} icon={ambulanceIcon}>
            <Popup>
              <div>
                <strong>Live Ambulance Tracking</strong>
                <div>Status: {trackingLabel}</div>
                <div>Progress: {(trackProgress * 100).toFixed(0)}%</div>
              </div>
            </Popup>
            <Tooltip direction="top" offset={[0, -8]} permanent>
              Ambulance Live
            </Tooltip>
          </Marker>
        ) : null}

        {emergency
          ? hospitals
              .filter((hospital) => hospital.name !== assignedHospital)
              .map((hospital) => (
                <Polyline
                  key={`candidate-${hospital.name}`}
                  positions={[
                    [emergency.lat, emergency.lng],
                    [hospital.lat, hospital.lng],
                  ]}
                  pathOptions={{ color: '#94a3b8', weight: 2, opacity: 0.5, dashArray: '6 6' }}
                />
              ))
          : null}
      </MapContainer>

      <div style={{ padding: '0.85rem 1rem', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.85rem', color: '#334155' }}>
          <span>Emergency: red circle</span>
          <span>Hospitals: map pins</span>
          <span>Ambulances: ambulance icons</span>
          <span>Assigned route: green line</span>
          <span>Candidate routes: dashed gray lines</span>
          {isTrackingEnabled ? <span>Live tracking: blue dashed route + moving ambulance</span> : null}
        </div>
        {isTrackingEnabled ? (
          <div style={{ marginTop: '0.5rem', color: '#1d4ed8', fontSize: '0.85rem', fontWeight: 600 }}>
            {trackingLabel}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default EmergencyMap
