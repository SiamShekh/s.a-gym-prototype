import { configureStore } from '@reduxjs/toolkit'
import auth from './authSlice'
import members from './membersSlice'

export const store = configureStore({
  reducer: { auth, members },
})
