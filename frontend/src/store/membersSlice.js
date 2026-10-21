import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { api } from '../api/client'
import { calcExpiry, planAmount, today } from '../lib/memberUtils'

export const fetchMembers = createAsyncThunk('members/fetch', async (_, { getState }) => {
  const { token } = getState().auth
  const data = await api('/members', { token })
  return data.members
})

export const saveMember = createAsyncThunk(
  'members/save',
  async ({ member, editing }, { getState, dispatch }) => {
    const { token } = getState().auth
    if (editing) {
      await api(`/members/${member.id}`, { method: 'PUT', body: member, token })
    } else {
      await api('/members', { method: 'POST', body: { ...member, id: '' }, token })
    }
    await dispatch(fetchMembers()).unwrap()
    return { name: member.name, editing }
  },
)

export const deleteMember = createAsyncThunk('members/delete', async (member, { getState, dispatch }) => {
  const { token } = getState().auth
  await api(`/members/${member.id}`, { method: 'DELETE', token })
  await dispatch(fetchMembers()).unwrap()
  return member.name
})

export const processPayment = createAsyncThunk(
  'members/pay',
  async ({ memberId, plan, method }, { getState, dispatch }) => {
    const { token } = getState().auth
    const member = getState().members.list.find((m) => m.id === memberId)
    if (!member) throw new Error('missing')
    const join = today()
    const expiry = calcExpiry(join, plan)
    const updated = {
      ...member,
      join,
      expiry,
      plan,
      amount: planAmount(plan),
      paid: true,
    }
    await api(`/members/${member.id}`, { method: 'PUT', body: updated, token })
    await dispatch(fetchMembers()).unwrap()
    return { name: member.name, method, expiry }
  },
)

const membersSlice = createSlice({
  name: 'members',
  initialState: {
    list: [],
    status: 'idle',
    pendingPayMemberId: null,
  },
  reducers: {
    requestPay(state, action) {
      state.pendingPayMemberId = action.payload
    },
    consumePayRequest(state) {
      state.pendingPayMemberId = null
    },
  },
  extraReducers(builder) {
    builder
      .addCase(fetchMembers.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(fetchMembers.fulfilled, (state, action) => {
        state.status = 'idle'
        state.list = action.payload
      })
      .addCase(fetchMembers.rejected, (state) => {
        state.status = 'error'
      })
  },
})

export const { requestPay, consumePayRequest } = membersSlice.actions
export default membersSlice.reducer
