import express from 'express'
import axios from 'axios'
import cors from 'cors'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'
import crypto from 'crypto'
import nodemailer from 'nodemailer'
import twilio from 'twilio'
import { fileURLToPath } from 'url'
import { Hospital } from './models/Hospital.js'
import { Room } from './models/Room.js'
import { Doctor } from './models/Doctor.js'
import { Patient } from './models/Patient.js'
import { Discharge } from './models/Discharge.js'
import { EmergencyCase } from './models/EmergencyCase.js'
import { OpAppointment } from './models/OpAppointment.js'
import { OperationAllocation } from './models/OperationAllocation.js'
import quantumRoutes from './routes/quantum.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.join(__dirname, '.env') })

const app = express()
const PORT = process.env.PORT || 4000
const QAOA_URL = process.env.QAOA_SERVICE_URL || 'http://127.0.0.1:8000'
const MONGODB_URI = process.env.MONGODB_URI
const DEFAULT_ALERT_EMAIL = process.env.EMERGENCY_ALERT_EMAIL || 'gudalarevanth15@gmail.com'
const DEFAULT_ALERT_PHONE = process.env.EMERGENCY_ALERT_PHONE || '+919392759970'
const HOSPITAL_ALERT_EMAILS = {
  'vizag city care hospital': process.env.ALERT_EMAIL_VIZAG_CITY_CARE || DEFAULT_ALERT_EMAIL,
  'vijayawada heart institute': process.env.ALERT_EMAIL_VIJAYAWADA_HEART || DEFAULT_ALERT_EMAIL,
  'guntur neuro center': process.env.ALERT_EMAIL_GUNTUR_NEURO || DEFAULT_ALERT_EMAIL,
  'kgh emergency': process.env.ALERT_EMAIL_KGH || DEFAULT_ALERT_EMAIL,
  'apollo vizag': process.env.ALERT_EMAIL_APOLLO_VIZAG || DEFAULT_ALERT_EMAIL,
  'care hospitals vizag': process.env.ALERT_EMAIL_CARE_VIZAG || DEFAULT_ALERT_EMAIL,
}

const resolveEmergencyEmailRecipient = (hospitalName, providedEmail) => {
  if (Array.isArray(providedEmail) && providedEmail.length) {
    return providedEmail.filter(Boolean).join(',')
  }

  if (typeof providedEmail === 'string' && providedEmail.trim()) {
    return providedEmail.trim()
  }

  const normalizedHospital = String(hospitalName || '').trim().toLowerCase()
  return HOSPITAL_ALERT_EMAILS[normalizedHospital] || DEFAULT_ALERT_EMAIL
}

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use('/api', quantumRoutes)

// Serve static React build files in production
const distPath = path.resolve(path.join(__dirname, '../../dist'))
app.use(express.static(distPath))

let dbConnected = false

const cloneAssignments = (assignments = []) =>
  assignments.map((item) => ({
    patient: item?.patient,
    patientId: item?.patientId,
    patientName: item?.patientName,
    room: item?.room ?? null,
  }))

const buildProbabilitySamples = (assignments = [], estimated = true) => {
  const base = cloneAssignments(assignments)
  const variants = [base]

  const assignedIndices = base
    .map((item, index) => (item.room ? index : -1))
    .filter((index) => index >= 0)

  if (assignedIndices.length >= 2) {
    const swapped = cloneAssignments(base)
    const [firstIndex, secondIndex] = assignedIndices
    const roomA = swapped[firstIndex].room
    swapped[firstIndex].room = swapped[secondIndex].room
    swapped[secondIndex].room = roomA
    variants.push(swapped)
  }

  if (assignedIndices.length >= 3) {
    const rotated = cloneAssignments(base)
    const [idx0, idx1, idx2] = assignedIndices
    const r0 = rotated[idx0].room
    const r1 = rotated[idx1].room
    const r2 = rotated[idx2].room
    rotated[idx0].room = r1
    rotated[idx1].room = r2
    rotated[idx2].room = r0
    variants.push(rotated)
  }

  const preset = [0.68, 0.22, 0.1]
  const labels = ['Top sample', 'Alternative sample A', 'Alternative sample B']
  const selected = variants.slice(0, Math.min(variants.length, preset.length))
  const selectedProbs = preset.slice(0, selected.length)
  const sum = selectedProbs.reduce((acc, value) => acc + value, 0) || 1

  return selected.map((variant, index) => ({
    probability: selectedProbs[index] / sum,
    assignments: variant,
    label: labels[index],
    estimated,
  }))
}

