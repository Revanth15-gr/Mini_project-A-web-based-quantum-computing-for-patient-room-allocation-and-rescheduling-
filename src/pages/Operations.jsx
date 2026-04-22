import { useContext, useEffect, useMemo, useState } from 'react'
import { HospitalContext } from '../state/HospitalContext.jsx'

function Operations() {
  const pushAction = (message) => {
    window.dispatchEvent(new CustomEvent('app-action', { detail: message }))
  }

  const {
    hospitals,
    doctors,
    opAppointments,
    bookOpAppointment,
    cancelOpAppointment,
    operationRooms,
    operationAllocations,
    allocateOperationRoom,
    releaseOperationRoom,
    selectedHospital,
    setSelectedHospital,
    addNotification,
  } = useContext(HospitalContext)

  const [appointmentForm, setAppointmentForm] = useState({
    patientName: '',
    hospital: selectedHospital,
    department: 'General Medicine',
    doctorName: '',
    appointmentDate: '',
    appointmentTime: '',
  })

  const [allocationForm, setAllocationForm] = useState({
    appointmentId: '',
    patientName: '',
    hospital: selectedHospital,
    procedure: 'General Surgery',
    priority: 'Routine',
    scheduledAt: '',
    estimatedDurationHours: '2',
  })

  const [quantumLoading, setQuantumLoading] = useState(false)
  const [quantumResult, setQuantumResult] = useState(null)
  const [liveSimulationOn, setLiveSimulationOn] = useState(false)

  const availableDoctors = useMemo(
    () => doctors.filter((doctor) => doctor.hospital === appointmentForm.hospital),
    [appointmentForm.hospital, doctors]
  )

  const availableRooms = useMemo(
    () =>
      operationRooms.filter(
        (room) => room.hospital === allocationForm.hospital && room.status === 'Available'
      ),
    [allocationForm.hospital, operationRooms]
  )

  const openAppointments = useMemo(
    () => opAppointments.filter((item) => item.status === 'Booked'),
    [opAppointments]
  )

  const activeAllocations = useMemo(
    () => operationAllocations.filter((item) => item.status === 'Allocated'),
    [operationAllocations]
  )

  const handleAppointmentSubmit = async (event) => {
    event.preventDefault()

    if (!appointmentForm.patientName.trim() || !appointmentForm.doctorName.trim()) {
      addNotification('Enter patient name and doctor name to book OP appointment', 'warning')
      return
    }

    const booked = await bookOpAppointment(appointmentForm)
    await runAutoQuantumOperationAllocation({
      appointments: booked ? [booked] : [],
      hospital: booked?.hospital || appointmentForm.hospital,
      silentNoBooked: true,
    })
    setAppointmentForm((current) => ({
      ...current,
      patientName: '',
      doctorName: '',
      appointmentDate: '',
      appointmentTime: '',
    }))
    pushAction(`OP booked: ${booked.patientName} at ${booked.hospital}`)
  }

  const handleCreateAllocation = async (event) => {
    event.preventDefault()

    const patientName = allocationForm.patientName.trim()
    if (!patientName) {
      addNotification('Enter patient details for OR allocation', 'warning')
      return
    }

    const created = await allocateOperationRoom({
      ...allocationForm,
      patientName,
      estimatedDurationHours: Number(allocationForm.estimatedDurationHours || 0),
    })

    if (created) {
      pushAction(`Allocated ${created.roomName} for ${created.patientName}`)
      setAllocationForm((current) => ({
        ...current,
        appointmentId: '',
        patientName: '',
        scheduledAt: '',
      }))
    }
  }

  const handleUseAppointment = (appointment) => {
    setAllocationForm((current) => ({
      ...current,
      appointmentId: appointment.id,
      patientName: appointment.patientName,
      hospital: appointment.hospital,
    }))
    setSelectedHospital(appointment.hospital)
    pushAction(`Loaded ${appointment.patientName} into OR allocation form`)
  }

  const executeQuantumCall = async (endpoint, payload, actionLabel) => {
    setQuantumLoading(true)
    try {
      const response = await fetch(endpoint, {
        method: payload ? 'POST' : 'GET',
        headers: { 'Content-Type': 'application/json' },
        body: payload ? JSON.stringify(payload) : undefined,
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error || data.detail || `Request failed (${response.status})`)
      }

      setQuantumResult({
        label: actionLabel,
        time: new Date().toLocaleTimeString(),
        data,
      })
      pushAction(`${actionLabel} completed`) 
      return data
    } catch (error) {
      addNotification(`Quantum call failed: ${error.message}`, 'error')
      return null
    } finally {
      setQuantumLoading(false)
    }
  }

  const runQuantumRoomAllocation = async () => {
    const patientsPayload = (patientsSourceForQuantum.length ? patientsSourceForQuantum : [{ id: 'P-001', priority: 1.2 }]).map((item, index) => ({
      id: item.id || item._id || `P-${index + 1}`,
      priority: Number(item.priority || 1.0),
      distance: Number(item.distance || index + 1),
    }))
    const roomsPayload = availableRooms.length
      ? availableRooms.slice(0, 8).map((room) => room.name)
      : ['Room 101', 'Room 102', 'Room 103']

    await executeQuantumCall('/api/quantum/room-allocation', {
      patients: patientsPayload,
      rooms: roomsPayload,
    }, 'Quantum Room Allocation')
  }

  const runQuantumEmergency = async () => {
    const emergencies = [
      { id: 'E-001', severity_score: 1.9, distance: 2.4 },
      { id: 'E-002', severity_score: 1.4, distance: 4.1 },
    ]
    const hospitalCandidates = hospitals.slice(0, 5).map((name, index) => ({
      name,
      capacity: 8 + index * 2,
      distance: 1.5 + index,
      specialist_match: 1.0 + (index % 3) * 0.1,
    }))

    await executeQuantumCall('/api/quantum/emergency', {
      emergencies,
      hospitals: hospitalCandidates,
    }, 'Quantum Emergency Assignment')
  }

  const runQuantumOperatingRoom = async () => {
    const cases = openAppointments.slice(0, 4).map((item, index) => ({
      id: item.id || `C-${index + 1}`,
      priority: item.status === 'Booked' ? 1.2 : 1.0,
    }))
    const operatingRooms = (availableRooms.length ? availableRooms : operationRooms)
      .slice(0, 6)
      .map((room) => room.name)

    await executeQuantumCall('/api/quantum/operating-room', {
      cases: cases.length ? cases : [{ id: 'C-001', priority: 1.1 }],
      operating_rooms: operatingRooms.length ? operatingRooms : ['OR-1', 'OR-2'],
    }, 'Quantum OR Scheduling')
  }

  const runAutoQuantumOperationAllocation = async ({ appointments = null, hospital = null, silentNoBooked = false } = {}) => {
    const hospitalToUse = hospital || allocationForm.hospital
    const appointmentsInHospital = openAppointments.filter(
      (item) => item.hospital === hospitalToUse
    )
    const targetAppointments = Array.isArray(appointments) && appointments.length
      ? appointments
      : (appointmentsInHospital.length ? appointmentsInHospital : openAppointments)

    if (!targetAppointments.length) {
      if (!silentNoBooked) {
        addNotification('No booked OP appointments available for automatic OR allocation', 'warning')
      }
      return
    }

    const freeRooms = operationRooms
      .filter((room) => room.hospital === hospitalToUse && room.status === 'Available')
      .map((room) => room.name)

    if (!freeRooms.length) {
      addNotification(`No available OR rooms in ${hospitalToUse} for auto allocation`, 'warning')
      return
    }

    const selectedAppointments = targetAppointments.slice(0, freeRooms.length)
    const quantumPayload = {
      cases: selectedAppointments.map((item, index) => ({
        id: item.id || `C-${index + 1}`,
        priority: item.priority === 'Emergency' ? 1.8 : item.priority === 'High' ? 1.3 : 1.0,
        distance: index + 1,
      })),
      operating_rooms: freeRooms,
    }

    const quantumData = await executeQuantumCall(
      '/api/quantum/operating-room',
      quantumPayload,
      'Quantum OR Auto Allocation'
    )

    const rawAllocations =
      quantumData?.result?.result?.allocations ||
      quantumData?.result?.allocations ||
      []

    const allocations = Array.isArray(rawAllocations) ? rawAllocations : []
    if (!allocations.length) {
      addNotification('Quantum OR scheduling returned no allocations', 'warning')
      return
    }

    const appointmentById = new Map(selectedAppointments.map((item) => [item.id, item]))
    let successCount = 0

    for (let index = 0; index < allocations.length; index += 1) {
      const item = allocations[index]
      const appointment = appointmentById.get(item?.entity)
      if (!appointment || !item?.resource) {
        continue
      }

      const scheduledAt = appointment.appointmentDate && appointment.appointmentTime
        ? `${appointment.appointmentDate}T${appointment.appointmentTime}`
        : new Date(Date.now() + index * 3600_000).toISOString().slice(0, 16)

      const created = await allocateOperationRoom({
        appointmentId: appointment.id,
        patientName: appointment.patientName,
        hospital: appointment.hospital,
        procedure: appointment.department === 'Surgery' ? 'General Surgery' : `${appointment.department} Procedure`,
        priority: 'High',
        scheduledAt,
        estimatedDurationHours: 2,
        preferredRoomName: item.resource,
      })

      if (created) {
        successCount += 1
      }
    }

    if (!successCount) {
      addNotification('Quantum auto allocation could not assign any operations', 'warning')
      return
    }

    addNotification(`Quantum auto allocation completed for ${successCount} operation(s)`, 'success')
    pushAction(`Quantum auto-allocated ${successCount} operations without manual entry`)
  }

  const runQuantumPrediction = async () => {
    await executeQuantumCall('/api/quantum/prediction', null, 'Quantum Prediction')
  }

  useEffect(() => {
    if (!liveSimulationOn) {
      return undefined
    }

    const runLive = async () => {
      await executeQuantumCall('/api/quantum/simulation?sampleSize=6', null, 'Quantum Live Simulation')
    }

    runLive()
    const timer = setInterval(runLive, 6000)
    return () => clearInterval(timer)
  }, [liveSimulationOn])

  const patientsSourceForQuantum = useMemo(
    () => opAppointments.slice(0, 8).map((item, index) => ({
      id: item.id || `P-${index + 1}`,
      priority: item.status === 'Booked' ? 1.3 : 1.0,
      distance: 1 + index,
    })),
    [opAppointments]
  )

  return (
    <div className="page-grid">
      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>OP Appointment Booking</h3>
            <p className="panel-subtitle">Book outpatient visits and move selected cases to surgery allocation</p>
          </div>
        </div>

        <form className="operations-form" onSubmit={handleAppointmentSubmit}>
          <input
            type="text"
            placeholder="Patient Name"
            value={appointmentForm.patientName}
            onChange={(event) =>
              setAppointmentForm((current) => ({ ...current, patientName: event.target.value }))
            }
            required
          />

          <select
            value={appointmentForm.hospital}
            onChange={(event) => {
              const hospital = event.target.value
              setAppointmentForm((current) => ({ ...current, hospital }))
              setSelectedHospital(hospital)
            }}
          >
            {hospitals.map((hospital) => (
              <option key={hospital} value={hospital}>
                {hospital}
              </option>
            ))}
          </select>

          <select
            value={appointmentForm.department}
            onChange={(event) =>
              setAppointmentForm((current) => ({ ...current, department: event.target.value }))
            }
          >
            <option>General Medicine</option>
            <option>Cardiology</option>
            <option>Neurology</option>
            <option>Orthopedics</option>
            <option>Surgery</option>
          </select>

          <input
            type="text"
            placeholder="Doctor Name"
            list="operations-doctors"
            value={appointmentForm.doctorName}
            onChange={(event) =>
              setAppointmentForm((current) => ({ ...current, doctorName: event.target.value }))
            }
            required
          />

          <datalist id="operations-doctors">
            {availableDoctors.slice(0, 30).map((doctor) => (
              <option key={doctor._id || doctor.id} value={doctor.name} />
            ))}
          </datalist>

          <input
            type="date"
            value={appointmentForm.appointmentDate}
            onChange={(event) =>
              setAppointmentForm((current) => ({ ...current, appointmentDate: event.target.value }))
            }
            required
          />

          <input
            type="time"
            value={appointmentForm.appointmentTime}
            onChange={(event) =>
              setAppointmentForm((current) => ({ ...current, appointmentTime: event.target.value }))
            }
            required
          />

          <button className="primary-button" type="submit">
            Book OP Appointment
          </button>
        </form>

        <div className="operations-list">
          {opAppointments.slice(0, 8).map((appointment) => (
            <article key={appointment.id} className="operation-item-card">
              <div>
                <p className="operation-item-title">{appointment.patientName}</p>
                <p className="operation-item-meta">
                  {appointment.hospital} | {appointment.department} | Dr. {appointment.doctorName.replace(/^Dr\.?\s*/i, '')}
                </p>
                <p className="operation-item-meta">
                  {appointment.appointmentDate || 'Date TBD'} {appointment.appointmentTime || ''}
                </p>
              </div>
              <div className="operation-item-actions">
                <span className="badge">{appointment.status}</span>
                {appointment.status === 'Booked' && (
                  <>
                    <button className="ghost-button" type="button" onClick={() => handleUseAppointment(appointment)}>
                      Send to OR
                    </button>
                    <button className="outline-button" type="button" onClick={() => void cancelOpAppointment(appointment.id)}>
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>Operation Room Allocation</h3>
            <p className="panel-subtitle">
              {allocationForm.hospital} | {availableRooms.length} operation rooms currently available | fully hands-free quantum auto allocation after OP booking
            </p>
          </div>
        </div>

        <form className="operations-form" onSubmit={handleCreateAllocation}>
          <select
            value={allocationForm.hospital}
            onChange={(event) => {
              const hospital = event.target.value
              setAllocationForm((current) => ({ ...current, hospital }))
              setSelectedHospital(hospital)
            }}
          >
            {hospitals.map((hospital) => (
              <option key={hospital} value={hospital}>
                {hospital}
              </option>
            ))}
          </select>

          <select
            value={allocationForm.appointmentId}
            onChange={(event) => {
              const appointmentId = event.target.value
              const selected = openAppointments.find((item) => item.id === appointmentId)
              setAllocationForm((current) => ({
                ...current,
                appointmentId,
                patientName: selected?.patientName || current.patientName,
                hospital: selected?.hospital || current.hospital,
              }))
            }}
          >
            <option value="">Optional: Select booked OP appointment</option>
            {openAppointments.map((appointment) => (
              <option key={appointment.id} value={appointment.id}>
                {appointment.id} - {appointment.patientName}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Patient Name"
            value={allocationForm.patientName}
            onChange={(event) =>
              setAllocationForm((current) => ({ ...current, patientName: event.target.value }))
            }
            required
          />

          <select
            value={allocationForm.procedure}
            onChange={(event) =>
              setAllocationForm((current) => ({ ...current, procedure: event.target.value }))
            }
          >
            <option>General Surgery</option>
            <option>Cardiac Surgery</option>
            <option>Neuro Surgery</option>
            <option>Orthopedic Surgery</option>
            <option>Emergency Surgery</option>
          </select>

          <select
            value={allocationForm.priority}
            onChange={(event) =>
              setAllocationForm((current) => ({ ...current, priority: event.target.value }))
            }
          >
            <option>Routine</option>
            <option>High</option>
            <option>Emergency</option>
          </select>

          <input
            type="datetime-local"
            value={allocationForm.scheduledAt}
            onChange={(event) =>
              setAllocationForm((current) => ({ ...current, scheduledAt: event.target.value }))
            }
            required
          />

          <button className="primary-button" type="submit">
            Allocate OR
          </button>
        </form>

        <div className="operations-list">
          {activeAllocations.length ? (
            activeAllocations.map((allocation) => (
              <article key={allocation.id} className="operation-item-card">
                <div>
                  <p className="operation-item-title">
                    {allocation.patientName} | {allocation.roomName}
                  </p>
                  <p className="operation-item-meta">
                    {allocation.procedure} | {allocation.priority} Priority
                  </p>
                  <p className="operation-item-meta">
                    {allocation.scheduledAt ? new Date(allocation.scheduledAt).toLocaleString() : 'Schedule pending'}
                  </p>
                </div>
                <div className="operation-item-actions">
                  <span className="badge">{allocation.status}</span>
                  <button className="outline-button" type="button" onClick={() => void releaseOperationRoom(allocation.id)}>
                    Complete
                  </button>
                </div>
              </article>
            ))
          ) : (
            <p className="panel-subtitle">No active operation room allocations yet.</p>
          )}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>Quantum Pipeline Live</h3>
            <p className="panel-subtitle">Run FastAPI hybrid quantum endpoints directly from frontend</p>
          </div>
          <button
            className="ghost-button"
            type="button"
            onClick={() => setLiveSimulationOn((current) => !current)}
          >
            {liveSimulationOn ? 'Stop Live Simulation' : 'Start Live Simulation'}
          </button>
        </div>

        <div className="quantum-action-row">
          <button className="primary-button" type="button" onClick={runQuantumRoomAllocation} disabled={quantumLoading}>
            Run Room Allocation
          </button>
          <button className="outline-button" type="button" onClick={runQuantumEmergency} disabled={quantumLoading}>
            Run Emergency
          </button>
          <button className="outline-button" type="button" onClick={runQuantumOperatingRoom} disabled={quantumLoading}>
            Run OR Scheduling
          </button>
          <button className="ghost-button" type="button" onClick={runQuantumPrediction} disabled={quantumLoading}>
            Run Prediction
          </button>
        </div>

        {quantumResult ? (
          <div className="quantum-result-box">
            <p className="operation-item-title">{quantumResult.label}</p>
            <p className="operation-item-meta">Updated at {quantumResult.time}</p>
            <pre className="quantum-result-pre">{JSON.stringify(quantumResult.data, null, 2)}</pre>
          </div>
        ) : (
          <p className="panel-subtitle">Run any quantum action above to see live backend results in frontend.</p>
        )}
      </section>
    </div>
  )
}

export default Operations
