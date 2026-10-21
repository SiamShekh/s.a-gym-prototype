import { actionsService } from './actions.service.js';

export const actionsController = {
  async list(req, res) {
    const { page, limit, type } = req.query;
    const result = await actionsService.listForAdmin(req.admin._id, {
      page: page != null ? Number(page) : undefined,
      limit: limit != null ? Number(limit) : undefined,
      type: type || undefined,
    });
    res.json({ success: true, ...result });
  },
};
