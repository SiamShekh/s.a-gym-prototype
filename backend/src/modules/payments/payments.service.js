import Payment from '../../models/Payment.js';

export const paymentsService = {
  async list(options = {}) {
    const filter = {};
    if (options.memberId) filter.member = options.memberId;
    if (options.method) filter.method = options.method;
    if (options.from || options.to) {
      filter.paidAt = {};
      if (options.from) filter.paidAt.$gte = options.from;
      if (options.to) filter.paidAt.$lte = options.to;
    }

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
};
