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
