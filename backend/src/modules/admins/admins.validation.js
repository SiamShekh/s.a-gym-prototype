import * as yup from 'yup';
import { ALL_PERMISSION_KEYS } from '../../constants/permissions.js';

const phoneString = yup
  .string()
  .trim()
  .matches(/^[0-9+\-\s]{10,15}$/, 'phone must be a valid phone number');

const permissionsField = yup
  .array()
  .of(yup.string().oneOf(ALL_PERMISSION_KEYS, 'invalid permission'))
  .optional();

export const createAdminSchema = yup.object({
  name: yup.string().trim().required('name is required'),
  phone: phoneString.required('phone is required'),
  password: yup.string().min(6, 'password must be at least 6 characters').required(),
  role: yup.string().oneOf(['owner', 'staff']).default('staff'),
  permissions: permissionsField,
});

export const updateAdminSchema = yup.object({
  name: yup.string().trim().required('name is required'),
  phone: phoneString.required('phone is required'),
  password: yup
    .string()
    .transform((v) => (v === '' || v == null ? undefined : v))
    .min(6, 'password must be at least 6 characters')
    .optional(),
  role: yup.string().oneOf(['owner', 'staff']).required(),
  permissions: permissionsField,
});

export const updatePermissionsSchema = yup.object({
  permissions: yup
    .array()
    .of(yup.string().oneOf(ALL_PERMISSION_KEYS, 'invalid permission'))
    .required('permissions is required'),
});
