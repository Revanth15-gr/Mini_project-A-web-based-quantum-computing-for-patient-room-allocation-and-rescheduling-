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

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.join(__dirname, '.env') })

const app = express()
const PORT = process.env.PORT || 4000
const QAOA_URL = process.env.QAOA_SERVICE_URL || 'http://127.0.0.1:8000'
const MONGODB_URI = process.env.MONGODB_URI

app.use(cors())
app.use(express.json({ limit: '10mb' }))

let dbConnected = false

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
    const doctor = await Doctor.create(req.body)
    res.status(201).json(doctor)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

app.put('/api/doctors/:id', async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, { new: true })
    res.json(doctor)
  } catch (error) {
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
    const patient = await Patient.findByIdAndUpdate(req.params.id, req.body, { new: true })
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
      timeout: 120000,
    })
    res.json(response.data)
  } catch (error) {
    const status = error.response?.status || 500
    const message = error.response?.data?.detail || error.message
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

app.listen(PORT, () => {
  console.log(`\n✓ QAOA Gateway listening on http://localhost:${PORT}`)
  console.log(`✓ MongoDB URI configured: ${MONGODB_URI ? 'Yes' : 'No'}`)
  console.log(`\n📚 API Endpoints:`)
  console.log(`   GET  /api/health              - Service status`)
  console.log(`   GET  /api/hospitals           - Get all hospitals`)
  console.log(`   POST /api/hospitals           - Create hospital`)
  console.log(`   GET  /api/rooms               - Get all rooms`)
  console.log(`   POST /api/rooms               - Create room`)
  console.log(`   GET  /api/doctors             - Get all doctors`)
  console.log(`   POST /api/doctors             - Create doctor`)
  console.log(`   GET  /api/patients            - Get all patients`)
  console.log(`   POST /api/patients            - Create patient`)
  console.log(`   POST /api/optimize            - Run QAOA optimization`)
  console.log(`   POST /api/seed                - Initialize database\n`)
})
