import { describe, it, expect } from 'vitest';
import { app, request, authHeader, createAdmin, loginAs } from './helpers.js';
import { addDaysIso, todayIso } from '../src/utils/dates.js';

const validMember = {
  name: 'করিম আহমেদ',
  phone: '01812345678',
  address: 'পাবনা',
  join: '2026-09-13',
  plan: '30:1000',
};

describe('date range filters', () => {
  it('recomputes overview income, expenses, and new members for an inclusive range', async () => {
    const headers = await authHeader();
    await request(app).post('/api/members').set(headers).send(validMember);
    await request(app).post('/api/expenses').set(headers).send({
      title: 'ভাড়া',
      amount: 700,
      category: 'rent',
      date: '2026-09-20',
    });
    await request(app).post('/api/expenses').set(headers).send({
      title: 'বিল',
      amount: 50,
      category: 'utilities',
      date: todayIso(),
    });

    const september = await request(app)
      .get('/api/reports/overview')
      .query({ from: '2026-09-13', to: '2026-09-20' })
      .set(headers);
    expect(september.status).toBe(200);
    expect(september.body.report.scope).toBe('range');
    expect(september.body.report.totalMembers).toBe(1);
    expect(september.body.report.newMembers).toBe(1);
    expect(september.body.report.monthExpenses).toBe(700);
    expect(september.body.report.monthRevenue).toBe(0);
    expect(september.body.report.bucket).toBe('day');

    const today = todayIso();
    const todayReport = await request(app)
      .get('/api/reports/overview')
      .query({ from: today, to: today })
      .set(headers);
    expect(todayReport.body.report.monthRevenue).toBe(1000);
    expect(todayReport.body.report.monthExpenses).toBe(50);
    expect(todayReport.body.report.totalMembers).toBe(0);

    const everything = await request(app)
      .get('/api/reports/overview')
      .query({ scope: 'everything' })
      .set(headers);
    expect(everything.body.report.scope).toBe('everything');
    expect(everything.body.report.monthRevenue).toBe(1000);
    expect(everything.body.report.monthExpenses).toBe(750);
    expect(everything.body.report.totalMembers).toBe(1);
  });

  it('filters members by join date and by payment date', async () => {
    const headers = await authHeader();
    const created = await request(app).post('/api/members').set(headers).send(validMember);
    expect(created.status).toBe(201);

    const byJoin = await request(app)
      .get('/api/members')
      .query({ from: '2026-09-13', to: '2026-09-13', dateBy: 'join' })
      .set(headers);
    expect(byJoin.body.members).toHaveLength(1);

    const outsideJoin = await request(app)
      .get('/api/members')
      .query({ from: '2026-08-01', to: '2026-08-31', dateBy: 'join' })
      .set(headers);
    expect(outsideJoin.body.members).toHaveLength(0);

    const byPayment = await request(app)
      .get('/api/members')
      .query({ from: todayIso(), to: todayIso(), dateBy: 'payment' })
      .set(headers);
    expect(byPayment.body.members.map((m) => m.id)).toContain(created.body.member.id);

    const payments = await request(app)
      .get('/api/payments')
      .query({ from: todayIso(), to: todayIso() })
      .set(headers);
    expect(payments.body.payments.length).toBeGreaterThanOrEqual(1);
    expect(payments.body.totalAmount).toBe(1000);

    const oldPayments = await request(app)
      .get('/api/payments')
      .query({ from: '2026-09-01', to: '2026-09-30' })
      .set(headers);
    expect(oldPayments.body.payments).toHaveLength(0);

    const expenses = await request(app)
      .get('/api/expenses')
      .query({ from: addDaysIso(todayIso(), -1), to: todayIso() })
      .set(headers);
    expect(expenses.status).toBe(200);
  });
});

describe('delete payment', () => {
  it('soft-deletes a renewal, restores membership, and hides it from totals', async () => {
    const headers = await authHeader();
    const created = await request(app).post('/api/members').set(headers).send(validMember);
    const memberId = created.body.member.id;
    expect(created.body.member.expiry).toBe('2026-10-13');

    const paid = await request(app)
      .post(`/api/members/${memberId}/pay`)
      .set(headers)
      .send({ plan: '90:2500', amount: 2500, method: 'bkash' });
    expect(paid.status).toBe(200);
    const extendedExpiry = paid.body.member.expiry;
    expect(extendedExpiry).not.toBe('2026-10-13');

    const before = await request(app).get('/api/payments').set(headers);
    const renewal = before.body.payments.find((p) => p.amount === 2500);
    expect(renewal).toBeTruthy();
    expect(before.body.totalAmount).toBe(3500);

    const removed = await request(app).delete(`/api/payments/${renewal.id}`).set(headers);
    expect(removed.status).toBe(200);
    expect(removed.body.member.expiry).toBe('2026-10-13');
    expect(removed.body.member.join).toBe('2026-09-13');
    expect(removed.body.member.paid).toBe(true);
    expect(removed.body.member.plan).toBe('30:1000');

    const after = await request(app).get('/api/payments').set(headers);
    expect(after.body.payments.find((p) => p.id === renewal.id)).toBeUndefined();
    expect(after.body.totalAmount).toBe(1000);

    const again = await request(app).delete(`/api/payments/${renewal.id}`).set(headers);
    expect(again.status).toBe(404);

    const overview = await request(app)
      .get('/api/reports/overview')
      .query({ scope: 'everything' })
      .set(headers);
    expect(overview.body.report.monthRevenue).toBe(1000);
  });

  it('marks the member unpaid when the only payment is deleted', async () => {
    const headers = await authHeader();
    const created = await request(app).post('/api/members').set(headers).send(validMember);
    const list = await request(app).get('/api/payments').set(headers);
    const only = list.body.payments[0];
    const removed = await request(app).delete(`/api/payments/${only.id}`).set(headers);
    expect(removed.status).toBe(200);
    expect(removed.body.member.id).toBe(created.body.member.id);
    expect(removed.body.member.paid).toBe(false);
    expect(removed.body.member.expiry).toBe(created.body.member.expiry);
  });

  it('lets only the owner delete a payment', async () => {
    await createAdmin({ phone: '01710000011', role: 'owner' });
    const ownerLogin = await loginAs('01710000011', 'secret123');
    const ownerHeaders = { Authorization: `Bearer ${ownerLogin.body.token}` };
    const created = await request(app).post('/api/members').set(ownerHeaders).send({
      ...validMember,
      phone: '01911111111',
    });
    const staff = await request(app)
      .post('/api/admins')
      .set(ownerHeaders)
      .send({
        name: 'Staff',
        phone: '01710000012',
        password: 'secret123',
        role: 'staff',
        permissions: ['view_members', 'view_payments', 'accept_payment'],
      });
    expect(staff.status).toBe(201);
    const staffLogin = await loginAs('01710000012', 'secret123');
    const staffHeaders = { Authorization: `Bearer ${staffLogin.body.token}` };

    const payments = await request(app).get('/api/payments').set(ownerHeaders);
    const payment = payments.body.payments.find((p) => p.member === created.body.member.id || p.phone === '01911111111');
    const denied = await request(app).delete(`/api/payments/${payment.id}`).set(staffHeaders);
    expect(denied.status).toBe(403);

    const stillThere = await request(app).get('/api/payments').set(ownerHeaders);
    expect(stillThere.body.payments.some((p) => p.id === payment.id)).toBe(true);
  });
});
