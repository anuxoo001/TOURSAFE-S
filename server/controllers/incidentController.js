import Incident from '../models/Incident.js';
import User from '../models/User.js';
import SafetyZone from '../models/SafetyZone.js';
import { classifyIncident } from '../services/aiClassifier.js';
import { zoneContainsPoint } from '../services/geo.js';
import { notifyAuthorities, notifyUser } from '../services/notifier.js';
import { emitZoneAlert } from '../services/notifier.js';

const findZoneAt = async (lat, lng) => {
  const zones = await SafetyZone.find({ active: true });
  return zones.find((z) => zoneContainsPoint(z, lat, lng)) || null;
};

export const reportIncident = async (req, res, next) => {
  try {
    const { title, description, type, lat, lng, address = '', photos = [] } = req.body;
    if (!title || !description) {
      return res.status(400).json({ success: false, message: 'Title and description are required' });
    }
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return res.status(400).json({ success: false, message: 'Valid lat/lng required' });
    }

    // AI classification
    const ai = classifyIncident(title, description);
    const zone = await findZoneAt(lat, lng);

    const incident = await Incident.create({
      reporter: req.user._id,
      type: ai.type || type || 'other',
      title,
      description,
      location: { type: 'Point', coordinates: [lng, lat] },
      address,
      severity: ai.severity,
      aiClassified: true,
      aiConfidence: ai.confidence,
      aiModel: 'rule-based-classifier',
      photos,
      zoneLevelAtIncident: zone?.level || null,
    });

    notifyAuthorities({
      type: 'incident',
      title: `📝 New incident: ${incident.title}`,
      body: `${req.user.name} reported: ${incident.description.slice(0, 120)}`,
      data: { incidentId: String(incident._id), severity: incident.severity, aiConfidence: ai.confidence, lat, lng },
    });

    if (ai.severity === 'critical' || ai.severity === 'high') {
      emitZoneAlert(String(req.user._id), {
        type: 'incident',
        level: ai.severity,
        message: 'Your report was classified as high severity. Authorities have been notified.',
        lat,
        lng,
      });
      await notifyUser({
        userId: req.user._id,
        type: 'incident',
        title: `Incident classified as ${ai.severity.toUpperCase()}`,
        body: 'Authorities have been notified immediately.',
        data: { incidentId: String(incident._id) },
      });
    }

    res.status(201).json({ success: true, incident, ai });
  } catch (err) {
    next(err);
  }
};

export const getIncidents = async (req, res, next) => {
  try {
    const { status, severity, type, reporterId, limit = 100, page = 1 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (severity) filter.severity = severity;
    if (type) filter.type = type;
    if (reporterId) filter.reporter = reporterId;

    const total = await Incident.countDocuments(filter);
    const incidents = await Incident.find(filter)
      .populate('reporter', 'name email touristId phone')
      .populate('assignedTo', 'name')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.json({ success: true, total, page: Number(page), limit: Number(limit), incidents });
  } catch (err) {
    next(err);
  }
};

export const getIncident = async (req, res, next) => {
  try {
    const incident = await Incident.findById(req.params.id)
      .populate('reporter', 'name email touristId phone country')
      .populate('assignedTo', 'name');
    if (!incident) return res.status(404).json({ success: false, message: 'Incident not found' });
    res.json({ success: true, incident });
  } catch (err) {
    next(err);
  }
};

export const updateIncidentStatus = async (req, res, next) => {
  try {
    const { status, severity, assignedTo } = req.body;
    const incident = await Incident.findById(req.params.id);
    if (!incident) return res.status(404).json({ success: false, message: 'Incident not found' });

    if (status !== undefined) {
      incident.status = status;
      if (status === 'resolved') incident.resolvedAt = new Date();
    }
    if (severity !== undefined) incident.severity = severity;
    if (assignedTo !== undefined) incident.assignedTo = assignedTo;

    await incident.save();

    // Notify the reporter about the status change
    await notifyUser({
      userId: incident.reporter,
      type: 'incident',
      title: `Incident ${incident.status}`,
      body: `Your report "${incident.title}" is now ${incident.status}.`,
      data: { incidentId: String(incident._id), status: incident.status },
    });

    res.json({ success: true, incident });
  } catch (err) {
    next(err);
  }
};

export const deleteIncident = async (req, res, next) => {
  try {
    const incident = await Incident.findByIdAndDelete(req.params.id);
    if (!incident) return res.status(404).json({ success: false, message: 'Incident not found' });
    res.json({ success: true, message: 'Incident deleted' });
  } catch (err) {
    next(err);
  }
};