import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import * as employeeService from '../../services/employeeService'

// createAsyncThunk wraps an async  function and auto-generates three action
// types — pending/fulfilled/rejected — dispatchedautomatically as the
// promise settles. No hand-written try/catch/finally + setLoading/setError;
// extraReducers below just reacts to whichever one fires.
export const fetchEmployees = createAsyncThunk('employees/fetch', async () => {
  return employeeService.getEmployees()
})

export const addEmployee = createAsyncThunk('employees/add', async (formData) => {
  return employeeService.createEmployee(formData)
})

export const updateEmployee = createAsyncThunk('employees/update', async ({ id, formData }) => {
  return employeeService.updateEmployee(id, formData)
})

export const deleteEmployee = createAsyncThunk('employees/delete', async (id) => {
  await employeeService.deleteEmployee(id)
  return id
})

const employeeSlice = createSlice({
  name: 'employees',
  initialState: {
    items: [],
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
    // Tracks ids added via addEmployee THIS session — GoRest gives us no
    // "date hired" field to derive a real "New Employees" count from, so
    // the Dashboard's stat card uses this instead: genuinely new, just
    // scoped to "since you opened the app" rather than a calendar window.
    newlyAddedIds: [],
  },
  reducers: {},
  // extraReducers handles actions this slice didn't define itself — here,
  // the pending/fulfilled/rejected actions createAsyncThunk generated above.
  // Redux Toolkit uses Immer internally, so writing `state.items.push(...)`
  // is safe — it looks like a mutation, but Immer records these as an
  // immutable update behind the scenes. Plain Redux would never allow this.
  extraReducers: (builder) => {
    builder
      .addCase(fetchEmployees.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchEmployees.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload
      })
      .addCase(fetchEmployees.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.error.message
      })
      .addCase(addEmployee.fulfilled, (state, action) => {
        // unshift, not push — puts the new hire at the FRONT of the list.
        // With push, a new employee lands at the end of the array, which
        // (with no active sort) means the last page — invisible unless you
        // page all the way through. unshift + resetting to page 1 in
        // Employees.jsx guarantees it's visible immediately.
        state.items.unshift(action.payload)
        state.newlyAddedIds.push(action.payload.id)
      })
      .addCase(updateEmployee.fulfilled, (state, action) => {
        const index = state.items.findIndex((emp) => emp.id === action.payload.id)
        if (index !== -1) state.items[index] = action.payload
      })
      .addCase(deleteEmployee.fulfilled, (state, action) => {
        state.items = state.items.filter((emp) => emp.id !== action.payload)
        state.newlyAddedIds = state.newlyAddedIds.filter((id) => id !== action.payload)
      })
  },
})

export default employeeSlice.reducer