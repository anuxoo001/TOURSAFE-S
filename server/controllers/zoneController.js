import SafetyZone from '../models/SafetyZone.js';
import { isGeoJsonPolygon, sanitizeCoord } from '../services/geo.js';
import { notifyUser, notifyAuthorities } from '../services/notifier.js';

export const getZones = async (req, res, next) => {
  try {
    const zones = await SafetyZone.find({}).sort({ createdAt: -1 });
    res.json({ success: true, count: zones.length, zones });
  } catch (err) {
    next(err);
  }
};

export const createZone = async (req, res, next) => {
  try {
    const { name, description, level, zoneType, radius, alertOnEnter } = req.body;
    const { geometry } = req.body;

    if (!name || !level) return res.status(400).json({ success: false, message: 'Name and level are required' });
    if (!['red', 'yellow', 'green'].includes(level)) {
      return res.status(400).json({ success: false, message: 'Level must be red, yellow or green' });
    }

    let geometryData = geometry;
    // Support simple [lng, lat] center with radius
    if (Array.isArray(geometry) && geometry.length === 2) {
      const c = sanitizeCoord(geometry[1], geometry[0]);
      if (!c) return res.status(400).json({ success: false, message: 'Invalid coordinates' });
      geometryData = { type: 'Point', coordinates: c };
    } else if (geometry && geometry.type === 'Point') {
      const c = sanitizeCoord(geometry.coordinates[1], geometry.coordinates[0]);
      if (!c) return res.status(400).json({ success: false, message: 'Invalid coordinates' });
      geometryData = { type: 'Point', coordinates: c };
    } else if (geometry && isGeoJsonPolygon(geometry)) {
      geometryData = geometry;
    } else {
      return res.status(400).json({ success: false, message: 'Invalid geometry. Provide [lng,lat] + radius or a GeoJSON Polygon' });
    }

    const zone = await SafetyZone.create({
      name,
      description: description || '',
      level,
      zoneType: zoneType || (level === 'red' ? 'danger' : level === 'green' ? 'safe' : 'caution'),
      geometry: geometryData,
      radius: Number(radius) || 500,
      alertOnEnter: alertOnEnter !== false,
      createdBy: req.user._id,
    });

    const tourists = await import('../models/User.js').then((m) => m.default.find({ role: 'tourist' }));
    for (const t of tourists) {
      await notifyUser({
        userId: t._id,
        type: 'zone_update',
        title: `${zone.level.toUpperCase()} zone added: ${zone.name}`,
        body: zone.description || 'A new safety zone was added to the map.',
        data: { zoneId: String(zone._id), level: zone.level },
      });
    }
    notifyAuthorities({ type: 'zone_update', title: 'Zone updated', body: `${zone.name} (${zone.level}) created.` });

    res.status(201).json({ success: true, zone });
  } catch (err) {
    next(err);
  }
};

export const updateZone = async (req, res, next) => {
  try {
    const zone = await SafetyZone.findById(req.params.id);
    if (!zone) return res.status(404).json({ success: false, message: 'Zone not found' });
    const { name, description, level, zoneType, radius, alertOnEnter, active } = req.body;
    if (name !== undefined) zone.name = name;
    if (description !== undefined) zone.description = description;
    if (level !== undefined && ['red', 'yellow', 'green'].includes(level)) zone.level = level;
    if (zoneType !== undefined) zone.zoneType = zoneType;
    if (radius !== undefined) zone.radius = Number(radius);
    if (alertOnEnter !== undefined) zone.alertOnEnter = alertOnEnter;
    if (active !== undefined) zone.active = active;
    await zone.save();
    res.json({ success: true, zone });
  } catch (err) {
    next(err);
  }
};

export const deleteZone = async (req, res, next) => {
  try {
    const zone = await SafetyZone.findByIdAndDelete(req.params.id);
    if (!zone) return res.status(404).json({ success: false, message: 'Zone not found' });
    res.json({ success: true, message: 'Zone deleted' });
  } catch (err) {
    next(err);
  }
};