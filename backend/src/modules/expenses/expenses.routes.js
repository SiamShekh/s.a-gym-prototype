import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { expensesController } from './expenses.controller.js';
import { createExpenseSchema } from './expenses.validation.js';

const router = Router();
router.use(requireAuth);
router.get('/', asyncHandler((req, res) => expensesController.list(req, res)));
router.post(
  '/',
  validate(createExpenseSchema),
  asyncHandler((req, res) => expensesController.create(req, res))
);
router.delete(
  '/:id',
  asyncHandler((req, res) => expensesController.remove(req, res))
);
export default router;
