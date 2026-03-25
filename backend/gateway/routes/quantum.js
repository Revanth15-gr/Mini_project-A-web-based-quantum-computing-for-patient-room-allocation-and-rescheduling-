import { Router } from 'express'
import axios from 'axios'
import { randomUUID } from 'crypto'

const router = Router()
const QUANTUM_ENGINE_URL = process.env.QUANTUM_ENGINE_URL || process.env.QAOA_SERVICE_URL || 'http://127.0.0.1:8000'
const trackingStore = new Map()
const TRACKING_TTL_MS = 30 * 60 * 1000

const TRACKING_STATES = [
  { key: 'requested', afterMs: 0, label: 'Ambulance requested' },
  { key: 'accepted', afterMs: 7000, label: 'Driver accepted' },
  { key: 'arrived', afterMs: 15000, label: 'Ambulance arrived at patient location' },
  { key: 'pickup', afterMs: 23000, label: 'Patient picked up' },
  { key: 'dropoff', afterMs: 36000, label: 'Patient dropped at assigned hospital' },
]

const deriveTrackingState = (startedAt) => {
  const elapsedMs = Math.max(0, Date.now() - startedAt)

  let current = TRACKING_STATES[0]
  for (const item of TRACKING_STATES) {
    if (elapsedMs >= item.afterMs) {
      current = item
    }
  }

  const endMs = TRACKING_STATES[TRACKING_STATES.length - 1].afterMs
  const progress = Math.min(1, elapsedMs / endMs)

  return {
    state: current.key,
    statusText: current.label,
    progress,
    elapsedMs,
  }
}

const isTrackingExpired = (record) => Date.now() - record.startedAt > TRACKING_TTL_MS

const cleanupExpiredTrackings = () => {
  for (const [trackingId, record] of trackingStore.entries()) {
    if (isTrackingExpired(record)) {
      trackingStore.delete(trackingId)
    }
  }
}

const shouldUseLocalFallback = (error) => {
  const status = error?.response?.status
  const code = String(error?.code || '').toLowerCase()
  const message = String(error?.message || '').toLowerCase()

  return (
    !status ||
    status === 404 ||
    status === 422 ||
    status >= 500 ||
    code.includes('econnrefused') ||
    message.includes('econnrefused') ||
    message.includes('network error') ||
    message.includes('timeout')
  )
}

const buildRoomUpstreamPayload = (body = {}) => {
  const patients = Array.isArray(body?.patients) ? body.patients : []
  const rooms = Array.isArray(body?.rooms)
    ? body.rooms
        .map((room) => {
          if (typeof room === 'string') {
            return room
          }
          return room?.id || room?.name || null
        })
        .filter(Boolean)
    : []

  return {
    ...body,
    patients,
    rooms,
  }
}

const buildRoomFallback = (body = {}) => {
  const patients = Array.isArray(body?.patients) ? body.patients : []
  const rooms = Array.isArray(body?.rooms) ? body.rooms : []

  const assignments = patients.map((patient, index) => ({
    patient_id: patient?.id || `PAT-${index + 1}`,
    patient_name: patient?.name || patient?.label || `Patient ${index + 1}`,
    room: rooms[index]?.id || rooms[index] || null,
  }))

  const assigned = assignments.filter((item) => item.room).length
  return {
    algorithm: 'local-fallback-room',
    assigned_count: assigned,
    total_patients: patients.length,
    assignments,
    message: 'Quantum service unavailable. Returned local fallback room allocation.',
  }
}

const buildEmergencyFallback = (body = {}) => {
  const emergencies = Array.isArray(body?.emergencies) ? body.emergencies : []
  const hospitals = Array.isArray(body?.hospitals) ? body.hospitals : []

  const assignments = emergencies.map((emergency, index) => {
    const hospital = hospitals[index % Math.max(hospitals.length, 1)]
    return {
      patient_id: emergency?.patient_id || emergency?.id || `EM-${index + 1}`,
      severity: emergency?.severity || 'high',
      hospital: hospital?.name || hospital || null,
      distance_km: Number(hospital?.distance_km ?? 3 + index * 2),
    }
  })

  return {
    algorithm: 'local-fallback-emergency',
    assigned_count: assignments.filter((item) => item.hospital).length,
    total_cases: emergencies.length,
    assignments,
    message: 'Quantum service unavailable. Returned local fallback emergency allocation.',
  }
}

