import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import config from './config/index.js';
import healthRoutes from './modules/health/health.routes.js';
import authRoutes from './modules/auth/auth.routes.js';
import membersRoutes from './modules/members/members.routes.js';
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
    version: '1.0.0',
    docs: {
      health: 'GET /api/health',
      login: 'POST /api/auth/login { phone, password }',
      members: 'GET|POST /api/members (auth)',
      memberById: 'GET|PUT|DELETE /api/members/:id (auth)',
    },
  });
});

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/members', membersRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
