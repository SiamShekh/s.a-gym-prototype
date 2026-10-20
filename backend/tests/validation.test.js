import { describe, it, expect } from 'vitest';
import { loginSchema } from '../src/modules/auth/auth.validation.js';
import { createMemberSchema } from '../src/modules/members/members.validation.js';
import { calcExpiry, planAmount, PLAN_CODES } from '../src/utils/plans.js';

describe('Yup schemas aligned with the Android app', () => {
  it('loginSchema validates phone + password', async () => {
    const value = await loginSchema.validate({
      phone: ' 01746-933966 ',
      password: 'secret123',
    });

    expect(value.phone).toBe('01746-933966');
    expect(value.password).toBe('secret123');
  });

  it('createMemberSchema requires form fields and strips unknown ones', async () => {
    const value = await createMemberSchema.validate(
      {
        name: 'Test',
        phone: '01700000000',
        address: 'পাবনা',
        join: '2026-01-01',
        plan: '30:1000',
        age: 24,
        gender: 'পুরুষ',
        note: 'legacy',
      },
      { stripUnknown: true }
    );

    expect(value).toEqual({
      name: 'Test',
      phone: '01700000000',
      address: 'পাবনা',
      join: '2026-01-01',
      plan: '30:1000',
      paid: true,
    });
    expect(value.age).toBeUndefined();
    expect(value.gender).toBeUndefined();
    expect(value.note).toBeUndefined();
  });

  it('createMemberSchema rejects plans outside app PLAN_CODES', async () => {
    await expect(
      createMemberSchema.validate({
        name: 'Test',
        phone: '01700000000',
        address: 'পাবনা',
        join: '2026-01-01',
        plan: '60:900',
      })
    ).rejects.toThrow();
  });
});

describe('plan helpers (MemberUtils parity)', () => {
  it('exposes the same plan codes as the Android app', () => {
    expect(PLAN_CODES).toEqual(['30:1000', '90:2500', '365:10000']);
  });

  it('derives amount and expiry like MemberUtils', () => {
    expect(planAmount('30:1000')).toBe(1000);
    expect(planAmount('90:2500')).toBe(2500);
    expect(planAmount('365:10000')).toBe(10000);
    expect(calcExpiry('2026-09-01', '30:1000')).toBe('2026-10-01');
    expect(calcExpiry('2026-09-01', '90:2500')).toBe('2026-11-30');
  });
});
