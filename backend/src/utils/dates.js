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
