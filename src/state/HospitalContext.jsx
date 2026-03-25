import { createContext, useEffect, useMemo, useState } from 'react'

const HospitalContext = createContext(null)
const SYSTEM_SETTINGS_STORAGE_KEY = 'hospitalSystemSettings'
const defaultSystemSettings = {
  autoRescheduleConflicts: true,
  enableIsolationPriority: true,
  lockIcuRooms: true,
  notifyCareTeams: true,
}

const normalizeSystemSettings = (rawSettings) => ({
  autoRescheduleConflicts:
    rawSettings?.autoRescheduleConflicts ?? defaultSystemSettings.autoRescheduleConflicts,
  enableIsolationPriority:
    rawSettings?.enableIsolationPriority ?? defaultSystemSettings.enableIsolationPriority,
  lockIcuRooms: rawSettings?.lockIcuRooms ?? defaultSystemSettings.lockIcuRooms,
  notifyCareTeams: rawSettings?.notifyCareTeams ?? defaultSystemSettings.notifyCareTeams,
})

const readStoredSystemSettings = () => {
  try {
    const raw = localStorage.getItem(SYSTEM_SETTINGS_STORAGE_KEY)
    if (!raw) {
      return defaultSystemSettings
    }
    return normalizeSystemSettings(JSON.parse(raw))
  } catch {
    return defaultSystemSettings
  }
}

const hospitalNames = [
  'Vizag City Care Hospital',
  'Vijayawada Heart Institute',
  'Guntur Neuro Center',
  'Kakinada Coastal Medical',
  'Rajahmundry River Hospital',
  'Machilipatnam Port Medical',
  'Eluru District Hospital',
  'Amalapuram Regional Care',
  'Ongole Medical Institute',
  'Nellore Emergency & Critical Care',
  'Tirupati Ortho & Trauma Hospital',
  'Anantapur Heart Center',
  'Kurnool Multi-Specialty Hospital',
  'Kadapa Regional Medical',
  'Chittoor Women & Child Care',
  'Nandyal District Hospital',
  'Proddatur Eye & ENT Center',
  'Hindupur Community Hospital',
  'Dharmavaram Diabetes Center',
  'Madanapalle Maternity Hospital',
]

const specialties = [
  'Cardiology',
  'Neurology',
  'Orthopedics',
  'Pediatrics',
  'General Medicine',
  'Emergency Care',
  'Surgery',
  'Radiology',
  'Anesthesiology',
  'Dermatology',
]

const statuses = ['On Duty', 'On Call', 'Off Shift']

// Generate 100 doctors (50 per district)
const doctorInventory = []
let doctorId = 1

// Coastal Andhra doctors (50)
for (let i = 0; i < 50; i++) {
  const hospitalIndex = i % 10
  doctorInventory.push({
    id: doctorId++,
    name: `Dr. ${String.fromCharCode(65 + (i % 26))}. ${['Kumar', 'Reddy', 'Patel', 'Nair', 'Rao', 'Singh', 'Sharma', 'Iyer', 'Gupta', 'Das'][i % 10]}`,
    specialty: specialties[i % specialties.length],
    hospital: hospitalNames[hospitalIndex],
    district: 'Coastal Andhra',
    status: statuses[i % 3],
    patients: Math.floor(Math.random() * 20) + 5,
    salary: Math.floor(Math.random() * 500000) + 800000, // ₹800,000 to ₹1,300,000
  })
}

// Rayalaseema doctors (50)
for (let i = 0; i < 50; i++) {
  const hospitalIndex = 10 + (i % 10)
  doctorInventory.push({
    id: doctorId++,
    name: `Dr. ${String.fromCharCode(65 + (i % 26))}. ${['Srinivas', 'Murthy', 'Yadav', 'Prasad', 'Raju', 'Krishna', 'Ramesh', 'Suresh', 'Sai', 'Venkat'][i % 10]}`,
    specialty: specialties[i % specialties.length],
    hospital: hospitalNames[hospitalIndex],
    district: 'Rayalaseema',
    status: statuses[i % 3],
    patients: Math.floor(Math.random() * 20) + 5,
    salary: Math.floor(Math.random() * 500000) + 800000,
  })
}

const equipmentTypes = [
  'Telemetry, ICU',
  'Standard Care',
  'Isolation',
  'Imaging Prep',
  'Telemetry',
  'Post-Op',
  'ICU',
  'General Care',
  'Surgery Prep',
  'Recovery',
  'Telemetry',
  'Isolation',
  'Pediatric Care',
  'Cardiac Care',
  'Neurology',
  'Orthopedic',
  'General Care',
  'ICU',
  'Post-Op',
  'Emergency',
]

