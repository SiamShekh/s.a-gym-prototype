import { describe, it, expect } from 'vitest';
import { app, request, authHeader, createAdmin, loginAs } from './helpers.js';

const validMember = {
  name: 'রাহুল ইসলাম',
  phone: '01712345678',
  address: 'সুজানগর',
  join: '2026-09-01',
  plan: '30:1000',
};

describe('Payments, expenses, reports, admins, export', () => {
  it('assigns member code and records payment history on create + pay', async () => {
    const headers = await authHeader();
    const created = await request(app)
      .post('/api/members')
      .set(headers)
      .send(validMember);

    expect(created.status).toBe(201);
    expect(created.body.member.code).toMatch(/^SA-\d{4}$/);

    const paid = await request(app)
      .post(`/api/members/${created.body.member.id}/pay`)
      .set(headers)
      .send({ plan: '90:2500', amount: 2500, method: 'nagad' });
    expect(paid.status).toBe(200);

    const payments = await request(app).get('/api/payments').set(headers);
    expect(payments.status).toBe(200);
    expect(payments.body.payments.length).toBeGreaterThanOrEqual(2);
    expect(payments.body.totalAmount).toBeGreaterThanOrEqual(3500);
  });

  it('creates expenses and includes them in overview profit', async () => {
    const headers = await authHeader();
    await request(app)
      .post('/api/members')
      .set(headers)
      .send(validMember);

    const expense = await request(app)
      .post('/api/expenses')
      .set(headers)
      .send({
        title: 'ভাড়া',
        amount: 500,
        category: 'rent',
        date: '2026-10-01',
      });
    expect(expense.status).toBe(201);

    const report = await request(app).get('/api/reports/overview').set(headers);
    expect(report.status).toBe(200);
    expect(report.body.report).toHaveProperty('monthRevenue');
    expect(report.body.report).toHaveProperty('monthExpenses');
    expect(report.body.report).toHaveProperty('monthly');
    expect(Array.isArray(report.body.report.monthly)).toBe(true);
  });

  it('allows owner to create staff admin and blocks staff from admin routes', async () => {
    await createAdmin({ phone: '01710000001', role: 'owner' });
    const ownerLogin = await loginAs('01710000001', 'secret123');
    const ownerHeaders = { Authorization: `Bearer ${ownerLogin.body.token}` };

    const created = await request(app)
      .post('/api/admins')
      .set(ownerHeaders)
      .send({
        name: 'Staff One',
        phone: '01710000002',
        password: 'secret123',
        role: 'staff',
      });
    expect(created.status).toBe(201);
    expect(created.body.admin.role).toBe('staff');

    const staffLogin = await loginAs('01710000002', 'secret123');
    const staffHeaders = { Authorization: `Bearer ${staffLogin.body.token}` };
    const denied = await request(app).get('/api/admins').set(staffHeaders);
    expect(denied.status).toBe(403);
  });

  it('exports members csv', async () => {
    const headers = await authHeader();
    await request(app).post('/api/members').set(headers).send(validMember);
    const res = await request(app).get('/api/export/members').set(headers);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/csv/);
    expect(res.text).toContain('code,name,phone');
    expect(res.text).toContain('রাহুল');
  });

  it('lists due members (unpaid or expired)', async () => {
    const headers = await authHeader();
    await request(app)
      .post('/api/members')
      .set(headers)
      .send({ ...validMember, paid: false, join: '2020-01-01', plan: '30:1000' });

    const res = await request(app).get('/api/members?status=due').set(headers);
    expect(res.status).toBe(200);
    expect(res.body.members.length).toBeGreaterThanOrEqual(1);
  });
});
