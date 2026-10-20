import { describe, it, expect } from 'vitest';
import { app, request, authHeader, createAdmin, loginAs } from './helpers.js';

const validMember = {
  name: 'রাহুল ইসলাম',
  phone: '01712345678',
  address: 'সুজানগর',
  join: '2026-09-01',
  plan: '30:1000',
};

describe('Members API', () => {
  it('requires auth to list members', async () => {
    const res = await request(app).get('/api/members');
    expect(res.status).toBe(401);
  });

  it('rejects create with Yup validation errors', async () => {
    const headers = await authHeader();
    const res = await request(app)
      .post('/api/members')
      .set(headers)
      .send({ name: 'Only name' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Validation failed');
    expect(res.body.errors.some((e) => e.path === 'phone')).toBe(true);
    expect(res.body.errors.some((e) => e.path === 'address')).toBe(true);
  });

  it('creates a member and derives amount + expiry from plan', async () => {
    const headers = await authHeader();
    const res = await request(app)
      .post('/api/members')
      .set(headers)
      .send(validMember);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.member).toMatchObject({
      name: validMember.name,
      phone: validMember.phone,
      address: validMember.address,
      join: '2026-09-01',
      plan: '30:1000',
      amount: 1000,
      expiry: '2026-10-01',
      paid: true,
    });
    expect(res.body.member.age).toBeUndefined();
    expect(res.body.member.gender).toBeUndefined();
    expect(res.body.member.note).toBeUndefined();
    expect(res.body.member.id).toEqual(expect.any(String));
  });

  it('lists members for an authenticated admin', async () => {
    const headers = await authHeader();
    await request(app).post('/api/members').set(headers).send(validMember);
    await request(app)
      .post('/api/members')
      .set(headers)
      .send({
        ...validMember,
        name: 'মিম আক্তার',
        phone: '01612345678',
        plan: '90:2500',
      });

    const res = await request(app).get('/api/members').set(headers);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.members).toHaveLength(2);
    expect(res.body.members[0].id).toEqual(expect.any(String));
  });

  it('gets, updates, and deletes a member', async () => {
    const headers = await authHeader();
    const created = await request(app)
      .post('/api/members')
      .set(headers)
      .send(validMember);

    const id = created.body.member.id;

    const got = await request(app).get(`/api/members/${id}`).set(headers);
    expect(got.status).toBe(200);
    expect(got.body.member.name).toBe(validMember.name);

    const updated = await request(app)
      .put(`/api/members/${id}`)
      .set(headers)
      .send({ paid: false, plan: '90:2500' });

    expect(updated.status).toBe(200);
    expect(updated.body.member.paid).toBe(false);
    expect(updated.body.member.plan).toBe('90:2500');
    expect(updated.body.member.amount).toBe(2500);
    expect(updated.body.member.expiry).toBe('2026-11-30');

    const removed = await request(app)
      .delete(`/api/members/${id}`)
      .set(headers);
    expect(removed.status).toBe(204);

    const missing = await request(app).get(`/api/members/${id}`).set(headers);
    expect(missing.status).toBe(404);
  });

  it('rejects unknown plan codes', async () => {
    const headers = await authHeader();
    const res = await request(app)
      .post('/api/members')
      .set(headers)
      .send({ ...validMember, plan: '30:500' });

    expect(res.status).toBe(400);
    expect(res.body.errors.some((e) => e.path === 'plan')).toBe(true);
  });

  it('rejects expired/invalid tokens', async () => {
    await createAdmin();
    const login = await loginAs();
    expect(login.status).toBe(200);

    const res = await request(app)
      .get('/api/members')
      .set({ Authorization: 'Bearer not-a-real-token' });

    expect(res.status).toBe(401);
  });
});
