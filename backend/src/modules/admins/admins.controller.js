import { adminsService } from './admins.service.js';
import { actionsService } from '../actions/actions.service.js';

export const adminsController = {
  async list(req, res) {
    const admins = await adminsService.list();
    res.json({ success: true, admins });
  },

  async create(req, res) {
    const admin = await adminsService.create(req.body);
    await actionsService.record({
      admin: req.admin,
      type: 'create_admin',
      summary: `নতুন অ্যাডমিন তৈরি করেছেন: ${admin.name}`,
      meta: {
        adminId: admin.id,
        name: admin.name,
        phone: admin.phone,
        role: admin.role,
        permissions: admin.permissions,
      },
    });
    res.status(201).json({ success: true, admin });
  },

  async update(req, res) {
    const admin = await adminsService.update(req.params.id, req.body, req.admin._id);
    await actionsService.record({
      admin: req.admin,
      type: 'update_admin',
      summary: `অ্যাডমিন আপডেট করেছেন: ${admin.name}`,
      meta: {
        adminId: admin.id,
        name: admin.name,
        phone: admin.phone,
        role: admin.role,
        permissions: admin.permissions,
      },
    });
    res.json({ success: true, admin });
  },

  async remove(req, res) {
    const admin = await adminsService.remove(req.params.id, req.admin._id);
    await actionsService.record({
      admin: req.admin,
      type: 'delete_admin',
      summary: `অ্যাডমিন মুছেছেন: ${admin.name}`,
      meta: { adminId: admin.id, name: admin.name, phone: admin.phone },
    });
    res.json({ success: true, admin });
  },

  async setActive(req, res) {
    const admin = await adminsService.setActive(
      req.params.id,
      req.body.isActive,
      req.admin._id
    );
    res.json({ success: true, admin });
  },

  async updatePermissions(req, res) {
    const admin = await adminsService.updatePermissions(req.params.id, req.body.permissions);
    await actionsService.record({
      admin: req.admin,
      type: 'update_admin_permissions',
      summary: `অনুমতি আপডেট করেছেন: ${admin.name}`,
      meta: { adminId: admin.id, permissions: admin.permissions },
    });
    res.json({ success: true, admin });
  },
};
