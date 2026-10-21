import Admin from '../../models/Admin.js';

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
    const admin = await Admin.create({
      name: data.name,
      phone,
      password: data.password,
      role: data.role === 'owner' ? 'owner' : 'staff',
      isActive: true,
    });
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
};
