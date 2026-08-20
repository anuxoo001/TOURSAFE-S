import Incident, { INCIDENT_TYPES, INCIDENT_SEVERITY } from '../models/Incident.js';
import SafetyZone from '../models/SafetyZone.js';
import User from '../models/User.js';
import EmergencyService from '../models/EmergencyService.js';

export const getAnalytics = async (req, res, next) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 3600 * 1000);

    const [totalIncidents, todayIncidents, weekIncidents, monthIncidents, openIncidents, criticalIncidents] =
      await Promise.all([
        Incident.countDocuments(),
        Incident.countDocuments({ createdAt: { $gte: todayStart } }),
        Incident.countDocuments({ createdAt: { $gte: weekAgo } }),
        Incident.countDocuments({ createdAt: { $gte: monthAgo } }),
        Incident.countDocuments({ status: { $ne: 'resolved' } }),
        Incident.countDocuments({ severity: 'critical', status: { $ne: 'resolved' } }),
      ]);

    const typeDist = await Incident.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const severityDist = await Incident.aggregate([
      { $group: { _id: '$severity', count: { $sum: 1 } } },
    ]);

    // last 14 days trend
    const trend = await Incident.aggregate([
      { $match: { createdAt: { $gte: new Date(now.getTime() - 14 * 24 * 3600 * 1000) } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const zones = await SafetyZone.find({ active: true });
    const zoneStats = zones.reduce(
      (acc, z) => {
        acc[z.level] = (acc[z.level] || 0) + 1;
        return acc;
      },
      { red: 0, yellow: 0, green: 0 }
    );

    const incidentByZone = await Incident.aggregate([
      {
        $group: {
          _id: '$zoneLevelAtIncident',
          count: { $sum: 1 },
        },
      },
    ]);

    const tourists = await User.countDocuments({ role: 'tourist' });
    const online = await User.countDocuments({ role: 'tourist', isOnline: true });

    const activeSOS = await User.countDocuments({ role: 'tourist', sosActive: true });

    const services = await EmergencyService.countDocuments();

    const avgResolution = await Incident.aggregate([
      { $match: { status: 'resolved', resolvedAt: { $ne: null } } },
      {
        $project: {
          hours: {
            $divide: [{ $subtract: ['$resolvedAt', '$createdAt'] }, 3600000],
          },
        },
      },
      { $group: { _id: null, avg: { $avg: '$hours' } } },
    ]);

    res.json({
      success: true,
      analytics: {
        totals: {
          incidents: totalIncidents,
          open: openIncidents,
          critical: criticalIncidents,
          tourists,
          online,
          activeSOS,
          services,
          avgResolutionHours: Number(avgResolution[0]?.avg?.toFixed(1) || 0),
        },
        periods: {
          today: todayIncidents,
          week: weekIncidents,
          month: monthIncidents,
        },
        typeDist,
        severityDist,
        trend,
        zoneStats,
        incidentByZone,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getSeverityStats = async (req, res, next) => {
  try {
    const incidents = await Incident.find({}).select('type severity createdAt zoneLevelAtIncident');
    res.json({ success: true, incidents });
  } catch (err) {
    next(err);
  }
};

export { INCIDENT_TYPES, INCIDENT_SEVERITY };