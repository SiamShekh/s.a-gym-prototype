import request from 'supertest';
import app from '../src/app.js';
import Admin from '../src/models/Admin.js';

export async function createAdmin(overrides = {}) {
  return Admin.create({
    name: 'Test Admin',
    phone: '01712345678',
    password: 'secret123',
    ...overrides,
  });
}

export async function loginAs(phone = '01712345678', password = 'secret123') {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ phone, password });
  return res;
}

export async function authHeader() {
  await createAdmin();
  const res = await loginAs();
  return { Authorization: `Bearer ${res.body.token}` };
}

export { app, request };
