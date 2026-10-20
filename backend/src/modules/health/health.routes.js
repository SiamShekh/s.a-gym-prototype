import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.json({
    success: true,
    service: 'sa-gym-backend',
    status: 'ok',
    time: new Date().toISOString(),
  });
});

export default router;
