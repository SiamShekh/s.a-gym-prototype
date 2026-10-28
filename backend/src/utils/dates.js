const TZ = process.env.SMS_TZ || 'Asia/Dhaka';

/** Calendar day in the gym timezone (Railway runs in UTC). */
export function todayIso(date = new Date(), timeZone = TZ) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const get = (type) => parts.find((p) => p.type === type)?.value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

/** Add days on the calendar date, independent of the server timezone. */
export function addDaysIso(iso, days) {
  const [y, m, d] = String(iso).split('-').map(Number);
  if (!y || !m || !d) return iso;
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + days);
  const yy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

export function monthKey(d = new Date()) {
  return todayIso(d).slice(0, 7);
}

export function monthRange(key) {
  const [y, m] = key.split('-').map(Number);
  const start = `${y}-${String(m).padStart(2, '0')}-01`;
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const end = `${y}-${String(m).padStart(2, '0')}-${String(last).padStart(2, '0')}`;
  return { start, end };
}

export function isIsoDay(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

/** Inclusive calendar span in days. */
export function daysBetweenIso(from, to) {
  const [ay, am, ad] = String(from).split('-').map(Number);
  const [by, bm, bd] = String(to).split('-').map(Number);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86400000);
}

export function monthKeysBetween(fromIso, toIso) {
  const keys = [];
  let [y, m] = String(fromIso).slice(0, 7).split('-').map(Number);
  const end = String(toIso).slice(0, 7);
  while (keys.length < 36) {
    const key = `${y}-${String(m).padStart(2, '0')}`;
    keys.push(key);
    if (key >= end) break;
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return keys;
}

export function eachIsoDay(from, to, cap = 400) {
  const days = [];
  let cur = from;
  while (cur <= to && days.length < cap) {
    days.push(cur);
    cur = addDaysIso(cur, 1);
  }
  return days;
}

export function lastNMonthKeys(n = 6, from = new Date()) {
  const [y, m] = todayIso(from).split('-').map(Number);
  const keys = [];
  for (let i = n - 1; i >= 0; i -= 1) {
    const date = new Date(Date.UTC(y, m - 1 - i, 1));
    const yy = date.getUTCFullYear();
    const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
    keys.push(`${yy}-${mm}`);
  }
  return keys;
}

const BN_MONTHS = [
  'জানু',
  'ফেব',
  'মার্চ',
  'এপ্রিল',
  'মে',
  'জুন',
  'জুলাই',
  'আগস্ট',
  'সেপ্ট',
  'অক্টো',
  'নভে',
  'ডিসে',
];

export function monthLabelBn(key) {
  const [, m] = key.split('-').map(Number);
  return BN_MONTHS[(m || 1) - 1] || key;
}
