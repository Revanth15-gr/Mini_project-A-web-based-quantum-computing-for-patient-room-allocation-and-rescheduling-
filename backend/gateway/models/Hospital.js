import mongoose from 'mongoose'

const HospitalSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    location: String,
    specialty: String,
    district: String,
    image: String,
    doctors: { type: Number, default: 0 },
    patients: { type: Number, default: 0 },
    occupancy: { type: Number, default: 0 },
    rooms: { type: Number, default: 0 },
  },
  { timestamps: true }
)

export const Hospital = mongoose.model('Hospital', HospitalSchema)
