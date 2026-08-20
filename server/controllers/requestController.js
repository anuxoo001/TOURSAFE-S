import HelpRequest, { REQUEST_STATUS, REQUEST_PRIORITY } from '../models/HelpRequest.js';
import { notifyUser, notifyAuthorities } from '../services/notifier.js';

const REQUEST_TYPE_LABELS = {
  emergency: 'Emergency',
  medical: 'Medical',
  police: 'Police',
  fire: 'Fire',
  lost: 'Lost Item/Person',
  theft: 'Theft',
  assistance: 'Assistance',
  contact_admin: 'Contact Admin',
  feedback: 'Feedback',
  other: 'Other',
};

// User submits a help/assistance request -> instantly received by admins
export const createRequest = async (req, res, next) => {
  try {
    const { type = 'other', subject, description, lat, lng, priority } = req.body;
    if (!subject || !description) {
      return res.status(400).json({ success: false, message: 'Subject and description are required' });
    }
    const coordinates =
      typeof lat === 'number' && typeof lng === 'number' ? [lng, lat] : [0, 0];

    const request = await HelpRequest.create({
      user: req.user._id,
      type,
      subject,
      description,
      location: { type: 'Point', coordinates },
      priority: priority || REQUEST_PRIORITY.MEDIUM,
    });

    notifyAuthorities({
      type: 'request',
      title: `📨 New request: ${REQUEST_TYPE_LABELS[type] || type}`,
      body: `${req.user.name} submitted "${subject}".`,
      data: { requestId: String(request._id), type, priority: request.priority, lat, lng },
    });

    await notifyUser({
      userId: req.user._id,
      type: 'system',
      title: 'Request received',
      body: `Your request "${subject}" has been submitted. An administrator will respond shortly.`,
      data: { requestId: String(request._id) },
    });

    res.status(201).json({ success: true, request });
  } catch (err) {
    next(err);
  }
};

export const getMyRequests = async (req, res, next) => {
  try {
    const requests = await HelpRequest.find({ user: req.user._id })
      .populate('assignedTo', 'name')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: requests.length, requests });
  } catch (err) {
    next(err);
  }
};

export const getAllRequests = async (req, res, next) => {
  try {
    const { status, type, priority, limit = 100, page = 1 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (priority) filter.priority = priority;

    const total = await HelpRequest.countDocuments(filter);
    const requests = await HelpRequest.find(filter)
      .populate('user', 'name email touristId phone country')
      .populate('assignedTo', 'name')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.json({ success: true, total, page: Number(page), limit: Number(limit), requests });
  } catch (err) {
    next(err);
  }
};

export const getRequest = async (req, res, next) => {
  try {
    const request = await HelpRequest.findById(req.params.id)
      .populate('user', 'name email touristId phone country')
      .populate('assignedTo', 'name');
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
    res.json({ success: true, request });
  } catch (err) {
    next(err);
  }
};

export const updateRequestStatus = async (req, res, next) => {
  try {
    const { status, priority, assignedTo, adminNote } = req.body;
    const request = await HelpRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    if (status !== undefined) {
      request.status = status;
      if (status === REQUEST_STATUS.RESOLVED) request.resolvedAt = new Date();
    }
    if (priority !== undefined) request.priority = priority;
    if (assignedTo !== undefined) request.assignedTo = assignedTo;
    if (adminNote !== undefined) request.adminNote = adminNote;

    await request.save();

    await notifyUser({
      userId: request.user,
      type: 'incident',
      title: `Request ${status || 'updated'}`,
      body: `Your request "${request.subject}" is now ${status || 'updated'}.${adminNote ? ` Admin note: ${adminNote}` : ''}`,
      data: { requestId: String(request._id), status: request.status },
    });

    res.json({ success: true, request });
  } catch (err) {
    next(err);
  }
};

export const deleteRequest = async (req, res, next) => {
  try {
    const request = await HelpRequest.findByIdAndDelete(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
    res.json({ success: true, message: 'Request deleted' });
  } catch (err) {
    next(err);
  }
};