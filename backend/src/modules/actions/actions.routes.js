import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { requireAuth } from '../../middleware/auth.js';
import { actionsController } from './actions.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/', asyncHandler((req, res) => actionsController.list(req, res)));

export default router;
