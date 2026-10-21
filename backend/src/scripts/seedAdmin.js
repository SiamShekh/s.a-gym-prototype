/**
 * Create (or update) an admin from env vars.
 * Usage: node src/scripts/seedAdmin.js
 *
 * Login uses phone + password (same as Android login screen).
 */
import '../polyfills.js';
import { connectDb, disconnectDb } from '../db/connection.js';
import Admin from '../models/Admin.js';

const phone = (process.env.SEED_ADMIN_PHONE || '01746933966').replace(
  /[\s-]/g,
  ''
);
const password = process.env.SEED_ADMIN_PASSWORD || '123456';
const name = process.env.SEED_ADMIN_NAME || 'Owner';

async function main() {
  await connectDb();

  let admin = await Admin.findOne({ phone }).select('+password');

  if (admin) {
    admin.name = name;
    admin.password = password;
    admin.role = 'owner';
    admin.isActive = true;
    await admin.save();
    console.log(`Updated admin: ${admin.phone}`);
  } else {
    admin = await Admin.create({ name, phone, password, role: 'owner' });
    console.log(`Created admin: ${admin.phone}`);
  }

  console.log('Login with phone:', phone, '/ password:', password);
  await disconnectDb();
}

main().catch(async (err) => {
  console.error(err);
  await disconnectDb();
  process.exit(1);
});
