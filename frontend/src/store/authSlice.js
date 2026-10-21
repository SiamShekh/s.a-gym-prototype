import { createSlice } from '@reduxjs/toolkit'
import { saApi } from '../api/saApi'
import { DEFAULT_STAFF_PERMISSIONS } from '../lib/permissions'

const STORAGE_KEY = 'sa_gym_session'

function readSession() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const saved = readSession()

function persist(state) {
  sessionStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      token: state.token,
      adminName: state.adminName,
      adminRole: state.adminRole,
      adminId: state.adminId,
      permissions: state.permissions,
    }),
  )
}

function applyAdmin(state, admin, token) {
  if (token) state.token = token
  state.adminName = admin?.name || null
  state.adminRole = admin?.role || 'owner'
  state.adminId = admin?.id || null
  state.permissions =
    admin?.role === 'owner' ? null : admin?.permissions || DEFAULT_STAFF_PERMISSIONS
  persist(state)
}

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    token: saved?.token || null,
    adminName: saved?.adminName || null,
    adminRole: saved?.adminRole || null,
    adminId: saved?.adminId || null,
    permissions: saved?.permissions || null,
    status: 'idle',
  },
  reducers: {
    logout(state) {
      state.token = null
      state.adminName = null
      state.adminRole = null
      state.adminId = null
      state.permissions = null
      state.status = 'idle'
      sessionStorage.removeItem(STORAGE_KEY)
    },
    updateSessionProfile(state, action) {
      if (action.payload.adminName != null) {
        state.adminName = action.payload.adminName
      }
      persist(state)
    },
  },
  extraReducers(builder) {
    builder
      .addMatcher(saApi.endpoints.login.matchPending, (state) => {
        state.status = 'loading'
      })
      .addMatcher(saApi.endpoints.login.matchFulfilled, (state, action) => {
        state.status = 'idle'
        applyAdmin(state, action.payload.admin, action.payload.token)
      })
      .addMatcher(saApi.endpoints.login.matchRejected, (state) => {
        state.status = 'idle'
      })
  },
})

export const { logout, updateSessionProfile } = authSlice.actions
export default authSlice.reducer
