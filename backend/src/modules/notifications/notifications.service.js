import Member from '../../models/Member.js';
import SmsLog from '../../models/SmsLog.js';
import config from '../../config/index.js';
import { addDaysIso, todayIso } from '../../utils/dates.js';
import {
  BUCKET_META,
  SMS_BUCKETS,
  buildExpirySms,
  getDhakaParts,
  normalizeBdPhone,
  smsBucketForDaysLeft,
} from '../../utils/smsMessage.js';
import { sendViaSmsGateway } from '../sms/sms.gateway.js';

function daysLeft(expiry, today = todayIso()) {
  const [ey, em, ed] = String(expiry || '').split('-').map(Number);
  const [ty, tm, td] = String(today || '').split('-').map(Number);
  if (!ey || !em || !ed || !ty || !tm || !td) return 0;
  const end = Date.UTC(ey, em - 1, ed);
  const start = Date.UTC(ty, tm - 1, td);
  return Math.round((end - start) / 86400000);
}

function emptyGroups() {
  return Object.fromEntries(SMS_BUCKETS.map((k) => [k, []]));
}

async function alreadySentStage(memberId, bucket, memberExpiry) {
  const found = await SmsLog.findOne({
    member: memberId,
    bucket,
    memberExpiry,
    status: { $in: ['sent', 'dry_run'] },
  }).select('_id');
  return Boolean(found);
}

async function cycleSendCount(memberId, memberExpiry) {
  return SmsLog.countDocuments({
    member: memberId,
    memberExpiry,
    status: { $in: ['sent', 'dry_run'] },
  });
}

async function todaySendCount() {
  const { dateKey } = getDhakaParts();
  const start = new Date(`${dateKey}T00:00:00+06:00`);
  return SmsLog.countDocuments({
    status: { $in: ['sent', 'dry_run'] },
    createdAt: { $gte: start },
  });
}

function toTarget(m, d, bucket) {
  const sms = buildExpirySms(d);
  const json = m.toJSON ? m.toJSON() : m;
  const phone = normalizeBdPhone(json.phone);
  return {
    id: json.id,
    code: json.code || '',
    name: json.name,
    phone: json.phone,
    expiry: json.expiry,
    daysLeft: d,
    plan: json.plan,
    smsOptOut: Boolean(json.smsOptOut),
    validPhone: Boolean(phone),
    sampleMessage: sms.message,
    charCount: sms.charCount,
    maxChars: sms.maxChars,
    bucket,
  };
}

