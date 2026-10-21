import { authService } from './auth.service.js';
import { actionsService } from '../actions/actions.service.js';

export const authController = {
  async login(req, res) {
    const result = await authService.login(req.body);
    await actionsService.record({
      admin: result.admin,
      type: 'login',
      summary: 'অ্যাকাউন্টে লগইন করেছেন',
      meta: { phone: result.admin.phone },
    });
    res.json({
      success: true,
      ...result,
    });
  },

  async updateProfile(req, res) {
    const admin = await authService.updateProfile(req.admin._id, req.body);
    await actionsService.record({
      admin: req.admin,
      type: 'update_profile',
      summary: req.body.newPassword
        ? 'প্রোফাইল/পাসওয়ার্ড আপডেট করেছেন'
        : 'প্রোফাইল নাম আপডেট করেছেন',
      meta: { name: admin.name },
    });
    res.json({ success: true, admin });
  },

  async me(req, res) {
    res.json({ success: true, admin: req.admin.toJSON() });
  },
};
