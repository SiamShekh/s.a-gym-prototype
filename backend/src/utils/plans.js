/** Mirrors app MemberUtils plan codes: days:amount */
export const PLAN_CODES = ['30:1000', '90:2500', '365:10000'];

export function planDays(plan) {
  return Number(String(plan).split(':')[0]) || 30;
}

export function planAmount(plan) {
  return Number(String(plan).split(':')[1]) || 0;
}

export function calcExpiry(join, plan) {
  const [y, m, d] = join.split('-').map(Number);
  if (!y || !m || !d) return join;
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + planDays(plan));
  const yy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}