export const notificationsService = {
  async queue() {
    // Use Asia/Dhaka calendar day so Railway UTC servers classify correctly
    const today = getDhakaParts().dateKey;
    const from = addDaysIso(today, -7);
    const to = addDaysIso(today, 7);
    const members = await Member.find({
      expiry: { $gte: from, $lte: to },
    }).sort({ expiry: 1 });

    const groups = emptyGroups();
    for (const m of members) {
      const d = daysLeft(m.expiry, today);
      const bucket = smsBucketForDaysLeft(d);
      if (!bucket) continue;
      groups[bucket].push(toTarget(m, d, bucket));
    }

    const sections = SMS_BUCKETS.map((key) => ({
      ...BUCKET_META[key],
      count: groups[key].length,
      members: groups[key],
      sampleMessage:
        groups[key][0]?.sampleMessage ||
        buildExpirySms(key.startsWith('ended') ? -2 : key === 'today' ? 0 : 3).message,
      charCount: groups[key][0]?.charCount || 0,
    }));

    const dhaka = getDhakaParts();
    const skipToday = config.smsSkipWeekdays.includes(dhaka.weekday);

    return {
      total: sections.reduce((s, g) => s + g.count, 0),
      maxChars: config.smsMaxChars,
      maxPerCycle: config.smsMaxPerCycle,
      dailyMax: config.smsDailyMax,
      smsEnabled: config.smsEnabled,
      timezone: config.smsTimezone,
      dhakaDate: dhaka.dateKey,
      skipToday,
      skipReason: skipToday ? 'friday_or_skip_weekday' : null,
      sections,
    };
  },

  async history(options = {}) {
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(options.limit) || 30));
    const skip = (page - 1) * limit;
    const filter = {};
    if (options.status) filter.status = options.status;
    if (options.source) filter.source = options.source;

    const [total, rows] = await Promise.all([
      SmsLog.countDocuments(filter),
      SmsLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    ]);

    return {
      logs: rows.map((r) => {
        const json = r.toJSON();
        return {
          ...json,
          bucketTitle: BUCKET_META[json.bucket]?.title || json.bucket,
        };
      }),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  },

  async send({
    admin = null,
    source = 'manual',
    memberIds = null,
    buckets = null,
  } = {}) {
    const queue = await this.queue();
    const allowedBuckets = new Set(
      Array.isArray(buckets) && buckets.length ? buckets : SMS_BUCKETS
    );
    const idFilter =
      Array.isArray(memberIds) && memberIds.length
        ? new Set(memberIds.map(String))
        : null;

    const targets = [];
    for (const section of queue.sections) {
      if (!allowedBuckets.has(section.key)) continue;
      for (const m of section.members) {
        if (idFilter && !idFilter.has(String(m.id))) continue;
        targets.push(m);
      }
    }

    const summary = {
      requested: targets.length,
      sent: 0,
      dryRun: 0,
      skippedDuplicate: 0,
      skippedCap: 0,
      skippedOptOut: 0,
      skippedInvalidPhone: 0,
      skippedBudget: 0,
      failed: 0,
      results: [],
    };

    let sentToday = await todaySendCount();

    for (const target of targets) {
      if (sentToday >= config.smsDailyMax) {
        summary.skippedBudget += 1;
        summary.results.push({
          memberId: target.id,
          name: target.name,
          status: 'skipped_budget',
        });
        continue;
      }

      if (target.smsOptOut) {
        summary.skippedOptOut += 1;
        summary.results.push({
          memberId: target.id,
          name: target.name,
          status: 'skipped_opt_out',
        });
        continue;
      }

      const phone = normalizeBdPhone(target.phone);
      if (!phone) {
        summary.skippedInvalidPhone += 1;
        summary.results.push({
          memberId: target.id,
          name: target.name,
          status: 'skipped_invalid_phone',
        });
        continue;
      }

      if (await alreadySentStage(target.id, target.bucket, target.expiry)) {
        summary.skippedDuplicate += 1;
        summary.results.push({
          memberId: target.id,
          name: target.name,
          status: 'skipped_duplicate',
          bucket: target.bucket,
        });
        continue;
      }

      const cycleCount = await cycleSendCount(target.id, target.expiry);
      if (cycleCount >= config.smsMaxPerCycle) {
        summary.skippedCap += 1;
        summary.results.push({
          memberId: target.id,
          name: target.name,
          status: 'skipped_cap',
        });
        continue;
      }

      const adminId = admin?._id || admin?.id || null;
      const adminName = admin?.name || (source === 'cron' ? 'System Cron' : 'Admin');

      try {
        const gateway = await sendViaSmsGateway({
          recipient: phone,
          message: target.sampleMessage,
        });
        const status = gateway.dryRun ? 'dry_run' : 'sent';
        await SmsLog.create({
          member: target.id,
          memberName: target.name,
          memberCode: target.code || '',
          phone,
          bucket: target.bucket,
          memberExpiry: target.expiry,
          message: target.sampleMessage,
          charCount: target.charCount,
          status,
          source,
          providerRef: gateway.providerRef || '',
          admin: adminId,
          adminName,
        });
        if (gateway.dryRun) summary.dryRun += 1;
        else summary.sent += 1;
        sentToday += 1;
        summary.results.push({
          memberId: target.id,
          name: target.name,
          status,
          bucket: target.bucket,
          charCount: target.charCount,
        });
      } catch (err) {
        await SmsLog.create({
          member: target.id,
          memberName: target.name,
          memberCode: target.code || '',
          phone,
          bucket: target.bucket,
          memberExpiry: target.expiry,
          message: target.sampleMessage,
          charCount: target.charCount,
          status: 'failed',
          source,
          error: err.message || 'send failed',
          admin: adminId,
          adminName,
        });
        summary.failed += 1;
        summary.results.push({
          memberId: target.id,
          name: target.name,
          status: 'failed',
          error: err.message,
        });
      }
    }

    return summary;
  },

  async runCron() {
    const dhaka = getDhakaParts();
    if (config.smsSkipWeekdays.includes(dhaka.weekday)) {
      return {
        skipped: true,
        reason: 'skip_weekday',
        weekday: dhaka.weekday,
        dhakaDate: dhaka.dateKey,
        message: 'SMS cron skipped (Friday / configured skip day in Asia/Dhaka)',
      };
    }

    const summary = await this.send({
      admin: null,
      source: 'cron',
      buckets: SMS_BUCKETS,
    });

    return {
      skipped: false,
      dhakaDate: dhaka.dateKey,
      timezone: config.smsTimezone,
      summary,
    };
  },
};
