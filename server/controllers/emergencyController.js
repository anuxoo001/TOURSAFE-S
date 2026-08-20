import EmergencyService, { SERVICE_TYPES } from '../models/EmergencyService.js';
import { haversineDistance } from '../services/geo.js';

export const getNearbyServices = async (req, res, next) => {
  try {
    const { lat, lng, type, radius = 20000, limit = 20 } = req.query;
    const filter = {};
    if (type) filter.type = type;

    let services = await EmergencyService.find(filter);

    if (lat && lng) {
      const la = Number(lat);
      const ln = Number(lng);
      const maxDist = Number(radius);
      services = services
        .map((s) => {
          const d = haversineDistance(la, ln, s.location.coordinates[1], s.location.coordinates[0]);
          return { ...s.toObject(), distance: Number(d.toFixed(0)) };
        })
        .filter((s) => s.distance <= maxDist)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, Number(limit));
    }

    res.json({ success: true, count: services.length, services });
  } catch (err) {
    next(err);
  }
};

export const createService = async (req, res, next) => {
  try {
    const { name, type, phone = '', address = '', lat, lng, hours = '24/7', emergencyNumber = '' } = req.body;
    if (!name || !type || typeof lat !== 'number' || typeof lng !== 'number') {
      return res.status(400).json({ success: false, message: 'name, type, lat and lng are required' });
    }
    const service = await EmergencyService.create({
      name,
      type,
      phone,
      address,
      location: { type: 'Point', coordinates: [lng, lat] },
      hours,
      emergencyNumber,
    });
    res.status(201).json({ success: true, service });
  } catch (err) {
    next(err);
  }
};

export const deleteService = async (req, res, next) => {
  try {
    const service = await EmergencyService.findByIdAndDelete(req.params.id);
    if (!service) return res.status(404).json({ success: false, message: 'Service not found' });
    res.json({ success: true, message: 'Service deleted' });
  } catch (err) {
    next(err);
  }
};

export { SERVICE_TYPES };