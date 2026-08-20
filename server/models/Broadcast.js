import mongoose from 'mongoose';

export const BROADCAST_LEVELS = {
  INFO: 'info',
  WARNING: 'warning',
  DANGER: 'danger',
};

export const BROADCAST_AUDIENCE = {
  ALL: 'all',
  TOURISTS: 'tourists',
};

const broadcastSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true },
    level: { type: String, enum: Object.values(BROADCAST_LEVELS), default: BROADCAST_LEVELS.INFO },
    audience: { type: String, enum: Object.values(BROADCAST_AUDIENCE), default: BROADCAST_AUDIENCE.ALL },
    active: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

broadcastSchema.index({ createdAt: -1 });

const Broadcast = mongoose.model('Broadcast', broadcastSchema);
export default Broadcast;