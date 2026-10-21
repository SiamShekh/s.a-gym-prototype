/** Dev: `/api` (Vite proxy). Prod (split hosts): full backend URL ending in `/api`. */
const BASE = String(import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')

export async function api(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  let res
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    const error = new Error('network')
    error.status = 0
    throw error
  }
  const text = await res.text()
  const data = text ? JSON.parse(text) : null
  if (!res.ok) {
    const error = new Error(data?.message || 'request failed')
    error.status = res.status
    error.data = data
    throw error
  }
  return data
}
