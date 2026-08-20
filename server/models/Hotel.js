import mongoose from 'mongoose';

export const HOTEL_TYPES = {
  HOTEL: 'hotel',
  HOSTEL: 'hostel',
  GUESTHOUSE: 'guesthouse',
  RESORT: 'resort',
  APARTMENT: 'apartment',
};

const hotelSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: Object.values(HOTEL_TYPES), default: HOTEL_TYPES.HOTEL },
    address: { type: String, default: '' },
    description: { type: String, default: '' },
    phone: { type: String, default: '' },
    pricePerNight: { type: Number, required: true, min: 0 },
    rating: { type: Number, default: 4.0, min: 0, max: 5 },
    rooms: { type: Number, default: 10, min: 1 },
    amenities: { type: [String], default: [] },
    image: { type: String, default: '' },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true }, // [lng, lat]
    },
    active: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

hotelSchema.index({ location: '2dsphere' });

const Hotel = mongoose.model('Hotel', hotelSchema);
export default Hotel;