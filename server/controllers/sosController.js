import User from '../models/User.js';
import SOSLog, { SOS_STATUS } from '../models/SOSLog.js';
import { broadcastSOS, notifyAuthorities, notifyUser, emitToUser } from '../services/notifier.js';

// REST fallback for SOS (primary is Socket.IO)
export const triggerSOS = async (req, res, next) => {
  try {
    const { lat, lng } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (typeof lat === 'number' && typeof lng === 'number') {
      user.lastLocation = { type: 'Point', coordinates: [lng, lat] };
      user.lastLocationAt = new Date();
    }
    user.sosActive = true;
    await user.save();

    const sosId = `SOS-${Date.now()}`;
    const payload = {
      sosId,
      userId: String(user._id),
      name: user.name,
      phone: user.phone,
      emergencyContact: user.emergencyContact,
      lat: lat ?? user.lastLocation?.coordinates?.[1] ?? 0,
      lng: lng ?? user.lastLocation?.coordinates?.[0] ?? 0,
      at: new Date().toISOString(),
    };

    await SOSLog.create({
      tourist: user._id,
      sosId,
      lat: payload.lat,
      lng: payload.lng,
      status: SOS_STATUS.ACTIVE,
    });

    broadcastSOS(payload);
    notifyAuthorities({ type: 'sos', title: '🚨 SOS EMERGENCY', body: `${user.name} pressed SOS. Immediate assistance required.`, data: payload });
    await notifyUser({
      userId: user._id,
      type: 'sos',
      title: 'SOS alert sent',
      body: 'Emergency services have been notified. Stay where you are.',
      data: payload,
    });

    res.status(201).json({ success: true, message: 'SOS alert sent', payload });
  } catch (err) {
    next(err);
  }
};

export const cancelSOS = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.sosActive = false;
    await user.save();

    await SOSLog.findOneAndUpdate(
      { tourist: user._id, status: { $in: [SOS_STATUS.ACTIVE, SOS_STATUS.ACKNOWLEDGED] } },
      { status: SOS_STATUS.RESOLVED, resolvedAt: new Date(), resolvedBy: user._id, notes: 'Cancelled by tourist' },
      { sort: { createdAt: -1 } }
    );

    broadcastSOS({ type: 'resolved', userId: String(user._id), at: new Date().toISOString() });
    res.json({ success: true, message: 'SOS cancelled' });
  } catch (err) {
    next(err);
  }
};

export const getSOSStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, sosActive: user.sosActive });
  } catch (err) {
    next(err);
  }
};

export const getActiveSOS = async (req, res, next) => {
  try {
    const users = await User.find({ sosActive: true, role: 'tourist' }).select(
      'name phone touristId emergencyContact lastLocation lastLocationAt sosActive'
    );
    res.json({
      success: true,
      count: users.length,
      sos: users.map((u) => ({
        userId: String(u._id),
        name: u.name,
        phone: u.phone,
        touristId: u.touristId,
        emergencyContact: u.emergencyContact,
        lat: u.lastLocation?.coordinates?.[1] ?? 0,
        lng: u.lastLocation?.coordinates?.[0] ?? 0,
        at: u.lastLocationAt,
      })),
    });
  } catch (err) {
    next(err);
  }
};

// Admin: full SOS history / logs
export const getSOSLogs = async (req, res, next) => {
  try {
    const { status, limit = 100 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    const logs = await SOSLog.find(filter)
      .populate('tourist', 'name email touristId phone')
      .populate('acknowledgedBy', 'name')
      .populate('resolvedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(Number(limit));
    res.json({ success: true, count: logs.length, logs });
  } catch (err) {
    next(err);
  }
};

// Admin: acknowledge an SOS alert -> user gets instant confirmation
export const acknowledgeSOS = async (req, res, next) => {
  try {
    const log = await SOSLog.findById(req.params.id);
    if (!log) return res.status(404).json({ success: false, message: 'SOS alert not found' });
    log.status = SOS_STATUS.ACKNOWLEDGED;
    log.acknowledgedBy = req.user._id;
    log.acknowledgedAt = new Date();
    await log.save();

    emitToUser(String(log.tourist), 'sos-ack', {
      type: 'acknowledged',
      sosId: log.sosId,
      adminName: req.user.name,
      message: `✅ Your SOS was acknowledged by ${req.user.name}. Help is on the way.`,
    });

    await notifyUser({
      userId: log.tourist,
      type: 'sos',
      title: 'SOS acknowledged',
      body: `Your SOS has been acknowledged by ${req.user.name}. Help is on the way.`,
      data: { sosId: log.sosId },
    });

    res.json({ success: true, log });
  } catch (err) {
    next(err);
  }
};

// Admin: resolve an SOS alert
export const resolveSOS = async (req, res, next) => {
  try {
    const { notes = '' } = req.body;
    const log = await SOSLog.findById(req.params.id);
    if (!log) return res.status(404).json({ success: false, message: 'SOS alert not found' });
    log.status = SOS_STATUS.RESOLVED;
    log.resolvedBy = req.user._id;
    log.resolvedAt = new Date();
    log.notes = notes || log.notes;
    await log.save();

    const user = await User.findById(log.tourist);
    if (user) {
      user.sosActive = false;
      await user.save().catch(() => {});
    }

    emitToUser(String(log.tourist), 'sos-ack', {
      type: 'resolved',
      sosId: log.sosId,
      adminName: req.user.name,
      message: `✅ Your SOS has been resolved by ${req.user.name}.`,
    });

    await notifyUser({
      userId: log.tourist,
      type: 'sos',
      title: 'SOS resolved',
      body: `Your SOS has been resolved${notes ? `: ${notes}` : ''}. Stay safe!`,
      data: { sosId: log.sosId },
    });

    res.json({ success: true, log });
  } catch (err) {
    next(err);
  }
};