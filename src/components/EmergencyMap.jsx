import { useMemo } from 'react'

function EmergencyMap({ emergencies = [], hospitals = [], assignedHospital = null }) {
  // Simple map visualization using SVG
  const mapWidth = 800
  const mapHeight = 600

  // Mock coordinates for Vizag area (scaled to map)
  const emergencyPoints = useMemo(() => {
    return emergencies.map((emergency, idx) => {
      const baseX = mapWidth * 0.4 + Math.random() * 100
      const baseY = mapHeight * 0.5 + Math.random() * 80
      return {
        ...emergency,
        mapX: baseX,
        mapY: baseY,
        id: emergency.id || `emergency-${idx}`,
      }
    })
  }, [emergencies])

  const hospitalPoints = useMemo(() => {
    return hospitals.map((hospital, idx) => {
      const positions = [
        { x: mapWidth * 0.3, y: mapHeight * 0.3 },
        { x: mapWidth * 0.6, y: mapHeight * 0.4 },
        { x: mapWidth * 0.5, y: mapHeight * 0.7 },
        { x: mapWidth * 0.2, y: mapHeight * 0.6 },
        { x: mapWidth * 0.75, y: mapHeight * 0.6 },
      ]
      const pos = positions[idx % positions.length]
      return {
        ...hospital,
        mapX: pos.x,
        mapY: pos.y,
        id: hospital.id || `hospital-${idx}`,
      }
    })
  }, [hospitals])

  const calculateDistance = (x1, y1, x2, y2) => {
    const dx = x2 - x1
    const dy = y2 - y1
    return Math.sqrt(dx * dx + dy * dy).toFixed(1)
  }

  return (
    <div style={{ marginTop: '1.5rem', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
      <svg
        width={mapWidth}
        height={mapHeight}
        style={{
          backgroundColor: '#f0f5ff',
          border: '2px solid rgba(76, 141, 255, 0.2)',
          display: 'block',
          margin: '0 auto',
        }}
      >
        {/* Grid background */}
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(76, 141, 255, 0.1)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width={mapWidth} height={mapHeight} fill="url(#grid)" />

        {/* Distance lines from emergency to hospitals */}
        {emergencyPoints.map((emergency) =>
          hospitalPoints.map((hospital) => (
            <line
              key={`line-${emergency.id}-${hospital.id}`}
              x1={emergency.mapX}
              y1={emergency.mapY}
              x2={hospital.mapX}
              y2={hospital.mapY}
              stroke="rgba(76, 141, 255, 0.15)"
              strokeWidth="1"
              strokeDasharray="5,5"
            />
          ))
        )}

        {/* Distance lines in bold for assigned hospital */}
        {assignedHospital &&
          emergencyPoints.map((emergency) => {
            const assigned = hospitalPoints.find((h) => h.name === assignedHospital)
            return assigned ? (
              <line
                key={`assigned-line-${emergency.id}`}
                x1={emergency.mapX}
                y1={emergency.mapY}
                x2={assigned.mapX}
                y2={assigned.mapY}
                stroke="#15803d"
                strokeWidth="3"
                opacity="0.8"
              />
            ) : null
          })}

        {/* Hospitals */}
        {hospitalPoints.map((hospital) => {
          const isAssigned = hospital.name === assignedHospital
          return (
            <g key={`hospital-${hospital.id}`}>
              <circle
                cx={hospital.mapX}
                cy={hospital.mapY}
                r={isAssigned ? 16 : 12}
                fill={isAssigned ? '#15803d' : '#4c8dff'}
                opacity={isAssigned ? 1 : 0.7}
                style={{ transition: 'all 0.3s ease' }}
              />
              <text
                x={hospital.mapX}
                y={hospital.mapY + 25}
                textAnchor="middle"
                fontSize="12"
                fill={isAssigned ? '#15803d' : '#164a8a'}
                fontWeight={isAssigned ? 'bold' : 'normal'}
              >
                🏥 {hospital.name.split(' ')[0]}
              </text>
              <text
                x={hospital.mapX}
                y={hospital.mapY + 40}
                textAnchor="middle"
                fontSize="10"
                fill="#666"
              >
                {hospital.icu_available ? `ICU: ${hospital.icu_available}` : 'ICU: N/A'}
              </text>
            </g>
          )
        })}

        {/* Emergency markers */}
        {emergencyPoints.map((emergency) => (
          <g key={`emergency-${emergency.id}`}>
            <circle cx={emergency.mapX} cy={emergency.mapY} r="8" fill="#dc2626" opacity="0.9" />
            <circle cx={emergency.mapX} cy={emergency.mapY} r="12" fill="none" stroke="#dc2626" strokeWidth="2" opacity="0.5" />
            <text x={emergency.mapX} y={emergency.mapY - 20} textAnchor="middle" fontSize="12" fill="#dc2626" fontWeight="bold">
              🚑 {emergency.severity?.toUpperCase()}
            </text>
          </g>
        ))}

        {/* Distance labels */}
        {assignedHospital &&
          emergencyPoints.map((emergency) => {
            const assigned = hospitalPoints.find((h) => h.name === assignedHospital)
            if (!assigned) return null
            const distance = calculateDistance(emergency.mapX, emergency.mapY, assigned.mapX, assigned.mapY)
            const midX = (emergency.mapX + assigned.mapX) / 2
            const midY = (emergency.mapY + assigned.mapY) / 2
            return (
              <text
                key={`distance-${emergency.id}`}
                x={midX}
                y={midY - 5}
                textAnchor="middle"
                fontSize="11"
                fill="#15803d"
                fontWeight="bold"
                backgroundColor="white"
                style={{ background: 'rgba(255,255,255,0.9)', padding: '2px 6px' }}
              >
                {distance} units
              </text>
            )
          })}
      </svg>

      {/* Map Legend */}
      <div style={{ padding: '1rem', backgroundColor: '#f9fafb', borderTop: '1px solid #e5e7eb' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', fontSize: '0.9rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: '#dc2626',
              }}
            />
            <span>Emergency Location</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: '#4c8dff',
              }}
            />
            <span>Hospital</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: '#15803d',
              }}
            />
            <span>Assigned Hospital</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EmergencyMap
