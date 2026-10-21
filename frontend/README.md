# S.A Gym (React)

Black / red admin UI matching the previous Android app.

```bash
npm install
npm run dev
```

Uses React Router, Redux Toolkit, React Hook Form, and Sonner. API calls go to `/api` (Vite proxies via `VITE_API_PROXY_TARGET`).

**Production (separate static host):** set `VITE_API_URL=https://YOUR-API.up.railway.app/api` at build time. Missing this causes login `405` on the static domain.
