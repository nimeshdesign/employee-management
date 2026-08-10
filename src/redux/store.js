import { configureStore } from '@reduxjs/toolkit'
import employeeReducer from './slices/employeeSlice'

// configureStore sets up the Redux store with good defaults baked in
// (Redux DevTools, the thunk middleware createAsyncThunk needs, dev-mode
// checks for accidental state mutation) — the older createStore() required
// wiring all of that by hand.
export const store = configureStore({
  reducer: {
    employees: employeeReducer,
  },
})