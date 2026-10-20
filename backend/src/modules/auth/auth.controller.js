import { authService } from './auth.service.js';

export const authController = {
  async login(req, res) {
    const result = await authService.login(req.body);
    res.json({
      success: true,
      ...result,
    });
  },
};
