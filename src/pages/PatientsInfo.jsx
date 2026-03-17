import { useContext, useEffect, useMemo, useState } from 'react'
import { HospitalContext } from '../state/HospitalContext.jsx'

function PatientsInfo() {
  const pushAction = (message) => {
    window.dispatchEvent(new CustomEvent('app-action', { detail: message }))
  }

  const getPatientKey = (patient, fallbackIndex = 0) =>
    patient._id ||
    patient.id ||
    `${patient.hospital}:${patient.name}:${patient.room || 'unassigned'}:${patient.next || 'none'}:${fallbackIndex}`

  const [showForm, setShowForm] = useState(false)
  const [isRescheduling, setIsRescheduling] = useState(false)
  const [reschedulingResult, setReschedulingResult] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false)
  const [selectedPatients, setSelectedPatients] = useState([])
  const [isApplyingSchedule, setIsApplyingSchedule] = useState(false)
  const [hasAppliedOptimizedSchedule, setHasAppliedOptimizedSchedule] = useState(false)
  const {
    rooms,
    patients,
    addPatient,
    removePatient,
    updatePatient,
    hospitals,
    selectedHospital,
    setSelectedHospital,
    addNotification,
  } = useContext(HospitalContext)
  const [formData, setFormData] = useState({
    name: '',
    status: 'Stable',
    care: 'General Medicine',
    next: '9:30 AM',
    hospital: selectedHospital,
  })

  // Sync form hospital with global selected hospital
  useEffect(() => {
    setFormData((current) => ({ ...current, hospital: selectedHospital }))
  }, [selectedHospital])

  const availableRooms = useMemo(() => {
    const occupied = new Set(
      patients
        .filter((p) => p.hospital === formData.hospital)
        .map((p) => `${p.hospital}-${p.room}`)
    )
    return rooms.filter(
      (room) =>
        room.hospital === formData.hospital &&
        !occupied.has(`${room.hospital}-${room.name}`)
    )
  }, [patients, rooms, formData.hospital])

  const filteredPatients = useMemo(() => {
    return patients.filter((patient) =>
      patient.hospital === selectedHospital &&
      patient.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [patients, searchTerm, selectedHospital])

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
    // Sync hospital selection with global state
    if (name === 'hospital') {
      setSelectedHospital(value)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!formData.name.trim()) {
      pushAction('Patient name is required')
      return
    }

    const newPatient = {
      name: formData.name.trim(),
      status: formData.status,
      care: formData.care,
      next: formData.next,
      hospital: formData.hospital,
    }

    const assignedRoom = await addPatient(newPatient)
    setFormData({
      name: '',
      status: 'Stable',
      care: 'General Medicine',
      next: '9:30 AM',
      hospital: selectedHospital,
    })
    setShowForm(false)
    pushAction(
      `Added ${newPatient.name} • ${formData.hospital} • Room: ${assignedRoom}`
    )
  }

  const handleRescheduling = async () => {
    if (selectedPatients.length === 0) {
      pushAction('Please select at least one patient to reschedule')
      addNotification('Please select at least one patient to reschedule', 'error')
      return
    }

    setIsRescheduling(true)
    setReschedulingResult(null)
    setHasAppliedOptimizedSchedule(false)
    setShowRescheduleDialog(false)
    pushAction('Starting quantum optimization rescheduling...')
    addNotification('Running QAOA optimization for patient rescheduling...', 'info')

    let patientsForQaoa = []
    let roomsForQaoa = []

    const buildOfflineResult = () => {
      const offlineAssignments = patientsForQaoa.map((patient, index) => ({
        patient: patient.label || patient.id,
        patientId: patient.id,
        patientName: patient.label || patient.id,
        room: roomsForQaoa[index] || null,
      }))

      return {
        cost: offlineAssignments.filter((item) => item.room).length,
        assignments: offlineAssignments,
        probabilities: [],
        solver: 'frontend-fallback',
        message: 'Optimization service unavailable. Used local fallback assignment.',
      }
    }

    try {
      // Get only selected patients
      const allSelectedPatients = patients.filter((patient, index) =>
        patient.hospital === selectedHospital && selectedPatients.includes(getPatientKey(patient, index))
      )
      // Deduplicate by name — prefer the entry that has a MongoDB _id
      const nameMap = new Map()
      for (const patient of allSelectedPatients) {
        if (!nameMap.has(patient.name) || patient._id) {
          nameMap.set(patient.name, patient)
        }
      }
      const hospitalPatients = Array.from(nameMap.values())
      const hospitalRooms = rooms.filter((r) => r.hospital === selectedHospital)

      if (hospitalPatients.length === 0) {
        addNotification(`No patients selected in ${selectedHospital}`, 'error')
        setIsRescheduling(false)
        return
      }

      if (hospitalRooms.length === 0) {
        addNotification(`No rooms available in ${selectedHospital}`, 'error')
        setIsRescheduling(false)
        return
      }

      // QAOA quantum simulation limited to 8 patients/rooms due to memory constraints
      const maxQaoaSize = 8
      patientsForQaoa = hospitalPatients.slice(0, maxQaoaSize).map((p, i) => ({
        id: getPatientKey(p, i),
        label: p.name || `patient-${i}`,
        priority: 1.2 - i * 0.05,
      }))
      roomsForQaoa = hospitalRooms.slice(0, maxQaoaSize).map((r) => r.name)
      
      if (hospitalPatients.length > maxQaoaSize) {
        addNotification(
          `Optimizing first ${maxQaoaSize} of ${hospitalPatients.length} patients (quantum simulation limit)`,
          'info'
        )
      }

      console.log('QAOA Rescheduling Request:', { 
        patients: patientsForQaoa, 
        rooms: roomsForQaoa,
        hospital: selectedHospital
      })

      const optimizePayload = JSON.stringify({
        patients: patientsForQaoa,
        rooms: roomsForQaoa,
      })

      const optimizeEndpoints = [
        '/api/optimize',
        'http://127.0.0.1:4000/api/optimize',
        'http://localhost:4000/api/optimize',
        'http://127.0.0.1:8000/optimize',
        'http://localhost:8000/optimize',
      ]

      let response = null
      let lastFetchError = null

      for (const endpoint of optimizeEndpoints) {
        try {
          response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: optimizePayload,
          })
          break
        } catch (fetchError) {
          lastFetchError = fetchError
        }
      }

      if (!response) {
        const offlineResult = buildOfflineResult()

        setReschedulingResult(offlineResult)
        addNotification('Optimization service unreachable. Applied local fallback scheduling.', 'warning')
        pushAction(
          `Fallback schedule applied: ${offlineResult.assignments.length} patients` +
            (lastFetchError?.message ? ` (${lastFetchError.message})` : '')
        )
        await applyOptimizedSchedule(offlineResult)
        return
      }

      console.log('Response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('QAOA Rescheduling Error:', errorData)
        throw new Error(errorData.detail || `API returned ${response.status}`)
      }

      const result = await response.json()
      console.log('QAOA Rescheduling Result:', result)

      const dedupedAssignments = []
      const seenPatientIds = new Set()
      const seenPatientNames = new Set()
      for (const assignment of result.assignments || []) {
        const assignmentKey = assignment.patientId || assignment.patient
        const displayName = assignment.patientName || assignment.patient
        if (seenPatientIds.has(assignmentKey) || (displayName && seenPatientNames.has(displayName))) {
          continue
        }
        if (assignmentKey) seenPatientIds.add(assignmentKey)
        if (displayName) seenPatientNames.add(displayName)
        dedupedAssignments.push(assignment)
      }
      
      if (dedupedAssignments.length === 0) {
        throw new Error('No assignments returned from optimization')
      }

      const normalizedResult = {
        ...result,
        assignments: dedupedAssignments,
      }

      setReschedulingResult(normalizedResult)
      addNotification('QAOA rescheduling completed successfully', 'success')
      pushAction(
        `Rescheduling complete: ${normalizedResult.assignments.length} patients optimized with cost ${normalizedResult.cost?.toFixed(2) || 'N/A'}`
      )
      await applyOptimizedSchedule(normalizedResult)
    } catch (error) {
      console.error('Rescheduling error:', error)
      const offlineResult = buildOfflineResult()
      if (offlineResult.assignments.length > 0) {
        setReschedulingResult(offlineResult)
        addNotification('Network issue detected. Applied local fallback scheduling.', 'warning')
        pushAction('Rescheduling service unreachable. Applied local fallback schedule.')
        await applyOptimizedSchedule(offlineResult)
      } else {
        addNotification(`Rescheduling failed: ${error.message}`, 'error')
        pushAction(`Rescheduling error: ${error.message}`)
      }
    } finally {
      setIsRescheduling(false)
    }
  }

  const handleOpenRescheduleDialog = () => {
    const hospitalPatients = patients.filter((p) => p.hospital === selectedHospital)
    
    if (hospitalPatients.length === 0) {
      pushAction('No patients available to reschedule')
      addNotification('No patients available to reschedule', 'error')
      return
    }
    
    // Pre-select all patients
    setSelectedPatients(hospitalPatients.map((patient, index) => getPatientKey(patient, index)))
    
    // Open dialog
    setShowRescheduleDialog(true)
    console.log('Opening reschedule dialog for', hospitalPatients.length, 'patients')
  }

  const handlePatientToggle = (patientId) => {
    setSelectedPatients(prev => 
      prev.includes(patientId) 
        ? prev.filter(id => id !== patientId)
        : [...prev, patientId]
    )
  }

  const handleSelectAll = () => {
    const hospitalPatients = patients.filter((p) => p.hospital === selectedHospital)
    setSelectedPatients(hospitalPatients.map((patient, index) => getPatientKey(patient, index)))
  }

  const handleDeselectAll = () => {
    setSelectedPatients([])
  }

  const applyOptimizedSchedule = async (optimizationResult = reschedulingResult) => {
    if (!optimizationResult || !optimizationResult.assignments) {
      addNotification('No optimization results to apply', 'error')
      return
    }

    setIsApplyingSchedule(true)
    console.log('Applying optimized schedule:', optimizationResult.assignments)

    // Build a lookup: patientName / patientId → new room
    const roomUpdates = new Map()
    for (const assignment of optimizationResult.assignments) {
      if (!assignment.room) continue
      const nameKey = (assignment.patientName || assignment.patient || '').trim().toLowerCase()
      const idKey = assignment.patientId || null
      if (idKey) roomUpdates.set(idKey, assignment.room)
      if (nameKey) roomUpdates.set(nameKey, assignment.room)
    }

    // Step 1: Update ALL matching patients in local state at once so UI reflects changes immediately
    setPatients((current) =>
      current.map((p) => {
        const idKey = p._id || p.id || null
        const nameKey = (p.name || '').trim().toLowerCase()
        const newRoom = (idKey && roomUpdates.has(idKey))
          ? roomUpdates.get(idKey)
          : (nameKey && roomUpdates.has(nameKey))
            ? roomUpdates.get(nameKey)
            : null
        if (!newRoom || newRoom === p.room) return p
        console.log(`Room update: ${p.name} → ${newRoom}`)
        return { ...p, room: newRoom }
      })
    )

    const appliedCount = optimizationResult.assignments.filter((a) => a.room).length
    addNotification(`✓ Room assignments updated for ${appliedCount} patients`, 'success')
    pushAction(`Applied optimized schedule to ${appliedCount} patients`)
    setHasAppliedOptimizedSchedule(true)

    // Step 2: Persist to MongoDB in background (non-blocking)
    for (const assignment of optimizationResult.assignments) {
      if (!assignment.room) continue
      const patient = patients.find((item) => {
        if (assignment.patientId) {
          if (item._id && item._id === assignment.patientId) return true
          if (item.id && item.id === assignment.patientId) return true
        }
        if (assignment.patientName && item.name === assignment.patientName) return true
        if (assignment.patient && item.name === assignment.patient) return true
        return false
      })
      if (!patient || !patient._id) continue
      fetch(`/api/patients/${patient._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...patient, room: assignment.room }),
      }).catch((err) => console.warn(`Background room persist failed for ${patient.name}:`, err.message))
    }

    setTimeout(() => setReschedulingResult(null), 4000)
    setIsApplyingSchedule(false)
  }

  const handleApplyOptimizedSchedule = async () => {
    await applyOptimizedSchedule(reschedulingResult)
  }

  return (
    <div className="page-grid">
      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>Patient Overview</h3>
            <p className="panel-subtitle">Live census with quantum priority tags</p>
            <div style={{ marginTop: '0.75rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                <span>Hospital:</span>
                <select 
                  value={selectedHospital} 
                  onChange={(e) => {
                    setSelectedHospital(e.target.value)
                    setSearchTerm('')
                  }}
                  style={{
                    padding: '0.4rem 0.6rem',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    backgroundColor: '#fff',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  {hospitals.map((hospital) => (
                    <option key={hospital} value={hospital}>
                      {hospital}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
          <button
            className="primary-button"
            type="button"
            onClick={() => setShowForm((current) => !current)}
          >
            {showForm ? 'Close Form' : 'Add Patient'}
          </button>
        </div>
        {showForm ? (
          <form className="patient-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <label>
                Hospital
                <select name="hospital" value={formData.hospital} onChange={handleChange}>
                  {hospitals.map((hospital) => (
                    <option key={hospital} value={hospital}>
                      {hospital}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Patient Name
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter patient name"
                  required
                />
              </label>
              <label>
                Status
                <select name="status" value={formData.status} onChange={handleChange}>
                  <option>Stable</option>
                  <option>Observation</option>
                  <option>Imaging</option>
                  <option>Recovering</option>
                  <option>Critical</option>
                </select>
              </label>
              <label>
                Care Path
                <select name="care" value={formData.care} onChange={handleChange}>
                  <option>General Medicine</option>
                  <option>Cardiology</option>
                  <option>Neurology</option>
                  <option>Orthopedics</option>
                  <option>Radiology</option>
                </select>
              </label>
              <label>
                Next Check
                <input
                  type="text"
                  name="next"
                  value={formData.next}
                  onChange={handleChange}
                  placeholder="9:30 AM"
                />
              </label>
            </div>
            <div className="form-footer">
              <p className="panel-subtitle">
                Auto-assigning room: {availableRooms[0]?.name || 'No rooms available'}
              </p>
              <button className="primary-button" type="submit">
                Save & Allocate
              </button>
            </div>
          </form>
        ) : null}
        <div className="panel-search">
          <span className="search-icon" aria-hidden="true" />
          <input
            type="search"
            placeholder="Search patient by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search patients"
          />
        </div>
        <div className="table table-7">
          <div className="table-row table-head table-row-7">
            <span>Patient</span>
            <span>Hospital</span>
            <span>Status</span>
            <span>Room</span>
            <span>Care Path</span>
            <span>Next Check</span>
            <span>Action</span>
          </div>
          {filteredPatients.map((patient, idx) => (
            <div
              key={patient._id || patient.id || `${patient.hospital}-${patient.name}-${idx}`}
              className="table-row table-row-7"
              onClick={() =>
                pushAction(
                  `Patient: ${patient.name} | Hospital: ${patient.hospital} | Status: ${patient.status} | Room: ${patient.room}`
                )
              }
              style={{ cursor: 'pointer' }}
            >
              <span className="table-strong">{patient.name}</span>
              <span style={{ fontSize: '0.85rem' }}>{patient.hospital}</span>
              <span className="badge">{patient.status}</span>
              <span>{patient.room}</span>
              <span>{patient.care}</span>
              <span>{patient.next}</span>
              <button
                className="ghost-button"
                type="button"
                onClick={async (event) => {
                  event.stopPropagation()
                  const reason = prompt(
                    `Enter discharge reason for ${patient.name}:`,
                    'Treatment completed successfully'
                  )
                  if (reason !== null) {
                    await removePatient(patient, reason || 'Discharged')
                    pushAction(`Discharged ${patient.name} • Room freed • Reason: ${reason || 'Discharged'}`)
                  }
                }}
              >
                Discharge
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>Quantum Rescheduling Queue</h3>
            <p className="panel-subtitle">
              Optimize patient assignments for {selectedHospital}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {reschedulingResult && (
              <button
                className="outline-button"
                type="button"
                onClick={() => setReschedulingResult(null)}
              >
                Clear Results
              </button>
            )}
            <button
              className="outline-button"
              type="button"
              onClick={handleOpenRescheduleDialog}
              disabled={isRescheduling || patients.filter((p) => p.hospital === selectedHospital).length === 0}
            >
              {isRescheduling ? 'Optimizing...' : 'Run Optimization'}
            </button>
          </div>
        </div>
        {isRescheduling ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <div
              style={{
                display: 'inline-block',
                width: '40px',
                height: '40px',
                border: '4px solid rgba(15, 34, 65, 0.1)',
                borderTopColor: '#0f2241',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }}
            />
            <p style={{ marginTop: '1rem', color: '#666' }}>
              Running QAOA optimization...
            </p>
          </div>
        ) : reschedulingResult ? (
          <div style={{ padding: '1.5rem' }}>
            <div
              style={{
                background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                color: '#fff',
                padding: '1rem',
                borderRadius: '8px',
                marginBottom: '1rem',
              }}
            >
              <strong>Optimization Complete</strong>
              <p style={{ fontSize: '0.9rem', marginTop: '0.5rem', opacity: 0.95 }}>
                {reschedulingResult.message || 'Patient assignments optimized successfully'}
              </p>
              {reschedulingResult.cost !== undefined && (
                <p style={{ fontSize: '0.85rem', marginTop: '0.25rem', opacity: 0.9 }}>
                  Optimization Cost: {reschedulingResult.cost.toFixed(3)}
                </p>
              )}
            </div>
            {reschedulingResult.assignments && reschedulingResult.assignments.length > 0 && (
              <div>
                <h4 style={{ marginBottom: '0.75rem', fontSize: '0.95rem' }}>
                  Optimized Assignments ({reschedulingResult.assignments.length} patients):
                </h4>
                <div className="queue-list">
                  {reschedulingResult.assignments.slice(0, 8).map((assignment, idx) => (
                    <div key={idx} className="queue-item">
                      <div className="queue-pulse" aria-hidden="true" />
                      <div>
                        <p className="queue-title">{assignment.patientName || assignment.patient}</p>
                        <p className="queue-meta">Assigned to {assignment.room || 'No room available'}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center' }}>
                  {hasAppliedOptimizedSchedule ? (
                    <p style={{ color: '#1e6b52', fontWeight: 600, margin: 0 }}>
                      Room numbers updated automatically after rescheduling.
                    </p>
                  ) : (
                    <button
                      className="primary-button"
                      type="button"
                      onClick={handleApplyOptimizedSchedule}
                      disabled={isApplyingSchedule}
                      style={{ minWidth: '200px' }}
                    >
                      {isApplyingSchedule ? 'Applying Schedule...' : 'Apply Optimized Schedule'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="queue-list">
            {patients.filter((p) => p.hospital === selectedHospital).length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                No patients in {selectedHospital} to optimize
              </div>
            ) : (
              <div style={{ padding: '1.5rem', color: '#666' }}>
                <p>
                  {patients.filter((p) => p.hospital === selectedHospital).length} patients ready for optimization
                </p>
                <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
                  Click "Run Optimization" to use quantum algorithms for optimal room assignments
                </p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Reschedule Dialog */}
      {showRescheduleDialog && (
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
          onClick={() => setShowRescheduleDialog(false)}
        >
          <div 
            style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              padding: '2rem',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.5rem', color: '#0f2241' }}>
                Select Patients for Rescheduling
              </h3>
              <p style={{ margin: '0.5rem 0 0 0', color: '#666', fontSize: '0.9rem' }}>
                Choose patients from {selectedHospital} to optimize with QAOA
              </p>
            </div>

            <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
              <button
                className="outline-button"
                type="button"
                onClick={handleSelectAll}
                style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}
              >
                Select All
              </button>
              <button
                className="outline-button"
                type="button"
                onClick={handleDeselectAll}
                style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}
              >
                Deselect All
              </button>
            </div>

            <div style={{ marginBottom: '1.5rem', maxHeight: '400px', overflowY: 'auto' }}>
              {patients.filter((p) => p.hospital === selectedHospital).length === 0 ? (
                <p style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>
                  No patients available in {selectedHospital}
                </p>
              ) : (
                patients.filter((p) => p.hospital === selectedHospital).map((patient, index) => (
                  <label 
                    key={getPatientKey(patient, index)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #e0e0e0',
                      marginBottom: '0.5rem',
                      cursor: 'pointer',
                      backgroundColor: selectedPatients.includes(getPatientKey(patient, index)) ? '#f0f8ff' : '#fff',
                      transition: 'all 0.2s',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedPatients.includes(getPatientKey(patient, index))}
                      onChange={() => handlePatientToggle(getPatientKey(patient, index))}
                      style={{ marginRight: '0.75rem', width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', color: '#0f2241' }}>
                        {patient.name}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>
                        Room: {patient.room} • {patient.status} • {patient.care}
                      </div>
                    </div>
                  </label>
                ))
              )}
            </div>

            <div style={{ 
              display: 'flex', 
              gap: '0.75rem', 
              justifyContent: 'flex-end',
              borderTop: '1px solid #e0e0e0',
              paddingTop: '1.5rem'
            }}>
              <button
                className="outline-button"
                type="button"
                onClick={() => setShowRescheduleDialog(false)}
              >
                Cancel
              </button>
              <button
                className="primary-button"
                type="button"
                onClick={handleRescheduling}
                disabled={selectedPatients.length === 0}
              >
                Optimize {selectedPatients.length} Patient{selectedPatients.length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PatientsInfo
