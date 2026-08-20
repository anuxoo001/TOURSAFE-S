import mongoose from 'mongoose';

export const SERVICE_TYPES = {
  HOSPITAL: 'hospital',
  CLINIC: 'clinic',
  PHARMACY: 'pharmacy',
  POLICE: 'police',
  FIRE: 'fire',
  EMBASSY: 'embassy',
  HELPLINE: 'helpline',
  OTHER: 'other',
};

const emergencyServiceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: { type: String, enum: Object.values(SERVICE_TYPES), required: true },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true },
    },
    hours: { type: String, default: '24/7' },
    rating: { type: Number, default: 0 },
    emergencyNumber: { type: String, default: '' },
  },
  { timestamps: true }
);

emergencyServiceSchema.index({ location: '2dsphere' });

const EmergencyService = mongoose.model('EmergencyService', emergencyServiceSchema);
export default EmergencyService;
