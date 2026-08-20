import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import SafetyZone from '../models/SafetyZone.js';
import SOSLog, { SOS_STATUS } from '../models/SOSLog.js';
import { zoneContainsPoint } from '../services/geo.js';
import {
  setSocketIO,
  notifyUser,
  notifyAuthorities,
  broadcastSOS,
  emitZoneAlert,
  broadcastLocation,
  rooms,
} from '../services/notifier.js';

let onlineUsers = new Map(); // userId -> socketId
const autoSosZones = new Map(); // userId -> Set of zoneIds where auto-SOS already triggered

const triggerSos = async ({ io, socket, userId, lat, lng, reason }) => {
  const user = await User.findById(userId);
  if (!user) return;
  if (lat !== undefined && lng !== undefined) {
    user.lastLocation = { type: 'Point', coordinates: [lng, lat] };
    user.lastLocationAt = new Date();
  }
  user.sosActive = true;
  await user.save().catch(() => {});
  const sosId = `SOS-${Date.now()}`;
  const payload = {
    sosId,
    userId: String(userId),
    name: user.name,
    phone: user.phone,
    emergencyContact: user.emergencyContact,
    lat: lat ?? user.lastLocation?.coordinates?.[1] ?? 0,
    lng: lng ?? user.lastLocation?.coordinates?.[0] ?? 0,
    at: new Date().toISOString(),
    auto: Boolean(reason),
    reason: reason || null,
  };
  try {
    await SOSLog.create({
      tourist: userId,
      sosId,
      lat: payload.lat,
      lng: payload.lng,
      status: SOS_STATUS.ACTIVE,
      notes: reason ? `Auto-triggered: ${reason}` : 'Triggered by tourist',
    });
  } catch (e) {
    console.error('Failed to persist SOS log:', e.message);
  }
  broadcastSOS(payload);
  notifyAuthorities({
    type: 'sos',
    title: reason ? '🚨 AUTO-SOS: Tourist in RED zone' : '🚨 SOS EMERGENCY',
    body: reason
      ? `${user.name} entered a RED danger zone. Automatic SOS raised. Immediate assistance required.`
      : `${user.name} pressed SOS. Immediate assistance required.`,
    data: payload,
  });
  socket.emit('sos-ack', { ok: true, message: reason ? 'Automatic SOS raised for entering a RED zone. Help is on the way.' : 'Emergency alert sent. Help is on the way.' });
};

export const initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    },
  });
  setSocketIO(io);

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('No token'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.userId;
    onlineUsers.set(userId, socket.id);

    const user = await User.findById(userId).catch(() => null);
    socket.join(rooms.getUserRoom(userId));
    if (user && user.role === 'authority') socket.join(rooms.getAuthoritiesRoom());

    if (user) {
      user.isOnline = true;
      await user.save().catch(() => {});
      io.emit('presence', { userId: String(user._id), online: true, role: user.role });
    }

    socket.on('location-update', async (data) => {
      const { lat, lng } = data || {};
      if (typeof lat !== 'number' || typeof lng !== 'number') return;
      if (user) {
        user.lastLocation = { type: 'Point', coordinates: [lng, lat] };
        user.lastLocationAt = new Date();
        await user.save().catch(() => {});
      }
      const payload = { userId: String(userId), name: user?.name || 'Tourist', lat, lng, at: new Date().toISOString() };
      broadcastLocation(payload);
    });

    socket.on('geofence-check', async (data) => {
      const { lat, lng } = data || {};
      if (typeof lat !== 'number' || typeof lng !== 'number' || !user) return;
      const zones = await SafetyZone.find({ active: true });
      const myRedZones = autoSosZones.get(userId) || new Set();
      for (const zone of zones) {
        const inside = zoneContainsPoint(zone, lat, lng);
        if (inside && zone.level === 'red') {
          emitZoneAlert(userId, {
            type: 'danger',
            zoneId: String(zone._id),
            zoneName: zone.name,
            level: zone.level,
            message: `You are inside a RED danger zone: ${zone.name}`,
            lat,
            lng,
          });
          await notifyUser({
            userId,
            type: 'geofence',
            title: '⚠️ Danger zone alert',
            body: `You entered ${zone.name} (RED zone). An automatic SOS has been raised to the authorities. Please move to a safe area immediately.`,
            data: { zoneId: String(zone._id), zoneName: zone.name, level: zone.level, lat, lng },
          });
          if (!myRedZones.has(String(zone._id))) {
            myRedZones.add(String(zone._id));
            autoSosZones.set(userId, myRedZones);
            await triggerSos({ io, socket, userId, lat, lng, reason: `Entered RED zone "${zone.name}"` });
          }
        } else if (inside && zone.level === 'yellow' && zone.alertOnEnter) {
          emitZoneAlert(userId, {
            type: 'caution',
            zoneId: String(zone._id),
            zoneName: zone.name,
            level: zone.level,
            message: `Caution: You are near ${zone.name} (YELLOW zone).`,
            lat,
            lng,
          });
          await notifyUser({
            userId,
            type: 'geofence',
            title: '🟡 Caution zone alert',
            body: `You are near ${zone.name} (YELLOW zone). Please be cautious.`,
            data: { zoneId: String(zone._id), zoneName: zone.name, level: zone.level, lat, lng },
          });
        } else if (!inside && myRedZones.has(String(zone._id))) {
          myRedZones.delete(String(zone._id));
          autoSosZones.set(userId, myRedZones);
        }
      }
    });

    socket.on('sos-trigger', async (data) => {
      const { lat, lng } = data || {};
      await triggerSos({ io, socket, userId, lat, lng, reason: null });
    });

    socket.on('sos-cancel', async () => {
      autoSosZones.delete(userId);
      const user = await User.findById(userId);
      if (user) {
        user.sosActive = false;
        await user.save().catch(() => {});
      }
      await SOSLog.findOneAndUpdate(
        { tourist: userId, status: { $in: [SOS_STATUS.ACTIVE, SOS_STATUS.ACKNOWLEDGED] } },
        { status: SOS_STATUS.RESOLVED, resolvedAt: new Date(), resolvedBy: userId, notes: 'Cancelled by tourist' },
        { sort: { createdAt: -1 } }
      ).catch(() => {});
      io.emit('sos-resolved', { userId: String(userId), at: new Date().toISOString() });
    });

    socket.on('disconnect', async () => {
      onlineUsers.delete(userId);
      autoSosZones.delete(userId);
      if (user) {
        user.isOnline = false;
        user.sosActive = false;
        await user.save().catch(() => {});
        await SOSLog.findOneAndUpdate(
          { tourist: userId, status: { $in: [SOS_STATUS.ACTIVE, SOS_STATUS.ACKNOWLEDGED] } },
          { status: SOS_STATUS.RESOLVED, resolvedAt: new Date(), notes: 'Resolved on disconnect' },
          { sort: { createdAt: -1 } }
        ).catch(() => {});
        io.emit('presence', { userId: String(userId), online: false, role: user.role });
      }
    });
  });

  return io;
};

export { onlineUsers };
