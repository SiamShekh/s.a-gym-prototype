import { paymentsService } from './payments.service.js';

export const paymentsController = {
  async list(req, res) {
    const { page, limit, memberId, method, from, to } = req.query;
    const result = await paymentsService.list({
      page: page != null ? Number(page) : undefined,
      limit: limit != null ? Number(limit) : undefined,
      memberId,
      method,
      from,
      to,
    });
    res.json({ success: true, ...result });
  },
};
