import jwt from 'jsonwebtoken';
import config from '../../config/index.js';
import Admin from '../../models/Admin.js';

function normalizePhone(phone) {
  return String(phone).replace(/[\s-]/g, '').trim();
}

function signToken(admin) {
  return jwt.sign(
    { phone: admin.phone },
    config.jwtSecret,
    {
      subject: admin._id.toString(),
      expiresIn: config.jwtExpiresIn,
    }
  );
}

export const authService = {
  async login({ phone, password }) {
    const normalized = normalizePhone(phone);
    const admin = await Admin.findOne({ phone: normalized }).select('+password');

    if (!admin || !admin.isActive) {
      const err = new Error('Invalid phone or password');
      err.statusCode = 401;
      throw err;
    }

    const ok = await admin.comparePassword(password);
    if (!ok) {
      const err = new Error('Invalid phone or password');
      err.statusCode = 401;
      throw err;
    }

    return {
      token: signToken(admin),
      admin: admin.toJSON(),
    };
  },
};
