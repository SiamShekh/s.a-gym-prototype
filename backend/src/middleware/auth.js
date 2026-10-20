import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import Admin from '../models/Admin.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const requireAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    const err = new Error('Authentication required');
    err.statusCode = 401;
    throw err;
  }

  let payload;
  try {
    payload = jwt.verify(token, config.jwtSecret);
  } catch {
    const err = new Error('Invalid or expired token');
    err.statusCode = 401;
    throw err;
  }

  const admin = await Admin.findById(payload.sub);
  if (!admin || !admin.isActive) {
    const err = new Error('Admin account not found or inactive');
    err.statusCode = 401;
    throw err;
  }

  req.admin = admin;
  next();
});
