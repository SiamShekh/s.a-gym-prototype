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
      meta: { adminId: admin.id, name: admin.name, phone: admin.phone, role: admin.role },
    });
    res.status(201).json({ success: true, admin });
  },

  async setActive(req, res) {
    const admin = await adminsService.setActive(
      req.params.id,
      req.body.isActive,
      req.admin._id
    );
    res.json({ success: true, admin });
  },
};
