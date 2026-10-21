import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { requireAuth } from '../../middleware/auth.js';
import { notificationsController } from './notifications.controller.js';

const router = Router();

/** Railway / external cron — secured by X-Cron-Secret, no JWT */
router.post(
  '/cron',
  asyncHandler((req, res) => notificationsController.cron(req, res))
);

router.use(requireAuth);

router.get(
  '/queue',
  asyncHandler((req, res) => notificationsController.queue(req, res))
);
router.get(
  '/history',
  asyncHandler((req, res) => notificationsController.history(req, res))
);
/** Keep old preview path as alias for queue */
router.get(
  '/preview',
  asyncHandler((req, res) => notificationsController.queue(req, res))
);

export default router;
