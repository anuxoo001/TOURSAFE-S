import Broadcast from '../models/Broadcast.js';
import User from '../models/User.js';
import { notifyUser, notifyAuthorities, broadcastToAll } from '../services/notifier.js';

export const createBroadcast = async (req, res, next) => {
  try {
    const { title, body, level = 'info', audience = 'all' } = req.body;
    if (!title || !body) {
      return res.status(400).json({ success: false, message: 'Title and body are required' });
    }

    const broadcast = await Broadcast.create({
      title,
      body,
      level,
      audience,
      createdBy: req.user._id,
    });

    // Persist a notification for every active tourist
    const filter = audience === 'tourists' ? { role: 'tourist' } : {};
    const tourists = await User.find(filter);
    for (const t of tourists) {
      await notifyUser({
        userId: t._id,
        type: 'zone_update',
        title: broadcast.title,
        body: broadcast.body,
        data: { broadcastId: String(broadcast._id), level },
      });
    }
    broadcastToAll({ type: 'broadcast', level, title, body, broadcastId: String(broadcast._id) });

    res.status(201).json({ success: true, broadcast, deliveredTo: tourists.length });
  } catch (err) {
    next(err);
  }
};

export const getBroadcasts = async (req, res, next) => {
  try {
    const broadcasts = await Broadcast.find({ active: true })
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ success: true, count: broadcasts.length, broadcasts });
  } catch (err) {
    next(err);
  }
};

export const getAllBroadcastsAdmin = async (req, res, next) => {
  try {
    const broadcasts = await Broadcast.find({})
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: broadcasts.length, broadcasts });
  } catch (err) {
    next(err);
  }
};

export const toggleBroadcast = async (req, res, next) => {
  try {
    const broadcast = await Broadcast.findById(req.params.id);
    if (!broadcast) return res.status(404).json({ success: false, message: 'Broadcast not found' });
    broadcast.active = !broadcast.active;
    await broadcast.save();
    res.json({ success: true, broadcast });
  } catch (err) {
    next(err);
  }
};

export const deleteBroadcast = async (req, res, next) => {
  try {
    const broadcast = await Broadcast.findByIdAndDelete(req.params.id);
    if (!broadcast) return res.status(404).json({ success: false, message: 'Broadcast not found' });
    res.json({ success: true, message: 'Broadcast deleted' });
  } catch (err) {
    next(err);
  }
};

export { notifyAuthorities };