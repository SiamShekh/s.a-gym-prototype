import { describe, it, expect } from 'vitest';
import { app, request, authHeader, createAdmin, loginAs } from './helpers.js';

/**
 * Contract test: every route the React frontend calls must work.
 */
describe('Frontend API contract', () => {
  const memberBody = {
    id: '',
    name: 'করিম',
    phone: '01711112222',
    address: 'মিরপুর',
    join: '2026-10-01',
    plan: '30:1000',
    amount: 1000,
    paid: true,
    expiry: '2026-10-31',
  };

  it('covers auth → members → pay → payments → expenses → reports → actions → admins → export', async () => {
    await createAdmin({ phone: '01746933966', name: 'Owner', role: 'owner' });
    const login = await loginAs('01746933966', 'secret123');
    expect(login.status).toBe(200);
    expect(login.body.token).toBeTruthy();
    expect(login.body.admin.role).toBe('owner');
    const headers = { Authorization: `Bearer ${login.body.token}` };

    const created = await request(app)
      .post('/api/members')
      .set(headers)
      .send(memberBody);
    expect(created.status).toBe(201);
    expect(created.body.member.code).toMatch(/^SA-\d{4}$/);
    const id = created.body.member.id;

    expect((await request(app).get('/api/members?page=1&limit=20').set(headers)).status).toBe(200);
    expect((await request(app).get('/api/members?status=due').set(headers)).status).toBe(200);
    expect((await request(app).get('/api/members?status=unpaid').set(headers)).status).toBe(200);
    expect((await request(app).get(`/api/members/${id}`).set(headers)).status).toBe(200);

    const updated = await request(app)
      .put(`/api/members/${id}`)
      .set(headers)
      .send({ ...memberBody, id, name: 'করিম আপডেট', amount: 900 });
    expect(updated.status).toBe(200);

    const paid = await request(app)
      .post(`/api/members/${id}/pay`)
      .set(headers)
      .send({ plan: '90:2500', amount: 2500, method: 'cash' });
    expect(paid.status).toBe(200);

    const payments = await request(app).get('/api/payments?page=1&limit=30').set(headers);
    expect(payments.status).toBe(200);
    expect(payments.body.payments.length).toBeGreaterThan(0);

    const expense = await request(app)
      .post('/api/expenses')
      .set(headers)
      .send({ title: 'ইলেকট্রিক বিল', amount: 200, category: 'utilities', date: '2026-10-21' });
    expect(expense.status).toBe(201);

    expect((await request(app).get('/api/expenses?page=1&limit=30').set(headers)).status).toBe(200);

    const report = await request(app).get('/api/reports/overview').set(headers);
    expect(report.status).toBe(200);
    expect(report.body.report.monthly).toHaveLength(6);

    const actions = await request(app).get('/api/actions?page=1&limit=30').set(headers);
    expect(actions.status).toBe(200);
    expect(actions.body.actions.length).toBeGreaterThan(0);

    const admins = await request(app).get('/api/admins').set(headers);
    expect(admins.status).toBe(200);

    const staff = await request(app)
      .post('/api/admins')
      .set(headers)
      .send({ name: 'Staff', phone: '01746933967', password: 'secret123', role: 'staff' });
    expect(staff.status).toBe(201);

    const toggle = await request(app)
      .patch(`/api/admins/${staff.body.admin.id}/active`)
      .set(headers)
      .send({ isActive: false });
    expect(toggle.status).toBe(200);
    expect(toggle.body.admin.isActive).toBe(false);

    for (const path of ['/api/export/members', '/api/export/payments', '/api/export/expenses']) {
      const csv = await request(app).get(path).set(headers);
      expect(csv.status).toBe(200);
      expect(csv.headers['content-type']).toMatch(/csv/);
    }

    expect(
      (await request(app).delete(`/api/expenses/${expense.body.expense.id}`).set(headers)).status
    ).toBe(204);
    expect((await request(app).delete(`/api/members/${id}`).set(headers)).status).toBe(204);
  });

  it('rejects staff from /api/admins', async () => {
    const headers = await authHeader(); // default admin is owner via schema default
    // create staff via owner
    const ownerPhone = '01720000001';
    await createAdmin({ phone: ownerPhone, role: 'owner' });
    const ownerLogin = await loginAs(ownerPhone, 'secret123');
    const ownerHeaders = { Authorization: `Bearer ${ownerLogin.body.token}` };

    await request(app)
      .post('/api/admins')
      .set(ownerHeaders)
      .send({ name: 'S', phone: '01720000002', password: 'secret123', role: 'staff' });

    const staffLogin = await loginAs('01720000002', 'secret123');
    const staffHeaders = { Authorization: `Bearer ${staffLogin.body.token}` };
    expect((await request(app).get('/api/admins').set(staffHeaders)).status).toBe(403);
    // staff can still use members
    expect((await request(app).get('/api/members').set(staffHeaders)).status).toBe(200);
    expect((await request(app).get('/api/reports/overview').set(staffHeaders)).status).toBe(200);
  });
});
