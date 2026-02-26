import mongoose from 'mongoose'

const emergencyCaseSchema = new mongoose.Schema({
  caseId: {
    type: String,
    required: true,
    unique: true,
  },
  ambulanceId: {
    type: String,
    required: true,
  },
  patientName: {
    type: String,
    required: true,
  },
  age: Number,
  incident: String,
  location: String,
  severity: {
    type: String,
    enum: ['Critical', 'Severe', 'Moderate'],
    default: 'Moderate',
  },
  injuries: String,
  eta: String,
  assignedHospital: {
    name: String,
    distance: Number,
    beds: Number,
    doctors: Number,
    district: String,
  },
  status: {
    type: String,
    enum: ['Pending', 'Assigned', 'In Transit', 'Arrived', 'Treated', 'Discharged'],
    default: 'Pending',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
})

export const EmergencyCase = mongoose.model('EmergencyCase', emergencyCaseSchema)
