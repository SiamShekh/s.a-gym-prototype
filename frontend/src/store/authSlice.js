import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { api } from '../api/client'

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

export const login = createAsyncThunk('auth/login', async ({ phone, password }, { rejectWithValue }) => {
  const normalizedPhone = phone.replace(/[\s-]/g, '').trim()
  try {
    return await api('/auth/login', {
      method: 'POST',
      body: { phone: normalizedPhone, password },
    })
  } catch (err) {
    return rejectWithValue({ status: err.status ?? 0, message: err.message })
  }
})

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    token: saved?.token || null,
    adminName: saved?.adminName || null,
    adminRole: saved?.adminRole || null,
    adminId: saved?.adminId || null,
    status: 'idle',
  },
  reducers: {
    logout(state) {
      state.token = null
      state.adminName = null
      state.adminRole = null
      state.adminId = null
      sessionStorage.removeItem(STORAGE_KEY)
    },
    updateSessionProfile(state, action) {
      if (action.payload.adminName != null) {
        state.adminName = action.payload.adminName
      }
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          token: state.token,
          adminName: state.adminName,
          adminRole: state.adminRole,
          adminId: state.adminId,
        }),
      )
    },
  },
  extraReducers(builder) {
    builder
      .addCase(login.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'idle'
        state.token = action.payload.token
        state.adminName = action.payload.admin?.name || null
        state.adminRole = action.payload.admin?.role || 'owner'
        state.adminId = action.payload.admin?.id || null
        sessionStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            token: state.token,
            adminName: state.adminName,
            adminRole: state.adminRole,
            adminId: state.adminId,
          }),
        )
      })
      .addCase(login.rejected, (state) => {
        state.status = 'idle'
      })
  },
})

export const { logout, updateSessionProfile } = authSlice.actions
export default authSlice.reducer
