import mongoose from 'mongoose';

export const INCIDENT_TYPES = {
  THEFT: 'theft',
  ASSAULT: 'assault',
  HARRASSMENT: 'harassment',
  SCAM: 'scam',
  MEDICAL: 'medical',
  FIRE: 'fire',
  TRAFFIC: 'traffic',
  NATURAL_DISASTER: 'natural_disaster',
  LOST_PERSON: 'lost_person',
  OTHER: 'other',
};

export const INCIDENT_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

export const INCIDENT_STATUS = {
  REPORTED: 'reported',
  REVIEWING: 'reviewing',
  RESOLVED: 'resolved',
  DISMISSED: 'dismissed',
};

const incidentSchema = new mongoose.Schema(
  {
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: Object.values(INCIDENT_TYPES), default: INCIDENT_TYPES.OTHER },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true },
    },
    address: { type: String, default: '' },
    status: { type: String, enum: Object.values(INCIDENT_STATUS), default: INCIDENT_STATUS.REPORTED },
    severity: { type: String, enum: Object.values(INCIDENT_SEVERITY), default: INCIDENT_SEVERITY.MEDIUM },
    aiClassified: { type: Boolean, default: false },
    aiConfidence: { type: Number, default: 0 },
    aiModel: { type: String, default: 'rule-based-classifier' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    photos: { type: [String], default: [] },
    resolvedAt: { type: Date, default: null },
    zoneLevelAtIncident: { type: String, default: null },
  },
  { timestamps: true }
);

incidentSchema.index({ location: '2dsphere' });
incidentSchema.index({ createdAt: -1 });
incidentSchema.index({ status: 1, severity: 1 });

const Incident = mongoose.model('Incident', incidentSchema);
export default Incident;