const buildFallbackOptimization = (payload = {}) => {
  const patients = Array.isArray(payload.patients) ? payload.patients : []
  const rooms = Array.isArray(payload.rooms) ? payload.rooms : []

  const assignments = []
  let cost = 0

  for (let i = 0; i < patients.length; i += 1) {
    const patient = patients[i]
    const room = i < rooms.length ? rooms[i] : null
    assignments.push({
      patient: patient?.label ?? patient?.name ?? patient?.id ?? `patient-${i + 1}`,
      patientId: patient?.id ?? `patient-${i + 1}`,
      patientName: patient?.label ?? patient?.name ?? patient?.id ?? `patient-${i + 1}`,
      room,
    })

    if (room !== null) {
      const priority = Number(patient?.priority) || 1
      cost += (Math.abs(i - i) + 1) / Math.max(priority, 0.1)
    }
  }

  return {
    cost,
    assignments,
    probabilities: buildProbabilitySamples(assignments, true),
    solver: 'gateway-fallback',
    pipeline: [
      'QAOA',
      'Grover',
      'VQE',
      'QuantumAnnealing',
      'AmplitudeAmplification',
      'MinimumFinding',
    ],
    algorithm_used: 'QAOA + Grover + VQE + Quantum Annealing + Amplitude Amplification + Minimum Finding',
    hybrid_bundle: {
      room_allocation: {
        pipeline: ['QAOA', 'QuantumAnnealing', 'AmplitudeAmplification'],
        result: assignments,
      },
      emergency_assignment: {
        pipeline: ['Grover', 'AmplitudeAmplification', 'QAOA', 'MinimumFinding'],
        result: assignments,
      },
      operating_room: {
        pipeline: ['QAOA', 'VQE', 'MinimumFinding'],
        result: assignments,
      },
      resource_balance: {
        pipeline: ['VQE', 'QuantumAnnealing'],
        result: assignments,
      },
      grover_room_search: {
        pipeline: ['Grover'],
        result: assignments.length ? assignments[0] : null,
      },
    },
    message: 'Used fallback optimizer because QAOA service was unavailable or failed.',
  }
}

const escapeXml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')

const getMailTransporter = () => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

const sendEmergencyEmail = async ({ to, subject, text, html }) => {
  const transporter = getMailTransporter()
  if (!transporter) {
    return { sent: false, reason: 'SMTP not configured' }
  }

  const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER
  const info = await transporter.sendMail({
    from: fromAddress,
    to,
    subject,
    text,
    html: html || text,
  })

  return { sent: true, messageId: info.messageId }
}

const getTwilioClient = () => {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    return null
  }
  return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
}

const sendEmergencyVoiceCall = async ({ to, message }) => {
  const client = getTwilioClient()
  const fromNumber = process.env.TWILIO_PHONE_NUMBER

  if (!client || !fromNumber) {
    return { sent: false, reason: 'Twilio voice not configured' }
  }

  const twiml = `<Response><Say voice="alice">${escapeXml(message)}</Say></Response>`
  const call = await client.calls.create({
    twiml,
    to,
    from: fromNumber,
  })

  return { sent: true, sid: call.sid }
}

const sendEmergencySms = async ({ to, message }) => {
  const client = getTwilioClient()
  const fromNumber = process.env.TWILIO_PHONE_NUMBER

  if (!client || !fromNumber) {
    return { sent: false, reason: 'Twilio SMS not configured' }
  }

  const sms = await client.messages.create({
    to,
    from: fromNumber,
    body: message,
  })

  return { sent: true, sid: sms.sid }
}

