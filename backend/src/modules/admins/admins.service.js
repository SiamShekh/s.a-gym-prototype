import Admin from '../../models/Admin.js';
import {
  ALL_PERMISSION_KEYS,
  DEFAULT_STAFF_PERMISSIONS,
  normalizePermissions,
} from '../../constants/permissions.js';

export const adminsService = {
  async list() {
    const rows = await Admin.find().sort({ createdAt: 1 });
    return rows.map((r) => r.toJSON());
  },

  async create(data) {
    const phone = String(data.phone).replace(/[\s-]/g, '').trim();
    const exists = await Admin.findOne({ phone });
    if (exists) {
      const err = new Error('An admin with this phone already exists');
      err.statusCode = 409;
      throw err;
    }
    const role = data.role === 'owner' ? 'owner' : 'staff';
    const permissions =
      role === 'owner'
        ? [...ALL_PERMISSION_KEYS]
        : normalizePermissions(data.permissions, { fallback: DEFAULT_STAFF_PERMISSIONS });

    const admin = await Admin.create({
      name: data.name,
      phone,
      password: data.password,
      role,
      permissions,
      isActive: true,
    });
    return admin.toJSON();
  },

  async update(id, data, actorId) {
    const admin = await Admin.findById(id);
    if (!admin) {
      const err = new Error('Admin not found');
      err.statusCode = 404;
      throw err;
    }

    const nextRole = data.role === 'owner' ? 'owner' : 'staff';
    if (admin.role === 'owner' && nextRole !== 'owner') {
      const owners = await Admin.countDocuments({ role: 'owner', isActive: true });
      if (owners <= 1 && admin.isActive) {
        const err = new Error('Cannot demote the last owner');
        err.statusCode = 400;
        throw err;
      }
    }

    if (String(id) === String(actorId) && nextRole !== 'owner' && admin.role === 'owner') {
      const err = new Error('You cannot demote your own owner account');
      err.statusCode = 400;
      throw err;
    }

    const phone = String(data.phone).replace(/[\s-]/g, '').trim();
    if (phone !== admin.phone) {
      const exists = await Admin.findOne({ phone, _id: { $ne: admin._id } });
      if (exists) {
        const err = new Error('An admin with this phone already exists');
        err.statusCode = 409;
        throw err;
      }
      admin.phone = phone;
    }

    admin.name = String(data.name).trim();
    admin.role = nextRole;
    admin.permissions =
      nextRole === 'owner'
        ? [...ALL_PERMISSION_KEYS]
        : normalizePermissions(data.permissions, {
            fallback: Array.isArray(admin.permissions) ? admin.permissions : DEFAULT_STAFF_PERMISSIONS,
          });

    if (data.password) {
      admin.password = data.password;
    }

    await admin.save();
    return admin.toJSON();
  },

  async remove(id, actorId) {
    if (String(id) === String(actorId)) {
      const err = new Error('You cannot delete your own account');
      err.statusCode = 400;
      throw err;
    }
    const admin = await Admin.findById(id);
    if (!admin) {
      const err = new Error('Admin not found');
      err.statusCode = 404;
      throw err;
    }
    if (admin.role === 'owner') {
      const owners = await Admin.countDocuments({ role: 'owner', isActive: true });
      if (owners <= 1) {
        const err = new Error('Cannot delete the last owner');
        err.statusCode = 400;
        throw err;
      }
    }
    await admin.deleteOne();
    return admin.toJSON();
  },

  async setActive(id, isActive, actorId) {
    if (String(id) === String(actorId) && !isActive) {
      const err = new Error('You cannot deactivate your own account');
      err.statusCode = 400;
      throw err;
    }
    const admin = await Admin.findById(id);
    if (!admin) {
      const err = new Error('Admin not found');
      err.statusCode = 404;
      throw err;
    }
    if (admin.role === 'owner' && !isActive) {
      const owners = await Admin.countDocuments({ role: 'owner', isActive: true });
      if (owners <= 1) {
        const err = new Error('Cannot deactivate the last owner');
        err.statusCode = 400;
        throw err;
      }
    }
    admin.isActive = Boolean(isActive);
    await admin.save();
    return admin.toJSON();
  },

  async updatePermissions(id, permissions) {
    const admin = await Admin.findById(id);
    if (!admin) {
      const err = new Error('Admin not found');
      err.statusCode = 404;
      throw err;
    }
    if (admin.role === 'owner') {
      const err = new Error('Owner permissions cannot be changed');
      err.statusCode = 400;
      throw err;
    }
    admin.permissions = normalizePermissions(permissions, { fallback: [] });
    await admin.save();
    return admin.toJSON();
  },
};
