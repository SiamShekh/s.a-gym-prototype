import { notificationsService } from './notifications.service.js';
import { actionsService } from '../actions/actions.service.js';
import config from '../../config/index.js';

export const notificationsController = {
  async queue(req, res) {
    const queue = await notificationsService.queue();
    res.json({ success: true, queue });
  },

  async history(req, res) {
    const { page, limit, status, source } = req.query;
    const result = await notificationsService.history({
      page: page != null ? Number(page) : undefined,
      limit: limit != null ? Number(limit) : undefined,
      status,
      source,
    });
    res.json({ success: true, ...result });
  },

  async cron(req, res) {
    const secret = req.get('x-cron-secret') || req.query.secret;
    if (!config.cronSecret || secret !== config.cronSecret) {
      return res.status(401).json({ success: false, message: 'Invalid cron secret' });
    }

    const result = await notificationsService.runCron();

    if (!result.skipped) {
      const s = result.summary;
      await actionsService.record({
        admin: { id: 'cron', name: 'System Cron' },
        type: 'send_sms',
        summary: `Cron SMS: পাঠানো ${s.sent + s.dryRun}, ডুপ্লিকেট ${s.skippedDuplicate}, ক্যাপ ${s.skippedCap}`,
        meta: { ...s, source: 'cron', dhakaDate: result.dhakaDate },
      });
    }

    res.json({ success: true, ...result });
  },
};
