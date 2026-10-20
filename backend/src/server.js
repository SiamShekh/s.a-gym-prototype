import app from './app.js';
import config from './config/index.js';
import { connectDb } from './db/connection.js';

async function start() {
  await connectDb();
  console.log(`MongoDB connected: ${config.mongoUri}`);

  app.listen(config.port, '0.0.0.0', () => {
    console.log(`S.A Gym API running on http://0.0.0.0:${config.port}`);
    console.log(`Health:  http://localhost:${config.port}/api/health`);
    console.log(`Login:   POST http://localhost:${config.port}/api/auth/login`);
    console.log(`Members: http://localhost:${config.port}/api/members`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
