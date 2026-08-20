import Notification from '../models/Notification.js';

// Injected io instance set from server.js
let io = null;

export const setSocketIO = (instance) => {
  io = instance;
};

const getUserRoom = (userId) => `user:${String(userId)}`;
const getAuthoritiesRoom = () => 'role:authority';

export const notifyUser = async ({ userId, type = 'info', title, body, data = {} }) => {
  let notification = null;
  try {
    notification = await Notification.create({ user: userId, type, title, body, data });
  } catch (err) {
    console.error('Failed to persist notification:', err.message);
  }
  if (io) {
    io.to(getUserRoom(userId)).emit('notification', {
      _id: notification?._id,
      type,
      title,
      body,
      data,
      read: false,
      createdAt: notification?.createdAt || new Date(),
    });
  }
  return notification;
};

export const notifyAuthorities = async ({ type = 'system', title, body, data = {} }) => {
  if (io) io.to(getAuthoritiesRoom()).emit('authority-alert', { type, title, body, data });
};

export const broadcastSOS = (sosPayload) => {
  if (io) io.emit('sos-alert', sosPayload);
};

export const emitZoneAlert = (userId, alert) => {
  if (io) io.to(getUserRoom(userId)).emit('geofence-alert', alert);
};

export const broadcastLocation = (payload) => {
  if (io) io.emit('location-update', payload);
};

export const emitToUser = (userId, event, payload) => {
  if (io) io.to(getUserRoom(userId)).emit(event, payload);
};

export const broadcastToAll = (payload) => {
  if (io) io.emit('broadcast', payload);
};

export const rooms = { getUserRoom, getAuthoritiesRoom };

export default {
  setSocketIO,
  notifyUser,
  notifyAuthorities,
  broadcastSOS,
  emitZoneAlert,
  broadcastLocation,
  emitToUser,
  broadcastToAll,
};
