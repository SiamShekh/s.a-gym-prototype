import { configureStore } from '@reduxjs/toolkit'
import { baseApi } from '../api/baseApi'
import '../api/saApi'
import auth from './authSlice'
import members from './membersSlice'
import actions from './actionsSlice'

export const store = configureStore({
  reducer: {
    auth,
    members,
    actions,
    [baseApi.reducerPath]: baseApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware),
})
