import Action from '../../models/Action.js';

export const actionsService = {
  async record({ admin, type, summary, meta = {} }) {
    const adminId = admin?._id || admin?.id;
    // Cron uses a non-ObjectId placeholder — skip Action log if invalid id
    const isObjectId =
      adminId &&
      String(adminId).match(/^[a-f\d]{24}$/i);
    if (!isObjectId) {
      // Still useful in server logs
      if (type === 'send_sms') {
        console.log('[action]', type, summary);
      }
      return null;
    }
    try {
      const row = await Action.create({
        admin: adminId,
        adminName: admin.name || 'Admin',
        type,
        summary,
        meta,
      });
      return row.toJSON();
    } catch (err) {
      // Never block the main request if audit write fails
      console.error('Failed to record action:', err.message);
      return null;
    }
  },

  async listForAdmin(adminId, options = {}) {
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(options.limit) || 30));
    const skip = (page - 1) * limit;
    const filter = { admin: adminId };

    if (options.type) {
      filter.type = options.type;
    }

    const from = parseDayStart(options.from);
    const to = parseDayEnd(options.to);
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = from;
      if (to) filter.createdAt.$lte = to;
    }

    const [total, rows] = await Promise.all([
      Action.countDocuments(filter),
      Action.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    ]);

    return {
      actions: rows.map((r) => r.toJSON()),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  },
};

function isIsoDay(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function parseDayStart(value) {
  if (!isIsoDay(value)) return null;
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function parseDayEnd(value) {
  if (!isIsoDay(value)) return null;
  const d = new Date(`${value}T23:59:59.999`);
  return Number.isNaN(d.getTime()) ? null : d;
}
