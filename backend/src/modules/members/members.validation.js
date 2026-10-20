import * as yup from 'yup';
import { PLAN_CODES } from '../../utils/plans.js';

const dateString = yup
  .string()
  .trim()
  .matches(/^\d{4}-\d{2}-\d{2}$/, 'must be a date in YYYY-MM-DD format');

const phoneString = yup
  .string()
  .trim()
  .matches(/^[0-9+\-\s]{10,15}$/, 'phone must be a valid phone number');

/** Body shape matches MemberFormDialog + Member.kt fields the UI uses */
export const createMemberSchema = yup.object({
  name: yup.string().trim().required('name is required'),
  phone: phoneString.required('phone is required'),
  address: yup.string().trim().required('address is required'),
  join: dateString.required('join is required'),
  plan: yup
    .string()
    .oneOf(PLAN_CODES, `plan must be one of: ${PLAN_CODES.join(', ')}`)
    .required('plan is required'),
  // Optional — server derives from join + plan when omitted (same as app utils)
  expiry: dateString.optional(),
  amount: yup.number().min(0).optional(),
  paid: yup.boolean().default(true),
});

export const updateMemberSchema = yup
  .object({
    name: yup.string().trim(),
    phone: phoneString,
    address: yup.string().trim(),
    join: dateString,
    plan: yup
      .string()
      .oneOf(PLAN_CODES, `plan must be one of: ${PLAN_CODES.join(', ')}`),
    expiry: dateString,
    amount: yup.number().min(0),
    paid: yup.boolean(),
  })
  .test(
    'at-least-one',
    'at least one field is required',
    (value) => value && Object.keys(value).length > 0
  );
