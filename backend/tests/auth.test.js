import { describe, it, expect } from 'vitest';
import { app, request, createAdmin, loginAs } from './helpers.js';

describe('POST /api/auth/login', () => {
  it('rejects invalid payload with Yup errors', async () => {
    const res = await request(app).post('/api/auth/login').send({
      phone: '123',
      password: '123',
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Validation failed');
    expect(res.body.errors.length).toBeGreaterThan(0);
  });

  it('rejects missing fields', async () => {
    const res = await request(app).post('/api/auth/login').send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('rejects wrong password', async () => {
    await createAdmin();
    const res = await loginAs('01712345678', 'wrong-password');

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/invalid phone or password/i);
  });

  it('logs in with phone + password and returns a JWT', async () => {
    await createAdmin({ name: 'Owner', phone: '01746933966' });
    const res = await loginAs('01746933966', 'secret123');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.admin).toMatchObject({
      name: 'Owner',
      phone: '01746933966',
      isActive: true,
    });
    expect(res.body.admin.email).toBeUndefined();
    expect(res.body.admin.password).toBeUndefined();
    expect(res.body.admin.id).toEqual(expect.any(String));
  });

  it('supports multiple admins in the database', async () => {
    await createAdmin({ phone: '01711111111', name: 'Admin One' });
    await createAdmin({ phone: '01722222222', name: 'Admin Two' });

    const first = await loginAs('01711111111', 'secret123');
    const second = await loginAs('01722222222', 'secret123');

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(first.body.admin.phone).toBe('01711111111');
    expect(second.body.admin.phone).toBe('01722222222');
  });
});
