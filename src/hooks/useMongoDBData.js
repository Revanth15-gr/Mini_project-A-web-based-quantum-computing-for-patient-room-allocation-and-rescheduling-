import { useEffect, useState } from 'react'

/**
 * Custom hook to fetch and manage data from MongoDB APIs
 */
export const useMongoDBData = () => {
  const [hospitals, setHospitals] = useState([])
  const [rooms, setRooms] = useState([])
  const [doctors, setDoctors] = useState([])
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch all data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        const [hospitalsRes, roomsRes, doctorsRes, patientsRes] = await Promise.all([
          fetch('/api/hospitals').catch((e) => ({ ok: false, error: e.message })),
          fetch('/api/rooms').catch((e) => ({ ok: false, error: e.message })),
          fetch('/api/doctors').catch((e) => ({ ok: false, error: e.message })),
          fetch('/api/patients').catch((e) => ({ ok: false, error: e.message })),
        ])

        if (hospitalsRes.ok) setHospitals(await hospitalsRes.json())
        if (roomsRes.ok) setRooms(await roomsRes.json())
        if (doctorsRes.ok) setDoctors(await doctorsRes.json())
        if (patientsRes.ok) setPatients(await patientsRes.json())
      } catch (err) {
        console.error('Error fetching MongoDB data:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Add patient and persist to MongoDB
  const addPatientToMongoDB = async (patient, roomId) => {
    try {
      const patientData = {
        name: patient.name,
        status: patient.status,
        care: patient.care,
        next: patient.next,
        hospital: patient.hospital,
        room: roomId?.name || null,
        roomId: roomId?._id || null,
      }

      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patientData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to add patient')
      }

      const newPatient = await response.json()
      setPatients((prev) => [...prev, newPatient])
      return newPatient
    } catch (err) {
      console.error('Error adding patient:', err)
      throw err
    }
  }

  // Delete patient and update MongoDB
  const deletePatient = async (patientId) => {
    try {
      const response = await fetch(`/api/patients/${patientId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete patient')

      setPatients((prev) => prev.filter((p) => p._id !== patientId))
    } catch (err) {
      console.error('Error deleting patient:', err)
      throw err
    }
  }

  return {
    hospitals,
    rooms,
    doctors,
    patients,
    setPatients,
    loading,
    error,
    addPatientToMongoDB,
    deletePatient,
  }
}
