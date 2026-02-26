import { useContext, useEffect, useMemo, useState } from 'react'
import { HospitalContext } from '../state/HospitalContext.jsx'

function PatientsInfo() {
  const pushAction = (message) => {
    window.dispatchEvent(new CustomEvent('app-action', { detail: message }))
  }

  const [showForm, setShowForm] = useState(false)
  const [isRescheduling, setIsRescheduling] = useState(false)
  const [reschedulingResult, setReschedulingResult] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false)
  const [selectedPatients, setSelectedPatients] = useState([])
  const [isApplyingSchedule, setIsApplyingSchedule] = useState(false)
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
      patient.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [patients, searchTerm])

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
    setShowRescheduleDialog(false)
    pushAction('Starting quantum optimization rescheduling...')
    addNotification('Running QAOA optimization for patient rescheduling...', 'info')

    try {
      // Get only selected patients
      const hospitalPatients = patients.filter((p) => 
        p.hospital === selectedHospital && selectedPatients.includes(p._id || p.name)
      )
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
      const patientsForQaoa = hospitalPatients.slice(0, maxQaoaSize).map((p, i) => ({
        id: p.name || `patient-${i}`,
        priority: 1.2 - i * 0.05,
      }))
      const roomsForQaoa = hospitalRooms.slice(0, maxQaoaSize).map((r) => r.name)
      
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

      const response = await fetch('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patients: patientsForQaoa,
          rooms: roomsForQaoa,
        }),
      })

      console.log('Response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('QAOA Rescheduling Error:', errorData)
        throw new Error(errorData.detail || `API returned ${response.status}`)
      }

      const result = await response.json()
      console.log('QAOA Rescheduling Result:', result)
      
      if (!result.assignments || result.assignments.length === 0) {
        throw new Error('No assignments returned from optimization')
      }

      setReschedulingResult(result)
      addNotification('QAOA rescheduling completed successfully', 'success')
      pushAction(
        `Rescheduling complete: ${result.assignments.length} patients optimized with cost ${result.cost?.toFixed(2) || 'N/A'}`
      )
    } catch (error) {
      console.error('Rescheduling error:', error)
      addNotification(`Rescheduling failed: ${error.message}`, 'error')
      pushAction(`Rescheduling error: ${error.message}`)
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
    setSelectedPatients(hospitalPatients.map(p => p._id || p.name))
    
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
    setSelectedPatients(hospitalPatients.map(p => p._id || p.name))
  }

  const handleDeselectAll = () => {
    setSelectedPatients([])
  }

  const handleApplyOptimizedSchedule = async () => {
    if (!reschedulingResult || !reschedulingResult.assignments) {
      addNotification('No optimization results to apply', 'error')
      return
    }

    setIsApplyingSchedule(true)
    console.log('Applying optimized schedule:', reschedulingResult.assignments)
    pushAction('Applying optimized room assignments...')
    addNotification('Applying optimized room assignments...', 'info')

    try {
      let successCount = 0
      let errorCount = 0

      // Update each patient with their new room assignment
      for (const assignment of reschedulingResult.assignments) {
        try {
          // Find the patient by name
          const patient = patients.find(p => p.name === assignment.patient)
          
          if (!patient) {
            console.warn(`Patient not found: ${assignment.patient}`)
            errorCount++
            continue
          }

          if (!assignment.room) {
            console.warn(`No room assigned for: ${assignment.patient}`)
            errorCount++
            continue
          }

          // Update patient room assignment
          console.log(`Updating ${patient.name} from ${patient.room} to ${assignment.room}`)
          
          await updatePatient(patient._id, {
            ...patient,
            room: assignment.room
          })

          successCount++
        } catch (error) {
          console.error(`Error updating patient ${assignment.patient}:`, error)
          errorCount++
        }
      }

      if (errorCount === 0) {
        addNotification(`✓ Successfully applied optimized schedule to ${successCount} patients`, 'success')
        pushAction(`Applied optimized schedule to ${successCount} patients`)
      } else {
        addNotification(
          `Applied schedule: ${successCount} successful, ${errorCount} failed`,
          'warning'
        )
        pushAction(`Applied schedule: ${successCount} successful, ${errorCount} failed`)
      }

      // Clear the results after applying
      setTimeout(() => {
        setReschedulingResult(null)
      }, 3000)

    } catch (error) {
      console.error('Error applying optimized schedule:', error)
      addNotification(`Failed to apply schedule: ${error.message}`, 'error')
      pushAction(`Error applying schedule: ${error.message}`)
    } finally {
      setIsApplyingSchedule(false)
    }
  }

  return (
    <div className="page-grid">
      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>Patient Overview</h3>
            <p className="panel-subtitle">Live census with quantum priority tags</p>
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
          {filteredPatients.map((patient) => (
            <div
              key={patient.name}
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
                        <p className="queue-title">{assignment.patient}</p>
                        <p className="queue-meta">Assigned to {assignment.room || 'No room available'}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center' }}>
                  <button
                    className="primary-button"
                    type="button"
                    onClick={handleApplyOptimizedSchedule}
                    disabled={isApplyingSchedule}
                    style={{ minWidth: '200px' }}
                  >
                    {isApplyingSchedule ? 'Applying Schedule...' : 'Apply Optimized Schedule'}
                  </button>
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
                patients.filter((p) => p.hospital === selectedHospital).map((patient) => (
                  <label 
                    key={patient._id || patient.name}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #e0e0e0',
                      marginBottom: '0.5rem',
                      cursor: 'pointer',
                      backgroundColor: selectedPatients.includes(patient._id || patient.name) ? '#f0f8ff' : '#fff',
                      transition: 'all 0.2s',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedPatients.includes(patient._id || patient.name)}
                      onChange={() => handlePatientToggle(patient._id || patient.name)}
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
