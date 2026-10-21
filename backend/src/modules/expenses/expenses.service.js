import Expense from '../../models/Expense.js';

export const expensesService = {
  async list(options = {}) {
    const filter = {};
    if (options.category) filter.category = options.category;
    if (options.from || options.to) {
      filter.date = {};
      if (options.from) filter.date.$gte = options.from;
      if (options.to) filter.date.$lte = options.to;
    }

    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(options.limit) || 30));
    const skip = (page - 1) * limit;

    const [total, rows, sumAgg] = await Promise.all([
      Expense.countDocuments(filter),
      Expense.find(filter).sort({ date: -1, createdAt: -1 }).skip(skip).limit(limit),
      Expense.aggregate([
        { $match: filter },
        { $group: { _id: null, totalAmount: { $sum: '$amount' } } },
      ]),
    ]);

    return {
      expenses: rows.map((r) => r.toJSON()),
      totalAmount: sumAgg[0]?.totalAmount || 0,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  },

  async create(data, admin) {
    const adminId = admin._id || admin.id;
    const expense = await Expense.create({
      title: data.title,
      amount: data.amount,
      category: data.category || 'other',
      date: data.date,
      note: data.note || '',
      admin: adminId,
      adminName: admin.name || 'Admin',
    });
    return expense.toJSON();
  },

  async remove(id) {
    const expense = await Expense.findByIdAndDelete(id);
    if (!expense) {
      const err = new Error('Expense not found');
      err.statusCode = 404;
      throw err;
    }
    return expense.toJSON();
  },
};
