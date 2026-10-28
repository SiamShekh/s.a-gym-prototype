import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

function resolveApiBase() {
  const raw = String(import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')
  if (raw === '/api' || raw.endsWith('/api')) return raw
  if (/^https?:\/\//i.test(raw)) return `${raw}/api`
  return raw
}

const rawBase = resolveApiBase()

const rawBaseQuery = fetchBaseQuery({
  baseUrl: rawBase,
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth?.token
    if (token) headers.set('Authorization', `Bearer ${token}`)
    return headers
  },
})

function isLoginRequest(args) {
  const url = typeof args === 'string' ? args : args?.url || ''
  return String(url).includes('/auth/login')
}

/** Detect static-host HTML / 405 so callers get a clear error. */
async function baseQuery(args, api, extraOptions) {
  const result = await rawBaseQuery(args, api, extraOptions)
  if (result.error?.status === 401 && !isLoginRequest(args)) {
    api.dispatch({ type: 'auth/logout' })
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      window.location.assign('/login')
    }
  }
  if (result.error) {
    const status = result.error.status
    const data = result.error.data
    const looksHtml =
      typeof data === 'string' && (data.includes('<!doctype') || data.includes('<html'))
    if (status === 405 || status === 'PARSING_ERROR' || looksHtml) {
      return {
        error: {
          status: status === 405 ? 405 : 502,
          data: {
            message:
              'API unreachable. Set VITE_API_URL to your backend (…/api) and redeploy the frontend.',
          },
        },
      }
    }
  }
  return result
}

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: [
    'Members',
    'Actions',
    'Payments',
    'Expenses',
    'Admins',
    'Reports',
    'Notifications',
    'Auth',
  ],
  endpoints: () => ({}),
})
