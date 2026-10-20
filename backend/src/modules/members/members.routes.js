import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { membersController } from './members.controller.js';
import {
  createMemberSchema,
  updateMemberSchema,
} from './members.validation.js';

const router = Router();

router.use(requireAuth);

router.get('/', asyncHandler((req, res) => membersController.list(req, res)));
router.get(
  '/:id',
  asyncHandler((req, res) => membersController.getById(req, res))
);
router.post(
  '/',
  validate(createMemberSchema),
  asyncHandler((req, res) => membersController.create(req, res))
);
router.put(
  '/:id',
  validate(updateMemberSchema),
  asyncHandler((req, res) => membersController.update(req, res))
);
router.delete(
  '/:id',
  asyncHandler((req, res) => membersController.remove(req, res))
);

export default router;
