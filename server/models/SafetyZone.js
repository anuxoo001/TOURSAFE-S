import mongoose from 'mongoose';

export const ZONE_LEVELS = {
  RED: 'red',
  YELLOW: 'yellow',
  GREEN: 'green',
};

export const ZONE_TYPES = {
  CAUTION: 'caution',
  DANGER: 'danger',
  SAFE: 'safe',
};

const safetyZoneSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    level: { type: String, enum: Object.values(ZONE_LEVELS), required: true },
    zoneType: { type: String, enum: Object.values(ZONE_TYPES), default: ZONE_TYPES.CAUTION },
    geometry: {
      type: { type: String, enum: ['Polygon', 'Point'], default: 'Polygon' },
      // For Polygon: [[[lng,lat],[lng,lat],...]]  |  For Point: [lng, lat]
      coordinates: { type: mongoose.Schema.Types.Mixed, required: true },
    },
    radius: { type: Number, default: 500 }, // meters used for Point-based geofences
    alertOnEnter: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const SafetyZone = mongoose.model('SafetyZone', safetyZoneSchema);
export default SafetyZone;
