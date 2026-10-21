import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { requireAuth, requireOwner } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { adminsController } from './admins.controller.js';
import {
  createAdminSchema,
  updateAdminSchema,
  updatePermissionsSchema,
} from './admins.validation.js';
import * as yup from 'yup';

const setActiveSchema = yup.object({
  isActive: yup.boolean().required(),
});

const router = Router();
router.use(requireAuth, requireOwner);

router.get('/', asyncHandler((req, res) => adminsController.list(req, res)));
router.post(
  '/',
  validate(createAdminSchema),
  asyncHandler((req, res) => adminsController.create(req, res))
);
router.put(
  '/:id',
  validate(updateAdminSchema),
  asyncHandler((req, res) => adminsController.update(req, res))
);
router.delete(
  '/:id',
  asyncHandler((req, res) => adminsController.remove(req, res))
);
router.patch(
  '/:id/active',
  validate(setActiveSchema),
  asyncHandler((req, res) => adminsController.setActive(req, res))
);
router.patch(
  '/:id/permissions',
  validate(updatePermissionsSchema),
  asyncHandler((req, res) => adminsController.updatePermissions(req, res))
);

export default router;