const buildDoctorFallback = (body = {}) => {
  const doctors = Array.isArray(body?.doctors) ? body.doctors : []
  const shifts = Array.isArray(body?.shifts) ? body.shifts : []

  const assignments = shifts.map((shift, index) => {
    const doctor = doctors[index % Math.max(doctors.length, 1)]
    return {
      shift: shift?.shift || `shift-${index + 1}`,
      department: shift?.department || 'General',
      doctor_id: doctor?.id || null,
      doctor_name: doctor?.name || 'Unassigned',
      specialization: doctor?.specialization || shift?.specialization || 'General Medicine',
    }
  })

  return {
    algorithm: 'local-fallback-doctor',
    assigned_count: assignments.filter((item) => item.doctor_id).length,
    total_shifts: shifts.length,
    assignments,
    message: 'Quantum service unavailable. Returned local fallback doctor allocation.',
  }
}

const normalizeRoomResponse = (data = {}, body = {}) => {
  if (Number.isFinite(data?.assigned_count)) {
    return data
  }

  const allocations =
    data?.result?.result?.allocations || data?.result?.allocations || data?.allocations || []
  const assignments = allocations.map((item, index) => ({
    patient_id: item?.entity || item?.patient_id || `PAT-${index + 1}`,
    patient_name: item?.patientName || item?.patient_name || item?.entity || `Patient ${index + 1}`,
    room: item?.resource || item?.room || null,
  }))

  const totalPatients =
    (Array.isArray(body?.patients) && body.patients.length) ||
    assignments.length ||
    data?.result?.result?.total_patients ||
    data?.result?.total_patients ||
    0

  return {
    algorithm: data?.result?.result?.solver || data?.solver || 'hybrid-room',
    assigned_count: assignments.filter((item) => item.room).length,
    total_patients: totalPatients,
    assignments,
    pipeline: data?.result?.pipeline || data?.pipeline || ['QAOA', 'QuantumAnnealing', 'AmplitudeAmplification'],
    explainability: data?.result?.quantum_explainability || data?.quantum_explainability,
    raw: data,
  }
}

const normalizeEmergencyResponse = (data = {}, body = {}) => {
  if (Number.isFinite(data?.assigned_count)) {
    return data
  }

  const allocations =
    data?.result?.result?.allocation?.allocations ||
    data?.result?.allocation?.allocations ||
    data?.allocation?.allocations ||
    data?.assignments ||
    []

  const assignments = allocations.map((item, index) => ({
    patient_id: item?.entity || item?.patient_id || `EM-${index + 1}`,
    severity: item?.severity || 'high',
    hospital: item?.resource || item?.hospital || null,
    distance_km: Number(item?.distance_km ?? item?.distance ?? 0),
  }))

  return {
    algorithm: data?.result?.result?.allocation?.solver || data?.solver || 'hybrid-emergency',
    assigned_count: assignments.filter((item) => item.hospital).length,
    total_cases:
      (Array.isArray(body?.emergencies) && body.emergencies.length) || assignments.length || data?.total_cases || 0,
    assignments,
    pipeline: data?.result?.pipeline || data?.pipeline || ['Grover', 'AmplitudeAmplification', 'QAOA', 'MinimumFinding'],
    explainability: data?.result?.quantum_explainability || data?.quantum_explainability,
    raw: data,
  }
}

const normalizeDoctorResponse = (data = {}, body = {}) => {
  if (Number.isFinite(data?.assigned_count) && Number.isFinite(data?.total_shifts)) {
    return data
  }

  const assignments = Array.isArray(data?.assignments)
    ? data.assignments
    : Array.isArray(data?.result?.assignments)
      ? data.result.assignments
      : []

  if (assignments.length) {
    return {
      algorithm: data?.algorithm || data?.solver || 'hybrid-doctor',
      assigned_count: assignments.filter((item) => item?.doctor_id || item?.doctor || item?.doctor_name).length,
      total_shifts:
        (Array.isArray(body?.shifts) && body.shifts.length) || assignments.length || data?.total_shifts || 0,
      assignments,
      pipeline: data?.pipeline || ['QAOA', 'VQE', 'QuantumAnnealing'],
      raw: data,
    }
  }

  const schedule = data?.result?.schedule || data?.schedule || {}
  const scheduleEntries = Object.values(schedule).reduce((acc, value) => {
    if (Array.isArray(value)) {
      return acc + value.length
    }
    return acc
  }, 0)

  return {
    algorithm: data?.algorithm || data?.solver || 'hybrid-doctor',
    assigned_count: scheduleEntries,
    total_shifts: (Array.isArray(body?.shifts) && body.shifts.length) || scheduleEntries || 0,
    assignments,
    pipeline: data?.pipeline || ['QAOA', 'VQE', 'QuantumAnnealing'],
    raw: data,
  }
}

