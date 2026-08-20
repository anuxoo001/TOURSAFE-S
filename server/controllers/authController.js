import jwt from 'jsonwebtoken';
import User, { ROLES } from '../models/User.js';
import { createTouristId } from '../services/qrService.js';
import { notifyAuthorities } from '../services/notifier.js';

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const sendTokenResponse = (res, user, statusCode = 200) => {
  const token = signToken(user._id);
  res.status(statusCode).json({
    success: true,
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      country: user.country,
      passport: user.passport,
      touristId: user.touristId,
      emergencyContact: user.emergencyContact,
      sosActive: user.sosActive,
    },
  });
};

export const register = async (req, res, next) => {
  try {
    const { name, email, password, phone = '', country = '', passport = '', role = ROLES.TOURIST } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    }
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ success: false, message: 'Email already registered' });

    if (role !== ROLES.TOURIST && !req.user) {
      // Public registration can only create tourists; authority/admin must be created by an admin
      if (role !== ROLES.TOURIST) {
        return res.status(403).json({ success: false, message: 'Tourists can only register as tourists' });
      }
    }

    const allowedRole = ROLES.TOURIST;
    const user = await User.create({
      name,
      email,
      password,
      role: allowedRole,
      phone,
      country,
      passport,
    });

    await createTouristId(user);

    notifyAuthorities({
      type: 'system',
      title: 'New tourist registered',
      body: `${user.name} (${user.touristId}) joined TOURSAFE.`,
      data: { userId: String(user._id) },
    });

    sendTokenResponse(res, user, 201);
  } catch (err) {
    next(err);
  }
};

export const registerAuthority = async (req, res, next) => {
  try {
    const { name, email, password, phone = '' } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    }
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ success: false, message: 'Email already registered' });
    const user = await User.create({ name, email, password, role: ROLES.AUTHORITY, phone });
    sendTokenResponse(res, user, 201);
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    sendTokenResponse(res, user);
  } catch (err) {
    next(err);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, country, passport, emergencyContact } = req.body;
    const user = await User.findById(req.user._id);
    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (country !== undefined) user.country = country;
    if (passport !== undefined) user.passport = passport;
    if (emergencyContact !== undefined) user.emergencyContact = emergencyContact;
    await user.save();
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};