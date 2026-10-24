import { describe, it, expect, beforeEach } from 'vitest';
import { app, request, createAdmin, loginAs } from './helpers.js';
import Member from '../src/models/Member.js';
import {
  buildExpirySms,
  clampSms,
  smsBucketForDaysLeft,
  isFridayInDhaka,
} from '../src/utils/smsMessage.js';
import { addDaysIso, todayIso } from '../src/utils/dates.js';
import config from '../src/config/index.js';

describe('SMS message limits & buckets', () => {
  it('keeps Bangla expiry SMS within default 70 chars', () => {
    for (const d of [-7, -3, -1, 0, 1, 3, 7]) {
      const sms = buildExpirySms(d);
      expect(sms.charCount).toBeLessThanOrEqual(70);
    }
  });

  it('maps daysLeft into anti-spam windows only', () => {
    expect(smsBucketForDaysLeft(0)).toBe('today');
    expect(smsBucketForDaysLeft(1)).toBe('tomorrow');
    expect(smsBucketForDaysLeft(2)).toBe('d2_3');
    expect(smsBucketForDaysLeft(5)).toBe('d4_7');
    expect(smsBucketForDaysLeft(-2)).toBe('ended_3d');
    expect(smsBucketForDaysLeft(-6)).toBe('ended_7d');
    expect(smsBucketForDaysLeft(-8)).toBeNull();
    expect(smsBucketForDaysLeft(8)).toBeNull();
  });

  it('truncates overlong messages', () => {
    const sms = clampSms('অ'.repeat(100), 70);
    expect(sms.truncated).toBe(true);
    expect(sms.charCount).toBeLessThanOrEqual(70);
  });
});

describe('Profile + notifications cron/history', () => {
  let headers;

  beforeEach(async () => {
    await createAdmin({ phone: '01730000001', name: 'Owner', role: 'owner' });
    const login = await loginAs('01730000001', 'secret123');
    headers = { Authorization: `Bearer ${login.body.token}` };
  });

  it('updates profile name and password', async () => {
    const res = await request(app)
      .patch('/api/auth/profile')
      .set(headers)
      .send({
        name: 'New Name',
        currentPassword: 'secret123',
        newPassword: 'newpass1',
      });
    expect(res.status).toBe(200);
    expect(res.body.admin.name).toBe('New Name');

    expect((await loginAs('01730000001', 'secret123')).status).toBe(401);
    expect((await loginAs('01730000001', 'newpass1')).status).toBe(200);
  });

  it('queues only in-window members and lists history after cron', async () => {
    const today = todayIso();
    await Member.create({
      name: 'Today End',
      phone: '01730000011',
      address: 'Dhaka',
      join: addDaysIso(today, -20),
      plan: '30:1000',
      expiry: today,
      amount: 1000,
      paid: true,
      code: 'SA-9101',
    });
    await Member.create({
      name: 'Old Expired',
      phone: '01730000012',
      address: 'Dhaka',
      join: addDaysIso(today, -90),
      plan: '30:1000',
      expiry: addDaysIso(today, -20),
      amount: 1000,
      paid: false,
      code: 'SA-9102',
    });
    await Member.create({
      name: 'Ended 2d',
      phone: '01730000013',
      address: 'Dhaka',
      join: addDaysIso(today, -40),
      plan: '30:1000',
      expiry: addDaysIso(today, -2),
      amount: 1000,
      paid: false,
      code: 'SA-9103',
    });

    const queue = await request(app).get('/api/notifications/queue').set(headers);
    expect(queue.status).toBe(200);
    expect(queue.body.queue.sections.find((s) => s.key === 'today')?.count).toBeGreaterThanOrEqual(1);
    expect(queue.body.queue.sections.find((s) => s.key === 'ended_3d')?.count).toBeGreaterThanOrEqual(1);
    const allIds = queue.body.queue.sections.flatMap((s) => s.members.map((m) => m.id));
    // Old expired (-20d) must not appear
    const old = queue.body.queue.sections.flatMap((s) => s.members).find((m) => m.code === 'SA-9102');
    expect(old).toBeUndefined();
    expect(allIds.length).toBeGreaterThanOrEqual(2);

    config.cronSecret = 'test-cron-secret';
    const friday = isFridayInDhaka();

    const cron = await request(app)
      .post('/api/notifications/cron')
      .set('X-Cron-Secret', 'test-cron-secret');
    expect(cron.status).toBe(200);

    if (friday) {
      expect(cron.body.skipped).toBe(true);
    } else {
      expect(cron.body.skipped).toBe(false);
      expect(cron.body.summary.sent + cron.body.summary.dryRun).toBeGreaterThan(0);

      // Second cron: same stages must dedupe (one per bucket per expiry cycle)
      const cron2 = await request(app)
        .post('/api/notifications/cron')
        .set('X-Cron-Secret', 'test-cron-secret');
      expect(cron2.status).toBe(200);
      expect(cron2.body.summary.skippedDuplicate).toBeGreaterThan(0);
      expect(cron2.body.summary.sent + cron2.body.summary.dryRun).toBe(0);
    }

    const history = await request(app).get('/api/notifications/history?page=1&limit=20').set(headers);
    expect(history.status).toBe(200);
    if (!friday) {
      expect(history.body.logs.length).toBeGreaterThan(0);
    }
  });

  it('lets an admin send the daily queue once', async () => {
    const today = todayIso();
    await Member.create({
      name: 'Today End',
      phone: '01730000021',
      address: 'Dhaka',
      join: addDaysIso(today, -20),
      plan: '30:1000',
      expiry: today,
      amount: 1000,
      paid: true,
      code: 'SA-9201',
    });

    const friday = isFridayInDhaka();
    const first = await request(app).post('/api/notifications/send-today').set(headers);
    if (friday) {
      expect(first.status).toBe(200);
      expect(first.body.skipped).toBe(true);
      return;
    }

    expect(first.status).toBe(200);
    expect(first.body.skipped).toBe(false);
    expect(first.body.summary.sent + first.body.summary.dryRun).toBeGreaterThan(0);

    const second = await request(app).post('/api/notifications/send-today').set(headers);
    expect(second.status).toBe(409);
    expect(second.body.alreadySent).toBe(true);

    const queue = await request(app).get('/api/notifications/queue').set(headers);
    expect(queue.body.queue.alreadySentToday).toBe(true);
  });

  it('rejects cron without secret', async () => {
    config.cronSecret = 'test-cron-secret';
    const res = await request(app).post('/api/notifications/cron');
    expect(res.status).toBe(401);
  });
});
