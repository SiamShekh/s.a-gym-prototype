import Admin from './models/Admin.js';
import Member from './models/Member.js';
import {
  ALL_PERMISSION_KEYS,
  DEFAULT_STAFF_PERMISSIONS,
} from './constants/permissions.js';

/**
 * Bring older DBs in line with the current API (roles + member codes).
 * Safe to run on every boot.
 */
export async function bootstrapData() {
  const roleResult = await Admin.updateMany(
    { $or: [{ role: { $exists: false } }, { role: null }, { role: '' }] },
    { $set: { role: 'owner' } }
  );

  await Admin.updateMany(
    { role: 'owner', $or: [{ permissions: { $exists: false } }, { permissions: null }] },
    { $set: { permissions: ALL_PERMISSION_KEYS } }
  );

  await Admin.updateMany(
    { role: 'staff', $or: [{ permissions: { $exists: false } }, { permissions: null }] },
    { $set: { permissions: DEFAULT_STAFF_PERMISSIONS } }
  );

  const missing = await Member.find({
    $or: [{ code: { $exists: false } }, { code: null }, { code: '' }],
  })
    .sort({ createdAt: 1 })
    .select('_id');

  let coded = 0;
  if (missing.length) {
    const last = await Member.findOne({ code: { $regex: /^SA-\d+$/ } })
      .sort({ code: -1 })
      .select('code')
      .lean();
    let n = 1;
    if (last?.code) {
      const match = String(last.code).match(/(\d+)$/);
      if (match) n = Number(match[1]) + 1;
    }
    for (const row of missing) {
      await Member.updateOne(
        { _id: row._id },
        { $set: { code: `SA-${String(n).padStart(4, '0')}` } }
      );
      n += 1;
      coded += 1;
    }
  }

  return {
    adminsRoleFixed: roleResult.modifiedCount || 0,
    membersCoded: coded,
  };
}