const proxyWithFallback = async ({ body, primaryEndpoint, fallbackEndpoint }) => {
  try {
    const response = await axios.post(`${QUANTUM_ENGINE_URL}${primaryEndpoint}`, body, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 20000,
    })
    return response.data
  } catch (primaryError) {
    if (!fallbackEndpoint) {
      throw primaryError
    }

    const fallbackResponse = await axios.post(`${QUANTUM_ENGINE_URL}${fallbackEndpoint}`, body, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 20000,
    })
    return fallbackResponse.data
  }
}

router.post('/quantum-room', async (req, res) => {
  try {
    let data
    const upstreamBody = buildRoomUpstreamPayload(req.body)
    try {
      data = await proxyWithFallback({
        body: upstreamBody,
        primaryEndpoint: '/quantum/room',
        fallbackEndpoint: '/quantum/room-allocation',
      })
    } catch (upstreamError) {
      if (!shouldUseLocalFallback(upstreamError)) {
        throw upstreamError
      }
      data = buildRoomFallback(req.body)
    }

    res.json(normalizeRoomResponse(data, req.body))
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.detail || error.message,
      endpoint: '/api/quantum-room',
    })
  }
})

router.post('/quantum-emergency', async (req, res) => {
  try {
    cleanupExpiredTrackings()

    let data
    try {
      data = await proxyWithFallback({
        body: req.body,
        primaryEndpoint: '/quantum/emergency',
        fallbackEndpoint: '/quantum/emergency',
      })
    } catch (upstreamError) {
      if (!shouldUseLocalFallback(upstreamError)) {
        throw upstreamError
      }
      data = buildEmergencyFallback(req.body)
    }

    data = normalizeEmergencyResponse(data, req.body)

    const primaryAssignment = data?.assignments?.[0] || null
    const firstEmergency = req.body?.emergencies?.[0] || null
    const nearestHospital = data?.assignments?.[0]?.hospital || null

    let tracking = null
    if (firstEmergency && nearestHospital) {
      const trackingId = randomUUID()
      const startedAt = Date.now()

      trackingStore.set(trackingId, {
        trackingId,
        startedAt,
        emergency: {
          patientId: firstEmergency.patient_id || firstEmergency.id || null,
          patientName: firstEmergency.patient_name || 'Emergency Patient',
          location: firstEmergency.location || 'Unknown location',
          latitude: firstEmergency.latitude,
          longitude: firstEmergency.longitude,
          severity: firstEmergency.severity || 'high',
        },
        assignment: {
          hospital: nearestHospital,
          distanceKm: primaryAssignment?.distance_km ?? null,
        },
      })

      tracking = {
        trackingId,
        ...deriveTrackingState(startedAt),
        assignedHospital: nearestHospital,
      }
    }

    res.json({
      ...data,
      tracking,
    })
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.detail || error.message,
      endpoint: '/api/quantum-emergency',
    })
  }
})

router.get('/quantum-tracking/:trackingId', (req, res) => {
  cleanupExpiredTrackings()

  const { trackingId } = req.params
  const record = trackingStore.get(trackingId)

  if (!record) {
    res.status(404).json({
      error: 'Tracking ID not found',
      endpoint: '/api/quantum-tracking/:trackingId',
    })
    return
  }

  if (isTrackingExpired(record)) {
    trackingStore.delete(trackingId)
    res.status(410).json({
      error: 'Tracking session expired (TTL reached)',
      endpoint: '/api/quantum-tracking/:trackingId',
      ttlMs: TRACKING_TTL_MS,
    })
    return
  }

  const dynamicState = deriveTrackingState(record.startedAt)
  res.json({
    trackingId,
    emergency: record.emergency,
    assignment: record.assignment,
    ...dynamicState,
    ttlMs: TRACKING_TTL_MS,
  })
})

router.post('/quantum-doctor', async (req, res) => {
  try {
    let data
    try {
      data = await proxyWithFallback({
        body: req.body,
        primaryEndpoint: '/quantum/doctor',
        fallbackEndpoint: '/quantum/doctor-shift',
      })
    } catch (upstreamError) {
      if (!shouldUseLocalFallback(upstreamError)) {
        throw upstreamError
      }
      data = buildDoctorFallback(req.body)
    }

    res.json(normalizeDoctorResponse(data, req.body))
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.detail || error.message,
      endpoint: '/api/quantum-doctor',
    })
  }
})

router.get('/quantum-status', async (req, res) => {
  try {
    const response = await axios.get(`${QUANTUM_ENGINE_URL}/quantum/status`, { timeout: 8000 })
    res.json(response.data)
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.detail || error.message,
      endpoint: '/api/quantum-status',
    })
  }
})

export default router
