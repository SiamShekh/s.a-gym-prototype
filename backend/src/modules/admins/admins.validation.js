import * as yup from 'yup';

const phoneString = yup
  .string()
  .trim()
  .matches(/^[0-9+\-\s]{10,15}$/, 'phone must be a valid phone number');

export const createAdminSchema = yup.object({
  name: yup.string().trim().required('name is required'),
  phone: phoneString.required('phone is required'),
  password: yup.string().min(6, 'password must be at least 6 characters').required(),
  role: yup.string().oneOf(['owner', 'staff']).default('staff'),
});
