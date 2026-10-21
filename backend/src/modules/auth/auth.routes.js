import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { validate } from '../../middleware/validate.js';
import { requireAuth } from '../../middleware/auth.js';
import { authController } from './auth.controller.js';
import { loginSchema, updateProfileSchema } from './auth.validation.js';

const router = Router();

router.post(
  '/login',
  validate(loginSchema),
  asyncHandler((req, res) => authController.login(req, res))
);

router.get(
  '/me',
  requireAuth,
  asyncHandler((req, res) => authController.me(req, res))
);

router.patch(
  '/profile',
  requireAuth,
  validate(updateProfileSchema),
  asyncHandler((req, res) => authController.updateProfile(req, res))
);

export default router;
