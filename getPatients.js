import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.join(__dirname, 'backend/gateway/.env') })

const patientSchema = new mongoose.Schema({}, { strict: false })
const Patient = mongoose.model('Patient', patientSchema, 'patients')

async function getPatients() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    const patients = await Patient.find()
    console.log(JSON.stringify(patients, null, 2))
    await mongoose.disconnect()
  } catch (error) {
    console.error('Error:', error.message)
    process.exit(1)
  }
}

getPatients()
