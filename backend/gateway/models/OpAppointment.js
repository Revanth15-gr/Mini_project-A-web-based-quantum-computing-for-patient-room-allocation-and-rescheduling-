import mongoose from 'mongoose'

const opAppointmentSchema = new mongoose.Schema(
  {
    patientName: { type: String, required: true },
    hospital: { type: String, required: true },
    department: { type: String, required: true },
    doctorName: { type: String, required: true },
    appointmentDate: { type: String, required: true },
    appointmentTime: { type: String, required: true },
    status: {
      type: String,
      enum: ['Booked', 'Moved to OR', 'Cancelled', 'Completed'],
      default: 'Booked',
    },
    type: { type: String, default: 'OP' },
  },
  { timestamps: true }
)

export const OpAppointment = mongoose.model('OpAppointment', opAppointmentSchema)