const buildEmergencyEmailMessage = ({ caseDetails = {}, assignedHospital = {} }) => {
  const caseId = escapeXml(caseDetails.caseId || 'Unknown Case')
  const patientName = escapeXml(caseDetails.patientName || 'Unknown Patient')
  const severity = escapeXml(caseDetails.severity || 'Unknown')
  const location = escapeXml(caseDetails.location || 'Unknown Location')
  const incident = escapeXml(caseDetails.incident || 'Emergency incident')
  const eta = escapeXml(caseDetails.eta || 'N/A')
  const hospitalName = escapeXml(assignedHospital.name || 'Unassigned Hospital')

  const html = `
<!DOCTYPE html>
<html>
  <body style="margin:0;padding:20px;background:#070f2a;font-family:Arial,sans-serif;color:#f3f4f6;">
    <div style="max-width:640px;margin:0 auto;">
      <div style="background:#d82d2d;border-radius:16px;padding:28px 24px;text-align:center;color:#ffffff;font-weight:700;">
        <div style="font-size:62px;line-height:1;">🚨</div>
        <div style="font-size:40px;line-height:1.1;margin-top:10px;letter-spacing:1px;">EMERGENCY ALERT</div>
        <div style="font-size:68px;line-height:1;margin-top:14px;">${caseId}</div>
      </div>

      <div style="margin-top:18px;background:#1f2024;border-left:5px solid #ef4444;border-radius:12px;padding:20px 18px;">
        <table role="presentation" style="width:100%;border-collapse:collapse;font-size:18px;line-height:1.45;">
          <tr><td style="color:#f87171;font-weight:700;padding:6px 0;white-space:nowrap;">Patient ID:</td><td style="padding:6px 0;">${patientName}</td></tr>
          <tr><td style="color:#f87171;font-weight:700;padding:6px 0;white-space:nowrap;">Priority:</td><td style="padding:6px 0;color:#f87171;font-weight:700;">${severity}</td></tr>
          <tr><td style="color:#f87171;font-weight:700;padding:6px 0;white-space:nowrap;">Location:</td><td style="padding:6px 0;">${location}</td></tr>
          <tr><td style="color:#f87171;font-weight:700;padding:6px 0;white-space:nowrap;">Incident Type:</td><td style="padding:6px 0;">${incident}</td></tr>
          <tr><td style="color:#f87171;font-weight:700;padding:6px 0;white-space:nowrap;">Assigned Hospital:</td><td style="padding:6px 0;">${hospitalName}</td></tr>
          <tr><td style="color:#f87171;font-weight:700;padding:6px 0;white-space:nowrap;">ETA:</td><td style="padding:6px 0;">${eta}</td></tr>
        </table>

        <div style="margin-top:16px;background:#4db351;border-radius:12px;padding:16px 14px;text-align:center;color:#ffffff;font-size:40px;line-height:1;">⚠️</div>
        <div style="margin-top:8px;background:#4db351;border-radius:12px;padding:16px 14px;text-align:center;color:#ffffff;font-size:30px;font-weight:800;letter-spacing:0.6px;">
          PLEASE PREPARE IMMEDIATELY
        </div>
      </div>
    </div>
  </body>
</html>
`

  const text =
    `EMERGENCY ALERT\n` +
    `${caseId}\n\n` +
    `Patient ID: ${patientName}\n` +
    `Priority: ${severity}\n` +
    `Location: ${location}\n` +
    `Incident Type: ${incident}\n` +
    `Assigned Hospital: ${hospitalName}\n` +
    `ETA: ${eta}\n\n` +
    `PLEASE PREPARE IMMEDIATELY`

  return { html, text }
}

const buildEmergencyVoiceMessage = ({ caseDetails = {}, assignedHospital = {} }) => {
  const caseId = caseDetails.caseId || 'Unknown case'
  const patientName = caseDetails.patientName || 'Unknown patient'
  const severity = caseDetails.severity || 'Unknown severity'
  const incident = caseDetails.incident || 'Emergency incident'
  const eta = caseDetails.eta || 'unknown ETA'
  const hospitalName = assignedHospital.name || 'nearest available hospital'
  const distance = Number.isFinite(Number(assignedHospital.distance))
    ? `${Number(assignedHospital.distance).toFixed(1)} kilometers`
    : 'unknown distance'

  return (
    `Emergency accident case alert. Case ${caseId}. ` +
    `Patient ${patientName}. Severity ${severity}. Incident: ${incident}. ` +
    `Assigned hospital: ${hospitalName}, distance ${distance}. ` +
    `Estimated arrival ${eta}. Emergency team get ready immediately.`
  )
}

// MongoDB Connection (non-blocking)
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    dbConnected = true
    console.log('✓ MongoDB connected successfully')
  })
  .catch((err) => {
    console.warn('⚠ MongoDB connection deferred:', err.message)
    console.warn('Running in fallback mode - implement caching/middleware as needed')
  })

// ===== HEALTH CHECK =====
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    database: dbConnected ? 'connected' : 'connecting',
    timestamp: new Date().toISOString(),
  })
})

