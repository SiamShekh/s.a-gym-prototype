# S.A Gym Backend

Express REST API with MongoDB (Mongoose), Yup validation, and JWT admin auth.

## Setup

```bash
cd backend
cp .env.example .env
# Start MongoDB locally, then:
npm install
npm run seed:admin
npm run dev
```

Default seeded admin:

- phone: `01746933966`
- password: `123456`
- role: `owner`

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start API with watch |
| `npm start` | Start API |
| `npm run seed:admin` | Create/update owner admin |
| `npm test` | Run Vitest suite |

## Endpoints (frontend contract)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/health` | no | Health check |
| POST | `/api/auth/login` | no | `{ phone, password }` → `{ token, admin }` |
| GET | `/api/members` | Bearer | List (`page`, `limit`, `q`, `status=active\|expiring\|expired\|unpaid`) |
| GET | `/api/members/:id` | Bearer | Get one |
| POST | `/api/members` | Bearer | Create (+ auto `SA-XXXX` code, payment if paid) |
| PUT | `/api/members/:id` | Bearer | Update |
| DELETE | `/api/members/:id` | Bearer | Delete |
| POST | `/api/members/:id/pay` | Bearer | Accept payment `{ plan, amount, method }` |
| GET | `/api/payments` | Bearer | Payment history |
| GET | `/api/expenses` | Bearer | List expenses |
| POST | `/api/expenses` | Bearer | Create expense |
| DELETE | `/api/expenses/:id` | Bearer | Delete expense |
| GET | `/api/reports/overview` | Bearer | Dashboard revenue / expense / profit |
| GET | `/api/actions` | Bearer | Current admin action log |
| GET | `/api/admins` | Owner | List admins |
| POST | `/api/admins` | Owner | Create admin |
| PATCH | `/api/admins/:id/active` | Owner | Activate / deactivate |
| GET | `/api/auth/me` | Bearer | Current admin |
| PATCH | `/api/auth/profile` | Bearer | Update name / password |
| GET | `/api/notifications/queue` | Bearer | Today's auto SMS queue |
| GET | `/api/notifications/history` | Bearer | SMS message log |
| POST | `/api/notifications/cron` | `X-Cron-Secret` | Daily auto-send job |

### SMS auto cron (SMS Gateway BD + Railway)

Configure in `.env` (keys from [app.smsgatewaybd.com/api](https://app.smsgatewaybd.com/api)):

```
SMS_ENABLED=true
SMS_API_URL=https://api.smsgateway.com.bd/api/send-message
SMS_CLIENT_ID=...
SMS_API_KEY=...
SMS_SENDER_ID=...
SMS_MAX_CHARS=70
SMS_TZ=Asia/Dhaka
SMS_SKIP_WEEKDAYS=5
SMS_MAX_PER_CYCLE=3
SMS_DAILY_MAX=200
CRON_SECRET=long-random-secret
```

**Railway Cron** (example daily 10:00 UTC+6 ≈ 04:00 UTC):

```
POST https://YOUR-API.up.railway.app/api/notifications/cron
Header: X-Cron-Secret: <CRON_SECRET>
```

Buckets (auto):
- today / tomorrow / 2–3d / 4–7d upcoming
- ended last 3d / ended 4–7d
- **never** SMS if expired more than 7 days

Anti-spam:
- one SMS per bucket per membership expiry cycle
- max 3 SMS per member per cycle
- Friday skipped (`SMS_SKIP_WEEKDAYS=5`)
- daily budget `SMS_DAILY_MAX`

Admin UI shows **queue + message history** (no manual alert button).

### Create member body

```json
{
  "name": "রাহুল ইসলাম",
  "phone": "01712345678",
  "address": "সুজানগর",
  "join": "2026-09-01",
  "plan": "30:1000"
}
```

`plan` must be one of: `30:1000`, `90:2500`, `365:10000`.  
`amount` and `expiry` are derived from plan + join when omitted.

### Payment body

```json
{
  "plan": "30:1000",
  "amount": 1000,
  "method": "bkash"
}
```

`method`: `bkash` | `nagad` | `rocket` | `cash`
