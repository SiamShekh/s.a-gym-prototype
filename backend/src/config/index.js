import dotenv from 'dotenv';

dotenv.config();

const config = {
  port: Number(process.env.PORT) || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sa-gym',
  jwtSecret: process.env.JWT_SECRET || 'dev-jwt-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  gymPhone: process.env.GYM_PHONE || process.env.SEED_ADMIN_PHONE || '01746933966',
  // SMS Gateway BD — https://app.smsgatewaybd.com/api / https://api.smsgateway.com.bd
  smsApiUrl:
    process.env.SMS_API_URL || 'https://api.smsgateway.com.bd/api/send-message',
  smsClientId: process.env.SMS_CLIENT_ID || '',
  smsApiKey: process.env.SMS_API_KEY || '',
  smsSenderId: process.env.SMS_SENDER_ID || '',
  /** Unicode/Bangla: 70 chars ≈ 1 SMS. Raise only if you accept multi-part billing. */
  smsMaxChars: Math.min(160, Math.max(20, Number(process.env.SMS_MAX_CHARS) || 70)),
  smsEnabled: String(process.env.SMS_ENABLED || 'false').toLowerCase() === 'true',
  smsTimezone: process.env.SMS_TZ || 'Asia/Dhaka',
  /** Comma-separated JS weekdays to skip (0=Sun … 5=Fri). Default Friday only. */
  smsSkipWeekdays: String(process.env.SMS_SKIP_WEEKDAYS || '5')
    .split(',')
    .map((n) => Number(String(n).trim()))
    .filter((n) => Number.isFinite(n)),
  /** Max successful SMS (sent/dry_run) per member per expiry cycle */
  smsMaxPerCycle: Math.max(1, Number(process.env.SMS_MAX_PER_CYCLE) || 3),
  /** Daily budget guard for cron */
  smsDailyMax: Math.max(1, Number(process.env.SMS_DAILY_MAX) || 200),
  cronSecret: process.env.CRON_SECRET || '',
};

export default config;
