import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { requireAuth, requireOwner, requirePermission } from '../../middleware/auth.js';
import { paymentsController } from './payments.controller.js';

const router = Router();
router.use(requireAuth);
router.get(
  '/',
  requirePermission('view_payments'),
  asyncHandler((req, res) => paymentsController.list(req, res))
);
router.delete(
  '/:id',
  requireOwner,
  asyncHandler((req, res) => paymentsController.remove(req, res))
);
export default router;
