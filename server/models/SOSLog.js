import mongoose from 'mongoose';

export const SOS_STATUS = {
  ACTIVE: 'active',
  ACKNOWLEDGED: 'acknowledged',
  RESOLVED: 'resolved',
};

const sosLogSchema = new mongoose.Schema(
  {
    tourist: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sosId: { type: String, required: true, unique: true },
    lat: { type: Number, default: 0 },
    lng: { type: Number, default: 0 },
    status: { type: String, enum: Object.values(SOS_STATUS), default: SOS_STATUS.ACTIVE },
    acknowledgedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    acknowledgedAt: { type: Date, default: null },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    resolvedAt: { type: Date, default: null },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

sosLogSchema.index({ status: 1, createdAt: -1 });

const SOSLog = mongoose.model('SOSLog', sosLogSchema);
export default SOSLog;