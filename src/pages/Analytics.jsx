import { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { HospitalContext } from '../state/HospitalContext.jsx'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css'
import 'leaflet-defaulticon-compatibility'

const hospitalLocations = {
  'Vizag City Care Hospital': { lat: 17.6869, lng: 83.2185, district: 'Coastal Andhra', beds: 6, doctors: 4 },
  'Vijayawada Heart Institute': { lat: 16.5062, lng: 80.6480, district: 'Coastal Andhra', beds: 3, doctors: 2 },
  'Guntur Neuro Center': { lat: 16.3067, lng: 80.4365, district: 'Coastal Andhra', beds: 2, doctors: 2 },
  'Kakinada Coastal Medical': { lat: 16.9891, lng: 82.2475, district: 'Coastal Andhra', beds: 4, doctors: 3 },
  'Rajahmundry River Hospital': { lat: 17.0689, lng: 81.7771, district: 'Coastal Andhra', beds: 5, doctors: 3 },
  'Machilipatnam Port Medical': { lat: 15.7497, lng: 80.1489, district: 'Coastal Andhra', beds: 3, doctors: 2 },
  'Eluru District Hospital': { lat: 16.3131, lng: 81.0994, district: 'Coastal Andhra', beds: 4, doctors: 3 },
  'Amalapuram Regional Care': { lat: 16.5778, lng: 82.0415, district: 'Coastal Andhra', beds: 3, doctors: 2 },
  'Ongole Medical Institute': { lat: 14.6349, lng: 79.9789, district: 'Rayalaseema', beds: 2, doctors: 2 },
  'Nellore Emergency & Critical Care': { lat: 14.4426, lng: 79.9864, district: 'Rayalaseema', beds: 5, doctors: 4 },
  'Tirupati Ortho & Trauma Hospital': { lat: 13.1939, lng: 79.8965, district: 'Rayalaseema', beds: 1, doctors: 1 },
  'Anantapur Heart Center': { lat: 13.1887, lng: 77.6051, district: 'Rayalaseema', beds: 6, doctors: 4 },
  'Kurnool Multi-Specialty Hospital': { lat: 15.8281, lng: 78.8353, district: 'Rayalaseema', beds: 3, doctors: 2 },
  'Kadapa Regional Medical': { lat: 14.4697, lng: 79.1367, district: 'Rayalaseema', beds: 4, doctors: 3 },
  'Chittoor Women & Child Care': { lat: 13.1939, lng: 79.1059, district: 'Rayalaseema', beds: 2, doctors: 2 },
  'Nandyal District Hospital': { lat: 14.4838, lng: 78.4867, district: 'Rayalaseema', beds: 3, doctors: 2 },
  'Proddatur Eye & ENT Center': { lat: 14.7505, lng: 78.5750, district: 'Rayalaseema', beds: 2, doctors: 1 },
  'Hindupur Community Hospital': { lat: 13.8298, lng: 79.4900, district: 'Rayalaseema', beds: 4, doctors: 3 },
  'Dharmavaram Diabetes Center': { lat: 13.7465, lng: 79.1267, district: 'Rayalaseema', beds: 3, doctors: 2 },
  'Madanapalle Maternity Hospital': { lat: 13.3400, lng: 79.1366, district: 'Rayalaseema', beds: 2, doctors: 1 },
}

const hospitalStatus = [
  {
    name: 'Vizag City Care Hospital',
    available: '6 Beds',
    doctors: '4',
    readiness: 'Ready',
    distance: '1.4 km',
    statusTone: 'ready',
  },
  {
    name: 'Vijayawada Heart Institute',
    available: '3 Beds',
    doctors: '2',
    readiness: 'Limited',
    distance: '2.6 km',
    statusTone: 'limited',
  },
  {
    name: 'Guntur Neuro Center',
    available: '2 Beds',
    doctors: '2',
    readiness: 'Limited',
    distance: '3.3 km',
    statusTone: 'limited',
  },
  {
    name: 'Tirupati Ortho & Trauma Hospital',
    available: '1 Bed',
    doctors: '1',
    readiness: 'Full',
    distance: '4.2 km',
    statusTone: 'full',
  },
  {
    name: 'Kakinada Coastal Medical',
    available: '4 Beds',
    doctors: '3',
    readiness: 'Ready',
    distance: '5.1 km',
    statusTone: 'ready',
  },
]

const quickActions = [
  'Prepare ER Team',
  'Share Patient Info',
  'Assign Hospital',
  'Dismiss Alert',
]

const DEFAULT_ALERT_PHONE = '+919392759970'
const DEFAULT_ALERT_EMAIL = 'gudalarevanth15@gmail.com'

const andhraPradeshBounds = {
  minLat: 12.6,
  maxLat: 19.3,
  minLng: 76.7,
  maxLng: 84.9,
}

const randomBetween = (min, max) => min + Math.random() * (max - min)

const clampToAndhraPradesh = ({ lat, lng }) => ({
  lat: Math.min(andhraPradeshBounds.maxLat, Math.max(andhraPradeshBounds.minLat, lat)),
  lng: Math.min(andhraPradeshBounds.maxLng, Math.max(andhraPradeshBounds.minLng, lng)),
})

const pickNextTarget = (currentLocation, district) => {
  const anchors = Object.values(hospitalLocations).filter((location) =>
    district ? location.district === district : true,
  )
  const pool = anchors.length > 0 ? anchors : Object.values(hospitalLocations)

  if (pool.length === 0) {
    return clampToAndhraPradesh(currentLocation)
  }

  const nearest = [...pool].sort((a, b) => {
    const da = Math.abs(a.lat - currentLocation.lat) + Math.abs(a.lng - currentLocation.lng)
    const db = Math.abs(b.lat - currentLocation.lat) + Math.abs(b.lng - currentLocation.lng)
    return da - db
  })

  const candidateIndex = Math.min(nearest.length - 1, 1 + Math.floor(Math.random() * Math.min(3, nearest.length)))
  const destination = nearest[candidateIndex] || nearest[0]

  return clampToAndhraPradesh({
    lat: destination.lat + randomBetween(-0.06, 0.06),
    lng: destination.lng + randomBetween(-0.08, 0.08),
  })
}

const getAmbulanceVisualOffset = (ambulanceId) => {
  const sum = String(ambulanceId)
    .split('')
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  const angle = (sum % 360) * (Math.PI / 180)
  const radius = 0.003
  return {
    lat: Math.sin(angle) * radius,
    lng: Math.cos(angle) * radius,
  }
}

// 5 Ambulances with different locations
const ambulanceFleet = [
  {
    id: 'AMB-001',
    location: { lat: 17.6869, lng: 83.2185, district: 'Coastal Andhra' },
    status: 'En Route',
    condition: 'Stable',
  },
  {
    id: 'AMB-002',
    location: { lat: 16.5062, lng: 80.6480, district: 'Coastal Andhra' },
    status: 'Available',
    condition: 'Idle',
  },
  {
    id: 'AMB-003',
    location: { lat: 15.8243, lng: 78.6783, district: 'Rayalaseema' },
    status: 'En Route',
    condition: 'Critical',
  },
  {
    id: 'AMB-004',
    location: { lat: 14.4426, lng: 79.9864, district: 'Rayalaseema' },
    status: 'Available',
    condition: 'Idle',
  },
  {
    id: 'AMB-005',
    location: { lat: 13.1939, lng: 79.8965, district: 'Rayalaseema' },
    status: 'En Route',
    condition: 'Severe',
  },
]

// 3 Emergency Cases - Initial data
const initialEmergencyCases = [
  {
    caseId: '#E001',
    incident: 'Severe Car Accident',
    location: 'RTC Complex & MVP Colony, Vizag',
    ambulanceId: 'AMB-001',
    eta: '4 Min',
    severity: 'Critical',
    patientName: 'Ramesh Kumar',
    age: 45,
    injuries: 'Multiple fractures, head trauma'
  },
  {
    caseId: '#E002',
    incident: 'Heart Attack Emergency',
    location: 'Dwarakanagar, Vijayawada',
    ambulanceId: 'AMB-003',
    eta: '6 Min',
    severity: 'Critical',
    patientName: 'Lakshmi Devi',
    age: 62,
    injuries: 'Acute chest pain, difficulty breathing'
  },
  {
    caseId: '#E003',
    incident: 'Road Traffic Accident',
    location: 'Tirupati Bypass Road, Tirupati',
    ambulanceId: 'AMB-005',
    eta: '8 Min',
    severity: 'Severe',
    patientName: 'Arjun Reddy',
    age: 28,
    injuries: 'Spinal injury, internal bleeding suspected'
  },
]

const emergencyIncidentTemplates = [
  { incident: 'Road Traffic Accident', injuries: 'Multiple trauma and possible fractures', severity: 'Severe' },
  { incident: 'Cardiac Emergency', injuries: 'Chest pain and breathing distress', severity: 'Critical' },
  { incident: 'Industrial Injury', injuries: 'Deep laceration and blood loss', severity: 'Severe' },
  { incident: 'Fall From Height', injuries: 'Possible spinal injury and head impact', severity: 'Critical' },
  { incident: 'Seizure Emergency', injuries: 'Neurological instability and disorientation', severity: 'High' },
]

const emergencyNames = [
  'Vikram Raju',
  'Sowmya Devi',
  'Mahesh Babu',
  'Anitha Kumari',
  'Praveen Kumar',
  'Srinidhi Reddy',
  'Rahul Teja',
  'Deepika Nair',
]

function Emergency() {
  const mapRef = useRef(null)
  const googleMapRef = useRef(null)
  const hasFittedBoundsRef = useRef(false)
  const hospitalMarkersRef = useRef([])
  const ambulanceMarkersRef = useRef({})
  const ambulanceTrailsRef = useRef({})
  const ambulanceHistoryRef = useRef({})
  const routeCorridorRef = useRef(null)
  const routeLineRef = useRef(null)
  const lastPanAtRef = useRef(0)
  const ambulanceRoadRoutesRef = useRef({})
  const ambulanceRoadCacheRef = useRef({})
  const ambulanceRoadAbortRef = useRef(null)
  const lastRoadRouteRef = useRef({
    fetchedAt: 0,
    start: null,
    end: null,
    points: null,
  })
  const routeAbortRef = useRef(null)
  const [selectedHospital, setSelectedHospital] = useState(null)
  const [selectedDistrict, setSelectedDistrict] = useState('All Districts')
  const [followSelectedAmbulance, setFollowSelectedAmbulance] = useState(true)
  const [showRouteCorridor, setShowRouteCorridor] = useState(true)
  const [selectedRouteMetrics, setSelectedRouteMetrics] = useState(null)
  const [ambulances, setAmbulances] = useState(() =>
    ambulanceFleet.map((ambulance) => ({
      ...ambulance,
      district: ambulance.location.district,
      speedKmph: randomBetween(34, 62),
      heading: randomBetween(0, 360),
      target: pickNextTarget(ambulance.location, ambulance.location.district),
      etaMinutes: Math.round(randomBetween(3, 9)),
    }))
  )
  const [selectedAmbulanceId, setSelectedAmbulanceId] = useState(ambulanceFleet[0].id)
  const [emergencyCases, setEmergencyCases] = useState(initialEmergencyCases)
  const [selectedEmergency, setSelectedEmergency] = useState(initialEmergencyCases[0])
  const [qaoaAssignmentsByCase, setQaoaAssignmentsByCase] = useState({})
  const [isAssigningHospital, setIsAssigningHospital] = useState(false)
  const [assignedHospital, setAssignedHospital] = useState(null)
  const [showERDialog, setShowERDialog] = useState(false)
  const [showPatientDialog, setShowPatientDialog] = useState(false)
  const latestAmbulancesRef = useRef([])

  const { addNotification, patients, rooms: roomInventory, systemSettings } = useContext(HospitalContext)

  const hospitalRoomAvailability = useMemo(() => {
    const roomCountByHospital = new Map()
    const occupiedByHospital = new Map()

    roomInventory.forEach((room) => {
      const hospitalName = room?.hospital
      if (!hospitalName) {
        return
      }
      roomCountByHospital.set(hospitalName, (roomCountByHospital.get(hospitalName) || 0) + 1)
    })

    patients.forEach((patient) => {
      const hospitalName = patient?.hospital
      const hasAssignedRoom = patient?.room && patient.room !== 'Unassigned'
      if (!hospitalName || !hasAssignedRoom) {
        return
      }
      occupiedByHospital.set(hospitalName, (occupiedByHospital.get(hospitalName) || 0) + 1)
    })

    const availability = {}
    Object.keys(hospitalLocations).forEach((hospitalName) => {
      const totalRooms = roomCountByHospital.get(hospitalName)
      if (Number.isFinite(totalRooms) && totalRooms > 0) {
        const occupiedRooms = occupiedByHospital.get(hospitalName) || 0
        availability[hospitalName] = Math.max(totalRooms - occupiedRooms, 0)
      } else {
        availability[hospitalName] = hospitalLocations[hospitalName]?.beds || 0
      }
    })

    return availability
  }, [patients, roomInventory])

  const pushAction = (message) => {
    window.dispatchEvent(new CustomEvent('app-action', { detail: message }))
  }

  const districts = ['All Districts', 'Coastal Andhra', 'Rayalaseema']

  const selectedAmbulance = useMemo(
    () => ambulances.find((ambulance) => ambulance.id === selectedAmbulanceId) || ambulances[0],
    [ambulances, selectedAmbulanceId],
  )

  const selectedEmergencyEta = useMemo(() => {
    if (!selectedEmergency) return null
    const matchedAmbulance = ambulances.find((ambulance) => ambulance.id === selectedEmergency.ambulanceId)
    return matchedAmbulance ? `${matchedAmbulance.etaMinutes} Min` : selectedEmergency.eta
  }, [ambulances, selectedEmergency])

  const formatRouteDuration = (minutes) => {
    const rounded = Math.max(1, Math.round(minutes))
    const hrs = Math.floor(rounded / 60)
    const mins = rounded % 60
    if (hrs <= 0) return `${mins} min`
    if (mins === 0) return `${hrs} hr`
    return `${hrs} hr ${mins} min`
  }

  useEffect(() => {
    latestAmbulancesRef.current = ambulances
  }, [ambulances])

  // Create one new incoming emergency every 5 minutes.
  useEffect(() => {
    const timer = setInterval(() => {
      const currentAmbulances = latestAmbulancesRef.current
      if (!Array.isArray(currentAmbulances) || currentAmbulances.length === 0) {
        return
      }

      const available = currentAmbulances.filter((item) => item.status === 'Available')
      const sourcePool = available.length > 0 ? available : currentAmbulances
      const assignedAmbulance = sourcePool[Math.floor(Math.random() * sourcePool.length)]
      const incidentTemplate = emergencyIncidentTemplates[Math.floor(Math.random() * emergencyIncidentTemplates.length)]
      const patientName = emergencyNames[Math.floor(Math.random() * emergencyNames.length)]

      let createdCase = null
      setEmergencyCases((current) => {
        const maxCaseNumber = current.reduce((maxValue, emergency) => {
          const numeric = Number(String(emergency.caseId || '').replace(/[^0-9]/g, ''))
          return Number.isFinite(numeric) ? Math.max(maxValue, numeric) : maxValue
        }, 0)
        const nextCaseId = `#E${String(maxCaseNumber + 1).padStart(3, '0')}`

        createdCase = {
          caseId: nextCaseId,
          incident: incidentTemplate.incident,
          location: `Near ${assignedAmbulance.location.district} corridor (${assignedAmbulance.location.lat.toFixed(3)}, ${assignedAmbulance.location.lng.toFixed(3)})`,
          ambulanceId: assignedAmbulance.id,
          eta: `${Math.max(2, assignedAmbulance.etaMinutes || 4)} Min`,
          severity: incidentTemplate.severity,
          patientName,
          age: Math.floor(randomBetween(22, 70)),
          injuries: incidentTemplate.injuries,
        }

        const appended = [...current, createdCase]
        return appended.slice(-12)
      })

      if (createdCase) {
        setSelectedEmergency((current) => current || createdCase)
        addNotification(`New emergency case received: ${createdCase.caseId} (${createdCase.incident})`, 'warning')
        pushAction(`Incoming emergency ${createdCase.caseId} assigned to ${createdCase.ambulanceId}`)
      }
    }, 5 * 60 * 1000)

    return () => clearInterval(timer)
  }, [])

  // Filter hospitals by selected district
  const filteredHospitals = selectedDistrict === 'All Districts'
    ? Object.entries(hospitalLocations)
    : Object.entries(hospitalLocations).filter(([_, coords]) => coords.district === selectedDistrict)

  // Calculate distance between two points (Haversine formula)
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371 // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  const dispatchNearestAmbulanceToHospital = (hospitalData, emergencyCase) => {
    if (!hospitalData?.coords || !emergencyCase?.caseId) return null

    const rankedAmbulances = ambulances
      .map((ambulance) => ({
        ...ambulance,
        dispatchDistanceKm: calculateDistance(
          ambulance.location.lat,
          ambulance.location.lng,
          hospitalData.coords.lat,
          hospitalData.coords.lng,
        ),
      }))
      .sort((a, b) => a.dispatchDistanceKm - b.dispatchDistanceKm)

    if (rankedAmbulances.length === 0) return null

    const nearestAmbulance = rankedAmbulances[0]
    const effectiveSpeed = Math.max(nearestAmbulance.speedKmph || 40, 1)
    const etaMinutes = Math.max(1, Math.ceil((nearestAmbulance.dispatchDistanceKm / effectiveSpeed) * 60))

    setAmbulances((current) =>
      current.map((ambulance) => {
        if (ambulance.id !== nearestAmbulance.id) return ambulance
        return {
          ...ambulance,
          status: 'En Route',
          condition: emergencyCase.severity === 'Critical' ? 'Critical' : ambulance.condition,
          assignedCaseId: emergencyCase.caseId,
          assignedHospitalName: hospitalData.name,
          missionTarget: {
            lat: hospitalData.coords.lat,
            lng: hospitalData.coords.lng,
          },
          target: clampToAndhraPradesh({
            lat: hospitalData.coords.lat,
            lng: hospitalData.coords.lng,
          }),
          // Keep ambulance motion visibly slower for emergency transport tracking.
          speedKmph: Math.min(Math.max(ambulance.speedKmph || 32, 22), 30),
          etaMinutes,
        }
      }),
    )

    const nextEta = `${etaMinutes} Min`
    setSelectedAmbulanceId(nearestAmbulance.id)
    setEmergencyCases((current) =>
      current.map((emergency) =>
        emergency.caseId === emergencyCase.caseId
          ? { ...emergency, ambulanceId: nearestAmbulance.id, eta: nextEta }
          : emergency,
      ),
    )
    setSelectedEmergency((current) =>
      current?.caseId === emergencyCase.caseId
        ? { ...current, ambulanceId: nearestAmbulance.id, eta: nextEta }
        : current,
    )

    return {
      ambulanceId: nearestAmbulance.id,
      eta: nextEta,
      distanceKm: nearestAmbulance.dispatchDistanceKm,
    }
  }

  // Move ambulances continuously within Andhra Pradesh bounds.
  useEffect(() => {
    const tickMs = 1100
    const timer = setInterval(() => {
      setAmbulances((current) =>
        current.map((ambulance) => {
          const activeMissionTarget = ambulance.missionTarget || null
          const target = activeMissionTarget || ambulance.target || pickNextTarget(ambulance.location, ambulance.district)
          const distanceToTarget = calculateDistance(
            ambulance.location.lat,
            ambulance.location.lng,
            target.lat,
            target.lng,
          )

          if (distanceToTarget < 0.06 && activeMissionTarget) {
            return {
              ...ambulance,
              location: clampToAndhraPradesh(target),
              target: clampToAndhraPradesh(target),
              missionTarget: null,
              assignedCaseId: null,
              status: 'Arrived',
              condition: 'Stable',
              etaMinutes: 1,
            }
          }

          if (distanceToTarget < 0.18) {
            const nextStatus = Math.random() < 0.28 ? 'Available' : 'En Route'
            return {
              ...ambulance,
              location: clampToAndhraPradesh(target),
              target: pickNextTarget(target, ambulance.district),
              speedKmph: randomBetween(32, 66),
              status: nextStatus,
              condition: nextStatus === 'Available' ? 'Idle' : ambulance.condition,
              etaMinutes: Math.round(randomBetween(3, 10)),
            }
          }

          const effectiveSpeedKmph = activeMissionTarget
            ? Math.min(Math.max(ambulance.speedKmph || 28, 22), 30)
            : ambulance.speedKmph
          const stepKm = (effectiveSpeedKmph * tickMs) / 3600000
          const ratio = Math.min(1, stepKm / Math.max(distanceToTarget, 0.0001))
          const nextPoint = clampToAndhraPradesh({
            lat: ambulance.location.lat + (target.lat - ambulance.location.lat) * ratio,
            lng: ambulance.location.lng + (target.lng - ambulance.location.lng) * ratio,
          })

          const heading = ((Math.atan2(target.lng - nextPoint.lng, target.lat - nextPoint.lat) * 180) / Math.PI + 360) % 360
          const etaMinutes = Math.max(1, Math.ceil((distanceToTarget / Math.max(effectiveSpeedKmph, 1)) * 60))

          return {
            ...ambulance,
            location: nextPoint,
            target,
            heading,
            speedKmph: effectiveSpeedKmph,
            etaMinutes,
            status: 'En Route',
          }
        }),
      )
    }, tickMs)

    return () => clearInterval(timer)
  }, [])

  // QAOA-based hospital assignment
  const handleAssignHospitalQAOA = async () => {
    setIsAssigningHospital(true)
    pushAction('Running QAOA optimization to assign nearest hospital...')
    addNotification('Assigning hospital using quantum optimization...', 'info')

    try {
      if (!selectedEmergency) {
        throw new Error('Select an emergency case before assigning a hospital')
      }
      const currentEmergency = selectedEmergency
      const ambulanceDistrict = selectedAmbulance?.district || selectedAmbulance?.location?.district || 'All'

      const severityWeight = currentEmergency.severity === 'Critical'
        ? 1.4
        : currentEmergency.severity === 'Severe'
          ? 1.2
          : 1.0

      // Get hospitals in ambulance district or all if needed
      const relevantHospitals = ambulanceDistrict === 'All'
        ? Object.entries(hospitalLocations)
        : Object.entries(hospitalLocations).filter(([_, coords]) =>
            coords.district === ambulanceDistrict
          )

      // Calculate distances and create optimization data
      const hospitalsWithDistance = relevantHospitals.map(([name, coords]) => ({
        name,
        coords,
        distance: calculateDistance(
          selectedAmbulance.location.lat, selectedAmbulance.location.lng,
          coords.lat, coords.lng
        ),
        beds: coords.beds,
        doctors: coords.doctors,
        availableRooms: hospitalRoomAvailability[name] ?? coords.beds,
      })).map((hospital) => {
        const availabilityPenalty = hospital.availableRooms > 0 ? 1 / hospital.availableRooms : 10
        const doctorPenalty = 1 / Math.max(hospital.doctors, 1)
        const score = hospital.distance * severityWeight + availabilityPenalty * 3 + doctorPenalty
        return {
          ...hospital,
          score,
        }
      }).sort((a, b) => a.score - b.score)

      const hospitalsWithCapacity = hospitalsWithDistance.filter((item) => item.availableRooms > 0)
      const candidateHospitals = hospitalsWithCapacity.length ? hospitalsWithCapacity : hospitalsWithDistance

      // Prepare QAOA request for top 5 nearest hospitals
      const topHospitals = candidateHospitals.slice(0, Math.min(5, candidateHospitals.length))

      const patients = [{
        id: selectedEmergency.caseId,
        priority: selectedEmergency.severity === 'Critical' ? 1.5 : 1.0
      }]

      const rooms = topHospitals.map((h) => h.name)
      const costMatrix = [topHospitals.map((h) => Number(h.score.toFixed(4)))]

      console.log('QAOA Hospital Assignment Request:', { patients, rooms, topHospitals })

      const response = await fetch('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patients, rooms, costMatrix })
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}))
        throw new Error(errorBody?.detail || errorBody?.error || `QAOA optimization failed (${response.status})`)
      }

      const result = await response.json()
      console.log('QAOA Assignment Result:', result)

      const assignedHospitalName = result.assignments[0]?.room || topHospitals[0].name
      const assignedData = hospitalsWithDistance.find((hospital) => hospital.name === assignedHospitalName) || topHospitals[0]

      const dispatch = dispatchNearestAmbulanceToHospital(assignedData, currentEmergency)

      setAssignedHospital(assignedData)
      setSelectedHospital(assignedHospitalName)
      setQaoaAssignmentsByCase((current) => ({
        ...current,
        [currentEmergency.caseId]: assignedData,
      }))
      setEmergencyCases((current) =>
        current.map((emergency) =>
          emergency.caseId === currentEmergency.caseId
            ? {
                ...emergency,
                assignedHospital: {
                  name: assignedHospitalName,
                  district: assignedData.coords?.district,
                  lat: assignedData.coords?.lat,
                  lng: assignedData.coords?.lng,
                },
              }
            : emergency,
        ),
      )
      setSelectedEmergency((current) =>
        current?.caseId === currentEmergency.caseId
          ? {
              ...current,
              assignedHospital: {
                name: assignedHospitalName,
                district: assignedData.coords?.district,
                lat: assignedData.coords?.lat,
                lng: assignedData.coords?.lng,
              },
            }
          : current,
      )

      const assignedHospitalData = {
        caseId: currentEmergency.caseId,
        ambulanceId: dispatch?.ambulanceId || currentEmergency.ambulanceId,
        patientName: currentEmergency.patientName,
        age: currentEmergency.age,
        incident: currentEmergency.incident,
        location: currentEmergency.location,
        severity: currentEmergency.severity,
        injuries: currentEmergency.injuries,
        eta: dispatch?.eta || currentEmergency.eta,
        assignedHospital: {
          name: assignedHospitalName,
          distance: assignedData.distance,
          beds: assignedData.availableRooms,
          doctors: assignedData.doctors,
          district: assignedData.coords.district,
        },
        status: 'Assigned'
      }

      // Save to MongoDB
      try {
        const mongoResponse = await fetch('/api/emergency-cases', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(assignedHospitalData)
        })

        if (mongoResponse.ok) {
          const savedCase = await mongoResponse.json()
          console.log('Emergency case saved to MongoDB:', savedCase)
          addNotification(`Case ${currentEmergency.caseId} saved to MongoDB`, 'success')
        } else {
          console.warn('Could not save to MongoDB:', mongoResponse.status)
        }
      } catch (mongoError) {
        console.warn('MongoDB save failed:', mongoError.message)
      }

      setAssignedHospital(assignedData)
      setSelectedHospital(assignedHospitalName)

      addNotification(`Hospital assigned: ${assignedHospitalName} (${assignedData.distance.toFixed(1)} km)`, 'success')
      pushAction(`Assigned ${assignedHospitalName} - ${assignedData.distance.toFixed(1)}km away, ${assignedData.beds} beds, ${assignedData.doctors} doctors`)

      // Send email immediately after assignment when notifications are enabled.
      if (systemSettings.notifyCareTeams) {
        try {
          const assignmentNotifyPayload = {
            caseDetails: {
              ...currentEmergency,
              eta: dispatch?.eta || currentEmergency.eta,
            },
            assignedHospital: {
              name: assignedHospitalName,
              distance: assignedData.distance,
              district: assignedData.coords?.district || assignedData.district,
              availableRooms: assignedData.availableRooms || assignedData.beds,
              doctors: assignedData.doctors,
            },
            recipients: {
              email: DEFAULT_ALERT_EMAIL,
              phone: null,
            },
          }

          const assignmentNotifyResponse = await fetch('/api/emergency/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(assignmentNotifyPayload),
          })

          const assignmentNotifyResult = await assignmentNotifyResponse.json().catch(() => null)
          const emailSent = Boolean(assignmentNotifyResult?.channels?.email?.sent)

          if (!assignmentNotifyResponse.ok || !emailSent) {
            throw new Error(assignmentNotifyResult?.error || assignmentNotifyResult?.message || 'Assignment email failed')
          }

          addNotification(`Assignment email sent to ${DEFAULT_ALERT_EMAIL}`, 'success')
          pushAction(`Assignment email sent to ${DEFAULT_ALERT_EMAIL}`)
        } catch (assignmentNotifyError) {
          console.warn('Assignment email could not be sent:', assignmentNotifyError.message)
          addNotification('Hospital assigned, but assignment email failed to send', 'warning')
        }
      } else {
        addNotification('Hospital assigned. Care-team notifications are disabled in Settings.', 'info')
        pushAction('Notification skipped because Notify care teams is disabled')
      }

    } catch (error) {
      console.error('Hospital assignment error:', error)
      addNotification(`Assignment failed: ${error.message}`, 'error')

      // Fallback: assign nearest hospital
      const nearest = Object.entries(hospitalLocations)
        .map(([name, coords]) => ({
          name,
          coords,
          distance: calculateDistance(
            selectedAmbulance.location.lat, selectedAmbulance.location.lng,
            coords.lat, coords.lng
          )
        }))
        .sort((a, b) => a.distance - b.distance)[0]

      setAssignedHospital(nearest)
      setSelectedHospital(nearest.name)
      setQaoaAssignmentsByCase((current) => ({
        ...current,
        [selectedEmergency.caseId]: nearest,
      }))
      setEmergencyCases((current) =>
        current.map((emergency) =>
          emergency.caseId === selectedEmergency.caseId
            ? {
                ...emergency,
                assignedHospital: {
                  name: nearest.name,
                  district: nearest.coords?.district,
                  lat: nearest.coords?.lat,
                  lng: nearest.coords?.lng,
                },
              }
            : emergency,
        ),
      )
      const fallbackDispatch = dispatchNearestAmbulanceToHospital(nearest, selectedEmergency)
      addNotification(`Fallback: Assigned nearest hospital - ${nearest.name}`, 'warning')
      if (fallbackDispatch) {
        addNotification(`${fallbackDispatch.ambulanceId} redirected via fallback (ETA ${fallbackDispatch.eta})`, 'info')
      }
    } finally {
      setIsAssigningHospital(false)
    }
  }

  const handlePrepareERTeam = () => {
    if (!systemSettings.notifyCareTeams) {
      addNotification('Notify care teams is disabled in Settings', 'warning')
      pushAction('Enable Notify care teams in Settings to send ER notifications')
      return
    }

    setShowERDialog(true)
    pushAction('Preparing ER team...')
    addNotification('ER Team notification sent', 'success')
  }

  const handleSharePatientInfo = () => {
    if (!systemSettings.notifyCareTeams) {
      addNotification('Notify care teams is disabled in Settings', 'warning')
      pushAction('Enable Notify care teams in Settings to share patient info')
      return
    }

    setShowPatientDialog(true)
    pushAction('Sharing patient information...')
    addNotification('Patient info shared with assigned hospital', 'success')
  }

  const handleDismissAlert = () => {
    if (confirm('Are you sure you want to dismiss this emergency alert?')) {
      // Remove the current emergency from the list
      const updatedCases = emergencyCases.filter((e) => e.caseId !== selectedEmergency.caseId)
      setEmergencyCases(updatedCases)

      // Clear hospital assignments
      setAssignedHospital(null)
      setSelectedHospital(null)

      // Select the next emergency if available
      if (updatedCases.length > 0) {
        setSelectedEmergency(updatedCases[0])
        pushAction(`Emergency ${selectedEmergency.caseId} dismissed - Switched to ${updatedCases[0].caseId}`)
        addNotification(`Emergency ${selectedEmergency.caseId} dismissed`, 'info')
      } else {
        setSelectedEmergency(null)
        pushAction('All emergency alerts cleared')
        addNotification('All emergency cases dismissed', 'success')
      }
    }
  }

  const handleRedEntry = () => {
    if (!selectedEmergency) {
      return
    }

    setEmergencyCases((current) =>
      current.map((emergency) =>
        emergency.caseId === selectedEmergency.caseId
          ? {
              ...emergency,
              severity: 'Critical',
              triage: 'Red Entry',
            }
          : emergency,
      ),
    )

    setSelectedEmergency((current) =>
      current
        ? {
            ...current,
            severity: 'Critical',
            triage: 'Red Entry',
          }
        : current,
    )

    setAmbulances((current) =>
      current.map((ambulance) =>
        ambulance.id === selectedEmergency.ambulanceId
          ? {
              ...ambulance,
              condition: 'Critical',
              status: 'En Route',
            }
          : ambulance,
      ),
    )

    addNotification(`Case ${selectedEmergency.caseId} marked as Red Entry`, 'warning')
    pushAction(`Case ${selectedEmergency.caseId} marked as Red Entry`)
  }

  const handleSendAlert = async () => {
    if (!systemSettings.notifyCareTeams) {
      addNotification('Notify care teams is disabled in System Settings', 'warning')
      pushAction('Alert blocked because Notify care teams is disabled')
      return
    }

    if (!assignedHospital) {
      addNotification('Please assign a hospital first before sending alert', 'warning')
      pushAction('Assign hospital first before sending alert')
      return
    }

    pushAction('Sending emergency alert to hospitals...')
    addNotification('Sending emergency alert to nearby hospitals...', 'info')

    try {
      setTimeout(async () => {
        const notifyPayload = {
          caseDetails: selectedEmergency,
          assignedHospital: {
            name: assignedHospital.name,
            distance: assignedHospital.distance,
            district: assignedHospital.coords?.district || assignedHospital.district,
            availableRooms: assignedHospital.availableRooms || assignedHospital.beds,
            doctors: assignedHospital.doctors,
          },
          recipients: {
            email: DEFAULT_ALERT_EMAIL,
            phone: DEFAULT_ALERT_PHONE,
          },
        }

        let notifyResponsePayload = null
        try {
          const notifyResponse = await fetch('/api/emergency/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(notifyPayload),
          })
          notifyResponsePayload = await notifyResponse.json().catch(() => null)
          if (!notifyResponse.ok) {
            throw new Error(notifyResponsePayload?.error || 'Emergency alert API failed')
          }
        } catch (notifyError) {
          console.warn('Notification provider issue:', notifyError.message)
        }

        // Update MongoDB with alert status
        try {
          // First, try to find the existing case
          const fetchExisting = await fetch(`/api/emergency-cases?caseId=${selectedEmergency.caseId}`)
          let existingCase = null

          if (fetchExisting.ok) {
            const cases = await fetchExisting.json()
            existingCase = cases.find((c) => c.caseId === selectedEmergency.caseId)
          }

          const updateData = {
            caseId: selectedEmergency.caseId,
            ambulanceId: selectedEmergency.ambulanceId,
            patientName: selectedEmergency.patientName,
            age: selectedEmergency.age,
            incident: selectedEmergency.incident,
            location: selectedEmergency.location,
            severity: selectedEmergency.severity,
            injuries: selectedEmergency.injuries,
            eta: selectedEmergency.eta,
            assignedHospital: {
              name: assignedHospital.name,
              distance: assignedHospital.distance,
              beds: assignedHospital.availableRooms || assignedHospital.beds,
              doctors: assignedHospital.doctors,
              district: assignedHospital.coords?.district || assignedHospital.district,
            },
            status: 'In Transit'
          }

          if (existingCase) {
            // Update existing case
            const response = await fetch(`/api/emergency-cases/${existingCase._id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updateData)
            })

            if (response.ok) {
              console.log('Emergency case updated in MongoDB with alert status')
            }
          } else {
            // Create new case
            const response = await fetch('/api/emergency-cases', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updateData)
            })

            if (response.ok) {
              console.log('Emergency case created in MongoDB with alert sent')
            }
          }
        } catch (mongoError) {
          console.warn('Could not update MongoDB:', mongoError.message)
        }

        const channelSummary = notifyResponsePayload?.channels
          ? `email:${notifyResponsePayload.channels.email?.sent ? 'ok' : 'skip'}, voice:${notifyResponsePayload.channels.voice?.sent ? 'ok' : 'skip'}, sms:${notifyResponsePayload.channels.sms?.sent ? 'ok' : 'skip'}`
          : 'email/voice/sms status unavailable'

        addNotification(`Emergency alert sent to ${assignedHospital.name} (${channelSummary})`, 'success')
        pushAction(`Alert sent to ${assignedHospital.name} | ${selectedEmergency.patientName} | ${selectedEmergency.incident} | ${channelSummary}`)
      }, 1000)
    } catch (error) {
      addNotification(`Failed to send alert: ${error.message}`, 'error')
      pushAction(`Error sending alert: ${error.message}`)
    }
  }

  const handleEmergencyVoiceCall = async () => {
    if (!selectedEmergency) {
      addNotification('Select an emergency case before placing a voice call', 'warning')
      return
    }

    if (!assignedHospital) {
      addNotification('Assign hospital first, then trigger emergency voice call', 'warning')
      return
    }

    pushAction(`Triggering emergency voice call for ${selectedEmergency.caseId}`)
    addNotification(`Placing emergency voice call to ${DEFAULT_ALERT_PHONE}...`, 'info')

    try {
      const payload = {
        phone: DEFAULT_ALERT_PHONE,
        caseDetails: selectedEmergency,
        assignedHospital: {
          name: assignedHospital.name,
          distance: assignedHospital.distance,
          availableRooms: assignedHospital.availableRooms || assignedHospital.beds,
          doctors: assignedHospital.doctors,
          district: assignedHospital.coords?.district || assignedHospital.district,
        },
      }

      const response = await fetch('/api/emergency/voice-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.success) {
        throw new Error(data.reason || data.message || 'Voice call could not be started')
      }

      addNotification(`? Emergency voice call started (${DEFAULT_ALERT_PHONE})`, 'success')
      pushAction(`? Voice call started for ${selectedEmergency.caseId} � SID: ${data.callSid || 'n/a'}`)
    } catch (error) {
      addNotification(`Voice call failed: ${error.message}`, 'error')
      pushAction(`? Voice call failed: ${error.message}`)
    }
  }

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapRef.current || googleMapRef.current) return

    const andhraPradeshCenter = [15.4909, 78.6569] // [lat, lng]
    const apBounds = L.latLngBounds(
      [andhraPradeshBounds.minLat, andhraPradeshBounds.minLng],
      [andhraPradeshBounds.maxLat, andhraPradeshBounds.maxLng],
    )

    // Create map
    const map = L.map(mapRef.current, {
      maxBounds: apBounds,
      maxBoundsViscosity: 0.85,
    }).setView(andhraPradeshCenter, 8)

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '� OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map)

    googleMapRef.current = map

    return () => {
      map.remove()
      googleMapRef.current = null
    }
  }, [])

  // Update hospital markers when district or assignment changes.
  useEffect(() => {
    if (!googleMapRef.current) return

    const map = googleMapRef.current

    // Remove only previously created hospital markers.
    hospitalMarkersRef.current.forEach((marker) => {
      if (marker && map.hasLayer(marker)) {
        map.removeLayer(marker)
      }
    })
    hospitalMarkersRef.current = []

    // Create custom icon for hospitals
    const createHospitalIcon = (district, isAssigned = false) => {
      const color = isAssigned ? '#10b981' : (district === 'Coastal Andhra' ? '#ef4444' : '#3b82f6')
      return L.divIcon({
        html: `
          <div style="
            background: ${color};
            border: 3px solid white;
            border-radius: 50%;
            width: ${isAssigned ? 32 : 24}px;
            height: ${isAssigned ? 32 : 24}px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            font-weight: bold;
            color: white;
            font-size: ${isAssigned ? 16 : 12}px;
            ${isAssigned ? 'animation: pulse 2s infinite;' : ''}
          ">H</div>
        `,
        iconSize: [isAssigned ? 32 : 24, isAssigned ? 32 : 24],
        className: 'hospital-icon',
      })
    }

    // Add hospital markers based on filter
    filteredHospitals.forEach(([name, coords]) => {
      const isAssigned = assignedHospital && assignedHospital.name === name
      const marker = L.marker([coords.lat, coords.lng], {
        icon: createHospitalIcon(coords.district, isAssigned),
      }).addTo(map)
      hospitalMarkersRef.current.push(marker)

      const distance = calculateDistance(
        selectedAmbulance.location.lat, selectedAmbulance.location.lng,
        coords.lat, coords.lng
      )

      const popupContent = `
        <div style="font-family: Arial; font-size: 12px; min-width: 180px;">
          <h4 style="margin: 0 0 8px 0; color: #0f2241; font-size: 14px;">${name}</h4>
          ${isAssigned ? '<p style="margin: 4px 0; color: #10b981; font-weight: bold;">? Assigned Hospital</p>' : ''}
          <div style="border-top: 1px solid #ddd; padding-top: 8px;">
            <p style="margin: 4px 0; color: #555;"><strong>District:</strong> ${coords.district}</p>
            <p style="margin: 4px 0; color: #555;"><strong>Available Beds:</strong> ${coords.beds}</p>
            <p style="margin: 4px 0; color: #555;"><strong>ER Doctors:</strong> ${coords.doctors}</p>
            <p style="margin: 4px 0; color: #555;"><strong>Distance:</strong> ${distance.toFixed(1)} km</p>
          </div>
        </div>
      `

      marker.bindPopup(popupContent, {
        maxWidth: 280,
        className: 'hospital-popup'
      })

      marker.on('click', () => {
        setSelectedHospital(name)
        pushAction(`Selected hospital: ${name}`)
      })
    })

    // Add custom CSS for animations
    if (!document.querySelector('style[data-map-animations]')) {
      const style = document.createElement('style')
      style.setAttribute('data-map-animations', 'true')
      style.textContent = `
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.8; }
        }
        @keyframes ambulanceMissionPulse {
          0% { transform: scale(1); filter: drop-shadow(0 0 0 rgba(239, 68, 68, 0.0)); }
          50% { transform: scale(1.18); filter: drop-shadow(0 0 8px rgba(239, 68, 68, 0.75)); }
          100% { transform: scale(1); filter: drop-shadow(0 0 0 rgba(239, 68, 68, 0.0)); }
        }
        .ambulance-live-marker-wrap {
          background: transparent !important;
          border: none !important;
        }
        .ambulance-live-marker {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 26px;
          height: 26px;
          background: transparent;
          border: none;
          box-shadow: none;
          transform: translateZ(0);
        }
        .ambulance-live-marker.is-selected {
          background: transparent;
          box-shadow: none;
        }
        .ambulance-live-marker.is-assigned {
          background: transparent;
          box-shadow: none;
        }
        .ambulance-live-marker.is-assigned.is-selected {
          background: transparent;
        }
        .ambulance-live-marker.is-active-mission {
          animation: ambulanceMissionPulse 1.1s ease-in-out infinite;
        }
        .ambulance-live-marker__emoji {
          font-size: 24px;
          line-height: 1;
          width: 24px;
          display: inline-flex;
          justify-content: center;
          font-family: "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif;
        }
        .ambulance-live-marker__fallback {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 22px;
          height: 22px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.2);
          font-size: 10px;
          font-weight: 700;
        }
        .ambulance-live-marker__id {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.2px;
          line-height: 1;
        }
        .ambulance-label {
          background: rgba(15, 34, 65, 0.94) !important;
          color: #fff !important;
          border: 1px solid rgba(255, 255, 255, 0.92) !important;
          border-radius: 999px !important;
          padding: 2px 8px !important;
          font-size: 11px !important;
          font-weight: 700;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.28) !important;
        }
        .ambulance-label.is-selected {
          background: rgba(249, 115, 22, 0.98) !important;
        }
        .ambulance-label::before {
          display: none !important;
        }
        .ambulance-center-emoji {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          color: #fff !important;
          font-size: 18px !important;
          font-weight: 700;
          margin: 0 !important;
          padding: 0 !important;
          line-height: 1 !important;
        }
        .ambulance-center-emoji::before {
          display: none !important;
        }
        .hospital-popup h4 { font-weight: bold; }
        .ambulance-popup h4 { font-weight: bold; }
      `
      document.head.appendChild(style)
    }

    // Adjust map bounds to show all markers
    if (filteredHospitals.length > 0) {
      const bounds = L.latLngBounds(
        filteredHospitals.map(([_, coords]) => [coords.lat, coords.lng])
      )
      // Include all ambulances in initial bounds.
      ambulances.forEach((ambulance) => bounds.extend([ambulance.location.lat, ambulance.location.lng]))
      if (!hasFittedBoundsRef.current) {
        map.fitBounds(bounds, { padding: [50, 50] })
        hasFittedBoundsRef.current = true
      }
    }
  }, [selectedDistrict, assignedHospital, filteredHospitals, selectedAmbulance])

  // Keep ambulance markers persistent and update positions smoothly like ride-hailing tracking.
  useEffect(() => {
    if (!googleMapRef.current) return

    const map = googleMapRef.current
    const activeIds = new Set(ambulances.map((ambulance) => ambulance.id))

    ambulances.forEach((ambulance) => {
      const isSelected = selectedAmbulance?.id === ambulance.id
      const emergencyForAmbulance = emergencyCases.find((e) => e.ambulanceId === ambulance.id)
      const isAssignedToEmergency = Boolean(
        emergencyForAmbulance && (
          qaoaAssignmentsByCase[emergencyForAmbulance.caseId] ||
          emergencyForAmbulance.assignedHospital ||
          (selectedEmergency?.caseId === emergencyForAmbulance.caseId && assignedHospital)
        ),
      )
      const isActiveMission = Boolean(ambulance.missionTarget && ambulance.assignedCaseId)
      const offset = getAmbulanceVisualOffset(ambulance.id)
      const displayLat = ambulance.location.lat + offset.lat
      const displayLng = ambulance.location.lng + offset.lng
      const markerIcon = L.divIcon({
        html: `
          <div class="ambulance-live-marker${isSelected ? ' is-selected' : ''}${isAssignedToEmergency ? ' is-assigned' : ''}${isActiveMission ? ' is-active-mission' : ''}">
            <span class="ambulance-live-marker__emoji" role="img" aria-label="ambulance">🚑</span>
          </div>
        `,
        className: 'ambulance-live-marker-wrap',
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      })

      let marker = ambulanceMarkersRef.current[ambulance.id]
      if (!marker) {
        marker = L.marker([displayLat, displayLng], {
          icon: markerIcon,
          zIndexOffset: isSelected ? 8000 : 7000,
          riseOnHover: true,
          isAmbulanceMarker: true,
        }).addTo(map)

        marker.on('click', () => {
          setSelectedAmbulanceId(ambulance.id)
          const emergencyForAmbulance = emergencyCases.find((e) => e.ambulanceId === ambulance.id)
          if (emergencyForAmbulance) {
            setSelectedEmergency(emergencyForAmbulance)
            pushAction(`${ambulance.id} - ${emergencyForAmbulance.incident}`)
          } else {
            pushAction(`${ambulance.id} - ${ambulance.status}`)
          }
        })

        ambulanceMarkersRef.current[ambulance.id] = marker
        ambulanceHistoryRef.current[ambulance.id] = [[ambulance.location.lat, ambulance.location.lng]]
      } else {
        marker.setIcon(markerIcon)
        marker.setZIndexOffset(isSelected ? 8000 : 7000)
        marker.setLatLng([displayLat, displayLng])
      }

      if (typeof marker.bringToFront === 'function') {
        marker.bringToFront()
      }

      marker.bindPopup(`
        <div style="font-family: Arial; font-size: 12px; min-width: 230px;">
          <h4 style="margin: 0 0 8px 0; color: #0f2241; font-size: 14px;">AMB ${ambulance.id}</h4>
          <div style="border-top: 1px solid #ddd; padding-top: 8px;">
            <p style="margin: 4px 0; color: #555;"><strong>Status:</strong> ${ambulance.status}</p>
            <p style="margin: 4px 0; color: #555;"><strong>Speed:</strong> ${ambulance.speedKmph.toFixed(0)} km/h</p>
            <p style="margin: 4px 0; color: #555;"><strong>ETA:</strong> ${ambulance.etaMinutes} min</p>
            ${emergencyForAmbulance ? `<p style="margin: 4px 0; color: #555;"><strong>Case:</strong> ${emergencyForAmbulance.caseId} - ${emergencyForAmbulance.incident}</p>` : ''}
            <p style="margin: 4px 0; color: #f59e0b;"><strong>Condition:</strong> ${ambulance.condition}</p>
          </div>
        </div>
      `, { maxWidth: 300, className: 'ambulance-popup' })

      const history = ambulanceHistoryRef.current[ambulance.id] || []
      history.push([ambulance.location.lat, ambulance.location.lng])
      if (history.length > 15) history.shift()
      ambulanceHistoryRef.current[ambulance.id] = history

      let trail = ambulanceTrailsRef.current[ambulance.id]
      if (!trail) {
        trail = L.polyline(history, {
          color: isSelected ? '#f97316' : '#f59e0b',
          weight: isSelected ? 4 : 3,
          opacity: 0.7,
          dashArray: '5, 9',
        }).addTo(map)
        ambulanceTrailsRef.current[ambulance.id] = trail
      } else {
        trail.setLatLngs(history)
        trail.setStyle({ color: isSelected ? '#f97316' : '#f59e0b', weight: isSelected ? 4 : 3 })
      }
    })

    Object.keys(ambulanceMarkersRef.current).forEach((id) => {
      if (activeIds.has(id)) return
      const marker = ambulanceMarkersRef.current[id]
      const trail = ambulanceTrailsRef.current[id]
      if (marker) map.removeLayer(marker)
      if (trail) map.removeLayer(trail)
      delete ambulanceMarkersRef.current[id]
      delete ambulanceTrailsRef.current[id]
      delete ambulanceHistoryRef.current[id]
    })
  }, [ambulances, emergencyCases, selectedAmbulance, qaoaAssignmentsByCase, selectedEmergency, assignedHospital])

  // Follow the selected ambulance smoothly on the map.
  useEffect(() => {
    if (!googleMapRef.current || !selectedAmbulance || !followSelectedAmbulance) return

    const map = googleMapRef.current
    const now = Date.now()
    if (now - lastPanAtRef.current < 1100) return

    lastPanAtRef.current = now
    map.panTo([selectedAmbulance.location.lat, selectedAmbulance.location.lng], {
      animate: true,
      duration: 0.9,
      easeLinearity: 0.25,
    })
  }, [selectedAmbulance, followSelectedAmbulance])

  // Highlight current route corridor from selected ambulance to assigned hospital.
  useEffect(() => {
    if (!googleMapRef.current) return

    const map = googleMapRef.current
    const start = selectedAmbulance?.location
    const end = assignedHospital?.coords

    if (!showRouteCorridor || !start || !end) {
      if (routeAbortRef.current) {
        routeAbortRef.current.abort()
        routeAbortRef.current = null
      }
      if (routeCorridorRef.current) {
        map.removeLayer(routeCorridorRef.current)
        routeCorridorRef.current = null
      }
      if (routeLineRef.current) {
        map.removeLayer(routeLineRef.current)
        routeLineRef.current = null
      }
      setSelectedRouteMetrics(null)
      return
    }

    const now = Date.now()
    const cached = lastRoadRouteRef.current
    const cachedStart = cached.start
    const cachedEnd = cached.end
    const startMovedKm = cachedStart
      ? calculateDistance(start.lat, start.lng, cachedStart.lat, cachedStart.lng)
      : Number.POSITIVE_INFINITY
    const endMovedKm = cachedEnd
      ? calculateDistance(end.lat, end.lng, cachedEnd.lat, cachedEnd.lng)
      : Number.POSITIVE_INFINITY

    const needsRefresh =
      !cached.points ||
      now - cached.fetchedAt > 9000 ||
      startMovedKm > 0.8 ||
      endMovedKm > 0.2

    const renderRoute = (routePoints) => {
      if (!routeCorridorRef.current) {
        routeCorridorRef.current = L.polyline(routePoints, {
          color: '#60a5fa',
          weight: 14,
          opacity: 0.25,
          lineJoin: 'round',
        }).addTo(map)
      } else {
        routeCorridorRef.current.setLatLngs(routePoints)
      }

      if (!routeLineRef.current) {
        routeLineRef.current = L.polyline(routePoints, {
          color: '#1d4ed8',
          weight: 5,
          opacity: 0.95,
          lineCap: 'round',
        }).addTo(map)
      } else {
        routeLineRef.current.setLatLngs(routePoints)
        routeLineRef.current.setStyle({
          color: '#1d4ed8',
          weight: 5,
          opacity: 0.95,
        })
      }
    }

    if (!needsRefresh && cached.points) {
      renderRoute(cached.points)
      return
    }

    const controller = new AbortController()
    if (routeAbortRef.current) routeAbortRef.current.abort()
    routeAbortRef.current = controller

    const fetchRoadRoute = async () => {
      const fallbackRoute = [
        [start.lat, start.lng],
        [end.lat, end.lng],
      ]

      try {
        const coordinates = `${start.lng},${start.lat};${end.lng},${end.lat}`
        const url = `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson&steps=false`
        const response = await fetch(url, { signal: controller.signal })
        if (!response.ok) throw new Error(`Route API ${response.status}`)

        const data = await response.json()
        const geometry = data?.routes?.[0]?.geometry?.coordinates
        const routeMeta = data?.routes?.[0]
        const roadPoints = Array.isArray(geometry)
          ? geometry.map(([lng, lat]) => [lat, lng])
          : null

        if (!roadPoints || roadPoints.length < 2) {
          throw new Error('Invalid route geometry')
        }

        lastRoadRouteRef.current = {
          fetchedAt: Date.now(),
          start: { lat: start.lat, lng: start.lng },
          end: { lat: end.lat, lng: end.lng },
          points: roadPoints,
        }
        setSelectedRouteMetrics({
          durationMin: (routeMeta?.duration || 0) / 60,
          distanceKm: (routeMeta?.distance || 0) / 1000,
        })
        renderRoute(roadPoints)
      } catch (error) {
        if (controller.signal.aborted) return
        const fallbackDistanceKm = calculateDistance(start.lat, start.lng, end.lat, end.lng)
        const fallbackDurationMin = (fallbackDistanceKm / Math.max(selectedAmbulance?.speedKmph || 40, 1)) * 60
        lastRoadRouteRef.current = {
          fetchedAt: Date.now(),
          start: { lat: start.lat, lng: start.lng },
          end: { lat: end.lat, lng: end.lng },
          points: fallbackRoute,
        }
        setSelectedRouteMetrics({
          durationMin: fallbackDurationMin,
          distanceKm: fallbackDistanceKm,
        })
        renderRoute(fallbackRoute)
      }
    }

    fetchRoadRoute()

    return () => {
      controller.abort()
    }
  }, [selectedAmbulance, assignedHospital, showRouteCorridor])

  // Draw roadway paths for each active emergency ambulance.
  useEffect(() => {
    if (!googleMapRef.current) return

    const map = googleMapRef.current
    const activeAmbulanceIds = new Set(emergencyCases.map((emergency) => emergency.ambulanceId))

    if (ambulanceRoadAbortRef.current) {
      ambulanceRoadAbortRef.current.abort()
    }
    const controller = new AbortController()
    ambulanceRoadAbortRef.current = controller

    const pickDestinationHospital = (ambulance, emergency) => {
      const caseAssignment = qaoaAssignmentsByCase[emergency.caseId]
      if (caseAssignment?.coords) {
        return {
          name: caseAssignment.name,
          lat: caseAssignment.coords.lat,
          lng: caseAssignment.coords.lng,
        }
      }

      const emergencyAssignedName = emergency?.assignedHospital?.name
      if (emergencyAssignedName && hospitalLocations[emergencyAssignedName]) {
        const assignedCoords = hospitalLocations[emergencyAssignedName]
        return {
          name: emergencyAssignedName,
          lat: assignedCoords.lat,
          lng: assignedCoords.lng,
        }
      }

      const selectedCaseAssigned =
        assignedHospital &&
        selectedEmergency?.caseId === emergency.caseId &&
        assignedHospital.coords

      if (selectedCaseAssigned) {
        return {
          name: assignedHospital.name,
          lat: assignedHospital.coords.lat,
          lng: assignedHospital.coords.lng,
        }
      }

      const hospitalsInDistrict = Object.entries(hospitalLocations)
        .filter(([_, coords]) => coords.district === ambulance.district)
        .map(([name, coords]) => ({ name, ...coords }))
      const candidates = hospitalsInDistrict.length > 0
        ? hospitalsInDistrict
        : Object.entries(hospitalLocations).map(([name, coords]) => ({ name, ...coords }))

      return candidates
        .map((hospital) => ({
          ...hospital,
          distance: calculateDistance(ambulance.location.lat, ambulance.location.lng, hospital.lat, hospital.lng),
        }))
        .sort((a, b) => a.distance - b.distance)[0]
    }

    const renderRoadway = (ambulanceId, points, isSelectedCase) => {
      let line = ambulanceRoadRoutesRef.current[ambulanceId]
      if (!line) {
        line = L.polyline(points, {
          color: isSelectedCase ? '#1d4ed8' : '#38bdf8',
          weight: isSelectedCase ? 6 : 4,
          opacity: isSelectedCase ? 0.96 : 0.88,
          lineCap: 'round',
        }).addTo(map)
        ambulanceRoadRoutesRef.current[ambulanceId] = line
      } else {
        line.setLatLngs(points)
        line.setStyle({
          color: isSelectedCase ? '#1d4ed8' : '#38bdf8',
          weight: isSelectedCase ? 6 : 4,
          opacity: isSelectedCase ? 0.96 : 0.88,
        })
      }

      if (typeof line.bringToBack === 'function') {
        line.bringToBack()
      }
    }

    const updateEmergencyRoadways = async () => {
      await Promise.all(
        emergencyCases.map(async (emergency) => {
          const ambulance = ambulances.find((item) => item.id === emergency.ambulanceId)
          if (!ambulance) return

          const destination = pickDestinationHospital(ambulance, emergency)
          if (!destination) return

          const start = { lat: ambulance.location.lat, lng: ambulance.location.lng }
          const end = { lat: destination.lat, lng: destination.lng }
          const isSelectedCase = selectedEmergency?.caseId === emergency.caseId

          const cacheKey = `${ambulance.id}:${start.lat.toFixed(2)},${start.lng.toFixed(2)}:${end.lat.toFixed(2)},${end.lng.toFixed(2)}`
          const cached = ambulanceRoadCacheRef.current[cacheKey]
          if (cached && Date.now() - cached.fetchedAt < 12000) {
            renderRoadway(ambulance.id, cached.points, isSelectedCase)
            return
          }

          const fallbackPoints = [
            [start.lat, start.lng],
            [end.lat, end.lng],
          ]

          try {
            const coordinates = `${start.lng},${start.lat};${end.lng},${end.lat}`
            const url = `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson&steps=false`
            const response = await fetch(url, { signal: controller.signal })
            if (!response.ok) throw new Error(`Route API ${response.status}`)

            const data = await response.json()
            const geometry = data?.routes?.[0]?.geometry?.coordinates
            const roadPoints = Array.isArray(geometry)
              ? geometry.map(([lng, lat]) => [lat, lng])
              : fallbackPoints

            ambulanceRoadCacheRef.current[cacheKey] = {
              fetchedAt: Date.now(),
              points: roadPoints,
            }
            renderRoadway(ambulance.id, roadPoints, isSelectedCase)
          } catch (error) {
            if (controller.signal.aborted) return
            renderRoadway(ambulance.id, fallbackPoints, isSelectedCase)
          }
        }),
      )
    }

    updateEmergencyRoadways()

    Object.keys(ambulanceRoadRoutesRef.current).forEach((ambulanceId) => {
      if (activeAmbulanceIds.has(ambulanceId)) return
      map.removeLayer(ambulanceRoadRoutesRef.current[ambulanceId])
      delete ambulanceRoadRoutesRef.current[ambulanceId]
    })

    return () => {
      controller.abort()
    }
  }, [ambulances, emergencyCases, selectedEmergency, assignedHospital, qaoaAssignmentsByCase])

  return (
    <div className="emergency-page">
      <div className="emergency-header">
        <div>
          <h2>Emergency Management</h2>
          <p className="panel-subtitle">Real-time hospital location mapping & live ambulance movement in Andhra Pradesh</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <select
            value={selectedDistrict}
            onChange={(e) => {
              setSelectedDistrict(e.target.value)
              pushAction(`District filter: ${e.target.value}`)
            }}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: '1px solid #d1d5db',
              fontSize: '0.9rem',
              cursor: 'pointer'
            }}
          >
            {districts.map((district) => (
              <option key={district} value={district}>{district}</option>
            ))}
          </select>
          <div className="emergency-search">
            <span className="search-icon" aria-hidden="true" />
            <input type="search" placeholder="Search hospitals..." aria-label="Search" />
          </div>
        </div>
      </div>

      {selectedEmergency ? (
        <section className="alert-banner">
          <div className="alert-left">
            <span className="alert-badge">Emergency Alert</span>
            <h3>Ambulance Reported Case: Nearby Hospitals Alert</h3>
            <div className="alert-meta">
              <span>Case {selectedEmergency.caseId}</span>
              <span>Patient: {selectedEmergency.patientName}</span>
              <span>{selectedEmergency.incident}</span>
              <span>{selectedEmergency.location}</span>
              <span>Ambulance ID: {selectedEmergency.ambulanceId}</span>
              <span>Arriving in {selectedEmergencyEta}</span>
              {selectedRouteMetrics && (
                <span>
                  Route ETA {formatRouteDuration(selectedRouteMetrics.durationMin)} � {selectedRouteMetrics.distanceKm.toFixed(1)} km
                </span>
              )}
              <span style={{ color: '#d97706', fontWeight: 'bold' }}>Severity: {selectedEmergency.severity}</span>
              {assignedHospital && (
                <span style={{ color: '#10b981', fontWeight: 'bold' }}>
                    ? Assigned: {assignedHospital.name} ({assignedHospital.availableRooms || assignedHospital.beds} rooms free)
                </span>
              )}
            </div>
          </div>
          <div className="alert-actions">
            <button
              className="outline-button"
              type="button"
              onClick={() => pushAction('Opening live ambulance feed')}
            >
              View Live Feed
            </button>
            <button
              className="primary-button"
              type="button"
              onClick={handleSendAlert}
              disabled={!assignedHospital}
            >
              {assignedHospital ? 'Send Alert' : 'Assign Hospital First'}
            </button>
          </div>
        </section>
      ) : (
        <section className="alert-banner" style={{ background: '#f0fdf4', borderColor: '#10b981' }}>
          <div className="alert-left">
            <span className="alert-badge" style={{ background: '#10b981' }}>All Clear</span>
            <h3>No Active Emergency Cases</h3>
            <p style={{ margin: '0.5rem 0 0 0', color: '#666' }}>
              All emergency cases have been handled. The system is monitoring for new incidents.
            </p>
          </div>
        </section>
      )}

      <div className="emergency-grid">
        <section className="panel map-panel">
          <div
            ref={mapRef}
            className="map-canvas"
            style={{
              width: '100%',
              height: '500px',
              borderRadius: '8px',
              overflow: 'hidden',
              border: '1px solid #d1e9f6',
              background: '#f0fbff'
            }}
          />

          <div className="panel-header">
            <div>
              <h3>Andhra Pradesh Hospital Network Map</h3>
              <p className="panel-subtitle">
                {filteredHospitals.length} hospitals in {selectedDistrict}
                {selectedHospital && ` - Selected: ${selectedHospital}`}
                {assignedHospital && ` - Assigned: ${assignedHospital.name} (${assignedHospital.distance.toFixed(1)} km)`}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '0.8rem', flexWrap: 'wrap' }}>
            <button
              className={followSelectedAmbulance ? 'primary-button' : 'outline-button'}
              type="button"
              onClick={() => setFollowSelectedAmbulance((prev) => !prev)}
            >
              {followSelectedAmbulance ? 'Follow Mode: ON' : 'Follow Mode: OFF'}
            </button>
            <button
              className={showRouteCorridor ? 'primary-button' : 'outline-button'}
              type="button"
              onClick={() => setShowRouteCorridor((prev) => !prev)}
              disabled={!assignedHospital}
            >
              {showRouteCorridor ? 'Route Corridor: ON' : 'Route Corridor: OFF'}
            </button>
          </div>
          <div className="status-table">
            <div className="status-row status-head">
              <span>Hospital</span>
              <span>District</span>
              <span>Beds</span>
              <span>Doctors</span>
              <span>Distance</span>
              <span></span>
            </div>
            {filteredHospitals
              .map(([name, coords]) => {
                const distance = calculateDistance(
                  selectedAmbulance.location.lat, selectedAmbulance.location.lng,
                  coords.lat, coords.lng
                )
                return { name, coords, distance }
              })
              .sort((a, b) => a.distance - b.distance)
              .slice(0, 10)
              .map(({ name, coords, distance }) => (
              <div key={name} className="status-row" style={{
                backgroundColor: assignedHospital?.name === name ? '#f0fdf4' : 'transparent'
              }}>
                <span style={{ fontWeight: assignedHospital?.name === name ? 'bold' : 'normal' }}>
                  {assignedHospital?.name === name && 'Assigned: '}{name}
                </span>
                <span>{coords.district === 'Coastal Andhra' ? 'Coastal' : 'Rayalaseema'}</span>
                <span>{coords.beds} Beds</span>
                <span>{coords.doctors} Doctors</span>
                <span>{distance.toFixed(1)} km</span>
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() => {
                    setSelectedHospital(name)
                    pushAction(`Viewing details for ${name}`)
                  }}
                >
                  View Details
                </button>
              </div>
            ))}
          </div>
        </section>

        <aside className="emergency-side">
          <section className="panel">
            <div className="panel-header">
              <div>
                <h3>Active Emergency Cases ({emergencyCases.length})</h3>
                <p className="panel-subtitle">{emergencyCases.length > 0 ? 'Click to select an emergency' : 'No active emergencies'}</p>
              </div>
            </div>
            <div className="status-table">
              {emergencyCases.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>
                  <p style={{ fontSize: '2rem', margin: '0 0 0.5rem 0' }}>?</p>
                  <p style={{ margin: 0, fontSize: '0.9rem' }}>All emergency cases handled</p>
                </div>
              ) : (
                emergencyCases.map((emergency) => (
                <div
                  key={emergency.caseId}
                  className="status-row"
                  onClick={() => {
                    setSelectedEmergency(emergency)
                    const ambulance = ambulances.find((a) => a.id === emergency.ambulanceId)
                    if (ambulance) setSelectedAmbulanceId(ambulance.id)
                    pushAction(`Selected ${emergency.caseId} - ${emergency.patientName}`)
                  }}
                  style={{
                    cursor: 'pointer',
                    backgroundColor: selectedEmergency?.caseId === emergency.caseId ? '#fef3c7' : 'transparent',
                    padding: '0.75rem',
                    borderRadius: '4px',
                    marginBottom: '0.5rem',
                    border: selectedEmergency?.caseId === emergency.caseId ? '2px solid #f59e0b' : '1px solid #e5e7eb'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <div>
                      <p style={{ margin: '0 0 4px 0', fontWeight: 'bold', fontSize: '0.9rem' }}>
                        Case {emergency.caseId} - {emergency.ambulanceId}
                      </p>
                      <p style={{ margin: '0 0 2px 0', fontSize: '0.8rem', color: '#656565' }}>
                        Patient: {emergency.patientName} ({emergency.age}y)
                      </p>
                      <p style={{ margin: '0 0 2px 0', fontSize: '0.8rem', color: '#656565' }}>
                        {emergency.incident}
                      </p>
                      <p style={{ margin: '0', fontSize: '0.8rem', color: '#d97706' }}>
                        Severity: {emergency.severity} | ETA: {emergency.ambulanceId === selectedAmbulance?.id ? `${selectedAmbulance.etaMinutes} Min` : emergency.eta}
                      </p>
                    </div>
                  </div>
                </div>
              )))
              }
            </div>
          </section>

          {selectedEmergency && (
            <section className="panel">
              <div className="panel-header">
                <div>
                  <h3>Selected Case Details</h3>
                  <p className="panel-subtitle">{selectedEmergency.caseId}</p>
                </div>
                <span className="alert-chip">{selectedEmergency.severity}</span>
              </div>
              <div className="incoming-card">
                <p style={{ fontSize: '0.9rem', margin: '8px 0' }}>
                  <strong>Patient:</strong> {selectedEmergency.patientName}, {selectedEmergency.age} years
                </p>
                <p style={{ fontSize: '0.9rem', margin: '8px 0' }}>
                  <strong>Incident:</strong> {selectedEmergency.incident}
                </p>
                <p style={{ fontSize: '0.9rem', margin: '8px 0' }}>
                  <strong>Location:</strong> {selectedEmergency.location}
                </p>
                <p style={{ fontSize: '0.9rem', margin: '8px 0' }}>
                  <strong>Injuries:</strong> {selectedEmergency.injuries}
                </p>
                <p style={{ fontSize: '0.9rem', margin: '8px 0' }}>
                  <strong>Ambulance:</strong> {selectedEmergency.ambulanceId} (ETA: {selectedEmergencyEta})
                </p>
                {selectedRouteMetrics && (
                  <p style={{ fontSize: '0.9rem', margin: '8px 0' }}>
                    <strong>Road Route:</strong> {selectedRouteMetrics.distanceKm.toFixed(1)} km • {formatRouteDuration(selectedRouteMetrics.durationMin)}
                  </p>
                )}
                <div className="incoming-actions">
                  <button
                    className="ghost-button"
                    type="button"
                    onClick={handleRedEntry}
                  >
                    Red Entry
                  </button>
                  <button
                    className="outline-button"
                    type="button"
                    onClick={handleDismissAlert}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </section>
          )}

          {!selectedEmergency && (
            <section className="panel">
              <div className="panel-header">
                <div>
                  <h3>No Active Cases</h3>
                  <p className="panel-subtitle">All emergencies resolved</p>
                </div>
              </div>
              <div className="incoming-card" style={{ textAlign: 'center', padding: '2rem' }}>
                <p style={{ fontSize: '2rem', margin: '0 0 0.5rem 0', color: '#10b981' }}>?</p>
                <p style={{ margin: 0, color: '#888' }}>No active emergency cases at this time</p>
              </div>
            </section>
          )}

          {selectedEmergency && (
            <section className="panel quick-actions">
              <div className="panel-header">
                <div>
                  <h3>Quick Actions</h3>
                  <p className="panel-subtitle">Emergency protocol steps</p>
                </div>
              </div>
              <div className="quick-list">
                <button
                  className="ghost-button"
                  type="button"
                  onClick={handlePrepareERTeam}
                >
                  Prepare ER Team
                </button>
                <button
                  className="ghost-button"
                  type="button"
                  onClick={handleSharePatientInfo}
                >
                  Share Patient Info
                </button>
                <button
                  className="primary-button"
                  type="button"
                  onClick={handleAssignHospitalQAOA}
                  disabled={isAssigningHospital}
                  style={{ width: '100%' }}
                >
                  {isAssigningHospital ? 'Assigning Hospital...' : assignedHospital ? `${assignedHospital.name}` : 'Assign Hospital (QAOA)'}
                </button>
                {assignedHospital && (
                  <button
                    className="outline-button"
                    type="button"
                    onClick={() => {
                      setAssignedHospital(null)
                      setSelectedHospital(null)
                      pushAction('Hospital assignment cleared - ready to reassign')
                    }}
                    style={{ width: '100%' }}
                  >
                    Reassign Hospital
                  </button>
                )}
                <button
                  className="outline-button"
                  type="button"
                  onClick={handleSendAlert}
                  disabled={!assignedHospital}
                  style={{ width: '100%' }}
                >
                  {assignedHospital ? 'Send Alert' : 'Assign Hospital First'}
                </button>
                <button
                  className="ghost-button"
                  type="button"
                  onClick={handleDismissAlert}
                  style={{ color: '#dc2626', width: '100%' }}
                >
                  Dismiss Alert
                </button>
              </div>
            </section>
          )}
        </aside>
      </div>

      {/* ER Team Dialog */}
      {showERDialog && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
          onClick={() => setShowERDialog(false)}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              padding: '2rem',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 1rem 0', color: '#0f2241' }}>ER Team Preparation</h3>
            <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f0fdf4', borderRadius: '8px' }}>
              <p style={{ margin: '0.5rem 0', fontSize: '0.9rem' }}>? ER Team notified</p>
              <p style={{ margin: '0.5rem 0', fontSize: '0.9rem' }}>? Trauma bay prepared</p>
              <p style={{ margin: '0.5rem 0', fontSize: '0.9rem' }}>? Specialist on standby</p>
              <p style={{ margin: '0.5rem 0', fontSize: '0.9rem' }}>? Operating room alerted</p>
              {assignedHospital && (
                <p style={{ margin: '0.5rem 0', fontSize: '0.9rem', fontWeight: 'bold', color: '#10b981' }}>
                  Hospital: {assignedHospital.name}
                </p>
              )}
            </div>
            <button
              className="primary-button"
              onClick={() => setShowERDialog(false)}
              style={{ width: '100%' }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Patient Info Dialog */}
      {showPatientDialog && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
          onClick={() => setShowPatientDialog(false)}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              padding: '2rem',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 1rem 0', color: '#0f2241' }}>Patient Information Shared</h3>
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ padding: '1rem', background: '#f9fafb', borderRadius: '8px', marginBottom: '1rem' }}>
                <p style={{ margin: '0.25rem 0', fontSize: '0.9rem' }}><strong>Case ID:</strong> {selectedEmergency.caseId}</p>
                <p style={{ margin: '0.25rem 0', fontSize: '0.9rem' }}><strong>Incident:</strong> {selectedEmergency.incident}</p>
                <p style={{ margin: '0.25rem 0', fontSize: '0.9rem' }}><strong>Severity:</strong> {selectedEmergency.severity}</p>
                <p style={{ margin: '0.25rem 0', fontSize: '0.9rem' }}><strong>ETA:</strong> {selectedEmergency.eta}</p>
                <p style={{ margin: '0.25rem 0', fontSize: '0.9rem' }}><strong>Location:</strong> {selectedEmergency.location}</p>
              </div>
              {assignedHospital && (
                <div style={{ padding: '1rem', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #10b981' }}>
                  <p style={{ margin: '0.25rem 0', fontSize: '0.9rem', fontWeight: 'bold', color: '#10b981' }}>
                    ? Shared with {assignedHospital.name}
                  </p>
                  <p style={{ margin: '0.25rem 0', fontSize: '0.85rem', color: '#666' }}>
                    Distance: {assignedHospital.distance.toFixed(1)} km
                  </p>
                </div>
              )}
            </div>
            <button
              className="primary-button"
              onClick={() => setShowPatientDialog(false)}
              style={{ width: '100%' }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Emergency
