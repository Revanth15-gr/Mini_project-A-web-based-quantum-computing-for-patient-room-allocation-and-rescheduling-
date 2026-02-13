import { createContext, useMemo, useState } from 'react'

const HospitalContext = createContext(null)

const roomInventory = [
  { name: 'Room 101', equipment: 'Telemetry, ICU' },
  { name: 'Room 102', equipment: 'Standard Care' },
  { name: 'Room 103', equipment: 'Isolation' },
  { name: 'Room 104', equipment: 'Imaging Prep' },
  { name: 'Room 105', equipment: 'Telemetry' },
  { name: 'Room 106', equipment: 'Post-Op' },
]

const seedPatients = [
  {
    name: 'Alice Harris',
    status: 'Stable',
    room: 'Room 101',
    care: 'Cardiology',
    next: '8:30 AM',
  },
  {
    name: 'John Miller',
    status: 'Observation',
    room: 'Room 103',
    care: 'Neurology',
    next: '10:15 AM',
  },
  {
    name: 'Sarah Lee',
    status: 'Imaging',
    room: 'Room 104',
    care: 'Radiology',
    next: '9:00 AM',
  },
  {
    name: 'Robert White',
    status: 'Recovering',
    room: 'Room 106',
    care: 'Orthopedics',
    next: '2:00 PM',
  },
]

function HospitalProvider({ children }) {
  const [patients, setPatients] = useState(seedPatients)

  const availableRooms = useMemo(() => {
    const occupied = new Set(patients.map((patient) => patient.room))
    return roomInventory.filter((room) => !occupied.has(room.name))
  }, [patients])

  const addPatient = (patient) => {
    const assignedRoom = availableRooms[0]?.name || 'Unassigned'
    const newPatient = { ...patient, room: assignedRoom }
    setPatients((current) => [newPatient, ...current])
    return assignedRoom
  }

  const value = {
    rooms: roomInventory,
    patients,
    addPatient,
  }

  return <HospitalContext.Provider value={value}>{children}</HospitalContext.Provider>
}

export { HospitalContext, HospitalProvider }
