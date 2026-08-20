import User from '../models/User.js';
import Incident from '../models/Incident.js';
import SafetyZone from '../models/SafetyZone.js';
import { generateQRDataUrl, VERIFICATION_URL } from '../services/qrService.js';
import { zoneContainsPoint } from '../services/geo.js';

export const getTouristId = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user.touristId) {
      // generate on the fly if missing
      const { createTouristId } = await import('../services/qrService.js');
      await createTouristId(user);
    }
    const qrDataUrl = await generateQRDataUrl(user);
    const verificationUrl = VERIFICATION_URL(user.touristId, 'demo');
    res.json({
      success: true,
      touristId: user.touristId,
      name: user.name,
      email: user.email,
      country: user.country,
      passport: user.passport,
      issuedAt: user.createdAt,
      qr: qrDataUrl,
      verificationUrl,
    });
  } catch (err) {
    next(err);
  }
};

export const verifyTouristId = async (req, res, next) => {
  try {
    const { touristId } = req.params;
    const user = await User.findOne({ touristId });
    if (!user) return res.status(404).json({ success: false, message: 'Tourist ID not found' });
    res.json({
      success: true,
      verified: true,
      tourist: {
        name: user.name,
        country: user.country,
        touristId: user.touristId,
        registered: user.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getMyLocation = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const coords = user.lastLocation?.coordinates || [0, 0];
    const zone = await SafetyZone.findOne({ active: true });
    let currentZone = null;
    if (zone) {
      const found = await SafetyZone.find({ active: true });
      const hit = found.find((z) => zoneContainsPoint(z, coords[1], coords[0]));
      if (hit) currentZone = { _id: hit._id, name: hit.name, level: hit.level };
    }
    res.json({
      success: true,
      location: { lat: coords[1], lng: coords[0], at: user.lastLocationAt },
      currentZone,
    });
  } catch (err) {
    next(err);
  }
};

export const getAllTourists = async (req, res, next) => {
  try {
    const tourists = await User.find({ role: 'tourist' })
      .select('name email country touristId lastLocation lastLocationAt isOnline sosActive')
      .sort({ createdAt: -1 });
    res.json({
      success: true,
      count: tourists.length,
      tourists: tourists.map((t) => ({
        _id: t._id,
        name: t.name,
        email: t.email,
        country: t.country,
        touristId: t.touristId,
        isOnline: t.isOnline,
        sosActive: t.sosActive,
        lastLocationAt: t.lastLocationAt,
        lat: t.lastLocation?.coordinates?.[1] ?? null,
        lng: t.lastLocation?.coordinates?.[0] ?? null,
      })),
    });
  } catch (err) {
    next(err);
  }
};

export const getTouristHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tourist = await User.findById(id);
    if (!tourist) return res.status(404).json({ success: false, message: 'Tourist not found' });
    const incidents = await Incident.find({ reporter: id }).sort({ createdAt: -1 }).limit(50);
    res.json({
      success: true,
      tourist: { _id: tourist._id, name: tourist.name, email: tourist.email, touristId: tourist.touristId },
      incidents,
    });
  } catch (err) {
    next(err);
  }
};