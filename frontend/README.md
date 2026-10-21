# S.A Gym (React)

```bash
npm install
npm run dev
```

API layer: RTK Query (`src/api/baseApi.js` + `saApi.js`).  
`baseUrl` = `VITE_API_URL` or `/api` (Vite proxies via `VITE_API_PROXY_TARGET`).

## Production 405 fix

On Railway **frontend** variables:

```bash
VITE_API_URL=https://YOUR-BACKEND.up.railway.app/api
```

Then redeploy the frontend.
