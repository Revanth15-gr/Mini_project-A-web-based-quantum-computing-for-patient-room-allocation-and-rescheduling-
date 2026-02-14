import mongoose from 'mongoose'

const RoomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    hospital: { type: String, required: true },
    equipment: String,
    status: { type: String, enum: ['Available', 'Occupied', 'Maintenance'], default: 'Available' },
    patientId: mongoose.Schema.Types.ObjectId,
    patientName: String,
  },
  { timestamps: true }
)

RoomSchema.index({ hospital: 1, name: 1 }, { unique: true })

export const Room = mongoose.model('Room', RoomSchema)