// Generate 20 rooms for each of the 20 hospitals (400 rooms total)
const roomInventory = hospitalNames.flatMap((hospital) =>
  Array.from({ length: 20 }, (_, i) => ({
    name: `Room ${101 + i}`,
    equipment: equipmentTypes[i],
    hospital,
  }))
)

const seedPatients = [
  {
    name: 'Alice Harris',
    status: 'Stable',
    room: 'Room 101',
    hospital: 'Vizag City Care Hospital',
    care: 'Cardiology',
    next: '8:30 AM',
  },
  {
    name: 'John Miller',
    status: 'Observation',
    room: 'Room 103',
    hospital: 'Vizag City Care Hospital',
    care: 'Neurology',
    next: '10:15 AM',
  },
  {
    name: 'Sarah Lee',
    status: 'Imaging',
    room: 'Room 104',
    hospital: 'Vijayawada Heart Institute',
    care: 'Radiology',
    next: '9:00 AM',
  },
  {
    name: 'Robert White',
    status: 'Recovering',
    room: 'Room 106',
    hospital: 'Vijayawada Heart Institute',
    care: 'Orthopedics',
    next: '2:00 PM',
  },
]

const seedOpAppointments = [
  {
    id: 'OP-1001',
    patientName: 'Kiran Varma',
    hospital: 'Vizag City Care Hospital',
    department: 'Cardiology',
    doctorName: 'Dr. A. Kumar',
    appointmentDate: '2026-03-26',
    appointmentTime: '09:30',
    status: 'Booked',
    type: 'OP',
  },
  {
    id: 'OP-1002',
    patientName: 'Sneha Rao',
    hospital: 'Vijayawada Heart Institute',
    department: 'Orthopedics',
    doctorName: 'Dr. B. Reddy',
    appointmentDate: '2026-03-26',
    appointmentTime: '11:00',
    status: 'Booked',
    type: 'OP',
  },
]

const seedOperationRooms = hospitalNames.flatMap((hospital) =>
  ['OR-1', 'OR-2', 'OR-3'].map((roomName, index) => ({
    id: `${hospital}-OR-${index + 1}`,
    name: roomName,
    hospital,
    equipment: index === 0 ? 'Major Surgery Suite' : index === 1 ? 'General Surgery' : 'Laparoscopic Suite',
    status: 'Available',
  }))
)

const toClientRecord = (record) => {
  if (!record) {
    return null
  }
  return {
    ...record,
    id: record.id || record._id,
  }
}

