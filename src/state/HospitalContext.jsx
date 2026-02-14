import { createContext, useMemo, useState } from 'react'

const HospitalContext = createContext(null)

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

function HospitalProvider({ children }) {
  const [patients, setPatients] = useState(seedPatients)
  const [selectedHospital, setSelectedHospital] = useState('Vizag City Care Hospital')
  const [notifications, setNotifications] = useState([])

  const availableRooms = useMemo(() => {
    const occupied = new Set(patients.map((patient) => patient.room))
    return roomInventory.filter((room) => !occupied.has(room.name))
  }, [patients])

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
    
    const assignedRoom = availableForHospital[0]?.name || 'Unassigned'
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
      setPatients((current) => [savedPatient, ...current])
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

  const addNotification = (message, type = 'error') => {
    const id = Date.now()
    setNotifications((current) => [...current, { id, message, type }])
    setTimeout(() => {
      setNotifications((current) => current.filter((n) => n.id !== id))
    }, 5000)
  }

  const value = {
    rooms: roomInventory,
    patients,
    addPatient,
    hospitals: hospitalNames,
    selectedHospital,
    setSelectedHospital,
    doctors: doctorInventory,
    notifications,
    addNotification,
  }

  return <HospitalContext.Provider value={value}>{children}</HospitalContext.Provider>
}

export { HospitalContext, HospitalProvider }
