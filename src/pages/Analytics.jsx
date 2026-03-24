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

function Emergency() {
  const mapRef = useRef(null)
  const googleMapRef = useRef(null)
  const [selectedHospital, setSelectedHospital] = useState(null)
  const [selectedDistrict, setSelectedDistrict] = useState('All Districts')
  const [selectedAmbulance, setSelectedAmbulance] = useState(ambulanceFleet[0])
  const [emergencyCases, setEmergencyCases] = useState(initialEmergencyCases)
  const [selectedEmergency, setSelectedEmergency] = useState(initialEmergencyCases[0])
  const [isAssigningHospital, setIsAssigningHospital] = useState(false)
  const [assignedHospital, setAssignedHospital] = useState(null)
  const [showERDialog, setShowERDialog] = useState(false)
  const [showPatientDialog, setShowPatientDialog] = useState(false)

  const { addNotification, patients, rooms: roomInventory } = useContext(HospitalContext)

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

  // QAOA-based hospital assignment
  const handleAssignHospitalQAOA = async () => {
    setIsAssigningHospital(true)
    pushAction('Running QAOA optimization to assign nearest hospital...')
    addNotification('Assigning hospital using quantum optimization...', 'info')

    try {
      // Get hospitals in ambulance district or all if needed
      const relevantHospitals = selectedAmbulance.location.district === 'All'
        ? Object.entries(hospitalLocations)
        : Object.entries(hospitalLocations).filter(([_, coords]) => 
            coords.district === selectedAmbulance.location.district
          )

      const severityWeight = selectedEmergency.severity === 'Critical'
        ? 1.4
        : selectedEmergency.severity === 'Severe'
          ? 1.2
          : 1.0

      // Calculate distances and create optimization data with live room availability.
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
        label: selectedEmergency.patientName,
        priority: selectedEmergency.severity === 'Critical' ? 1.5 : 1.0
      }]

      const rooms = topHospitals.map(h => h.name)
      const costMatrix = [topHospitals.map((h) => Number(h.score.toFixed(4)))]

      console.log('QAOA Hospital Assignment Request:', { patients, rooms, topHospitals })

      const response = await fetch('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patients, rooms, costMatrix })
      })

      if (!response.ok) {
        throw new Error('QAOA optimization failed')
      }

      const result = await response.json()
      console.log('QAOA Assignment Result:', result)

      const assignedHospitalName = result.assignments[0]?.room || topHospitals[0].name
      const assignedData = hospitalsWithDistance.find(h => h.name === assignedHospitalName)

      setAssignedHospital(assignedData)
      setSelectedHospital(assignedHospitalName)
      
      const assignedHospitalData = {
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
          console.log('✅ Emergency case saved to MongoDB:', savedCase)
          addNotification(`✓ Case ${selectedEmergency.caseId} saved to MongoDB`, 'success')
        } else {
          console.warn('⚠️ Could not save to MongoDB:', mongoResponse.status)
        }
      } catch (mongoError) {
        console.warn('⚠️ MongoDB save failed:', mongoError.message)
      }

      setAssignedHospital(assignedData)
      setSelectedHospital(assignedHospitalName)
      
      addNotification(`✓ Hospital assigned: ${assignedHospitalName} (${assignedData.distance.toFixed(1)} km, ${assignedData.availableRooms} rooms free)`, 'success')
      pushAction(`Assigned ${assignedHospitalName} - ${assignedData.distance.toFixed(1)}km away, ${assignedData.availableRooms} rooms free, ${assignedData.doctors} doctors`)

      // Send confirmation email to user after successful assignment
      try {
        const confirmEmailPayload = {
          caseDetails: selectedEmergency,
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

        const confirmResponse = await fetch('/api/emergency/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(confirmEmailPayload),
        })

        if (confirmResponse.ok) {
          const confirmResult = await confirmResponse.json()
          if (confirmResult.channels?.email?.sent) {
            console.log('✅ Confirmation email sent to', DEFAULT_ALERT_EMAIL)
            addNotification(`✓ Confirmation email sent to ${DEFAULT_ALERT_EMAIL}`, 'success')
          }
        } else {
          console.warn('⚠️ Could not send confirmation email:', confirmResponse.status)
        }
      } catch (emailError) {
        console.warn('⚠️ Email confirmation failed:', emailError.message)
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
      addNotification(`Fallback: Assigned nearest hospital - ${nearest.name}`, 'warning')
    } finally {
      setIsAssigningHospital(false)
    }
  }

  const handlePrepareERTeam = () => {
    setShowERDialog(true)
    pushAction('Preparing ER team...')
    addNotification('ER Team notification sent', 'success')
  }

  const handleSharePatientInfo = () => {
    setShowPatientDialog(true)
    pushAction('Sharing patient information...')
    addNotification('Patient info shared with assigned hospital', 'success')
  }

  const handleDismissAlert = () => {
    if (confirm('Are you sure you want to dismiss this emergency alert?')) {
      // Remove the current emergency from the list
      const updatedCases = emergencyCases.filter(e => e.caseId !== selectedEmergency.caseId)
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

  const handleSendAlert = async () => {
    if (!assignedHospital) {
      addNotification('Please assign a hospital first before sending alert', 'warning')
      pushAction('⚠️ Assign hospital first before sending alert')
      return
    }

    pushAction('🚨 Sending emergency alert to hospitals...')
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
          console.warn('⚠️ Notification provider issue:', notifyError.message)
        }

        // Update MongoDB with alert status
        try {
          // First, try to find the existing case
          const fetchExisting = await fetch(`/api/emergency-cases?caseId=${selectedEmergency.caseId}`)
          let existingCase = null
          
          if (fetchExisting.ok) {
            const cases = await fetchExisting.json()
            existingCase = cases.find(c => c.caseId === selectedEmergency.caseId)
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
              console.log('✅ Emergency case updated in MongoDB with alert status')
            }
          } else {
            // Create new case
            const response = await fetch('/api/emergency-cases', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updateData)
            })
            
            if (response.ok) {
              console.log('✅ Emergency case created in MongoDB with alert sent')
            }
          }
        } catch (mongoError) {
          console.warn('⚠️ Could not update MongoDB:', mongoError.message)
        }

        const channelSummary = notifyResponsePayload?.channels
          ? `email:${notifyResponsePayload.channels.email?.sent ? 'ok' : 'skip'}, voice:${notifyResponsePayload.channels.voice?.sent ? 'ok' : 'skip'}, sms:${notifyResponsePayload.channels.sms?.sent ? 'ok' : 'skip'}`
          : 'email/voice/sms status unavailable'

        addNotification(`✓ Emergency alert sent to ${assignedHospital.name} (${channelSummary})`, 'success')
        pushAction(`✓ Alert sent to ${assignedHospital.name} • ${selectedEmergency.patientName} • ${selectedEmergency.incident} • ${channelSummary}`)
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

    pushAction(`📞 Triggering emergency voice call for ${selectedEmergency.caseId}`)
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

      addNotification(`✓ Emergency voice call started (${DEFAULT_ALERT_PHONE})`, 'success')
      pushAction(`✓ Voice call started for ${selectedEmergency.caseId} • SID: ${data.callSid || 'n/a'}`)
    } catch (error) {
      addNotification(`Voice call failed: ${error.message}`, 'error')
      pushAction(`❌ Voice call failed: ${error.message}`)
    }
  }

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapRef.current || googleMapRef.current) return

    const andhraPradeshCenter = [15.4909, 78.6569] // [lat, lng]
    
    // Create map
    const map = L.map(mapRef.current).setView(andhraPradeshCenter, 8)
    
    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map)
    
    googleMapRef.current = map
    
    return () => {
      map.remove()
      googleMapRef.current = null
    }
  }, [])

  // Update map markers when district filter changes
  useEffect(() => {
    if (!googleMapRef.current) return
    
    const map = googleMapRef.current
    
    // Clear all markers
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer)
      }
    })
    
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
          ">🏥</div>
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
      
      const distance = calculateDistance(
        selectedAmbulance.location.lat, selectedAmbulance.location.lng,
        coords.lat, coords.lng
      )
      
      const popupContent = `
        <div style="font-family: Arial; font-size: 12px; min-width: 180px;">
          <h4 style="margin: 0 0 8px 0; color: #0f2241; font-size: 14px;">${name}</h4>
          ${isAssigned ? '<p style="margin: 4px 0; color: #10b981; font-weight: bold;">✓ Assigned Hospital</p>' : ''}
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
    
    // Add all ambulance markers (5 ambulances)
    ambulanceFleet.forEach((ambulance) => {
      const isSelected = selectedAmbulance.id === ambulance.id
      const ambulanceIcon = L.divIcon({
        html: `
          <div style="
            background: ${isSelected ? '#f59e0b' : '#fbbf24'};
            border: ${isSelected ? '4px' : '3px'} solid #f59e0b;
            border-radius: 50%;
            width: ${isSelected ? 38 : 32}px;
            height: ${isSelected ? 38 : 32}px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 10px rgba(0,0,0,0.4);
            font-size: 18px;
            animation: pulse 2s infinite;
          ">🚑</div>
        `,
        iconSize: [isSelected ? 38 : 32, isSelected ? 38 : 32],
        className: 'ambulance-icon',
      })
      
      const marker = L.marker([ambulance.location.lat, ambulance.location.lng], {
        icon: ambulanceIcon,
      }).addTo(map)
      
      // Find corresponding emergency case for this ambulance
      const emergencyForAmbulance = emergencyCases.find(e => e.ambulanceId === ambulance.id)
      const emergencyContent = emergencyForAmbulance 
        ? `<p style="margin: 4px 0; color: #555;"><strong>Case:</strong> ${emergencyForAmbulance.caseId}</p>
           <p style="margin: 4px 0; color: #555;"><strong>Patient:</strong> ${emergencyForAmbulance.patientName}</p>
           <p style="margin: 4px 0; color: #555;"><strong>Incident:</strong> ${emergencyForAmbulance.incident}</p>
           <p style="margin: 4px 0; color: #555;"><strong>ETA:</strong> ${emergencyForAmbulance.eta}</p>`
        : ''
      
      marker.bindPopup(`
        <div style="font-family: Arial; font-size: 12px; min-width: 220px;">
          <h4 style="margin: 0 0 8px 0; color: #0f2241; font-size: 14px;"> 🚑 ${ambulance.id}</h4>
          <div style="border-top: 1px solid #ddd; padding-top: 8px;">
            <p style="margin: 4px 0; color: #555;"><strong>Status:</strong> ${ambulance.status}</p>
            ${emergencyContent}
            <p style="margin: 4px 0; color: #f59e0b;"><strong>Condition:</strong> ${ambulance.condition}</p>
          </div>
        </div>
      `, {
        maxWidth: 280,
        className: 'ambulance-popup'
      })
      
      marker.on('click', () => {
        setSelectedAmbulance(ambulance)
        if (emergencyForAmbulance) {
          setSelectedEmergency(emergencyForAmbulance)
          pushAction(`${ambulance.id} - ${emergencyForAmbulance.incident} - ETA: ${emergencyForAmbulance.eta}`)
        } else {
          pushAction(`${ambulance.id} - ${ambulance.status}`)
        }
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
        .ambulance-icon { animation: pulse 2s infinite; }
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
      // Include all ambulances in bounds
      ambulanceFleet.forEach(ambulance => {
        bounds.extend([ambulance.location.lat, ambulance.location.lng])
      })
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [selectedDistrict, assignedHospital, filteredHospitals, selectedAmbulance, selectedEmergency])

  return (
    <div className="emergency-page">
      <div className="emergency-header">
        <div>
          <h2>Emergency Management</h2>
          <p className="panel-subtitle">Real-time hospital location mapping & response</p>
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
            {districts.map(district => (
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
              <span>Arriving in {selectedEmergency.eta}</span>
              <span style={{ color: '#d97706', fontWeight: 'bold' }}>Severity: {selectedEmergency.severity}</span>
              {assignedHospital && (
                <span style={{ color: '#10b981', fontWeight: 'bold' }}>
                    ✓ Assigned: {assignedHospital.name} ({assignedHospital.availableRooms || assignedHospital.beds} rooms free)
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
              {assignedHospital ? '📤 Send Alert' : 'Assign Hospital First'}
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
                  {assignedHospital?.name === name && '✓ '}{name}
                </span>
                <span>{coords.district === 'Coastal Andhra' ? '🌊 Coastal' : '⛰️ Rayalaseema'}</span>
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
                  <p style={{ fontSize: '2rem', margin: '0 0 0.5rem 0' }}>✓</p>
                  <p style={{ margin: 0, fontSize: '0.9rem' }}>All emergency cases handled</p>
                </div>
              ) : (
                emergencyCases.map((emergency) => (
                <div 
                  key={emergency.caseId}
                  className="status-row"
                  onClick={() => {
                    setSelectedEmergency(emergency)
                    const ambulance = ambulanceFleet.find(a => a.id === emergency.ambulanceId)
                    if (ambulance) setSelectedAmbulance(ambulance)
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
                        🚑 {emergency.caseId} - {emergency.ambulanceId}
                      </p>
                      <p style={{ margin: '0 0 2px 0', fontSize: '0.8rem', color: '#656565' }}>
                        Patient: {emergency.patientName} ({emergency.age}y)
                      </p>
                      <p style={{ margin: '0 0 2px 0', fontSize: '0.8rem', color: '#656565' }}>
                        {emergency.incident}
                      </p>
                      <p style={{ margin: '0', fontSize: '0.8rem', color: '#d97706' }}>
                        Severity: {emergency.severity} | ETA: {emergency.eta}
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
                  <strong>Ambulance:</strong> {selectedEmergency.ambulanceId} (ETA: {selectedEmergency.eta})
                </p>
                <div className="incoming-actions">
                  <button
                    className="ghost-button"
                    type="button"
                    onClick={() => pushAction('Marked case as red entry')}
                  >
                    Red Entry
                  </button>
                  <button
                    className="outline-button"
                    type="button"
                    onClick={() => pushAction('Dismissed incoming case alert')}
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
                <p style={{ fontSize: '2rem', margin: '0 0 0.5rem 0', color: '#10b981' }}>✓</p>
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
                  🏥 Prepare ER Team
                </button>
                <button
                  className="ghost-button"
                  type="button"
                  onClick={handleSharePatientInfo}
                >
                  📋 Share Patient Info
                </button>
                <button
                  className="primary-button"
                  type="button"
                  onClick={handleAssignHospitalQAOA}
                  disabled={isAssigningHospital}
                  style={{ width: '100%' }}
                >
                  {isAssigningHospital ? '⏳ Assigning Hospital...' : assignedHospital ? `✓ ${assignedHospital.name}` : '🔍 Assign Hospital (QAOA)'}
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
                    🔄 Reassign Hospital
                  </button>
                )}
                <button
                  className="outline-button"
                  type="button"
                  onClick={handleSendAlert}
                  disabled={!assignedHospital}
                  style={{ width: '100%' }}
                >
                  {assignedHospital ? '📤 Send Alert' : '⚠️ Assign Hospital First'}
                </button>
                <button
                  className="primary-button"
                  type="button"
                  onClick={handleEmergencyVoiceCall}
                  disabled={!assignedHospital}
                  style={{ width: '100%' }}
                >
                  {assignedHospital ? `📞 Emergency Voice Call (${DEFAULT_ALERT_PHONE})` : '⚠️ Assign Hospital First'}
                </button>
                <button
                  className="ghost-button"
                  type="button"
                  onClick={handleDismissAlert}
                  style={{ color: '#dc2626', width: '100%' }}
                >
                  ❌ Dismiss Alert
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
              <p style={{ margin: '0.5rem 0', fontSize: '0.9rem' }}>✓ ER Team notified</p>
              <p style={{ margin: '0.5rem 0', fontSize: '0.9rem' }}>✓ Trauma bay prepared</p>
              <p style={{ margin: '0.5rem 0', fontSize: '0.9rem' }}>✓ Specialist on standby</p>
              <p style={{ margin: '0.5rem 0', fontSize: '0.9rem' }}>✓ Operating room alerted</p>
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
                    ✓ Shared with {assignedHospital.name}
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
