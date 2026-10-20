# S.A Gym Backend

Express REST API with MongoDB (Mongoose), Yup validation, and JWT admin auth.

Models follow the Android app:

- **Admin** — login with **phone + password** (LoginActivity)
- **Member** — form fields: name, phone, address, join, plan; derived: expiry, amount; billing: paid

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

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start API with watch |
| `npm start` | Start API |
| `npm run seed:admin` | Create/update an admin in MongoDB |
| `npm test` | Run Vitest suite |

### Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/health` | no | Health check |
| POST | `/api/auth/login` | no | `{ phone, password }` → `{ token, admin }` |
| GET | `/api/members` | Bearer | List members |
| GET | `/api/members/:id` | Bearer | Get one |
| POST | `/api/members` | Bearer | Create |
| PUT | `/api/members/:id` | Bearer | Update |
| DELETE | `/api/members/:id` | Bearer | Delete |

### Create member body (matches MemberFormDialog)

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
`amount` and `expiry` are derived from plan + join when omitted (same rules as `MemberUtils`).
