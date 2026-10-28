import Payment from '../../models/Payment.js';
import Member from '../../models/Member.js';
import { calcExpiry } from '../../utils/plans.js';
import { isIsoDay } from '../../utils/dates.js';

export function activePaymentMatch(extra = {}) {
  return { deletedAt: null, ...extra };
}

function paidAtRange(from, to) {
  const range = {};
  if (isIsoDay(from)) range.$gte = from;
  if (isIsoDay(to)) range.$lte = to;
  if (range.$gte && range.$lte && range.$gte > range.$lte) {
    return { $gte: to, $lte: from };
  }
  return Object.keys(range).length ? range : null;
}

export const paymentsService = {
  async list(options = {}) {
    const filter = activePaymentMatch();
    if (options.memberId) filter.member = options.memberId;
    if (options.method) filter.method = options.method;
    const paidAt = paidAtRange(options.from, options.to);
    if (paidAt) filter.paidAt = paidAt;

    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(options.limit) || 30));
    const skip = (page - 1) * limit;

    const [total, rows, sumAgg] = await Promise.all([
      Payment.countDocuments(filter),
      Payment.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Payment.aggregate([
        { $match: filter },
        { $group: { _id: null, totalAmount: { $sum: '$amount' } } },
      ]),
    ]);

    return {
      payments: rows.map((r) => r.toJSON()),
      totalAmount: sumAgg[0]?.totalAmount || 0,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  },

  /**
   * Soft-delete a payment and roll the member back when this payment was
   * the one currently defining their plan / expiry.
   */
  async remove(id, admin) {
    const payment = await Payment.findOne({ _id: id, deletedAt: null });
    if (!payment) {
      const err = new Error('Payment not found');
      err.statusCode = 404;
      throw err;
    }

    payment.deletedAt = new Date();
    payment.deletedBy = admin?._id || admin?.id || null;
    await payment.save();

    const member = await reconcileMember(payment);
    return { payment: payment.toJSON(), member };
  },
};

async function reconcileMember(deletedPayment) {
  const member = await Member.findById(deletedPayment.member);
  if (!member) return null;

  const remaining = await Payment.find(activePaymentMatch({ member: member._id })).sort({
    paidAt: -1,
    createdAt: -1,
  });

  const newerRemains = remaining.some(
    (row) =>
      row.paidAt > deletedPayment.paidAt ||
      (row.paidAt === deletedPayment.paidAt && row.createdAt > deletedPayment.createdAt)
  );
  if (newerRemains) return member.toJSON();

  const prior = deletedPayment.prior;
  if (prior?.join && prior?.plan && prior?.expiry) {
    member.join = prior.join;
    member.plan = prior.plan;
    member.expiry = prior.expiry;
    member.amount = prior.amount ?? member.amount;
    member.paid = prior.paid !== false;
  } else if (remaining[0]) {
    const latest = remaining[0];
    member.plan = latest.plan;
    member.amount = latest.amount;
    member.paid = true;
    member.join = latest.paidAt;
    member.expiry = calcExpiry(latest.paidAt, latest.plan);
  } else {
    member.paid = false;
  }

  await member.save();
  return member.toJSON();
}
