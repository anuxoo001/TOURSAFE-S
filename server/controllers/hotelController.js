import Hotel, { HOTEL_TYPES } from '../models/Hotel.js';
import HotelBooking, { BOOKING_STATUS } from '../models/HotelBooking.js';
import SafetyZone from '../models/SafetyZone.js';
import { zoneContainsPoint, haversineDistance } from '../services/geo.js';
import { notifyUser, notifyAuthorities } from '../services/notifier.js';

const LEVEL_ORDER = { red: 3, yellow: 2, green: 1 };

// Determine the worst-severity zone containing a point. Returns { level, name, id } or null.
export const getZoneForPoint = async (lat, lng) => {
  const zones = await SafetyZone.find({ active: true });
  let worst = null;
  for (const zone of zones) {
    if (!zoneContainsPoint(zone, lat, lng)) continue;
    if (!worst || (LEVEL_ORDER[zone.level] || 0) > (LEVEL_ORDER[worst.level] || 0)) {
      worst = { level: zone.level, name: zone.name, id: String(zone._id), zoneType: zone.zoneType };
    }
  }
  return worst;
};

export const listHotels = async (req, res) => {
  try {
    const { level, near, radius = 5000 } = req.query;
    const query = { active: true };
    const filterLevel = ['red', 'yellow', 'green'].includes(level) ? level : null;

    let hotels = await Hotel.find(query).sort({ rating: -1, createdAt: -1 });

    // Zone verification
    const withZone = [];
    for (const hotel of hotels) {
      const [lng, lat] = hotel.location.coordinates;
      const zone = await getZoneForPoint(lat, lng);
      if (filterLevel && zone?.level !== filterLevel) continue;
      withZone.push({
        ...hotel.toObject(),
        zone,
        zoneLabel: zone ? (zone.level === 'red' ? 'DANGER ZONE' : zone.level === 'yellow' ? 'CAUTION ZONE' : 'SAFE ZONE') : 'No zone data',
      });
    }

    // Proximity sort if coordinates provided
    if (near) {
      const [latStr, lngStr] = String(near).split(',');
      const lat = Number(latStr);
      const lng = Number(lngStr);
      if (!isNaN(lat) && !isNaN(lng)) {
        withZone.sort((a, b) => {
          const dA = haversineDistance(lat, lng, a.location.coordinates[1], a.location.coordinates[0]);
          const dB = haversineDistance(lat, lng, b.location.coordinates[1], b.location.coordinates[0]);
          return dA - dB;
        });
      }
    }

    res.json({ success: true, count: withZone.length, hotels: withZone });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getHotel = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) return res.status(404).json({ success: false, message: 'Hotel not found' });
    const [lng, lat] = hotel.location.coordinates;
    const zone = await getZoneForPoint(lat, lng);
    res.json({ success: true, hotel: { ...hotel.toObject(), zone } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createHotel = async (req, res) => {
  try {
    const { name, type, address, description, phone, pricePerNight, rating, rooms, amenities, image, lat, lng } = req.body;
    if (!name || pricePerNight === undefined || lat === undefined || lng === undefined) {
      return res.status(400).json({ success: false, message: 'Name, price and location are required' });
    }
    const hotel = await Hotel.create({
      name,
      type: type || HOTEL_TYPES.HOTEL,
      address,
      description,
      phone,
      pricePerNight,
      rating,
      rooms,
      amenities: Array.isArray(amenities) ? amenities : String(amenities || '').split(',').map((a) => a.trim()).filter(Boolean),
      image,
      location: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
      createdBy: req.user._id,
    });
    res.status(201).json({ success: true, hotel });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateHotel = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) return res.status(404).json({ success: false, message: 'Hotel not found' });
    const allowed = ['name', 'type', 'address', 'description', 'phone', 'pricePerNight', 'rating', 'rooms', 'amenities', 'image', 'active'];
    const patch = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) patch[key] = req.body[key];
    }
    if (req.body.lat !== undefined && req.body.lng !== undefined) {
      patch.location = { type: 'Point', coordinates: [Number(req.body.lng), Number(req.body.lat)] };
    }
    const updated = await Hotel.findByIdAndUpdate(req.params.id, patch, { new: true });
    res.json({ success: true, hotel: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteHotel = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) return res.status(404).json({ success: false, message: 'Hotel not found' });
    await Hotel.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Hotel deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createBooking = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel || !hotel.active) return res.status(404).json({ success: false, message: 'Hotel not found' });

    const { checkIn, checkOut, guests = 1 } = req.body;
    const inDate = new Date(checkIn);
    const outDate = new Date(checkOut);
    if (isNaN(inDate) || isNaN(outDate) || outDate <= inDate) {
      return res.status(400).json({ success: false, message: 'Valid check-in and check-out dates are required' });
    }
    const nights = Math.max(1, Math.round((outDate - inDate) / (1000 * 60 * 60 * 24)));
    const totalPrice = hotel.pricePerNight * nights;

    // Availability: count overlapping active bookings
    const overlapping = await HotelBooking.countDocuments({
      hotel: hotel._id,
      status: { $in: [BOOKING_STATUS.PENDING, BOOKING_STATUS.CONFIRMED] },
      checkIn: { $lt: outDate },
      checkOut: { $gt: inDate },
    });
    if (overlapping >= hotel.rooms) {
      return res.status(400).json({ success: false, message: 'No rooms available for these dates' });
    }

    const booking = await HotelBooking.create({
      hotel: hotel._id,
      tourist: req.user._id,
      checkIn: inDate,
      checkOut: outDate,
      guests,
      nights,
      totalPrice,
    });

    await notifyUser({
      userId: req.user._id,
      type: 'booking',
      title: '🏨 Booking requested',
      body: `Your request for ${hotel.name} (${nights} night${nights > 1 ? 's' : ''}) has been submitted. Pending admin confirmation.`,
      data: { bookingId: String(booking._id), hotelId: String(hotel._id), hotelName: hotel.name },
    });
    notifyAuthorities({
      type: 'booking',
      title: 'New hotel booking request',
      body: `${req.user.name} requested ${hotel.name} (${nights} nights).`,
      data: { bookingId: String(booking._id), hotelId: String(hotel._id), hotelName: hotel.name },
    });

    res.status(201).json({ success: true, booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const myBookings = async (req, res) => {
  try {
    const bookings = await HotelBooking.find({ tourist: req.user._id })
      .populate('hotel', 'name type address pricePerNight location')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: bookings.length, bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getAllBookings = async (req, res) => {
  try {
    const bookings = await HotelBooking.find({})
      .populate('hotel', 'name type address pricePerNight location')
      .populate('tourist', 'name email phone')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: bookings.length, bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateBookingStatus = async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    if (!Object.values(BOOKING_STATUS).includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const booking = await HotelBooking.findById(req.params.id)
      .populate('hotel', 'name')
      .populate('tourist', 'name email');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    booking.status = status;
    if (adminNote !== undefined) booking.adminNote = adminNote;
    await booking.save();

    await notifyUser({
      userId: booking.tourist._id,
      type: 'booking',
      title: status === BOOKING_STATUS.CONFIRMED ? '✅ Booking confirmed' : status === BOOKING_STATUS.CANCELLED ? '❌ Booking cancelled' : 'Booking updated',
      body:
        status === BOOKING_STATUS.CONFIRMED
          ? `Your booking at ${booking.hotel.name} has been confirmed. Safe travels!`
          : status === BOOKING_STATUS.CANCELLED
            ? `Your booking at ${booking.hotel.name} was cancelled.${adminNote ? ` Reason: ${adminNote}` : ''}`
            : `Your booking at ${booking.hotel.name} is now "${status}".`,
      data: { bookingId: String(booking._id), hotelName: booking.hotel.name, status },
    });

    res.json({ success: true, booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export default { listHotels, getHotel, createHotel, updateHotel, deleteHotel, createBooking, myBookings, getAllBookings, updateBookingStatus };