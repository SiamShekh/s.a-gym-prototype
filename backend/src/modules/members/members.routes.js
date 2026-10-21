import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { requireAuth, requirePermission } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { membersController } from './members.controller.js';
import {
  acceptPaymentSchema,
  createMemberSchema,
  updateMemberSchema,
} from './members.validation.js';

const router = Router();

router.use(requireAuth);

router.get(
  '/',
  requirePermission('view_members'),
  asyncHandler((req, res) => membersController.list(req, res))
);
router.post(
  '/',
  requirePermission('create_members'),
  validate(createMemberSchema),
  asyncHandler((req, res) => membersController.create(req, res))
);
router.post(
  '/:id/pay',
  requirePermission('accept_payment'),
  validate(acceptPaymentSchema),
  asyncHandler((req, res) => membersController.acceptPayment(req, res))
);
router.get(
  '/:id',
  requirePermission('view_members'),
  asyncHandler((req, res) => membersController.getById(req, res))
);
router.put(
  '/:id',
  requirePermission('edit_members'),
  validate(updateMemberSchema),
  asyncHandler((req, res) => membersController.update(req, res))
);
router.delete(
  '/:id',
  requirePermission('delete_members'),
  asyncHandler((req, res) => membersController.remove(req, res))
);

export default router;
