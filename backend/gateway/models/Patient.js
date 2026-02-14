import mongoose from 'mongoose'

const PatientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    status: { type: String, enum: ['Stable', 'Critical', 'Recovering'], default: 'Stable' },
    care: String,
    next: String,
    hospital: { type: String, required: true },
    room: String,
    roomId: mongoose.Schema.Types.ObjectId,
  },
  { timestamps: true }
)

export const Patient = mongoose.model('Patient', PatientSchema)
