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
