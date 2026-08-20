import mongoose from 'mongoose';

export const REQUEST_TYPES = {
  EMERGENCY: 'emergency',
  MEDICAL: 'medical',
  POLICE: 'police',
  FIRE: 'fire',
  LOST: 'lost',
  THEFT: 'theft',
  ASSISTANCE: 'assistance',
  CONTACT_ADMIN: 'contact_admin',
  FEEDBACK: 'feedback',
  OTHER: 'other',
};

export const REQUEST_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
};

export const REQUEST_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

const helpRequestSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: Object.values(REQUEST_TYPES), default: REQUEST_TYPES.OTHER },
    subject: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] },
    },
    status: { type: String, enum: Object.values(REQUEST_STATUS), default: REQUEST_STATUS.PENDING },
    priority: { type: String, enum: Object.values(REQUEST_PRIORITY), default: REQUEST_PRIORITY.MEDIUM },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    adminNote: { type: String, default: '' },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

helpRequestSchema.index({ user: 1, createdAt: -1 });
helpRequestSchema.index({ status: 1, priority: 1 });

const HelpRequest = mongoose.model('HelpRequest', helpRequestSchema);
export default HelpRequest;