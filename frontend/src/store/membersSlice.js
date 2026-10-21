import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { api } from '../api/client'

function toQuery(params = {}) {
  const search = new URLSearchParams()
  if (params.page != null) search.set('page', String(params.page))
  if (params.limit != null) search.set('limit', String(params.limit))
  if (params.q) search.set('q', params.q)
  if (params.status && params.status !== 'all') search.set('status', params.status)
  const qs = search.toString()
  return qs ? `?${qs}` : ''
}

export const fetchMembers = createAsyncThunk(
  'members/fetch',
  async (params = {}, { getState }) => {
    const { token } = getState().auth
    const data = await api(`/members${toQuery(params)}`, { token })
    return {
      members: data.members,
      pagination: data.pagination || null,
      query: params,
    }
  },
)

async function refetchCurrent(dispatch, getState) {
  const query = getState().members.query
  await dispatch(fetchMembers(query)).unwrap()
}

export const saveMember = createAsyncThunk(
  'members/save',
  async ({ member, editing }, { getState, dispatch }) => {
    const { token } = getState().auth
    if (editing) {
      await api(`/members/${member.id}`, { method: 'PUT', body: member, token })
    } else {
      await api('/members', { method: 'POST', body: { ...member, id: '' }, token })
    }
    await refetchCurrent(dispatch, getState)
    return { name: member.name, editing }
  },
)

export const deleteMember = createAsyncThunk('members/delete', async (member, { getState, dispatch }) => {
  const { token } = getState().auth
  await api(`/members/${member.id}`, { method: 'DELETE', token })
  await refetchCurrent(dispatch, getState)
  return member.name
})

export const processPayment = createAsyncThunk(
  'members/pay',
  async ({ memberId, plan, method, amount }, { getState, dispatch }) => {
    const { token } = getState().auth
    const member = getState().members.list.find((m) => m.id === memberId)
    if (!member) throw new Error('missing')
    const paidAmount = Number(amount)
    if (!Number.isFinite(paidAmount) || paidAmount <= 0) throw new Error('amount')
    const data = await api(`/members/${member.id}/pay`, {
      method: 'POST',
      body: { plan, method, amount: paidAmount },
      token,
    })
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
        state.status = 'idle'
        state.list = action.payload.members
        state.pagination = action.payload.pagination
        state.query = action.payload.query || {}
      })
      .addCase(fetchMembers.rejected, (state) => {
        state.status = 'error'
      })
  },
})

export default membersSlice.reducer
