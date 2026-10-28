import Member from '../../models/Member.js';
import Payment from '../../models/Payment.js';
import Expense from '../../models/Expense.js';
import { activePaymentMatch } from '../payments/payments.service.js';
import {
  addDaysIso,
  daysBetweenIso,
  eachIsoDay,
  isIsoDay,
  lastNMonthKeys,
  monthKeysBetween,
  monthLabelBn,
  monthRange,
  todayIso,
} from '../../utils/dates.js';

async function sumBetween(Model, dateField, start, end, extra = {}) {
  const rows = await Model.aggregate([
    { $match: { ...extra, [dateField]: { $gte: start, $lte: end } } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  return rows[0]?.total || 0;
}

async function sumMatch(Model, match) {
  const rows = await Model.aggregate([
    { $match: match },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  return rows[0]?.total || 0;
}

function clipRange(start, end, from, to) {
  const s = from && start < from ? from : start;
  const e = to && end > to ? to : end;
  if (s > e) return null;
  return { start: s, end: e };
}

function withCohort(statusFilter, cohort) {
  if (!cohort) return statusFilter;
  return { $and: [cohort, statusFilter] };
}

function planDistributionFrom(planRows) {
  const planMap = Object.fromEntries(planRows.map((r) => [r._id, r.count]));
  return [
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
}

async function seriesForRange(from, to) {
  const span = daysBetweenIso(from, to);
  if (span <= 62) {
    const days = eachIsoDay(from, to);
    const [payRows, expRows] = await Promise.all([
      Payment.aggregate([
        { $match: activePaymentMatch({ paidAt: { $gte: from, $lte: to } }) },
        { $group: { _id: '$paidAt', total: { $sum: '$amount' } } },
      ]),
      Expense.aggregate([
        { $match: { date: { $gte: from, $lte: to } } },
        { $group: { _id: '$date', total: { $sum: '$amount' } } },
      ]),
    ]);
    const pay = Object.fromEntries(payRows.map((r) => [r._id, r.total]));
    const exp = Object.fromEntries(expRows.map((r) => [r._id, r.total]));
    return {
      bucket: 'day',
      monthly: days.map((day) => {
        const revenue = pay[day] || 0;
        const expenses = exp[day] || 0;
        const [, m, d] = day.split('-');
        return {
          key: day,
          label: `${Number(d)}/${Number(m)}`,
          revenue,
          expenses,
          profit: revenue - expenses,
        };
      }),
    };
  }

  const keys = monthKeysBetween(from, to);
  const monthly = await Promise.all(
    keys.map(async (key) => {
      const bounds = monthRange(key);
      const clipped = clipRange(bounds.start, bounds.end, from, to);
      const [revenue, expenses] = clipped
        ? await Promise.all([
            sumBetween(Payment, 'paidAt', clipped.start, clipped.end, { deletedAt: null }),
            sumBetween(Expense, 'date', clipped.start, clipped.end),
          ])
        : [0, 0];
      return {
        key,
        label: monthLabelBn(key),
        revenue,
        expenses,
        profit: revenue - expenses,
      };
    })
  );
  return { bucket: 'month', monthly };
}

export const reportsService = {
  /**
   * scope:
   *  - omitted: legacy dashboard (this calendar month for money, all members)
   *  - everything: all-time money and all members
   *  - range: inclusive from/to (Asia/Dhaka calendar dates) for money,
   *    and members whose join date falls in that range
   */
  async overview({ from, to, scope } = {}) {
    const today = todayIso();
    const in7 = addDaysIso(today, 7);
    const ranged = isIsoDay(from) && isIsoDay(to);
    const start = ranged && from > to ? to : from;
    const end = ranged && from > to ? from : to;
    const everything = scope === 'everything';
    const cohort = ranged && !everything ? { join: { $gte: start, $lte: end } } : null;

    const monthKeys = lastNMonthKeys(6);
    const thisMonth = monthKeys[monthKeys.length - 1];
    const { start: monthStart, end: monthEnd } = monthRange(thisMonth);

    const moneyPromise = everything
      ? Promise.all([
          sumMatch(Payment, activePaymentMatch()),
          sumMatch(Expense, {}),
        ])
      : ranged
        ? Promise.all([
            sumBetween(Payment, 'paidAt', start, end, { deletedAt: null }),
            sumBetween(Expense, 'date', start, end),
          ])
        : Promise.all([
            sumBetween(Payment, 'paidAt', monthStart, monthEnd, { deletedAt: null }),
            sumBetween(Expense, 'date', monthStart, monthEnd),
          ]);

    const planPipeline = cohort
      ? [{ $match: cohort }, { $group: { _id: '$plan', count: { $sum: 1 } } }]
      : [{ $group: { _id: '$plan', count: { $sum: 1 } } }];

    const [
      totalMembers,
      active,
      expiring,
      expired,
      unpaid,
      [monthRevenue, monthExpenses],
      planRows,
    ] = await Promise.all([
      Member.countDocuments(cohort || {}),
      Member.countDocuments(withCohort({ expiry: { $gt: in7 } }, cohort)),
      Member.countDocuments(withCohort({ expiry: { $gte: today, $lte: in7 } }, cohort)),
      Member.countDocuments(withCohort({ expiry: { $lt: today } }, cohort)),
      Member.countDocuments(
        withCohort({ $or: [{ paid: false }, { expiry: { $lt: today } }] }, cohort)
      ),
      moneyPromise,
      Member.aggregate(planPipeline),
    ]);

    let monthly;
    let bucket = 'month';
    if (ranged && !everything) {
      const series = await seriesForRange(start, end);
      monthly = series.monthly;
      bucket = series.bucket;
    } else if (everything) {
      const bounds = await Promise.all([
        Payment.findOne(activePaymentMatch()).sort({ paidAt: 1 }).select('paidAt'),
        Expense.findOne().sort({ date: 1 }).select('date'),
      ]);
      const first = [bounds[0]?.paidAt, bounds[1]?.date].filter(Boolean).sort()[0];
      const fromKey = first && first < addDaysIso(today, -365) ? first : addDaysIso(today, -365);
      const series = await seriesForRange(fromKey, today);
      monthly = series.monthly;
      bucket = series.bucket;
    } else {
      monthly = await Promise.all(
        monthKeys.map(async (key) => {
          const { start: mStart, end: mEnd } = monthRange(key);
          const [revenue, expenses] = await Promise.all([
            sumBetween(Payment, 'paidAt', mStart, mEnd, { deletedAt: null }),
            sumBetween(Expense, 'date', mStart, mEnd),
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
    }

    const resolvedScope = everything ? 'everything' : ranged ? 'range' : 'month';

    return {
      scope: resolvedScope,
      from: resolvedScope === 'range' ? start : null,
      to: resolvedScope === 'range' ? end : null,
      bucket,
      totalMembers,
      newMembers: resolvedScope === 'range' ? totalMembers : 0,
      active,
      expiring,
      expired,
      unpaid,
      monthRevenue,
      monthExpenses,
      monthProfit: monthRevenue - monthExpenses,
      monthly,
      planDistribution: planDistributionFrom(planRows),
    };
  },
};
