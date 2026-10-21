import * as yup from 'yup';

/** Matches Android login: phone + password */
export const loginSchema = yup.object({
  phone: yup
    .string()
    .trim()
    .matches(/^[0-9+\-\s]{10,15}$/, 'phone must be a valid phone number')
    .required('phone is required'),
  password: yup
    .string()
    .min(6, 'password must be at least 6 characters')
    .required('password is required'),
});

export const updateProfileSchema = yup
  .object({
    name: yup.string().trim().min(2).max(80),
    currentPassword: yup.string().min(6),
    newPassword: yup.string().min(6, 'new password must be at least 6 characters'),
  })
  .test(
    'at-least-one',
    'name or newPassword is required',
    (value) => Boolean(value?.name || value?.newPassword)
  )
  .test(
    'password-pair',
    'currentPassword is required to change password',
    (value) => !value?.newPassword || Boolean(value?.currentPassword)
  );
