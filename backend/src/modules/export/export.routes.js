import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { requireAuth } from '../../middleware/auth.js';
import { exportController } from './export.controller.js';

const router = Router();
router.use(requireAuth);
router.get('/members', asyncHandler((req, res) => exportController.members(req, res)));
router.get('/payments', asyncHandler((req, res) => exportController.payments(req, res)));
router.get('/expenses', asyncHandler((req, res) => exportController.expenses(req, res)));
export default router;
