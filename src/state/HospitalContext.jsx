import { createContext, useEffect, useMemo, useState } from 'react'

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
  const [doctors, setDoctors] = useState(doctorInventory)
  const [selectedHospital, setSelectedHospital] = useState('Vizag City Care Hospital')
  const [notifications, setNotifications] = useState([])

  const availableRooms = useMemo(() => {
    const occupied = new Set(patients.map((patient) => patient.room))
    return roomInventory.filter((room) => !occupied.has(room.name))
  }, [patients])

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

  const removePatient = async (patient) => {
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
          reason: 'Discharged',
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



  const value = {
    rooms: roomInventory,
    patients,
    addPatient,
    removePatient,
    hospitals: hospitalNames,
    selectedHospital,
    setSelectedHospital,
    doctors,
    addDoctor,
    notifications,
    addNotification,
  }

  return <HospitalContext.Provider value={value}>{children}</HospitalContext.Provider>
}

export { HospitalContext, HospitalProvider }
