import mongoose from 'mongoose'

const DoctorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    specialty: String,
    hospital: String,
    district: String,
    status: { type: String, enum: ['Available', 'On Leave', 'Off Duty'], default: 'Available' },
    patients: { type: Number, default: 0 },
    salary: { type: Number, default: 800000 },
  },
  { timestamps: true }
)

export const Doctor = mongoose.model('Doctor', DoctorSchema)
