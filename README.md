# S.A Gym Management (Monorepo)

```
sa-manegement/
├── frontend/   # React (Vite, React Router, Redux Toolkit, React Hook Form, Sonner)
└── backend/    # Express REST API
```

## Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

API: `http://localhost:4000/api`

## Web app

```bash
cd frontend
npm install
npm run dev
```

Dev server: `http://localhost:5173` (proxies `/api` to the backend).

## Root scripts

```bash
npm run install:all
npm run dev:backend
npm run dev:web
```

## Railway deploy

### Option A — one service (recommended)

Deploy the **repo root** with `railway.toml` (builds `frontend/dist`, Express serves it + `/api`). Browser can keep using `/api` — no `VITE_API_URL` needed.

### Option B — two services (static frontend + API)

On the **frontend** service set a **build-time** variable, then redeploy:

```bash
VITE_API_URL=https://YOUR-API.up.railway.app/api
```

Without this, `POST /api/auth/login` hits the static host and returns **405 Method Not Allowed** (`Allow: GET, HEAD`).

On the **backend** service (optional):

```bash
CORS_ORIGIN=https://dashboard-production-afb4.up.railway.app
```
