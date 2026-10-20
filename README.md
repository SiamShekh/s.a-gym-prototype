# S.A Gym Management (Monorepo)

```
sa-manegement/
├── app/
│   ├── android/     # Android Studio project (Retrofit + Picasso)
│   └── web/         # Vite/React + legacy HTML
└── backend/         # Express REST API (modular)
```

## Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

API: `http://localhost:4000/api`

## Android app

1. Start the backend first.
2. Android Studio → **Open** → `app/android`
3. Run on emulator (uses `http://10.0.2.2:4000/api/`).

Physical device: change `BASE_URL` in  
`app/android/app/src/main/java/com/sagym/management/data/api/RetrofitClient.kt`  
to your PC’s LAN IP.

## Web app

```bash
cd app/web
npm install
npm run dev
```

Legacy full UI: open `app/web/index.legacy.html` (or serve via any static server).

## Root scripts

```bash
npm run install:all
npm run dev:backend
npm run dev:web
```
