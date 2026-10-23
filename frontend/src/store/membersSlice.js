import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { saApi } from '../api/saApi'

let fetchSeq = 0

export const fetchMembers = createAsyncThunk(
  'members/fetch',
  async (params = {}, { dispatch, rejectWithValue }) => {
    const seq = ++fetchSeq
    try {
      const data = await dispatch(
        saApi.endpoints.getMembers.initiate(params, { forceRefetch: true }),
      ).unwrap()
      return {
        members: data.members,
        pagination: data.pagination || null,
        query: params,
        seq,
      }
    } catch (err) {
      return rejectWithValue({ seq, message: err?.data?.message || 'failed' })
    }
  },
)

async function refetchCurrent(dispatch, getState) {
  const query = getState().members.query
  await dispatch(fetchMembers(query)).unwrap()
}

export const saveMember = createAsyncThunk(
  'members/save',
  async ({ member, editing }, { dispatch, getState }) => {
    if (editing) {
      await dispatch(
        saApi.endpoints.updateMember.initiate({ ...member, id: member.id }),
      ).unwrap()
    } else {
      await dispatch(saApi.endpoints.createMember.initiate(member)).unwrap()
    }
    await refetchCurrent(dispatch, getState)
    return { name: member.name, editing }
  },
)

export const deleteMember = createAsyncThunk(
  'members/delete',
  async (member, { dispatch, getState }) => {
    await dispatch(saApi.endpoints.deleteMember.initiate(member.id)).unwrap()
    await refetchCurrent(dispatch, getState)
    return member.name
  },
)

export const processPayment = createAsyncThunk(
  'members/pay',
  async ({ memberId, plan, method, amount }, { dispatch, getState }) => {
    const member = getState().members.list.find((m) => m.id === memberId)
    if (!member) throw new Error('missing')
    const paidAmount = Number(amount)
    if (!Number.isFinite(paidAmount) || paidAmount <= 0) throw new Error('amount')
    const data = await dispatch(
      saApi.endpoints.payMember.initiate({
        id: member.id,
        plan,
        method,
        amount: paidAmount,
      }),
    ).unwrap()
    await refetchCurrent(dispatch, getState)
    return {
      name: data.member?.name || member.name,
      method: data.method || method,
      expiry: data.member?.expiry,
      amount: data.amount ?? paidAmount,
    }
  },
)

const membersSlice = createSlice({
  name: 'members',
  initialState: {
    list: [],
    status: 'idle',
    pagination: null,
    query: {},
  },
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(fetchMembers.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(fetchMembers.fulfilled, (state, action) => {
        if (action.payload.seq !== fetchSeq) return
        state.status = 'idle'
        state.list = action.payload.members
        state.pagination = action.payload.pagination
        state.query = action.payload.query || {}
      })
      .addCase(fetchMembers.rejected, (state, action) => {
        if (action.payload?.seq !== fetchSeq) return
        state.status = 'error'
      })
  },
})

export default membersSlice.reducer
