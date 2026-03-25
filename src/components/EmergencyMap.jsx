import { useMemo, useState } from 'react'

function EmergencyMap({ emergencies = [], hospitals = [], assignedHospital = null }) {
  const [hoveredItemId, setHoveredItemId] = useState(null)
  
  // Simple map visualization using SVG
  const mapWidth = 900
  const mapHeight = 650

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
    <div style={{ marginTop: '0', borderRadius: '12px', overflow: 'visible', width: '100%' }}>
      <svg
        width={mapWidth}
        height={mapHeight}
        style={{
          backgroundColor: '#f0f5ff',
          border: '2px solid rgba(76, 141, 255, 0.3)',
          display: 'block',
          margin: '0 auto',
          borderRadius: '8px',
        }}
      >
        <defs>
          {/* Grid background pattern */}
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(76, 141, 255, 0.1)" strokeWidth="0.5" />
          </pattern>

          {/* Pulse animation for emergency */}
          <style>
            {`
              @keyframes pulse-animation {
                0%, 100% { r: 8; opacity: 0.9; }
                50% { r: 12; opacity: 0.6; }
              }
              @keyframes hover-glow {
                0%, 100% { filter: drop-shadow(0 0 2px rgba(76, 141, 255, 0.3)); }
                50% { filter: drop-shadow(0 0 8px rgba(76, 141, 255, 0.6)); }
              }
              .emergency-pulse {
                animation: pulse-animation 2s infinite;
              }
              .hospital-hover {
                transition: all 0.3s ease;
              }
              .hospital-hover:hover {
                animation: hover-glow 0.6s ease;
              }
            `}
          </style>
        </defs>

        {/* Grid background */}
        <rect width={mapWidth} height={mapHeight} fill="url(#grid)" />

        {/* Map border */}
        <rect x="10" y="10" width={mapWidth - 20} height={mapHeight - 20} fill="none" stroke="rgba(76, 141, 255, 0.2)" strokeWidth="2" strokeDasharray="5,5" />

        {/* Grid lines */}
        <g stroke="rgba(76, 141, 255, 0.05)" strokeWidth="0.5">
          {[...Array(10)].map((_, i) => (
            <line key={`vline-${i}`} x1={(mapWidth / 10) * i} y1="0" x2={(mapWidth / 10) * i} y2={mapHeight} />
          ))}
          {[...Array(10)].map((_, i) => (
            <line key={`hline-${i}`} x1="0" y1={(mapHeight / 10) * i} x2={mapWidth} y2={(mapHeight / 10) * i} />
          ))}
        </g>

        {/* Distance lines - faded for all hospitals */}
        {emergencyPoints.map((emergency) =>
          hospitalPoints.map((hospital) => (
            <line
              key={`line-${emergency.id}-${hospital.id}`}
              x1={emergency.mapX}
              y1={emergency.mapY}
              x2={hospital.mapX}
              y2={hospital.mapY}
              stroke="rgba(76, 141, 255, 0.1)"
              strokeWidth="1"
              strokeDasharray="5,5"
            />
          ))
        )}

        {/* Highlighted distance line for assigned hospital */}
        {assignedHospital &&
          emergencyPoints.map((emergency) => {
            const assigned = hospitalPoints.find((h) => h.name === assignedHospital)
            return assigned ? (
              <g key={`assigned-connection-${emergency.id}`}>
                {/* Glow effect */}
                <line
                  x1={emergency.mapX}
                  y1={emergency.mapY}
                  x2={assigned.mapX}
                  y2={assigned.mapY}
                  stroke="#15803d"
                  strokeWidth="6"
                  opacity="0.2"
                />
                {/* Main line */}
                <line
                  x1={emergency.mapX}
                  y1={emergency.mapY}
                  x2={assigned.mapX}
                  y2={assigned.mapY}
                  stroke="#15803d"
                  strokeWidth="3"
                  opacity="0.9"
                  strokeLinecap="round"
                />
              </g>
            ) : null
          })}

        {/* Hospitals */}
        {hospitalPoints.map((hospital) => {
          const isAssigned = hospital.name === assignedHospital
          const isHovered = hoveredItemId === `hospital-${hospital.id}`
          return (
            <g
              key={`hospital-group-${hospital.id}`}
              onMouseEnter={() => setHoveredItemId(`hospital-${hospital.id}`)}
              onMouseLeave={() => setHoveredItemId(null)}
              className="hospital-hover"
              style={{ cursor: 'pointer' }}
            >
              {/* Glow background */}
              <circle
                cx={hospital.mapX}
                cy={hospital.mapY}
                r={isAssigned ? 22 : isHovered ? 18 : 14}
                fill={isAssigned ? '#15803d' : '#4c8dff'}
                opacity={isAssigned ? 0.15 : 0.1}
              />

              {/* Main circle */}
              <circle
                cx={hospital.mapX}
                cy={hospital.mapY}
                r={isAssigned ? 16 : isHovered ? 14 : 12}
                fill={isAssigned ? '#15803d' : '#4c8dff'}
                opacity={isAssigned ? 1 : isHovered ? 0.85 : 0.7}
                style={{ transition: 'all 0.3s ease' }}
              />

              {/* Ring for assigned */}
              {isAssigned && (
                <circle
                  cx={hospital.mapX}
                  cy={hospital.mapY}
                  r="20"
                  fill="none"
                  stroke="#15803d"
                  strokeWidth="1.5"
                  opacity="0.4"
                  style={{ animation: 'pulse 2s infinite' }}
                />
              )}

              {/* Hospital name */}
              <text
                x={hospital.mapX}
                y={hospital.mapY + 28}
                textAnchor="middle"
                fontSize="12"
                fill={isAssigned ? '#15803d' : '#164a8a'}
                fontWeight={isAssigned || isHovered ? 'bold' : 'normal'}
              >
                🏥 {hospital.name.split(' ')[0]}
              </text>

              {/* ICU info */}
              <text
                x={hospital.mapX}
                y={hospital.mapY + 42}
                textAnchor="middle"
                fontSize="10"
                fill={hospital.icu_available >= 6 ? '#15803d' : '#dc2626'}
                fontWeight="bold"
              >
                ICU: {hospital.icu_available}
              </text>

              {/* Hover info tooltip */}
              {isHovered && (
                <g>
                  <rect
                    x={hospital.mapX - 55}
                    y={hospital.mapY - 60}
                    width="110"
                    height="55"
                    fill="white"
                    stroke="#164a8a"
                    strokeWidth="1.5"
                    rx="6"
                    fillOpacity="0.98"
                  />
                  <text
                    x={hospital.mapX}
                    y={hospital.mapY - 45}
                    textAnchor="middle"
                    fontSize="11"
                    fill="#164a8a"
                    fontWeight="bold"
                  >
                    {hospital.name}
                  </text>
                  <text
                    x={hospital.mapX}
                    y={hospital.mapY - 30}
                    textAnchor="middle"
                    fontSize="9"
                    fill="#6b7280"
                  >
                    ICU: {hospital.icu_available}
                  </text>
                  <text
                    x={hospital.mapX}
                    y={hospital.mapY - 18}
                    textAnchor="middle"
                    fontSize="9"
                    fill="#6b7280"
                  >
                    Doctors: {hospital.doctors_available}
                  </text>
                </g>
              )}
            </g>
          )
        })}

        {/* Emergency markers */}
        {emergencyPoints.map((emergency) => (
          <g key={`emergency-group-${emergency.id}`}>
            {/* Pulse effect circles */}
            <circle cx={emergency.mapX} cy={emergency.mapY} r="8" fill="#dc2626" opacity="0.3" className="emergency-pulse" />

            {/* Main emergency marker */}
            <circle cx={emergency.mapX} cy={emergency.mapY} r="8" fill="#dc2626" opacity="0.95" />

            {/* Outer ring */}
            <circle cx={emergency.mapX} cy={emergency.mapY} r="12" fill="none" stroke="#dc2626" strokeWidth="2" opacity="0.5" />

            {/* Severity label */}
            <text
              x={emergency.mapX}
              y={emergency.mapY - 22}
              textAnchor="middle"
              fontSize="11"
              fill="#dc2626"
              fontWeight="bold"
              backgroundColor="white"
            >
              🚑 {emergency.severity?.toUpperCase()}
            </text>

            {/* Patient info */}
            <text
              x={emergency.mapX}
              y={emergency.mapY + 20}
              textAnchor="middle"
              fontSize="10"
              fill="#dc2626"
              fontWeight="bold"
            >
              {emergency.patientName?.split(' ')[0] || 'Patient'}
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
              <g key={`distance-${emergency.id}`}>
                {/* Distance background */}
                <rect
                  x={midX - 35}
                  y={midY - 10}
                  width="70"
                  height="20"
                  fill="white"
                  stroke="#15803d"
                  strokeWidth="1.5"
                  rx="4"
                  opacity="0.95"
                />
                {/* Distance text */}
                <text
                  x={midX}
                  y={midY + 5}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#15803d"
                  fontWeight="bold"
                >
                  {distance} units
                </text>
              </g>
            )
          })}

        {/* Compass */}
        <g onClick={() => alert('Map orientation: North is up')}>
          <text x={mapWidth - 30} y="30" fontSize="14" fontWeight="bold" fill="#164a8a" textAnchor="middle">
            🧭 N
          </text>
        </g>
      </svg>

      {/* Map Legend */}
      <div style={{ padding: '1.25rem', backgroundColor: '#f9fafb', borderTop: '1px solid #e5e7eb', borderRadius: '0 0 8px 8px', border: '1px solid rgba(76, 141, 255, 0.3)', borderTop: '1px solid rgba(76, 141, 255, 0.3)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', fontSize: '0.9rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#dc2626' }} />
            <div>
              <strong>Emergency Location</strong>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#6b7280' }}>With pulse animation</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#4c8dff' }} />
            <div>
              <strong>Available Hospital</strong>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#6b7280' }}>Hover for details</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#15803d' }} />
            <div>
              <strong>Assigned Hospital</strong>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#6b7280' }}>With connection line</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '20px', height: '2px', backgroundColor: '#15803d' }} />
            <div>
              <strong>Distance Line</strong>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#6b7280' }}>To assigned hospital</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EmergencyMap
