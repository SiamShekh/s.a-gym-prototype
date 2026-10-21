import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import Admin from '../models/Admin.js';
import { adminHasPermission } from '../constants/permissions.js';
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

  // Older admins may lack role — treat as owner so the app keeps working
  if (!admin.role) {
    admin.role = 'owner';
    await admin.save();
  }

  req.admin = admin;
  next();
});

export const requireOwner = asyncHandler(async (req, res, next) => {
  if (!req.admin) {
    const err = new Error('Authentication required');
    err.statusCode = 401;
    throw err;
  }
  const role = req.admin.role || 'owner';
  if (role !== 'owner') {
    const err = new Error('Owner access required');
    err.statusCode = 403;
    throw err;
  }
  next();
});

/** Owners pass. Staff must have at least one of the listed permission keys. */
export function requirePermission(...keys) {
  return asyncHandler(async (req, res, next) => {
    if (!req.admin) {
      const err = new Error('Authentication required');
      err.statusCode = 401;
      throw err;
    }
    const allowed = keys.some((key) => adminHasPermission(req.admin, key));
    if (!allowed) {
      const err = new Error('Permission denied');
      err.statusCode = 403;
      throw err;
    }
    next();
  });
}