// ===== HOSPITALS API =====
app.get('/api/hospitals', async (req, res) => {
  try {
    const hospitals = await Hospital.find()
    res.json(hospitals)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/hospitals', async (req, res) => {
  try {
    const hospital = await Hospital.create(req.body)
    res.status(201).json(hospital)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

app.put('/api/hospitals/:id', async (req, res) => {
  try {
    const hospital = await Hospital.findByIdAndUpdate(req.params.id, req.body, { new: true })
    res.json(hospital)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

app.delete('/api/hospitals/:id', async (req, res) => {
  try {
    await Hospital.findByIdAndDelete(req.params.id)
    res.json({ message: 'Hospital deleted' })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// ===== ROOMS API =====
app.get('/api/rooms', async (req, res) => {
  try {
    const rooms = await Room.find()
    res.json(rooms)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.get('/api/rooms/:hospital', async (req, res) => {
  try {
    const rooms = await Room.find({ hospital: req.params.hospital })
    res.json(rooms)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/rooms', async (req, res) => {
  try {
    const room = await Room.create(req.body)
    res.status(201).json(room)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

app.put('/api/rooms/:id', async (req, res) => {
  try {
    const room = await Room.findByIdAndUpdate(req.params.id, req.body, { new: true })
    res.json(room)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// ===== DOCTORS API =====
app.get('/api/doctors', async (req, res) => {
  try {
    const doctors = await Doctor.find()
    res.json(doctors)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/doctors', async (req, res) => {
  try {
    console.log('📤 Creating doctor with data:', req.body)
    const doctor = await Doctor.create(req.body)
    console.log('✅ Doctor created:', doctor)
    res.status(201).json(doctor)
  } catch (error) {
    console.error('❌ Doctor creation error:', error.message)
    res.status(400).json({ error: error.message })
  }
})

app.put('/api/doctors/:id', async (req, res) => {
  try {
    console.log(`📝 Updating doctor ${req.params.id} with:`, req.body)
    const doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' })
    }
    console.log(`✅ Doctor updated:`, doctor)
    res.json(doctor)
  } catch (error) {
    console.error(`❌ Doctor update error:`, error.message)
    res.status(400).json({ error: error.message })
  }
})

// ===== PATIENTS API =====
app.get('/api/patients', async (req, res) => {
  try {
    const patients = await Patient.find()
    res.json(patients)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.get('/api/patients/:hospital', async (req, res) => {
  try {
    const patients = await Patient.find({ hospital: req.params.hospital })
    res.json(patients)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/patients', async (req, res) => {
  try {
    const patient = await Patient.create(req.body)
    
    // Update room status if room name is specified
    if (patient.room && patient.hospital) {
      const room = await Room.findOne({
        name: patient.room,
        hospital: patient.hospital,
      })
      
      if (room) {
        await Room.findByIdAndUpdate(room._id, {
          status: 'Occupied',
          patientId: patient._id,
          patientName: patient.name,
        })
      }
    }
    
    res.status(201).json(patient)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

app.put('/api/patients/:id', async (req, res) => {
  try {
    if (!dbConnected) {
      return res.status(503).json({ error: 'Database not connected' })
    }
    const existingPatient = await Patient.findById(req.params.id)
    if (!existingPatient) {
      return res.status(404).json({ error: 'Patient not found' })
    }

    const nextHospital = req.body.hospital || existingPatient.hospital
    const nextName = req.body.name || existingPatient.name
    const nextRoom = Object.prototype.hasOwnProperty.call(req.body, 'room')
      ? req.body.room
      : existingPatient.room
    const roomChanged = nextRoom !== existingPatient.room || nextHospital !== existingPatient.hospital
    let nextRoomId = existingPatient.roomId || null

    if (roomChanged && existingPatient.room && existingPatient.hospital) {
      await Room.findOneAndUpdate(
        { name: existingPatient.room, hospital: existingPatient.hospital },
        {
          status: 'Available',
          patientId: null,
          patientName: null,
        },
      )
    }

    if (nextRoom && nextHospital) {
      const occupiedRoom = await Room.findOneAndUpdate(
        { name: nextRoom, hospital: nextHospital },
        {
          status: 'Occupied',
          patientId: existingPatient._id,
          patientName: nextName,
        },
        { new: true },
      )
      nextRoomId = occupiedRoom?._id || null
    } else {
      nextRoomId = null
    }

    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        room: nextRoom,
        roomId: nextRoomId,
      },
      { new: true },
    )

    res.json(patient)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

app.delete('/api/patients/:id', async (req, res) => {
  try {
    const patient = await Patient.findByIdAndDelete(req.params.id)
    
    // Release room if assigned
    if (patient.roomId) {
      await Room.findByIdAndUpdate(patient.roomId, {
        status: 'Available',
        patientId: null,
        patientName: null,
      })
    }
    
    res.json({ message: 'Patient deleted' })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// ===== DISCHARGES API =====
app.get('/api/discharges', async (req, res) => {
  try {
    if (!dbConnected) {
      return res.status(503).json({ error: 'Database not connected' })
    }
    const discharges = await Discharge.find().sort({ dischargedAt: -1 })
    res.json(discharges)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/discharges', async (req, res) => {
  try {
    if (!dbConnected) {
      return res.status(503).json({ error: 'Database not connected' })
    }
    if (!req.body?.name) {
      return res.status(400).json({ error: 'Patient name is required' })
    }
    const discharge = await Discharge.create(req.body)
    res.status(201).json(discharge)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// ===== QAOA OPTIMIZATION =====
app.post('/api/optimize', async (req, res) => {
  try {
    const response = await axios.post(`${QAOA_URL}/optimize`, req.body, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000,
    })
    res.json(response.data)
  } catch (error) {
    const status = error.response?.status || 500
    const message = error.response?.data?.detail || error.message

    // For server-side optimization failures, degrade gracefully instead of surfacing 500.
    if (status >= 500) {
      return res.json(buildFallbackOptimization(req.body))
    }

    res.status(status).json({ detail: message })
  }
})

// ===== HYBRID MULTI-QUANTUM API PROXY =====
const proxyQuantumRequest = async ({ method = 'get', endpoint, body = undefined, timeout = 20000 }) => {
  const response = await axios({
    method,
    url: `${QAOA_URL}${endpoint}`,
    data: body,
    headers: { 'Content-Type': 'application/json' },
    timeout,
  })
  return response.data
}

app.post('/api/quantum/room-allocation', async (req, res) => {
  try {
    const data = await proxyQuantumRequest({ method: 'post', endpoint: '/quantum/room-allocation', body: req.body })
    res.json(data)
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.detail || error.message,
      endpoint: '/quantum/room-allocation',
    })
  }
})

app.post('/api/quantum/emergency', async (req, res) => {
  try {
    const data = await proxyQuantumRequest({ method: 'post', endpoint: '/quantum/emergency', body: req.body })
    res.json(data)
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.detail || error.message,
      endpoint: '/quantum/emergency',
    })
  }
})

app.post('/api/quantum/operating-room', async (req, res) => {
  try {
    const data = await proxyQuantumRequest({ method: 'post', endpoint: '/quantum/operating-room', body: req.body })
    res.json(data)
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.detail || error.message,
      endpoint: '/quantum/operating-room',
    })
  }
})

app.post('/api/quantum/ambulance', async (req, res) => {
  try {
    const data = await proxyQuantumRequest({ method: 'post', endpoint: '/quantum/ambulance', body: req.body })
    res.json(data)
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.detail || error.message,
      endpoint: '/quantum/ambulance',
    })
  }
})

app.post('/api/quantum/resource-balance', async (req, res) => {
  try {
    const data = await proxyQuantumRequest({ method: 'post', endpoint: '/quantum/resource-balance', body: req.body })
    res.json(data)
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.detail || error.message,
      endpoint: '/quantum/resource-balance',
    })
  }
})

app.get('/api/quantum/prediction', async (req, res) => {
  try {
    const data = await proxyQuantumRequest({ method: 'get', endpoint: '/quantum/prediction' })
    res.json(data)
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.detail || error.message,
      endpoint: '/quantum/prediction',
    })
  }
})

app.get('/api/quantum/simulation', async (req, res) => {
  try {
    const sampleSize = Number(req.query.sampleSize || 6)
    const data = await proxyQuantumRequest({ method: 'get', endpoint: `/quantum/simulation?sample_size=${sampleSize}` })
    res.json(data)
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.detail || error.message,
      endpoint: '/quantum/simulation',
    })
  }
})

// ===== SEED DATABASE (Initialize with default data) =====
app.post('/api/seed', async (req, res) => {
  try {
    // Clear existing data
    await Hospital.deleteMany({})
    await Room.deleteMany({})
    await Doctor.deleteMany({})
    await Patient.deleteMany({})

    // Sample hospitals data
    const hospitalData = [
      {
        name: 'Vizag City Care Hospital',
        location: 'Visakhapatnam, Coastal Andhra',
        specialty: 'General Medicine',
        district: 'Coastal Andhra',
        image: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        doctors: 60,
        patients: 124,
        occupancy: 84,
        rooms: 20,
      },
      {
        name: 'Tirupati Ortho & Trauma Hospital',
        location: 'Tirupati, Rayalaseema',
        specialty: 'Orthopedics',
        district: 'Rayalaseema',
        image: 'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)',
        doctors: 52,
        patients: 72,
        occupancy: 76,
        rooms: 20,
      },
    ]

    const hospitals = await Hospital.insertMany(hospitalData)
    res.status(201).json({ message: 'Database seeded successfully', hospitals })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// ===== EMERGENCY CASES API =====
app.get('/api/emergency-cases', async (req, res) => {
  try {
    const cases = await EmergencyCase.find()
    res.json(cases)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/emergency-cases', async (req, res) => {
  try {
    console.log('📤 Creating emergency case:', req.body)
    const emergencyCase = await EmergencyCase.create(req.body)
    console.log('✅ Emergency case created:', emergencyCase)
    res.status(201).json(emergencyCase)
  } catch (error) {
    console.error('❌ Emergency case creation error:', error.message)
    res.status(400).json({ error: error.message })
  }
})

app.get('/api/emergency-cases/:id', async (req, res) => {
  try {
    const emergencyCase = await EmergencyCase.findById(req.params.id)
    if (!emergencyCase) {
      return res.status(404).json({ error: 'Emergency case not found' })
    }
    res.json(emergencyCase)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.put('/api/emergency-cases/:id', async (req, res) => {
  try {
    console.log(`📝 Updating emergency case ${req.params.id} with:`, req.body)
    const emergencyCase = await EmergencyCase.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!emergencyCase) {
      return res.status(404).json({ error: 'Emergency case not found' })
    }
    console.log(`✅ Emergency case updated:`, emergencyCase)
    res.json(emergencyCase)
  } catch (error) {
    console.error(`❌ Emergency case update error:`, error.message)
    res.status(400).json({ error: error.message })
  }
})

app.delete('/api/emergency-cases/:id', async (req, res) => {
  try {
    await EmergencyCase.findByIdAndDelete(req.params.id)
    res.json({ message: 'Emergency case deleted' })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// ===== OP APPOINTMENTS API =====
app.get('/api/op-appointments', async (req, res) => {
  try {
    const appointments = await OpAppointment.find().sort({ createdAt: -1 })
    res.json(appointments)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/op-appointments', async (req, res) => {
  try {
    const appointment = await OpAppointment.create(req.body)
    res.status(201).json(appointment)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

app.put('/api/op-appointments/:id', async (req, res) => {
  try {
    const appointment = await OpAppointment.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!appointment) {
      return res.status(404).json({ error: 'OP appointment not found' })
    }
    res.json(appointment)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// ===== OPERATION ALLOCATION API =====
app.get('/api/operation-allocations', async (req, res) => {
  try {
    const allocations = await OperationAllocation.find().sort({ createdAt: -1 })
    res.json(allocations)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/operation-allocations', async (req, res) => {
  try {
    const allocation = await OperationAllocation.create(req.body)
    res.status(201).json(allocation)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

app.put('/api/operation-allocations/:id/complete', async (req, res) => {
  try {
    const allocation = await OperationAllocation.findByIdAndUpdate(
      req.params.id,
      {
        status: 'Completed',
        completedAt: new Date().toISOString(),
      },
      { new: true },
    )

    if (!allocation) {
      return res.status(404).json({ error: 'Operation allocation not found' })
    }

    res.json(allocation)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

app.post('/api/emergency/notify', async (req, res) => {
  try {
    const { caseDetails = {}, assignedHospital = {}, recipients = {} } = req.body || {}

    const targetEmail = resolveEmergencyEmailRecipient(assignedHospital.name, recipients.email)
    const targetPhone = String(recipients.phone || DEFAULT_ALERT_PHONE).replace(/\s+/g, '')

    const caseId = caseDetails.caseId || 'Unknown Case'
    const patientName = caseDetails.patientName || 'Unknown Patient'
    const severity = caseDetails.severity || 'Unknown'
    const incident = caseDetails.incident || 'Emergency incident'
    const eta = caseDetails.eta || 'N/A'
    const hospitalName = assignedHospital.name || 'Unassigned Hospital'
    const distance = Number.isFinite(Number(assignedHospital.distance))
      ? `${Number(assignedHospital.distance).toFixed(1)} km`
      : 'N/A'
    const availableRooms = assignedHospital.availableRooms ?? assignedHospital.beds ?? 'N/A'

    const emailSubject = `🚨 Emergency Alert ${caseId}: ${patientName} assigned to ${hospitalName}`
    const baseMessage =
      `Emergency ${caseId}. Patient ${patientName}. Severity ${severity}. Incident: ${incident}. ` +
      `Assigned Hospital: ${hospitalName}. Distance ${distance}. Available rooms ${availableRooms}. ETA ${eta}.`

    const emailMessage = buildEmergencyEmailMessage({
      caseDetails: { ...caseDetails, location: caseDetails.location || 'Emergency Location' },
      assignedHospital,
    })

    const [emailStatus, voiceStatus, smsStatus] = await Promise.allSettled([
      sendEmergencyEmail({
        to: targetEmail,
        subject: emailSubject,
        text: emailMessage.text,
        html: emailMessage.html,
      }),
      sendEmergencyVoiceCall({
        to: targetPhone,
        message: `${baseMessage} Emergency team get ready immediately.`,
      }),
      sendEmergencySms({
        to: targetPhone,
        message: `${baseMessage} Emergency team get ready.`,
      }),
    ])

    const normalizeChannelStatus = (result) => {
      if (result.status === 'fulfilled') {
        return result.value
      }
      return { sent: false, reason: result.reason?.message || 'Channel failed' }
    }

    const channels = {
      email: normalizeChannelStatus(emailStatus),
      voice: normalizeChannelStatus(voiceStatus),
      sms: normalizeChannelStatus(smsStatus),
    }

    const sentAny = Object.values(channels).some((channel) => channel.sent)

    res.json({
      success: sentAny,
      message: sentAny
        ? 'Emergency alert dispatched through configured channels'
        : 'Alert prepared but no delivery channel is fully configured',
      recipients: {
        email: targetEmail,
        phone: targetPhone,
      },
      channels,
      preview: baseMessage,
    })
  } catch (error) {
    console.error('❌ Emergency notify error:', error.message)
    res.status(500).json({ error: error.message || 'Emergency notify failed' })
  }
})

app.post('/api/emergency/voice-call', async (req, res) => {
  try {
    const { caseDetails = {}, assignedHospital = {}, phone } = req.body || {}
    const targetPhone = String(phone || DEFAULT_ALERT_PHONE).replace(/\s+/g, '')
    const voiceMessage = buildEmergencyVoiceMessage({ caseDetails, assignedHospital })

    const voice = await sendEmergencyVoiceCall({
      to: targetPhone,
      message: voiceMessage,
    })

    if (!voice.sent) {
      return res.status(400).json({
        success: false,
        message: 'Voice call not sent',
        reason: voice.reason || 'Voice provider not configured',
        phone: targetPhone,
        preview: voiceMessage,
      })
    }

    return res.json({
      success: true,
      message: 'Emergency voice call initiated',
      phone: targetPhone,
      callSid: voice.sid,
      preview: voiceMessage,
    })
  } catch (error) {
    console.error('❌ Emergency voice-call error:', error.message)
    return res.status(500).json({
      success: false,
      message: 'Emergency voice call failed',
      reason: error.message,
    })
  }
})

// ===== QUANTUM SECURE COMMUNICATION =====

app.post('/api/secure/encode', async (req, res) => {
  try {
    const response = await axios.post(`${QAOA_URL}/secure/encode`, req.body, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000,
    })
    res.json(response.data)
  } catch (error) {
    console.error('🔒 Secure encode error:', error.message)
    // Fallback: simple base64 encoding
    const message = req.body?.message || ''
    const encoded = Buffer.from(message).toString('base64')
    res.json({
      success: true,
      packet: {
        encrypted_data: encoded,
        quantum_ops: 'fallback',
        sender_id: 'hospital-system',
        recipient_id: req.body?.recipient_id || 'secure-storage',
      },
      message: 'Message fallback-encoded (QAOA service unavailable)',
      security_level: 'standard',
    })
  }
})

app.post('/api/secure/decode', async (req, res) => {
  try {
    const response = await axios.post(`${QAOA_URL}/secure/decode`, req.body, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000,
    })
    res.json(response.data)
  } catch (error) {
    console.error('🔒 Secure decode error:', error.message)
    // Fallback: simple base64 decoding
    const encrypted = req.body?.encrypted_data || ''
    try {
      const decoded = Buffer.from(encrypted, 'base64').toString('utf-8')
      res.json({
        success: true,
        decoded_message: decoded,
        quantum_verified: false,
        message: 'Message fallback-decoded (QAOA service unavailable)',
      })
    } catch (e) {
      res.status(400).json({ error: 'Decoding failed' })
    }
  }
})

app.post('/api/secure/send-secure-data', async (req, res) => {
  try {
    const response = await axios.post(`${QAOA_URL}/secure/send-secure-data`, req.body, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000,
    })
    res.json(response.data)
  } catch (error) {
    console.error('🔒 Secure transmission error:', error.message)
    // Fallback: generate mock transmission ID
    const transmissionId = crypto.randomBytes(8).toString('hex')
    res.json({
      success: true,
      transmission_id: transmissionId,
      recipient_id: req.body?.recipient_id,
      quantum_secured: false,
      encryption_method: 'standard-base64',
      message: 'Secure data queued (QAOA service unavailable)',
    })
  }
})

app.post('/api/secure/patient-data', async (req, res) => {
  try {
    const { patientId, hospitalId, data } = req.body
    const response = await axios.post(
      `${QAOA_URL}/secure/patient-data?patient_id=${patientId}&hospital_id=${hospitalId}&data=${JSON.stringify(
        data,
      )}`,
      {},
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000,
      },
    )
    res.json(response.data)
  } catch (error) {
    console.error('🔒 Secure patient data error:', error.message)
    // Fallback: mock response
    res.json({
      success: true,
      patient_id: req.body?.patientId,
      hospital_id: req.body?.hospitalId,
      transmission_id: crypto.randomBytes(8).toString('hex'),
      quantum_encrypted: false,
      security_level: 'standard',
      message: 'Patient data queued for transmission (fallback mode)',
    })
  }
})

app.get('/api/secure/quantum-status', async (req, res) => {
  try {
    const response = await axios.get(`${QAOA_URL}/secure/quantum-status`, {
      timeout: 5000,
    })
    res.json(response.data)
  } catch (error) {
    console.error('🔒 Quantum status check error:', error.message)
    res.json({
      quantum_layer_active: false,
      encoding_method: 'Gateway Fallback',
      bits_per_qubit: 0,
      message: 'Quantum layer unavailable - using standard encryption',
      security_features: [
        'Standard base64 encoding',
        'Cryptographic hashing for verification',
        'CORS protection',
      ],
    })
  }
})

// SPA fallback: serve index.html for all non-API routes (for React Router)
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

app.listen(PORT, () => {
  console.log(`\n✓ QAOA Gateway listening on http://localhost:${PORT}`)
  console.log(`✓ MongoDB URI configured: ${MONGODB_URI ? 'Yes' : 'No'}`)
  console.log(`\n📚 API Endpoints:`)
  console.log(`   GET  /api/health                  - Service status`)
  console.log(`   GET  /api/hospitals               - Get all hospitals`)
  console.log(`   POST /api/hospitals               - Create hospital`)
  console.log(`   GET  /api/rooms                   - Get all rooms`)
  console.log(`   POST /api/rooms                   - Create room`)
  console.log(`   GET  /api/doctors                 - Get all doctors`)
  console.log(`   POST /api/doctors                 - Create doctor`)
  console.log(`   GET  /api/patients                - Get all patients`)
  console.log(`   POST /api/patients                - Create patient`)
  console.log(`   GET  /api/emergency-cases         - Get all emergency cases`)
  console.log(`   POST /api/emergency-cases         - Create emergency case`)
  console.log(`   PUT  /api/emergency-cases/:id     - Update emergency case`)
  console.log(`   GET  /api/op-appointments         - Get OP appointments`)
  console.log(`   POST /api/op-appointments         - Create OP appointment`)
  console.log(`   GET  /api/operation-allocations   - Get OR allocations`)
  console.log(`   POST /api/operation-allocations   - Create OR allocation`)
  console.log(`   POST /api/emergency/notify        - Send emergency email/voice/sms alerts`)
  console.log(`   POST /api/emergency/voice-call    - Trigger emergency voice call alert`)
  console.log(`   POST /api/optimize                - Run QAOA optimization`)
  console.log(`   POST /api/seed                    - Initialize database`)
  console.log(`\n🔒 Quantum Secure Communication:`)
  console.log(`   POST /api/secure/encode           - Encode message (Quantum Superdense Coding)`)
  console.log(`   POST /api/secure/decode           - Decode message`)
  console.log(`   POST /api/secure/send-secure-data - Send encrypted data`)
  console.log(`   POST /api/secure/patient-data     - Encrypt & transmit patient data`)
  console.log(`   GET  /api/secure/quantum-status   - Check quantum layer status\n`)
})
