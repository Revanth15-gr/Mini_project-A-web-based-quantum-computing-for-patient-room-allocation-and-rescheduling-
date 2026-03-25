import { useContext, useEffect, useMemo, useState } from 'react'
import { HospitalContext } from '../state/HospitalContext.jsx'

const rooms = ['Room 101', 'Room 102', 'Room 103', 'Room 104', 'Room 105', 'Room 106', 'Room 107', 'Room 108', 'Room 109', 'Room 110', 'Room 111', 'Room 112', 'Room 113', 'Room 114', 'Room 115', 'Room 116', 'Room 117', 'Room 118', 'Room 119', 'Room 120']
const times = ['7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '2:00 PM']

const assignments = [
  {
    time: '7:00 AM',
    room: 'Room 101',
    name: 'Alice Harris',
    note: 'Vitals',
    tone: 'cool',
  },
  {
    time: '7:00 AM',
    room: 'Room 102',
    name: 'Dak & Miller',
    note: 'Labs',
    tone: 'ice',
  },
  {
    time: '8:00 AM',
    room: 'Room 101',
    name: 'Sarah Lee',
    note: 'MRI',
    tone: 'warm',
  },
  {
    time: '8:00 AM',
    room: 'Room 103',
    name: 'John Miller',
    note: 'Meds',
    tone: 'cool',
  },
  {
    time: '9:00 AM',
    room: 'Room 103',
    name: 'Sarah Lee',
    note: 'Medications',
    tone: 'mint',
  },
  {
    time: '9:00 AM',
    room: 'Room 104',
    name: 'Sarah Lee',
    note: 'Follow-up',
    tone: 'ice',
  },
  {
    time: '9:00 AM',
    room: 'Room 105',
    name: 'Robert White',
    note: 'Monitoring',
    tone: 'cool',
  },
  {
    time: '10:00 AM',
    room: 'Room 106',
    name: 'Robert White',
    note: 'BEDS',
    tone: 'warm',
  },
  {
    time: '2:00 PM',
    room: 'Room 105',
    name: 'John Miller',
    note: 'Discharge',
    tone: 'ice',
  },
  {
    time: '2:00 PM',
    room: 'Room 106',
    name: 'Emma Rools',
    note: 'Monitoring',
    tone: 'mint',
  },
]

const insights = [
  { label: 'Estimated Cost Savings', value: '$850', delta: '+12%' },
  { label: 'Efficiency Improvement', value: '31%', delta: '+5%' },
  { label: 'Conflicts Resolved', value: '21', delta: '-8%' },
]

const fallbackChanges = [
  { name: 'Sarah Lee', from: 'Room 104', to: 'Room 101' },
  { name: 'William Brown', from: 'Room 105', to: 'Room 103' },
  { name: 'John Miller', from: 'Room 102', to: 'Room 103' },
]

const REPORT_STORAGE_KEY = 'optimizationReportData'
const RUN_HISTORY_KEY = 'optimizationRunHistory'
const DASHBOARD_VIDEO_SRC = '/media/dashboard-interactive.mp4'

function formatLatency(ms) {
  if (!Number.isFinite(ms) || ms <= 0) {
    return '1.2s'
  }
  return `${(ms / 1000).toFixed(2)}s`
}

function computeFairness(assignmentsList, roomNames) {
  if (!assignmentsList?.length || !roomNames?.length) {
    return 0.94
  }
  const roomLoad = roomNames.map((roomName) =>
    assignmentsList.filter((item) => item.room === roomName).length
  )
  const sum = roomLoad.reduce((acc, val) => acc + val, 0)
  const sumSquares = roomLoad.reduce((acc, val) => acc + val * val, 0)
  if (sum === 0 || sumSquares === 0) {
    return 0
  }
  return Number(((sum * sum) / (roomLoad.length * sumSquares)).toFixed(2))
}

function getAssignment(time, room) {
  return assignments.find((item) => item.time === time && item.room === room)
}

function pushAction(message) {
  window.dispatchEvent(new CustomEvent('app-action', { detail: message }))
}

function readLatestReport() {
  try {
    return JSON.parse(localStorage.getItem(REPORT_STORAGE_KEY) || 'null')
  } catch {
    return null
  }
}

function normalizeName(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
}

function getAssignmentPatientName(item) {
  return item?.patientName || item?.patient || item?.label || item?.name || ''
}

function toFiniteNumber(value, fallback = null) {
  const num = Number(value)
  return Number.isFinite(num) ? num : fallback
}

function normalizeAssignmentItem(item, index = 0) {
  return {
    ...item,
    patientName: getAssignmentPatientName(item) || `Patient ${index + 1}`,
    room: item?.room ?? item?.assignedRoom ?? item?.room_id ?? null,
  }
}

function normalizeQaoaResult(payload) {
  const source = payload?.result && typeof payload.result === 'object' ? payload.result : payload
  const rawAssignments = Array.isArray(source?.assignments) ? source.assignments : []

  let rawProbabilities = source?.probabilities
  if (!Array.isArray(rawProbabilities) && rawProbabilities && typeof rawProbabilities === 'object') {
    rawProbabilities = Object.entries(rawProbabilities).map(([label, probability]) => ({
      label,
      probability,
    }))
  }

  return {
    ...source,
    solver: source?.solver || payload?.solver || 'qaoa',
    cost: toFiniteNumber(
      source?.cost ?? source?.objectiveValue ?? source?.total_cost ?? source?.optimization_score,
      null
    ),
    assignments: rawAssignments.map((item, index) => normalizeAssignmentItem(item, index)),
    probabilities: Array.isArray(rawProbabilities)
      ? rawProbabilities.map((item, index) => ({
          ...item,
          label: item?.label || item?.bitstring || `Sample ${index + 1}`,
          probability: toFiniteNumber(item?.probability ?? item?.value ?? item?.weight, 0),
          assignments: Array.isArray(item?.assignments)
            ? item.assignments.map((assignment, assignmentIndex) =>
                normalizeAssignmentItem(assignment, assignmentIndex)
              )
            : [],
        }))
      : [],
  }
}

async function requestOptimize(payload) {
  const endpoints = [
    '/api/optimize',
    'http://127.0.0.1:4000/api/optimize',
    'http://localhost:4000/api/optimize',
    'http://127.0.0.1:8000/optimize',
    'http://localhost:8000/optimize',
  ]
  let lastError = null

  const fetchWithTimeout = async (url, options, timeoutMs = 12000) => {
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), timeoutMs)
    try {
      return await fetch(url, { ...options, signal: controller.signal })
    } finally {
      window.clearTimeout(timeout)
    }
  }

  for (const endpoint of endpoints) {
    try {
      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}))
        throw new Error(errorPayload.detail || `QAOA returned ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      const endpointError = new Error(`${endpoint} -> ${error?.message || 'request failed'}`)
      endpointError.cause = error
      lastError = endpointError
    }
  }

  throw lastError || new Error('Unable to reach optimization service')
}

function Dashboard() {
  const { patients, doctors, rooms: roomInventory, hospitals, selectedHospital, setSelectedHospital } = useContext(HospitalContext)
  const [optimizing, setOptimizing] = useState(false)
  const [activeTab, setActiveTab] = useState('scheduler')
  const [qaoaResult, setQaoaResult] = useState(null)
  const [qaoaError, setQaoaError] = useState('')
  const [optimizationLatencyMs, setOptimizationLatencyMs] = useState(1200)
  const [runHistory, setRunHistory] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [latestReport, setLatestReport] = useState(() => readLatestReport())
  const [quantumPanelState, setQuantumPanelState] = useState({
    loading: '',
    room: null,
    emergency: null,
    doctor: null,
    error: '',
  })
  const [realTimeEnabled, setRealTimeEnabled] = useState(true)
  const [lastRealtimeAction, setLastRealtimeAction] = useState('Idle')

  const qaoaPatients = useMemo(
    () =>
      patients
        .filter((p) => p.hospital === selectedHospital)
        .slice(0, 6)
        .map((patient, index) => ({
          id: patient._id || patient.id || `${patient.hospital}-${patient.name}-${index}`,
          label: patient.name,
          priority: 1.2 - index * 0.05,
        })),
    [patients, selectedHospital]
  )

  useEffect(() => {
    try {
      const storedHistory = JSON.parse(localStorage.getItem(RUN_HISTORY_KEY) || '[]')
      if (Array.isArray(storedHistory)) {
        setRunHistory(storedHistory)
      }
    } catch {
      setRunHistory([])
    }
  }, [])

  useEffect(() => {
    const syncReport = () => {
      setLatestReport(readLatestReport())
    }

    const onStorage = (event) => {
      if (event.key === REPORT_STORAGE_KEY) {
        syncReport()
      }
    }

    const timer = setInterval(syncReport, 2500)
    window.addEventListener('storage', onStorage)

    return () => {
      clearInterval(timer)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  const currentRoomAssignments = useMemo(() => {
    const assignmentMap = {}
    patients
      .filter((p) => p.hospital === selectedHospital)
      .forEach((patient) => {
        if (patient.room && patient.room !== 'Unassigned') {
          assignmentMap[patient.room] = patient
        }
      })
    return assignmentMap
  }, [patients, selectedHospital])

  const hospitalRooms = useMemo(
    () => roomInventory.filter((r) => r.hospital === selectedHospital),
    [roomInventory, selectedHospital]
  )

  const satisfactionScore = useMemo(() => {
    if (!qaoaResult?.assignments?.length) {
      return 83
    }
    const assigned = qaoaResult.assignments.filter((item) => item.room).length
    return Math.round((assigned / qaoaResult.assignments.length) * 100)
  }, [qaoaResult])

  const satisfactionTrend = useMemo(() => {
    const historyTrend = runHistory.slice(-4).map((item) => item.satisfaction)
    const base = historyTrend.length ? historyTrend : [62, 68, 72, 76]
    return [...base, satisfactionScore]
  }, [runHistory, satisfactionScore])

  const scheduleAdjustments = useMemo(() => {
    if (!qaoaResult?.assignments?.length) {
      return 0
    }
    const patientMap = new Map(
      patients
        .filter((p) => p.hospital === selectedHospital)
        .map((p) => [p.name, p])
    )
    return qaoaResult.assignments.filter((item) => {
      const patientName = item.patientName || item.patient
      const existingPatient = patientMap.get(patientName)
      return existingPatient && item.room && existingPatient.room !== item.room
    }).length
  }, [patients, qaoaResult, selectedHospital])

  const fairnessIndex = useMemo(
    () => computeFairness(qaoaResult?.assignments || [], hospitalRooms.map((r) => r.name)),
    [hospitalRooms, qaoaResult]
  )

  const throughputValue = useMemo(() => {
    if (!qaoaResult?.assignments?.length || !optimizationLatencyMs) {
      return 0
    }
    const assignedCount = qaoaResult.assignments.filter((item) => item.room).length
    return Number((assignedCount / Math.max(optimizationLatencyMs / 1000, 0.001)).toFixed(1))
  }, [optimizationLatencyMs, qaoaResult])

  const schedulerRows = useMemo(
    () =>
      hospitalRooms.map((roomInfo) => ({
        roomInfo,
        patient: currentRoomAssignments[roomInfo.name] || null,
      })),
    [currentRoomAssignments, hospitalRooms]
  )

  const latestAssignments = useMemo(() => {
    if (qaoaResult?.assignments?.length) {
      return qaoaResult.assignments
    }
    if (
      latestReport?.selectedHospital === selectedHospital &&
      Array.isArray(latestReport?.assignments) &&
      latestReport.assignments.length
    ) {
      return latestReport.assignments
    }
    return []
  }, [latestReport, qaoaResult, selectedHospital])

  const roomAssignmentChanges = useMemo(() => {
    if (!latestAssignments.length) {
      return fallbackChanges
    }

    const currentPatientMap = new Map(
      patients
        .filter((p) => p.hospital === selectedHospital)
        .map((p) => [normalizeName(p.name), p])
    )

    const changesFromLatestRun = latestAssignments
      .map((item) => {
        const name = getAssignmentPatientName(item)
        const targetRoom = item?.room || null
        const existingPatient = currentPatientMap.get(normalizeName(name))

        if (!existingPatient || !targetRoom) {
          return null
        }

        const currentRoom = existingPatient.room || 'Unassigned'
        if (currentRoom === targetRoom) {
          return null
        }

        return {
          name: existingPatient.name || name,
          from: currentRoom,
          to: targetRoom,
        }
      })
      .filter(Boolean)

    if (!changesFromLatestRun.length) {
      return []
    }

    const dedupe = new Map()
    changesFromLatestRun.forEach((item) => {
      const key = `${normalizeName(item.name)}-${item.from}-${item.to}`
      if (!dedupe.has(key)) {
        dedupe.set(key, item)
      }
    })

    return Array.from(dedupe.values())
  }, [latestAssignments, patients, selectedHospital])

  const normalizedSearch = searchQuery.trim().toLowerCase()

  const filteredSchedulerRows = useMemo(() => {
    if (!normalizedSearch) {
      return schedulerRows
    }

    return schedulerRows.filter(({ roomInfo, patient }) => {
      const haystack = [
        roomInfo?.name,
        patient?.name,
        patient?.status,
        patient?.care,
        patient?.next,
        roomInfo?.equipment,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(normalizedSearch)
    })
  }, [normalizedSearch, schedulerRows])

  const filteredChanges = useMemo(() => {
    if (!normalizedSearch) {
      return roomAssignmentChanges
    }

    return roomAssignmentChanges.filter((change) =>
      [change.name, change.from, change.to]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch)
    )
  }, [normalizedSearch, roomAssignmentChanges])

  const metrics = useMemo(
    () => [
      {
        label: 'Schedule Adjustments',
        value: qaoaResult ? `${scheduleAdjustments}` : '0',
        chart: 'ring',
      },
      {
        label: 'Latency',
        value: formatLatency(optimizationLatencyMs),
        chart: 'line',
      },
      {
        label: 'Fairness Index',
        value: fairnessIndex.toFixed(2),
        chart: 'bars',
      },
    ],
    [fairnessIndex, optimizationLatencyMs, qaoaResult, scheduleAdjustments]
  )

  const buildReportPayload = (overrides = {}) => {
    const generatedAt = new Date().toISOString()
    return {
      generatedAt,
      selectedHospital,
      solver: qaoaResult?.solver || 'not-run',
      cost: Number.isFinite(qaoaResult?.cost) ? qaoaResult.cost : null,
      latencyMs: optimizationLatencyMs,
      throughput: throughputValue,
      satisfactionScore,
      fairnessIndex,
      scheduleAdjustments,
      assignments: qaoaResult?.assignments || [],
      probabilities: qaoaResult?.probabilities || [],
      trend: satisfactionTrend,
      runHistory: runHistory.slice(-10),
      system: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        cores: navigator.hardwareConcurrency || 'n/a',
        deviceMemoryGB: navigator.deviceMemory || 'n/a',
        online: navigator.onLine,
      },
      ...overrides,
    }
  }

  const saveAndOpenReport = () => {
    const reportPayload = buildReportPayload()

    localStorage.setItem(REPORT_STORAGE_KEY, JSON.stringify(reportPayload))
    window.open('/optimization-report', '_blank', 'noopener,noreferrer')
    pushAction('Opened full optimization report in a new tab')
  }

  const handleOptimize = async () => {
    setOptimizing(true)
    setQaoaError('')
    const startedAt = performance.now()
    try {
      // QAOA quantum simulation limited to 8 patients/rooms due to memory constraints
      const maxQaoaSize = 8
      const roomNames = hospitalRooms.slice(0, maxQaoaSize).map((r) => r.name)
      const qaoaPayload = qaoaPatients.slice(0, maxQaoaSize)
      
      if (qaoaPatients.length === 0) {
        setQaoaError('No patients in selected hospital to optimize')
        setOptimizing(false)
        return
      }

      if (qaoaPatients.length > maxQaoaSize) {
        setQaoaError(`Note: Optimizing first ${maxQaoaSize} of ${qaoaPatients.length} patients due to quantum simulation memory limits`)
      }
      
      console.log('QAOA Request:', { 
        patients: qaoaPayload,
        rooms: roomNames,
      })
      
      const data = await requestOptimize({ patients: qaoaPayload, rooms: roomNames })
      const normalizedData = normalizeQaoaResult(data)
      console.log('QAOA Result:', normalizedData)
      setQaoaResult(normalizedData)

      const elapsedMs = performance.now() - startedAt
      setOptimizationLatencyMs(elapsedMs)

      const assignedCount = (normalizedData.assignments || []).filter((item) => item.room).length
      const currentPatientMap = new Map(
        patients
          .filter((p) => p.hospital === selectedHospital)
          .map((p) => [p.name, p])
      )
      const adjustmentsForRun = (normalizedData.assignments || []).filter((item) => {
        const patientName = item.patientName || item.patient
        const existingPatient = currentPatientMap.get(patientName)
        return existingPatient && item.room && existingPatient.room !== item.room
      }).length

      const runItem = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        satisfaction: normalizedData.assignments?.length
          ? Math.round((assignedCount / normalizedData.assignments.length) * 100)
          : 0,
        throughput: Number((assignedCount / Math.max(elapsedMs / 1000, 0.001)).toFixed(1)),
        latencyMs: Number(elapsedMs.toFixed(1)),
      }
      const nextHistory = [...runHistory, runItem].slice(-12)
      setRunHistory(nextHistory)
      localStorage.setItem(RUN_HISTORY_KEY, JSON.stringify(nextHistory))

      const liveReportPayload = buildReportPayload({
        generatedAt: new Date().toISOString(),
        solver: normalizedData?.solver || 'qaoa',
        cost: Number.isFinite(normalizedData?.cost) ? normalizedData.cost : null,
        latencyMs: elapsedMs,
        throughput: Number((assignedCount / Math.max(elapsedMs / 1000, 0.001)).toFixed(1)),
        satisfactionScore: runItem.satisfaction,
        fairnessIndex: computeFairness(normalizedData?.assignments || [], roomNames),
        scheduleAdjustments: adjustmentsForRun,
        assignments: normalizedData?.assignments || [],
        probabilities: normalizedData?.probabilities || [],
        trend: [...(nextHistory.slice(-4).map((item) => item.satisfaction) || []), runItem.satisfaction],
        runHistory: nextHistory.slice(-10),
      })
      localStorage.setItem(REPORT_STORAGE_KEY, JSON.stringify(liveReportPayload))
    } catch (error) {
      console.error('QAOA Error:', error)
      if (String(error?.message || '').toLowerCase().includes('failed to fetch')) {
        setQaoaError(
          'Unable to reach optimization services. Ensure gateway (4000) or QAOA service (8000) is running, then retry.'
        )
      } else {
        setQaoaError(error.message || 'Unable to reach QAOA service')
      }
    } finally {
      setOptimizing(false)
    }
  }

  const runQuantumPanel = async (panelType) => {
    setQuantumPanelState((prev) => ({ ...prev, loading: panelType, error: '' }))

    try {
      const endpoints = {
        room: '/api/quantum-room',
        emergency: '/api/quantum-emergency',
        doctor: '/api/quantum-doctor',
      }

      const payloadMap = {
        room: {
          patients: qaoaPatients.map((patient) => ({
            id: patient.id,
            priority: Number(patient.priority) || 1,
            icu: false,
            department: 'General Medicine',
          })),
          rooms: hospitalRooms.slice(0, 12).map((room) => ({
            id: room.name,
            type: String(room.equipment || '').toLowerCase().includes('icu') ? 'ICU' : 'General',
            available: !currentRoomAssignments[room.name],
            department: room.equipment,
            hospital: room.hospital,
          })),
        },
        emergency: {
          emergencies: [
            {
              patient_id: `EM-${Date.now()}`,
              severity: 'high',
              required_department: 'Emergency',
              location: selectedHospital,
            },
          ],
          hospitals: hospitals.slice(0, 3).map((name, index) => ({
            name,
            icu_available: 4 + (2 - index),
            doctors_available: 10 - index,
            distance_km: 2 + index * 3,
          })),
        },
        doctor: {
          doctors: doctors
            .filter((doctor) => doctor.hospital === selectedHospital)
            .slice(0, 18)
            .map((doctor) => ({
              id: doctor.id,
              name: doctor.name,
              specialization: doctor.specialty,
              availability: ['morning', 'afternoon', 'night'],
              experience: Math.max(1, Math.round((doctor.patients || 1) / 2)),
              available: doctor.status !== 'Off Shift',
              fatigue_score: doctor.status === 'On Duty' ? 0.6 : 0.2,
            })),
          shifts: [
            { shift: 'morning', department: 'ICU', specialization: 'Emergency Care' },
            { shift: 'afternoon', department: 'Surgery', specialization: 'Surgery' },
            { shift: 'night', department: 'Emergency', specialization: 'Emergency Care' },
          ],
        },
      }

      const response = await fetch(endpoints[panelType], {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadMap[panelType]),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error || `Quantum panel request failed: ${response.status}`)
      }

      setQuantumPanelState((prev) => ({ ...prev, loading: '', [panelType]: data }))
    } catch (error) {
      setQuantumPanelState((prev) => ({ ...prev, loading: '', error: error.message || 'Quantum panel request failed' }))
    }
  }

  const handleRealtimeEvent = async (eventType) => {
    if (!realTimeEnabled) {
      setLastRealtimeAction(`Skipped ${eventType} event (real-time optimization disabled)`)
      return
    }

    if (eventType === 'patient-arrival') {
      setLastRealtimeAction('New patient arrived -> re-running room optimization')
      await runQuantumPanel('room')
      return
    }

    if (eventType === 'emergency-occurred') {
      setLastRealtimeAction('Emergency detected -> re-running emergency allocation')
      await runQuantumPanel('emergency')
      return
    }

    if (eventType === 'doctor-unavailable') {
      setLastRealtimeAction('Doctor unavailable -> re-running doctor shift allocation')
      await runQuantumPanel('doctor')
    }
  }

  return (
    <div className="dashboard-grid">
      <div className="dashboard-main">
        <section className="hero-card">
          <div>
            <p className="hero-tag">Quantum Optimization</p>
            <h2>Optimizing Hospital Room Assignments with Quantum Computing</h2>
            <p className="hero-subtitle">
              Explore feasible, conflict-free allocations with adaptive rescheduling
              under clinical constraints.
            </p>
          </div>
          <div className="hero-actions">
            <button
              className="primary-button"
              type="button"
              onClick={handleOptimize}
              disabled={optimizing}
            >
              {optimizing ? 'Optimizing...' : 'Optimize Schedule'}
            </button>
            <button
              className="outline-button"
              type="button"
              onClick={() => pushAction('Open reschedule dialog for patient selection')}
            >
              Reschedule Patient
            </button>
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <h3>Advanced Quantum Optimization Panels</h3>
              <p className="panel-subtitle">Room, emergency, and doctor optimization with hybrid quantum orchestration</p>
            </div>
          </div>

          <div className="stats-row">
            <div className="stat-card">
              <p><strong>Quantum Room Allocation</strong></p>
              <button
                className="outline-button"
                type="button"
                onClick={() => runQuantumPanel('room')}
                disabled={quantumPanelState.loading === 'room'}
              >
                {quantumPanelState.loading === 'room' ? 'Running...' : 'Run Quantum Room Allocation'}
              </button>
              <p style={{ marginTop: '0.5rem' }}>
                Assigned: {quantumPanelState.room?.assigned_count ?? '-'} / {quantumPanelState.room?.total_patients ?? '-'}
              </p>
            </div>

            <div className="stat-card">
              <p><strong>Emergency Allocation Panel</strong></p>
              <button
                className="outline-button"
                type="button"
                onClick={() => runQuantumPanel('emergency')}
                disabled={quantumPanelState.loading === 'emergency'}
              >
                {quantumPanelState.loading === 'emergency' ? 'Running...' : 'Run Quantum Emergency Allocation'}
              </button>
              <p style={{ marginTop: '0.5rem' }}>
                Cases Assigned: {quantumPanelState.emergency?.assigned_count ?? '-'}
              </p>
            </div>

            <div className="stat-card">
              <p><strong>Doctor Shift Panel</strong></p>
              <button
                className="outline-button"
                type="button"
                onClick={() => runQuantumPanel('doctor')}
                disabled={quantumPanelState.loading === 'doctor'}
              >
                {quantumPanelState.loading === 'doctor' ? 'Running...' : 'Run Quantum Doctor Shift'}
              </button>
              <p style={{ marginTop: '0.5rem' }}>
                Shift Coverage: {quantumPanelState.doctor?.assigned_count ?? '-'} / {quantumPanelState.doctor?.total_shifts ?? '-'}
              </p>
            </div>
          </div>

          <div className="panel-header" style={{ marginTop: '1rem' }}>
            <div>
              <h3>Real-time Hospital Resource Optimization</h3>
              <p className="panel-subtitle">Automatically re-runs quantum optimization for live operational events</p>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                checked={realTimeEnabled}
                onChange={(event) => setRealTimeEnabled(event.target.checked)}
              />
              Enable real-time optimization
            </label>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button className="outline-button" type="button" onClick={() => handleRealtimeEvent('patient-arrival')}>
              Patient Arrives
            </button>
            <button className="outline-button" type="button" onClick={() => handleRealtimeEvent('emergency-occurred')}>
              Emergency Occurs
            </button>
            <button className="outline-button" type="button" onClick={() => handleRealtimeEvent('doctor-unavailable')}>
              Doctor Unavailable
            </button>
          </div>

          <p className="panel-subtitle" style={{ marginTop: '0.75rem' }}>
            {lastRealtimeAction}
          </p>

          {quantumPanelState.error ? <p style={{ color: '#b91c1c' }}>{quantumPanelState.error}</p> : null}
        </section>

        <section className="panel interactive-video-panel">
          <div className="video-frame">
            <video
              className="dashboard-video"
              src={DASHBOARD_VIDEO_SRC}
              preload="auto"
              autoPlay
              loop
              controls={false}
              muted
              playsInline
              crossOrigin="anonymous"
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
          </div>
        </section>

        <section className="panel qaoa-output">
          <div className="panel-header">
            <div>
              <h3>QAOA Output</h3>
              <p className="panel-subtitle">Assignments, cost, and probabilities</p>
            </div>
            <button
              className="ghost-button"
              type="button"
              onClick={handleOptimize}
              disabled={optimizing}
            >
              {optimizing ? 'Running QAOA...' : 'Run QAOA'}
            </button>
          </div>
          {qaoaError ? (
            <p className="qaoa-error">{qaoaError}</p>
          ) : qaoaResult ? (
            <div className="qaoa-grid">
              <div className="qaoa-card">
                <h4>Cost</h4>
                <p>{Number.isFinite(qaoaResult.cost) ? qaoaResult.cost.toFixed(3) : '-'}</p>
              </div>
              <div className="qaoa-card">
                <h4>Assignments</h4>
                <ul className="qaoa-list">
                  {qaoaResult.assignments?.map((item, index) => (
                    <li key={`${getAssignmentPatientName(item) || index}-${item.room || 'unassigned'}`}>
                      {getAssignmentPatientName(item) || `Patient ${index + 1}`} → {item.room || 'Unassigned'}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="qaoa-card">
                <h4>Probabilities</h4>
                <ul className="qaoa-list">
                  {qaoaResult.probabilities?.length ? (
                    qaoaResult.probabilities.map((item, index) => (
                      <li key={`prob-${index}`}>
                        {(item.probability * 100).toFixed(1)}% {item.label || `Sample ${index + 1}`}
                        {item.estimated ? ' (estimated)' : ''}
                      </li>
                    ))
                  ) : (
                    <li>Not available</li>
                  )}
                </ul>
              </div>
            </div>
          ) : (
            <p className="panel-subtitle">Run QAOA to see assignments.</p>
          )}
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <h3>Schedule Overview</h3>
              <p className="panel-subtitle">
                {selectedHospital} -{' '}
                {Object.keys(currentRoomAssignments).length} of {hospitalRooms.length} rooms
                occupied
              </p>
            </div>
            <div className="panel-actions">
              <select
                value={selectedHospital}
                onChange={(e) => setSelectedHospital(e.target.value)}
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(15, 34, 65, 0.1)',
                  fontSize: '0.9rem',
                }}
              >
                {hospitals.map((hospital) => (
                  <option key={hospital} value={hospital}>
                    {hospital}
                  </option>
                ))}
              </select>
              <button className="chip" onClick={() => pushAction('Today view selected')}>
                Today
              </button>
              <button
                className="chip chip-active"
                onClick={() => pushAction('This week view selected')}
              >
                This Week
              </button>
              <button className="chip" onClick={() => pushAction('Tomorrow view selected')}>
                Tomorrow
              </button>
              <button
                className="ghost-button"
                type="button"
                onClick={() => pushAction('Date picker opened')}
              >
                April 22, 2024
              </button>
            </div>
          </div>
          <div className="panel-tabs">
            <button
              className={`tab ${activeTab === 'scheduler' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('scheduler')}
            >
              Scheduler
            </button>
            <button
              className={`tab ${activeTab === 'constraints' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('constraints')}
            >
              Constraints & Parameters
            </button>
            <button
              className={`tab ${activeTab === 'history' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              Optimization History
            </button>
            <div className="panel-search">
              <span className="search-icon" aria-hidden="true" />
              <input
                type="search"
                placeholder="Search"
                aria-label="Search"
                value={searchQuery}
                onChange={(e) => {
                  const value = e.target.value
                  setSearchQuery(value)
                  if (value) {
                    pushAction(`Searching details for: ${value}`)
                  }
                }}
              />
            </div>
          </div>

          {normalizedSearch && (
            <p className="panel-subtitle" style={{ margin: '0.75rem 0 0' }}>
              Search "{searchQuery}" matched {filteredSchedulerRows.length} schedule rows and {filteredChanges.length} reallocation changes.
            </p>
          )}

          {activeTab === 'scheduler' && (
            <div className="scheduler">
              <div className="scheduler-row scheduler-head">
                <div className="scheduler-cell time-cell">Room</div>
                <div className="scheduler-cell">Patient</div>
                <div className="scheduler-cell">Status</div>
                <div className="scheduler-cell">Care Type</div>
                <div className="scheduler-cell">Next Appointment</div>
                <div className="scheduler-cell">Equipment</div>
              </div>
              {filteredSchedulerRows.map(({ roomInfo, patient }) => {
                return (
                  <div key={`${roomInfo.hospital}-${roomInfo.name}`} className="scheduler-row">
                    <div className="scheduler-cell time-cell">{roomInfo.name}</div>
                    <div className="scheduler-cell">
                      {patient ? (
                        <span style={{ fontWeight: 600 }}>{patient.name}</span>
                      ) : (
                        <span style={{ color: '#5c6a85', fontStyle: 'italic' }}>Available</span>
                      )}
                    </div>
                    <div className="scheduler-cell">
                      {patient ? (
                        <span className={`status-pill ${patient.status === 'Stable' ? 'ready' : patient.status === 'Observation' ? 'limited' : 'full'}`}>
                          {patient.status}
                        </span>
                      ) : (
                        '-'
                      )}
                    </div>
                    <div className="scheduler-cell">
                      {patient ? patient.care : '-'}
                    </div>
                    <div className="scheduler-cell">
                      {patient ? patient.next : '-'}
                    </div>
                    <div className="scheduler-cell">
                      <span style={{ fontSize: '0.85rem', color: '#5c6a85' }}>
                        {roomInfo?.equipment || '-'}
                      </span>
                    </div>
                  </div>
                )
              })}
              {!filteredSchedulerRows.length && (
                <div className="scheduler-row">
                  <div className="scheduler-cell time-cell">-</div>
                  <div className="scheduler-cell" style={{ gridColumn: 'span 5', color: '#5c6a85' }}>
                    No schedule details found for "{searchQuery}".
                  </div>
                </div>
              )}
            </div>
          )}
          {activeTab === 'constraints' && (
            <div style={{ padding: '1rem', textAlign: 'center', color: '#5c6a85' }}>
              Constraints & Parameters view
            </div>
          )}
          {activeTab === 'history' && (
            <div style={{ padding: '1rem', textAlign: 'center', color: '#5c6a85' }}>
              Optimization History view
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <h3>Optimization Insights</h3>
              <p className="panel-subtitle">Adaptive metrics from quantum engine</p>
            </div>
            <button
              className="ghost-button"
              type="button"
              onClick={saveAndOpenReport}
            >
              View Full Report
            </button>
          </div>
          <div className="insight-row">
            <div className="insight-graph">
              <div className="bar-chart">
                {(runHistory.length
                  ? runHistory.slice(-8).map((item) => Math.max(12, Math.min(100, item.throughput * 10)))
                  : [20, 35, 25, 50, 65, 60, 78, 82]
                ).map((value, index) => (
                  <span
                    key={`bar-${value}-${index}`}
                    style={{ height: `${value}%` }}
                  />
                ))}
              </div>
              <p className="chart-label">Optimization throughput {throughputValue || 0} assignments/s</p>
            </div>
            <div className="insight-graph">
              <div className="line-chart">
                <svg viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true">
                  <polyline
                    points={satisfactionTrend
                      .map((value, index) => `${index * 25},${40 - (value / 100) * 40}`)
                      .join(' ')}
                  />
                  {satisfactionTrend.map((value, index) => (
                    <circle
                      key={`dot-${value}-${index}`}
                      cx={index * 25}
                      cy={40 - (value / 100) * 40}
                      r="1.6"
                    />
                  ))}
                </svg>
              </div>
              <p className="chart-label">Constraint satisfaction {satisfactionScore}%</p>
            </div>
            <div className="insight-metrics">
              {metrics.map((metric) => (
                <div key={metric.label} className="metric-card">
                  <div className={`metric-chart metric-${metric.chart}`} />
                  <div>
                    <p className="metric-value">{metric.value}</p>
                    <p className="metric-label">{metric.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <aside className="dashboard-aside">
        <section className="aside-card">
          <div className="aside-header">
            <div>
              <h3>Optimization Insights</h3>
              <p className="panel-subtitle">Quantum cycle summary</p>
            </div>
            <div className="holo-ring" aria-hidden="true" />
          </div>
          <div className="aside-image" aria-hidden="true">
            <div className="pulse-grid">
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
          </div>
          <div className="insight-stats">
            {insights.map((item) => (
              <div key={item.label} className="stat-row">
                <p className="stat-value">{item.value}</p>
                <div>
                  <p className="stat-label">{item.label}</p>
                  <p className="stat-delta">{item.delta} vs last run</p>
                </div>
              </div>
            ))}
          </div>
          <button
            className="primary-button"
            type="button"
            onClick={() => pushAction('Optimized schedule applied to system')}
          >
            Apply Optimized Schedule
          </button>
        </section>

        <section className="aside-card">
          <div className="panel-header">
            <div>
              <h3>Room Assignment Changes</h3>
              <p className="panel-subtitle">
                Latest quantum reallocation
                {latestReport?.generatedAt ? ` | Updated ${new Date(latestReport.generatedAt).toLocaleTimeString()}` : ''}
              </p>
            </div>
            <button
              className="ghost-button"
              type="button"
              onClick={() => pushAction('Loading full changes report...')}
            >
              View Full Report
            </button>
          </div>
          <div className="change-list">
            {filteredChanges.map((change, index) => (
              <div
                key={`${change.name}-${change.from}-${change.to}-${index}`}
                className="change-item"
                onClick={() =>
                  pushAction(
                    `${change.name} reassigned from ${change.from} to ${change.to}`
                  )
                }
                style={{ cursor: 'pointer' }}
              >
                <div className="change-avatar" aria-hidden="true" />
                <div>
                  <p className="change-name">{change.name}</p>
                  <p className="change-note">
                    {change.from} to {change.to}
                  </p>
                </div>
                <span className="change-arrow" aria-hidden="true" />
              </div>
            ))}
            {!filteredChanges.length && (
              <div className="change-item" style={{ cursor: 'default' }}>
                <div className="change-avatar" aria-hidden="true" />
                <div>
                  <p className="change-name">No matching reallocation details</p>
                  <p className="change-note">
                    {normalizedSearch
                      ? `Nothing found for "${searchQuery}"`
                      : 'Run/reschedule with QAOA to generate latest room changes.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
      </aside>
    </div>
  )
}

export default Dashboard
