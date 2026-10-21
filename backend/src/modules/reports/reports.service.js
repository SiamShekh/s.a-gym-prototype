import Member from '../../models/Member.js';
import Payment from '../../models/Payment.js';
import Expense from '../../models/Expense.js';
import {
  addDaysIso,
  lastNMonthKeys,
  monthLabelBn,
  monthRange,
  todayIso,
} from '../../utils/dates.js';

async function sumBetween(Model, dateField, start, end) {
  const rows = await Model.aggregate([
    { $match: { [dateField]: { $gte: start, $lte: end } } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  return rows[0]?.total || 0;
}

export const reportsService = {
  async overview() {
    const today = todayIso();
    const in7 = addDaysIso(today, 7);
    const monthKeys = lastNMonthKeys(6);
    const thisMonth = monthKeys[monthKeys.length - 1];
    const { start: monthStart, end: monthEnd } = monthRange(thisMonth);

    const [
      totalMembers,
      active,
      expiring,
      expired,
      unpaid,
      monthRevenue,
      monthExpenses,
      planRows,
    ] = await Promise.all([
      Member.countDocuments(),
      Member.countDocuments({ expiry: { $gt: in7 } }),
      Member.countDocuments({ expiry: { $gte: today, $lte: in7 } }),
      Member.countDocuments({ expiry: { $lt: today } }),
      Member.countDocuments({
        $or: [{ paid: false }, { expiry: { $lt: today } }],
      }),
      sumBetween(Payment, 'paidAt', monthStart, monthEnd),
      sumBetween(Expense, 'date', monthStart, monthEnd),
      Member.aggregate([{ $group: { _id: '$plan', count: { $sum: 1 } } }]),
    ]);

    const monthly = await Promise.all(
      monthKeys.map(async (key) => {
        const { start, end } = monthRange(key);
        const [revenue, expenses] = await Promise.all([
          sumBetween(Payment, 'paidAt', start, end),
          sumBetween(Expense, 'date', start, end),
        ]);
        return {
          key,
          label: monthLabelBn(key),
          revenue,
          expenses,
          profit: revenue - expenses,
        };
      })
    );

    const planMap = Object.fromEntries(planRows.map((r) => [r._id, r.count]));
    const planDistribution = [
      {
        label: '১ মাস প্যাকেজ',
        count: (planMap['30:1000'] || 0) + (planMap['30:500'] || 0),
      },
      {
        label: '৩ মাস প্যাকেজ',
        count: (planMap['90:2500'] || 0) + (planMap['90:1200'] || 0),
      },
      {
        label: '১২ মাস প্যাকেজ',
        count: (planMap['365:10000'] || 0) + (planMap['365:4000'] || 0),
      },
    ];

    return {
      totalMembers,
      active,
      expiring,
      expired,
      unpaid,
      monthRevenue,
      monthExpenses,
      monthProfit: monthRevenue - monthExpenses,
      monthly,
      planDistribution,
    };
  },
};
