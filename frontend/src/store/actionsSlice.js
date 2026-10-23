import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { saApi } from '../api/saApi'

let fetchSeq = 0

export const fetchActions = createAsyncThunk(
  'actions/fetch',
  async (params = {}, { dispatch, rejectWithValue }) => {
    const seq = ++fetchSeq
    try {
      const data = await dispatch(
        saApi.endpoints.getActions.initiate(params, { forceRefetch: true }),
      ).unwrap()
      return {
        actions: data.actions,
        pagination: data.pagination || null,
        query: params,
        seq,
      }
    } catch (err) {
      return rejectWithValue({ seq, message: err?.data?.message || 'failed' })
    }
  },
)

const actionsSlice = createSlice({
  name: 'actions',
  initialState: {
    list: [],
    status: 'idle',
    pagination: null,
    query: { page: 1, limit: 30, type: 'all', from: '', to: '' },
  },
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(fetchActions.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(fetchActions.fulfilled, (state, action) => {
        if (action.payload.seq !== fetchSeq) return
        state.status = 'idle'
        state.list = action.payload.actions
        state.pagination = action.payload.pagination
        state.query = { ...state.query, ...action.payload.query }
      })
      .addCase(fetchActions.rejected, (state, action) => {
        if (action.payload?.seq !== fetchSeq) return
        state.status = 'error'
      })
  },
})

export default actionsSlice.reducer
