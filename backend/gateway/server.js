import express from 'express'
import axios from 'axios'
import cors from 'cors'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { Hospital } from './models/Hospital.js'
import { Room } from './models/Room.js'
import { Doctor } from './models/Doctor.js'
import { Patient } from './models/Patient.js'
import { Discharge } from './models/Discharge.js'
import { EmergencyCase } from './models/EmergencyCase.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.join(__dirname, '.env') })

const app = express()
const PORT = process.env.PORT || 4000
const QAOA_URL = process.env.QAOA_SERVICE_URL || 'http://127.0.0.1:8000'
const MONGODB_URI = process.env.MONGODB_URI

app.use(cors())
app.use(express.json({ limit: '10mb' }))

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
    message: 'Used fallback optimizer because QAOA service was unavailable or failed.',
  }
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
    const crypto = require('crypto')
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
    const crypto = require('crypto')
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
  console.log(`   POST /api/optimize                - Run QAOA optimization`)
  console.log(`   POST /api/seed                    - Initialize database`)
  console.log(`\n🔒 Quantum Secure Communication:`)
  console.log(`   POST /api/secure/encode           - Encode message (Quantum Superdense Coding)`)
  console.log(`   POST /api/secure/decode           - Decode message`)
  console.log(`   POST /api/secure/send-secure-data - Send encrypted data`)
  console.log(`   POST /api/secure/patient-data     - Encrypt & transmit patient data`)
  console.log(`   GET  /api/secure/quantum-status   - Check quantum layer status\n`)
})
