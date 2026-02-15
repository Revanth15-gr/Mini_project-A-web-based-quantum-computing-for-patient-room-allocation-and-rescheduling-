import mongoose from 'mongoose'

const dischargeSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
    name: { type: String, required: true },
    status: { type: String },
    room: { type: String },
    hospital: { type: String },
    care: { type: String },
    dischargedAt: { type: Date, default: Date.now },
    reason: { type: String, default: 'Discharged' },
  },
  { timestamps: true }
)

export const Discharge = mongoose.model('Discharge', dischargeSchema)
