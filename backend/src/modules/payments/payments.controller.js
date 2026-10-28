import { paymentsService } from './payments.service.js';
import { actionsService } from '../actions/actions.service.js';

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

  async remove(req, res) {
    const { payment, member } = await paymentsService.remove(req.params.id, req.admin);
    await actionsService.record({
      admin: req.admin,
      type: 'delete_payment',
      summary: `${payment.memberName}-এর পেমেন্ট মুছেছেন (৳${payment.amount})`,
      meta: {
        paymentId: payment.id,
        memberId: member?.id || String(payment.member || ''),
        memberName: payment.memberName,
        amount: payment.amount,
        paidAt: payment.paidAt,
        expiry: member?.expiry,
        paid: member?.paid,
      },
    });
    res.json({ success: true, payment, member });
  },
};
