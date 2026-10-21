/** Keep in sync with backend/src/constants/permissions.js */
export const PERMISSION_OPTIONS = [
  { key: 'view_members', label: 'সদস্য দেখা' },
  { key: 'create_members', label: 'নতুন সদস্য' },
  { key: 'edit_members', label: 'সদস্য এডিট' },
  { key: 'delete_members', label: 'সদস্য ডিলিট' },
  { key: 'accept_payment', label: 'পেমেন্ট গ্রহণ' },
  { key: 'view_payments', label: 'পেমেন্ট হিস্টোরি' },
  { key: 'manage_expenses', label: 'খরচ ম্যানেজ' },
  { key: 'view_reports', label: 'ড্যাশবোর্ড / রিপোর্ট' },
  { key: 'send_notifications', label: 'নোটিফিকেশন' },
  { key: 'view_actions', label: 'অ্যাকশন লগ' },
]

export const ALL_PERMISSION_KEYS = PERMISSION_OPTIONS.map((p) => p.key)

export const DEFAULT_STAFF_PERMISSIONS = ALL_PERMISSION_KEYS.filter((k) => k !== 'delete_members')

export function hasPermission(role, permissions, key) {
  if (role === 'owner') return true
  const list = Array.isArray(permissions) ? permissions : DEFAULT_STAFF_PERMISSIONS
  return list.includes(key)
}

export function permissionLabels(permissions) {
  if (!Array.isArray(permissions) || !permissions.length) return 'কোনো অনুমতি নেই'
  const map = Object.fromEntries(PERMISSION_OPTIONS.map((p) => [p.key, p.label]))
  return permissions.map((k) => map[k] || k).join(' · ')
}
