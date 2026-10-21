import { actionsService } from './actions.service.js';

export const actionsController = {
  async list(req, res) {
    const { page, limit, type, from, to } = req.query;
    const result = await actionsService.listForAdmin(req.admin._id, {
      page: page != null ? Number(page) : undefined,
      limit: limit != null ? Number(limit) : undefined,
      type: type || undefined,
      from: from || undefined,
      to: to || undefined,
    });
    res.json({ success: true, ...result });
  },
};
