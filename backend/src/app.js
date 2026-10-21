import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import config from './config/index.js';
import healthRoutes from './modules/health/health.routes.js';
import authRoutes from './modules/auth/auth.routes.js';
import membersRoutes from './modules/members/members.routes.js';
import actionsRoutes from './modules/actions/actions.routes.js';
import paymentsRoutes from './modules/payments/payments.routes.js';
import expensesRoutes from './modules/expenses/expenses.routes.js';
import reportsRoutes from './modules/reports/reports.routes.js';
import adminsRoutes from './modules/admins/admins.routes.js';
import exportRoutes from './modules/export/export.routes.js';
import notificationsRoutes from './modules/notifications/notifications.routes.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(
  cors({
    origin: config.corsOrigin === '*' ? true : config.corsOrigin.split(','),
  })
);
app.use(express.json());
app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev'));

app.get('/', (req, res) => {
  res.json({
    name: 'S.A Gym API',
    version: '1.1.0',
    docs: {
      health: 'GET /api/health',
      login: 'POST /api/auth/login',
      members: 'GET|POST /api/members (auth)',
      memberById: 'GET|PUT|DELETE /api/members/:id (auth)',
      memberPay: 'POST /api/members/:id/pay (auth)',
      payments: 'GET /api/payments (auth)',
      expenses: 'GET|POST|DELETE /api/expenses (auth)',
      reports: 'GET /api/reports/overview (auth)',
      admins: 'GET|POST /api/admins (owner)',
      export: 'GET /api/export/{members|payments|expenses} (auth)',
      actions: 'GET /api/actions (auth)',
      profile: 'PATCH /api/auth/profile (auth)',
      notificationsQueue: 'GET /api/notifications/queue (auth)',
      notificationsHistory: 'GET /api/notifications/history (auth)',
      notificationsCron: 'POST /api/notifications/cron (X-Cron-Secret)',
    },
  });
});

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/members', membersRoutes);
app.use('/api/actions', actionsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/expenses', expensesRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/admins', adminsRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/notifications', notificationsRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
