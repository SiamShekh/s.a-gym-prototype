import { configureStore } from '@reduxjs/toolkit'
import auth from './authSlice'
import members from './membersSlice'
import actions from './actionsSlice'

export const store = configureStore({
  reducer: { auth, members, actions },
})
