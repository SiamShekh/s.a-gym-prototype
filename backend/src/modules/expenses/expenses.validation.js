import * as yup from 'yup';
import { EXPENSE_CATEGORIES } from '../../models/Expense.js';

const dateString = yup
  .string()
  .trim()
  .matches(/^\d{4}-\d{2}-\d{2}$/, 'must be a date in YYYY-MM-DD format');

export const createExpenseSchema = yup.object({
  title: yup.string().trim().required('title is required'),
  amount: yup
    .number()
    .typeError('amount must be a number')
    .positive('amount must be positive')
    .required('amount is required'),
  category: yup.string().oneOf(EXPENSE_CATEGORIES).default('other'),
  date: dateString.required('date is required'),
  note: yup.string().trim().optional(),
});
