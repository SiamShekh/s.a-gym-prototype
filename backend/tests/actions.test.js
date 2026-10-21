import { describe, it, expect } from 'vitest';
import { app, request, authHeader } from './helpers.js';

const validMember = {
  name: 'রাহুল ইসলাম',
  phone: '01712345678',
  address: 'সুজানগর',
  join: '2026-09-01',
  plan: '30:1000',
};

describe('Actions API', () => {
  it('requires auth to list actions', async () => {
    const res = await request(app).get('/api/actions');
    expect(res.status).toBe(401);
  });

  it('records create / pay / delete and lists them for the logged-in admin', async () => {
    const headers = await authHeader();

    const created = await request(app)
      .post('/api/members')
      .set(headers)
      .send(validMember);
    expect(created.status).toBe(201);
    const memberId = created.body.member.id;

    const paid = await request(app)
      .post(`/api/members/${memberId}/pay`)
      .set(headers)
      .send({ plan: '30:1000', amount: 900, method: 'bkash' });
    expect(paid.status).toBe(200);
    expect(paid.body.member.amount).toBe(900);

    await request(app).delete(`/api/members/${memberId}`).set(headers);

    const res = await request(app).get('/api/actions').set(headers);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.actions.length).toBeGreaterThanOrEqual(3);

    const types = res.body.actions.map((a) => a.type);
    expect(types).toEqual(
      expect.arrayContaining(['create_member', 'accept_payment', 'delete_member', 'login'])
    );
  });

  it('filters actions by type', async () => {
    const headers = await authHeader();
    await request(app).post('/api/members').set(headers).send(validMember);

    const res = await request(app)
      .get('/api/actions?type=create_member')
      .set(headers);

    expect(res.status).toBe(200);
    expect(res.body.actions.every((a) => a.type === 'create_member')).toBe(true);
  });
});
