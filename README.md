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

## Fix login 405 on Railway

The dashboard static host cannot handle `POST /api/*`. Point the frontend at your **backend** URL.

1. Deploy **backend** as its own Railway service  
   - Root Directory: `backend`  
   - Start: `npm start`  
   - Env: `MONGODB_URI`, `JWT_SECRET`, `CORS_ORIGIN=*` (or your dashboard URL)
2. Copy the backend public URL, e.g. `https://xxxxx.up.railway.app`
3. On the **frontend** service → Variables (build-time):

```bash
VITE_API_URL=https://xxxxx.up.railway.app/api
```

4. **Redeploy frontend** (Vite bakes this in at build time)

Check:

```bash
npm run smoke -- https://xxxxx.up.railway.app
```
