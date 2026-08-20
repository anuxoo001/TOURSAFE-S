import QRCode from 'qrcode';
import User from '../models/User.js';

const VERIFICATION_URL = (touristId, token) =>
  `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify/${touristId}?token=${token}`;

export const generateTouristId = () => {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `TS-${ts}-${rand}`;
};

export const createTouristId = async (user) => {
  let touristId = generateTouristId();
  while (await User.findOne({ touristId })) {
    touristId = generateTouristId();
  }
  user.touristId = touristId;
  await user.save();
  return touristId;
};

export const generateQRDataUrl = async (user) => {
  const payload = {
    type: 'TOURSAFE_ID',
    touristId: user.touristId,
    name: user.name,
    country: user.country,
    issuedAt: user.touristIdIssuedAt || new Date().toISOString(),
  };
  try {
    return await QRCode.toDataURL(JSON.stringify(payload));
  } catch (err) {
    return null;
  }
};

export { VERIFICATION_URL };
