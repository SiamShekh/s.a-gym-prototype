import config from '../config/index.js';

/** Bangla/Unicode SMS ≈ 70 chars per billable part. Keep default to 1 part. */
export const DEFAULT_SMS_MAX_CHARS = 70;

/** Upcoming + recently-ended stages only (never older than 7 days expired). */
export const SMS_BUCKETS = ['today', 'tomorrow', 'd2_3', 'd4_7', 'ended_3d', 'ended_7d'];

export const BUCKET_META = {
  today: { key: 'today', title: 'আজ শেষ', hint: 'মেয়াদ আজ শেষ' },
  tomorrow: { key: 'tomorrow', title: 'কাল শেষ', hint: 'মেয়াদ কাল শেষ' },
  d2_3: { key: 'd2_3', title: '২–৩ দিনে শেষ', hint: 'শীঘ্রই মেয়াদ শেষ' },
  d4_7: { key: 'd4_7', title: '৪–৭ দিনে শেষ', hint: 'আগামী সপ্তাহে শেষ' },
  ended_3d: { key: 'ended_3d', title: 'শেষ ৩ দিনে উত্তীর্ণ', hint: '১–৩ দিন আগে মেয়াদ শেষ' },
  ended_7d: { key: 'ended_7d', title: '৭ দিন আগে উত্তীর্ণ', hint: '৪–৭ দিন আগে মেয়াদ শেষ' },
};

export function gymPhoneDigits() {
  return String(config.gymPhone || '01746933966').replace(/[\s-]/g, '');
}

/**
 * Map daysLeft to a sendable bucket.
 * daysLeft > 7 or < -7 → null (out of window / anti-spam cutoff)
 */
export function smsBucketForDaysLeft(days) {
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  if (days >= 2 && days <= 3) return 'd2_3';
  if (days >= 4 && days <= 7) return 'd4_7';
  if (days <= -1 && days >= -3) return 'ended_3d';
  if (days <= -4 && days >= -7) return 'ended_7d';
  return null;
}

export function buildExpirySms(daysLeft) {
  const phone = gymPhoneDigits();
  let message;
  if (daysLeft < 0) {
    const ago = Math.abs(daysLeft);
    message = `S.A Gym: মেয়াদ ${ago}দিন আগে শেষ। রিনিউ ${phone}`;
  } else if (daysLeft === 0) {
    message = `S.A Gym: মেয়াদ আজ শেষ। রিনিউ ${phone}`;
  } else if (daysLeft === 1) {
    message = `S.A Gym: মেয়াদ কাল শেষ। রিনিউ ${phone}`;
  } else {
    message = `S.A Gym: মেয়াদ ${daysLeft} দিনে শেষ। রিনিউ ${phone}`;
  }
  return clampSms(message);
}

export function clampSms(message, max = config.smsMaxChars) {
  const text = String(message || '').trim();
  const limit = Math.max(20, Number(max) || DEFAULT_SMS_MAX_CHARS);
  if (text.length <= limit) {
    return { message: text, charCount: text.length, truncated: false, maxChars: limit };
  }
  const cut = text.slice(0, Math.max(1, limit - 1)).trimEnd();
  return {
    message: `${cut}…`,
    charCount: cut.length + 1,
    truncated: true,
    maxChars: limit,
  };
}

export function normalizeBdPhone(phone) {
  let p = String(phone || '').replace(/[\s-]/g, '');
  if (p.startsWith('+880')) p = `0${p.slice(4)}`;
  if (p.startsWith('880')) p = `0${p.slice(3)}`;
  if (!/^01\d{9}$/.test(p)) return null;
  return p;
}

/** Friday = 5 in JS getDay() when using en-US in Asia/Dhaka */
export function getDhakaParts(date = new Date()) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: config.smsTimezone || 'Asia/Dhaka',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
    hour: '2-digit',
    hour12: false,
  });
  const parts = Object.fromEntries(fmt.formatToParts(date).map((p) => [p.type, p.value]));
  const weekdayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    weekday: weekdayMap[parts.weekday] ?? null,
    hour: Number(parts.hour),
    dateKey: `${parts.year}-${parts.month}-${parts.day}`,
  };
}

export function isFridayInDhaka(date = new Date()) {
  return getDhakaParts(date).weekday === 5;
}
