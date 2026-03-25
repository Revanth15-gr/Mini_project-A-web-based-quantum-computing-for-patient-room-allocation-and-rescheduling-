import mongoose from 'mongoose'

const operationAllocationSchema = new mongoose.Schema(
  {
    appointmentId: { type: String, default: '' },
    patientName: { type: String, required: true },
    hospital: { type: String, required: true },
    procedure: { type: String, required: true },
    surgeon: { type: String, default: '' },
    priority: {
      type: String,
      enum: ['Routine', 'High', 'Emergency'],
      default: 'Routine',
    },
    scheduledAt: { type: String, required: true },
    estimatedDurationHours: { type: Number, default: 2 },
    roomId: { type: String, required: true },
    roomName: { type: String, required: true },
    status: {
      type: String,
      enum: ['Allocated', 'Completed', 'Cancelled'],
      default: 'Allocated',
    },
    completedAt: { type: String, default: '' },
  },
  { timestamps: true }
)

export const OperationAllocation = mongoose.model('OperationAllocation', operationAllocationSchema)
