import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { saApi } from '../api/saApi'

export const fetchActions = createAsyncThunk(
  'actions/fetch',
  async (params = {}, { dispatch }) => {
    const data = await dispatch(
      saApi.endpoints.getActions.initiate(params, { forceRefetch: true }),
    ).unwrap()
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
    query: { page: 1, limit: 30, type: 'all', from: '', to: '' },
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
