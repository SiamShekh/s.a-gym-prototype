import './polyfills.js';
import app from './app.js';
import config from './config/index.js';
import { connectDb } from './db/connection.js';
import { bootstrapData } from './bootstrap.js';

async function start() {
  await connectDb();
  console.log(`MongoDB connected: ${config.mongoUri}`);

  const boot = await bootstrapData();
  if (boot.adminsRoleFixed || boot.membersCoded) {
    console.log(
      `Bootstrap: roles fixed=${boot.adminsRoleFixed}, member codes assigned=${boot.membersCoded}`
    );
  }

  app.listen(config.port, '0.0.0.0', () => {
    console.log(`S.A Gym API running on http://0.0.0.0:${config.port}`);
    console.log(`Health:    GET  /api/health`);
    console.log(`Login:     POST /api/auth/login`);
    console.log(`Members:   /api/members`);
    console.log(`Payments:  /api/payments`);
    console.log(`Expenses:  /api/expenses`);
    console.log(`Reports:   /api/reports/overview`);
    console.log(`Admins:    /api/admins (owner)`);
    console.log(`Actions:   /api/actions`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
