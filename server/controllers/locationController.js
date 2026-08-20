import User from '../models/User.js';
import { sanitizeCoord } from '../services/geo.js';

// REST fallback for location updates (Socket.IO is the primary channel)
export const updateLocation = async (req, res, next) => {
  try {
    const { lat, lng } = req.body;
    const c = sanitizeCoord(lat, lng);
    if (!c) return res.status(400).json({ success: false, message: 'Invalid coordinates' });

    const user = await User.findById(req.user._id);
    user.lastLocation = { type: 'Point', coordinates: c };
    user.lastLocationAt = new Date();
    user.isOnline = true;
    await user.save();

    res.json({ success: true, location: { lat: c[1], lng: c[0], at: user.lastLocationAt } });
  } catch (err) {
    next(err);
  }
};

// Authority: get live positions of all online tourists
export const getLivePositions = async (req, res, next) => {
  try {
    const tourists = await User.find({ role: 'tourist', lastLocationAt: { $ne: null } }).select(
      'name touristId lastLocation lastLocationAt isOnline sosActive'
    );
    res.json({
      success: true,
      count: tourists.length,
      positions: tourists
        .filter((t) => t.lastLocation && t.lastLocation.coordinates)
        .map((t) => ({
          userId: String(t._id),
          name: t.name,
          touristId: t.touristId,
          isOnline: t.isOnline,
          sosActive: t.sosActive,
          lat: t.lastLocation.coordinates[1],
          lng: t.lastLocation.coordinates[0],
          at: t.lastLocationAt,
        })),
    });
  } catch (err) {
    next(err);
  }
};