function HospitalProvider({ children }) {
  const [patients, setPatients] = useState(seedPatients)
  const [doctors, setDoctors] = useState(doctorInventory)
  const [selectedHospital, setSelectedHospital] = useState('Vizag City Care Hospital')
  const [notifications, setNotifications] = useState([])
  const [systemSettings, setSystemSettings] = useState(() => readStoredSystemSettings())
  const [opAppointments, setOpAppointments] = useState(seedOpAppointments)
  const [operationRooms, setOperationRooms] = useState(seedOperationRooms)
  const [operationAllocations, setOperationAllocations] = useState([])

  useEffect(() => {
    try {
      localStorage.setItem(SYSTEM_SETTINGS_STORAGE_KEY, JSON.stringify(systemSettings))
    } catch {
      // Ignore storage write errors and keep in-memory settings.
    }
  }, [systemSettings])

  const availableRooms = useMemo(() => {
    const occupied = new Set(patients.map((patient) => patient.room))
    return roomInventory.filter((room) => !occupied.has(room.name))
  }, [patients])

  // Fetch existing patients from MongoDB on component mount
  useEffect(() => {
    const fetchPatientsFromDB = async () => {
      try {
        const response = await fetch('/api/patients')
        if (response.ok) {
          const data = await response.json()
          // Handle both array and object with 'value' property
          const patientsArray = Array.isArray(data) ? data : (data.value || [])
          if (patientsArray.length > 0) {
            // Deduplicate by name+hospital — keep the most recently created (_id sorts lexicographically)
            const seen = new Map()
            for (const p of patientsArray) {
              const key = `${p.hospital}||${p.name}`
              if (!seen.has(key) || (p._id && (!seen.get(key)._id || p._id > seen.get(key)._id))) {
                seen.set(key, p)
              }
            }
            const uniquePatients = Array.from(seen.values())
            console.log('✅ Loaded', uniquePatients.length, 'patients from MongoDB (deduplicated from', patientsArray.length, ')')
            setPatients(uniquePatients)
          }
        }
      } catch (error) {
        console.warn('⚠️ Could not fetch patients from MongoDB:', error.message)
        console.log('Using seed data as fallback')
      }
    }

    fetchPatientsFromDB()
  }, [])

  // Rotate doctor statuses every 3 hours
  useEffect(() => {
    const statusRotation = ['On Duty', 'On Call', 'Off Shift']
    
    const rotateStatuses = () => {
      setDoctors((current) =>
        current.map((doctor) => {
          const currentIndex = statusRotation.indexOf(doctor.status)
          const nextIndex = (currentIndex + 1) % statusRotation.length
          const newStatus = statusRotation[nextIndex]
          
          // Update in MongoDB
          fetch(`/api/doctors/${doctor._id || doctor.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus }),
          }).catch((err) => console.warn(`⚠️ Could not update ${doctor.name} status:`, err.message))
          
          return { ...doctor, status: newStatus }
        })
      )
      console.log('🔄 Doctor statuses rotated every 3 hours')
    }

    // Rotate immediately, then every 3 hours (10,800,000 ms)
    rotateStatuses()
    const interval = setInterval(rotateStatuses, 3 * 60 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  // Load OP appointments and OR allocations from MongoDB when available.
  useEffect(() => {
    const loadOperationsData = async () => {
      try {
        const [appointmentsResponse, allocationsResponse] = await Promise.all([
          fetch('/api/op-appointments'),
          fetch('/api/operation-allocations'),
        ])

        if (appointmentsResponse.ok) {
          const appointments = await appointmentsResponse.json()
          if (Array.isArray(appointments) && appointments.length > 0) {
            setOpAppointments(appointments.map(toClientRecord))
          }
        }

        if (allocationsResponse.ok) {
          const allocations = await allocationsResponse.json()
          if (Array.isArray(allocations) && allocations.length > 0) {
            const normalizedAllocations = allocations.map(toClientRecord)
            setOperationAllocations(normalizedAllocations)

            const activeRoomIds = new Set(
              normalizedAllocations
                .filter((item) => item.status === 'Allocated')
                .map((item) => item.roomId)
            )

            if (activeRoomIds.size > 0) {
              setOperationRooms((current) =>
                current.map((room) =>
                  activeRoomIds.has(room.id)
                    ? { ...room, status: 'Allocated' }
                    : room
                )
              )
            }
          }
        }
      } catch (error) {
        console.warn('⚠️ Could not load operations module data:', error.message)
      }
    }

    loadOperationsData()
  }, [])

  const addPatient = async (patient) => {
    // Find available rooms for the patient's hospital before state update
    const occupiedForHospital = new Set(
      patients
        .filter((p) => p.hospital === patient.hospital)
        .map((p) => p.room)
    )
    
    const availableForHospital = roomInventory.filter(
      (room) => room.hospital === patient.hospital && !occupiedForHospital.has(room.name)
    )
    
    const patientText = `${patient.status || ''} ${patient.care || ''}`.toLowerCase()
    const isCriticalPatient = /critical|severe|trauma|emergency/.test(patientText)
    const isIsolationRoom = (room) => room?.equipment?.toLowerCase().includes('isolation')
    const isIcuRoom = (room) => room?.equipment?.toLowerCase().includes('icu')

    let roomCandidates = availableForHospital
    if (systemSettings.lockIcuRooms && !isCriticalPatient) {
      const nonIcuRooms = roomCandidates.filter((room) => !isIcuRoom(room))
      roomCandidates = nonIcuRooms.length ? nonIcuRooms : roomCandidates
    }

    let assignedRoom = roomCandidates[0]?.name || 'Unassigned'
    if (systemSettings.enableIsolationPriority) {
      const isolationRoom = roomCandidates.find((room) => isIsolationRoom(room))
      if (isolationRoom) {
        assignedRoom = isolationRoom.name
      }
    }

    const newPatient = { ...patient, room: assignedRoom }
    
    try {
      // POST to MongoDB via gateway API
      console.log('📤 Sending patient to MongoDB:', newPatient)
      
      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPatient),
      })
      
      console.log('📥 Response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ API Error:', errorText)
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const savedPatient = await response.json()
      console.log('✅ Patient saved to MongoDB:', savedPatient)
      // Replace any existing entry with the same name+hospital, then prepend the saved record
      setPatients((current) => [
        savedPatient,
        ...current.filter(
          (p) => !(p.name === savedPatient.name && p.hospital === savedPatient.hospital)
        ),
      ])
      addNotification(`✓ Patient added and saved to MongoDB`, 'success')
      return assignedRoom
    } catch (error) {
      console.error('🔴 Error adding patient to MongoDB:', error)
      addNotification(`⚠️ Error: ${error.message}. Check console for details.`, 'error')
      // Still update local state as fallback
      console.warn('Using local state fallback (data NOT in database)')
      setPatients((current) => [newPatient, ...current])
      return assignedRoom
    }
  }

  const removePatient = async (patient, reason = 'Discharged') => {
    try {
      const response = await fetch('/api/discharges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: patient._id,
          name: patient.name,
          status: patient.status,
          room: patient.room,
          hospital: patient.hospital,
          care: patient.care,
          reason: reason,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || `HTTP ${response.status}`)
      }

      if (patient._id) {
        await fetch(`/api/patients/${patient._id}`, { method: 'DELETE' })
      }

      setPatients((current) =>
        current.filter((item) => item.name !== patient.name)
      )
    } catch (error) {
      addNotification(`Error saving discharge: ${error.message}`, 'error')
    }
  }

  const addDoctor = async (doctor) => {
    try {
      // Prepare data for MongoDB (no custom id field)
      const doctorToSave = {
        name: doctor.name,
        specialty: doctor.specialty,
        hospital: doctor.hospital,
        district: doctor.district,
        status: doctor.status,
        salary: doctor.salary,
        patients: 0,
      }

      // POST to MongoDB via gateway API
      console.log('📤 Sending doctor to MongoDB:', doctorToSave)

      const response = await fetch('/api/doctors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(doctorToSave),
      })

      console.log('📥 Response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ API Error:', errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const savedDoctor = await response.json()
      console.log('✅ Doctor saved to MongoDB:', savedDoctor)
      setDoctors((current) => [savedDoctor, ...current])
      addNotification(`✓ Doctor ${doctor.name} added successfully`, 'success')
      return savedDoctor
    } catch (error) {
      console.error('🔴 Error adding doctor to MongoDB:', error)
      addNotification(`⚠️ Error: ${error.message}`, 'error')
      // Fallback: add to local state
      const newDoctor = { ...doctor, id: Date.now(), patients: 0 }
      setDoctors((current) => [newDoctor, ...current])
      return newDoctor
    }
  }

  const addNotification = (message, type = 'error') => {
    const id = Date.now()
    setNotifications((current) => [...current, { id, message, type }])
    setTimeout(() => {
      setNotifications((current) => current.filter((n) => n.id !== id))
    }, 5000)
  }

  const updatePatient = async (patientId, updates) => {
    const matchesPatient = (patient) =>
      (patientId && (patient._id === patientId || patient.id === patientId)) ||
      (updates?.name && patient.name === updates.name)

    if (!patientId) {
      const localPatient = { ...updates }
      setPatients((current) => current.map((patient) => (matchesPatient(patient) ? { ...patient, ...localPatient } : patient)))
      return localPatient
    }

    try {
      const response = await fetch(`/api/patients/${patientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        throw new Error(`Failed to update patient: ${response.statusText}`)
      }

      const updatedPatient = await response.json()
      
      // Update local state
      setPatients((current) =>
        current.map((patient) => (matchesPatient(patient) ? { ...patient, ...updatedPatient } : patient))
      )

      return updatedPatient
    } catch (error) {
      console.error('Error updating patient:', error)
      addNotification(`Failed to update patient: ${error.message}`, 'error')
      throw error
    }
  }

  const updateSystemSetting = (settingKey, value) => {
    setSystemSettings((current) =>
      normalizeSystemSettings({
        ...current,
        [settingKey]: value,
      })
    )
  }

  const bookOpAppointment = async (appointmentInput) => {
    const nextAppointment = {
      patientName: appointmentInput.patientName,
      hospital: appointmentInput.hospital,
      department: appointmentInput.department,
      doctorName: appointmentInput.doctorName,
      appointmentDate: appointmentInput.appointmentDate,
      appointmentTime: appointmentInput.appointmentTime,
      status: 'Booked',
      type: 'OP',
      createdAt: new Date().toISOString(),
    }

    try {
      const response = await fetch('/api/op-appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextAppointment),
      })

      if (!response.ok) {
        throw new Error(`Failed to save OP appointment (${response.status})`)
      }

      const savedAppointment = toClientRecord(await response.json())
      setOpAppointments((current) => [savedAppointment, ...current])
      addNotification(`OP appointment booked for ${savedAppointment.patientName}`, 'success')
      return savedAppointment
    } catch (error) {
      const fallbackAppointment = {
        ...nextAppointment,
        id: `OP-${Date.now()}`,
      }
      setOpAppointments((current) => [fallbackAppointment, ...current])
      addNotification(`Saved locally: ${fallbackAppointment.patientName} (DB unavailable)`, 'warning')
      return fallbackAppointment
    }
  }

  const cancelOpAppointment = async (appointmentId) => {
    try {
      await fetch(`/api/op-appointments/${appointmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Cancelled' }),
      })
    } catch (error) {
      console.warn('⚠️ Could not persist OP cancellation:', error.message)
    }

    setOpAppointments((current) =>
      current.map((item) => (item.id === appointmentId ? { ...item, status: 'Cancelled' } : item))
    )
  }

  const allocateOperationRoom = async ({
    appointmentId,
    patientName,
    hospital,
    procedure,
    priority,
    scheduledAt,
    estimatedDurationHours,
  }) => {
    const availableRooms = operationRooms.filter(
      (room) => room.hospital === hospital && room.status === 'Available'
    )

    if (!availableRooms.length) {
      addNotification(`No operation room available in ${hospital}`, 'warning')
      return null
    }

    const selectedRoom = availableRooms[0]
    const allocation = {
      appointmentId,
      patientName,
      hospital,
      procedure,
      priority,
      scheduledAt,
      estimatedDurationHours,
      roomId: selectedRoom.id,
      roomName: selectedRoom.name,
      status: 'Allocated',
      allocatedAt: new Date().toISOString(),
    }

    let finalAllocation = allocation

    try {
      const response = await fetch('/api/operation-allocations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(allocation),
      })

      if (!response.ok) {
        throw new Error(`Failed to persist OR allocation (${response.status})`)
      }

      finalAllocation = toClientRecord(await response.json())
    } catch (error) {
      finalAllocation = {
        ...allocation,
        id: `OR-ALLOC-${Date.now()}`,
      }
      console.warn('⚠️ OR allocation saved locally:', error.message)
      addNotification('OR allocation saved locally (DB unavailable)', 'warning')
    }

    setOperationRooms((current) =>
      current.map((room) =>
        room.id === selectedRoom.id
          ? { ...room, status: 'Allocated' }
          : room
      )
    )

    setOperationAllocations((current) => [finalAllocation, ...current])

    if (appointmentId) {
      setOpAppointments((current) =>
        current.map((appointment) =>
          appointment.id === appointmentId
            ? { ...appointment, status: 'Moved to OR' }
            : appointment
        )
      )
    }

    addNotification(
      `${finalAllocation.roomName} allocated for ${finalAllocation.patientName} (${finalAllocation.procedure})`,
      'success'
    )

    return finalAllocation
  }

  const releaseOperationRoom = async (allocationId) => {
    const activeAllocation = operationAllocations.find((item) => item.id === allocationId)
    if (!activeAllocation) {
      return
    }

    try {
      await fetch(`/api/operation-allocations/${allocationId}/complete`, {
        method: 'PUT',
      })
    } catch (error) {
      console.warn('⚠️ Could not persist OR completion:', error.message)
    }

    setOperationRooms((current) =>
      current.map((room) =>
        room.id === activeAllocation.roomId ? { ...room, status: 'Available' } : room
      )
    )

    setOperationAllocations((current) =>
      current.map((item) =>
        item.id === allocationId
          ? { ...item, status: 'Completed', completedAt: new Date().toISOString() }
          : item
      )
    )

    addNotification(
      `${activeAllocation.roomName} released for next surgical allocation`,
      'info'
    )
  }



  const value = {
    rooms: roomInventory,
    patients,
    addPatient,
    removePatient,
    updatePatient,
    hospitals: hospitalNames,
    selectedHospital,
    setSelectedHospital,
    doctors,
    addDoctor,
    notifications,
    addNotification,
    systemSettings,
    updateSystemSetting,
    opAppointments,
    bookOpAppointment,
    cancelOpAppointment,
    operationRooms,
    operationAllocations,
    allocateOperationRoom,
    releaseOperationRoom,
  }

  return <HospitalContext.Provider value={value}>{children}</HospitalContext.Provider>
}

export { HospitalContext, HospitalProvider }
