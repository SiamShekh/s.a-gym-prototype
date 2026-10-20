import Member from '../../models/Member.js';
import { calcExpiry, planAmount } from '../../utils/plans.js';

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

export const membersService = {
  async list() {
    const members = await Member.find().sort({ createdAt: -1 });
    return members.map((m) => m.toJSON());
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

  async create(data) {
    const member = await Member.create(withDerivedFields(data));
    return member.toJSON();
  },

  async update(id, data) {
    const existing = await Member.findById(id);
    if (!existing) {
      const err = new Error('Member not found');
      err.statusCode = 404;
      throw err;
    }

    const patch = withDerivedFields(data, existing.toObject());
    // Recalculate expiry/amount when plan or join changes and client did not send them
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
  },
};
