import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { api } from '../api/client'

function toQuery(params = {}) {
  const search = new URLSearchParams()
  if (params.page != null) search.set('page', String(params.page))
  if (params.limit != null) search.set('limit', String(params.limit))
  if (params.type && params.type !== 'all') search.set('type', params.type)
  const qs = search.toString()
  return qs ? `?${qs}` : ''
}

export const fetchActions = createAsyncThunk(
  'actions/fetch',
  async (params = {}, { getState }) => {
    const { token } = getState().auth
    const data = await api(`/actions${toQuery(params)}`, { token })
    return {
      actions: data.actions,
      pagination: data.pagination || null,
      query: params,
    }
  },
)

const actionsSlice = createSlice({
  name: 'actions',
  initialState: {
    list: [],
    status: 'idle',
    pagination: null,
    query: { page: 1, limit: 30, type: 'all' },
  },
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(fetchActions.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(fetchActions.fulfilled, (state, action) => {
        state.status = 'idle'
        state.list = action.payload.actions
        state.pagination = action.payload.pagination
        state.query = { ...state.query, ...action.payload.query }
      })
      .addCase(fetchActions.rejected, (state) => {
        state.status = 'error'
      })
  },
})

export default actionsSlice.reducer
