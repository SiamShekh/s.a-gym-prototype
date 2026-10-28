import Member from '../../models/Member.js';
import Payment from '../../models/Payment.js';
import { activePaymentMatch } from '../payments/payments.service.js';
import { calcExpiry, planAmount } from '../../utils/plans.js';
import { addDaysIso, isIsoDay, todayIso } from '../../utils/dates.js';

function withDerivedFields(data, existing = {}) {
  const join = data.join ?? existing.join;
  const plan = data.plan ?? existing.plan;
  const next = { ...data };

  if (plan != null && next.amount === undefined) {
    next.amount = planAmount(plan);
  }
  if (join != null && plan != null && next.expiry === undefined) {
    next.expiry = calcExpiry(join, plan);
  }

  return next;
}

async function nextMemberCode() {
  const rows = await Member.aggregate([
    { $match: { code: { $regex: /^SA-\d+$/ } } },
    {
      $project: {
        n: { $convert: { input: { $substrCP: ['$code', 3, 12] }, to: 'int', onError: 0, onNull: 0 } },
      },
    },
    { $group: { _id: null, max: { $max: '$n' } } },
  ]);
  const n = (rows[0]?.max || 0) + 1;
  return `SA-${String(n).padStart(4, '0')}`;
}

async function buildListFilter({ q, status, from, to, dateBy }) {
  const and = [];
  const query = String(q || '').trim();
  if (query) {
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    and.push({
      $or: [
        { name: { $regex: escaped, $options: 'i' } },
        { phone: { $regex: escaped, $options: 'i' } },
        { code: { $regex: escaped, $options: 'i' } },
      ],
    });
  }

  const today = todayIso();
  const in7 = addDaysIso(today, 7);
  if (status === 'expired') {
    and.push({ expiry: { $lt: today } });
  } else if (status === 'expiring') {
    and.push({ expiry: { $gte: today, $lte: in7 } });
  } else if (status === 'active') {
    and.push({ expiry: { $gt: in7 }, paid: { $ne: false } });
  } else if (status === 'unpaid') {
    and.push({ paid: false });
  } else if (status === 'due') {
    // Same set the dashboard counts as বকেয়া
    and.push({ $or: [{ paid: false }, { expiry: { $lt: today } }] });
  }

  const start = isIsoDay(from) ? from : '';
  const end = isIsoDay(to) ? to : '';
  if (start || end) {
    const bounds = {};
    if (start) bounds.$gte = start;
    if (end) bounds.$lte = end;
    if (bounds.$gte && bounds.$lte && bounds.$gte > bounds.$lte) {
      const swap = bounds.$gte;
      bounds.$gte = bounds.$lte;
      bounds.$lte = swap;
    }
    if (dateBy === 'payment') {
      const ids = await Payment.distinct('member', activePaymentMatch({ paidAt: bounds }));
      and.push({ _id: { $in: ids } });
    } else {
      and.push({ join: bounds });
    }
  }

  if (!and.length) return {};
  if (and.length === 1) return and[0];
  return { $and: and };
}

async function recordPayment({ member, amount, method, plan, admin, note = '', prior = null }) {
  const adminId = admin?._id || admin?.id;
  if (!adminId) return null;
  return Payment.create({
    member: member.id || member._id,
    memberName: member.name,
    memberCode: member.code || '',
    phone: member.phone || '',
    plan: plan || member.plan,
    amount,
    method: method || 'cash',
    admin: adminId,
    adminName: admin.name || 'Admin',
    paidAt: todayIso(),
    note,
    prior: prior
      ? {
          join: prior.join || '',
          plan: prior.plan || '',
          expiry: prior.expiry || '',
          amount: prior.amount ?? 0,
          paid: prior.paid !== false,
        }
      : undefined,
  });
}

export const membersService = {
  async list(options = {}) {
    const filter = await buildListFilter(options);
    const sort = { createdAt: -1 };
    const paginate = options.page != null || options.limit != null;

    if (!paginate) {
      const members = await Member.find(filter).sort(sort);
      return { members: members.map((m) => m.toJSON()) };
    }

    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(options.limit) || 20));
    const skip = (page - 1) * limit;
    const [total, rows] = await Promise.all([
      Member.countDocuments(filter),
      Member.find(filter).sort(sort).skip(skip).limit(limit),
    ]);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      members: rows.map((m) => m.toJSON()),
      pagination: { page, limit, total, totalPages },
    };
  },

  async getById(id) {
    const member = await Member.findById(id);
    if (!member) {
      const err = new Error('Member not found');
      err.statusCode = 404;
      throw err;
    }
    return member.toJSON();
  },

  async create(data, admin = null) {
    const payload = withDerivedFields(data);
    if (!payload.code) {
      payload.code = await nextMemberCode();
    }
    const member = await Member.create(payload);
    const json = member.toJSON();
    if (json.paid !== false && admin) {
      await recordPayment({
        member: json,
        amount: json.amount,
        method: 'cash',
        plan: json.plan,
        admin,
        note: 'নতুন সদস্য নিবন্ধন',
      });
    }
    return json;
  },

  async update(id, data) {
    const existing = await Member.findById(id);
    if (!existing) {
      const err = new Error('Member not found');
      err.statusCode = 404;
      throw err;
    }

    const patch = withDerivedFields(data, existing.toObject());
    if (
      (data.plan !== undefined || data.join !== undefined) &&
      data.expiry === undefined
    ) {
      patch.expiry = calcExpiry(
        data.join ?? existing.join,
        data.plan ?? existing.plan
      );
    }
    if (data.plan !== undefined && data.amount === undefined) {
      patch.amount = planAmount(data.plan);
    }
    // Never overwrite code from client empty string
    if (data.code !== undefined && !String(data.code).trim()) {
      delete patch.code;
    }

    Object.assign(existing, patch);
    await existing.save();
    return existing.toJSON();
  },

  async remove(id) {
    const member = await Member.findByIdAndDelete(id);
    if (!member) {
      const err = new Error('Member not found');
      err.statusCode = 404;
      throw err;
    }
    return member.toJSON();
  },

  async acceptPayment(id, { plan, amount, method }, admin = null) {
    const existing = await Member.findById(id);
    if (!existing) {
      const err = new Error('Member not found');
      err.statusCode = 404;
      throw err;
    }

    const prior = {
      join: existing.join,
      plan: existing.plan,
      expiry: existing.expiry,
      amount: existing.amount,
      paid: existing.paid !== false,
    };
    const join = todayIso();
    const paidAmount = Number(amount);
    if (!Number.isFinite(paidAmount) || paidAmount <= 0) {
      const err = new Error('amount must be a positive number');
      err.statusCode = 400;
      throw err;
    }

    existing.plan = plan;
    existing.join = join;
    existing.expiry = calcExpiry(join, plan);
    existing.amount = paidAmount;
    existing.paid = true;
    if (!existing.code) {
      existing.code = await nextMemberCode();
    }
    await existing.save();

    const member = existing.toJSON();
    if (admin) {
      await recordPayment({
        member,
        amount: paidAmount,
        method: method || 'cash',
        plan,
        admin,
        prior,
      });
    }

    return {
      member,
      method: method || 'cash',
      amount: paidAmount,
    };
  },
};
