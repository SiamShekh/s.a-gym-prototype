/** Granular staff permissions. Owners always have every permission. */
export const ALL_PERMISSION_KEYS = [
  'view_members',
  'create_members',
  'edit_members',
  'delete_members',
  'accept_payment',
  'view_payments',
  'manage_expenses',
  'view_reports',
  'send_notifications',
  'view_actions',
];

/** Sensible defaults when creating staff without an explicit list (backward compatible). */
export const DEFAULT_STAFF_PERMISSIONS = [
  'view_members',
  'create_members',
  'edit_members',
  'accept_payment',
  'view_payments',
  'manage_expenses',
  'view_reports',
  'send_notifications',
  'view_actions',
];

const KEY_SET = new Set(ALL_PERMISSION_KEYS);

export function normalizePermissions(input, { fallback = DEFAULT_STAFF_PERMISSIONS } = {}) {
  if (input == null) return [...fallback];
  if (!Array.isArray(input)) return [...fallback];
  return [...new Set(input.filter((p) => KEY_SET.has(p)))];
}

export function adminHasPermission(admin, key) {
  if (!admin) return false;
  if ((admin.role || 'owner') === 'owner') return true;
  const perms = Array.isArray(admin.permissions) ? admin.permissions : DEFAULT_STAFF_PERMISSIONS;
  return perms.includes(key);
}
