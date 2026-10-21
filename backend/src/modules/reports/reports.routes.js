import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { requireAuth, requirePermission } from '../../middleware/auth.js';
import { reportsController } from './reports.controller.js';

const router = Router();
router.use(requireAuth, requirePermission('view_reports'));
router.get('/overview', asyncHandler((req, res) => reportsController.overview(req, res)));
export default router;
