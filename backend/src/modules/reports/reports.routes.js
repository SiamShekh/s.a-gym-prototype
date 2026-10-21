import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { requireAuth } from '../../middleware/auth.js';
import { reportsController } from './reports.controller.js';

const router = Router();
router.use(requireAuth);
router.get('/overview', asyncHandler((req, res) => reportsController.overview(req, res)));
export default router;
