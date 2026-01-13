import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface AdminState {
  serverStatus: {
    isOnline: boolean
    lastCheckedAt: number | null
  }
}

const initialState: AdminState = {
  serverStatus: {
    isOnline: false,
    lastCheckedAt: null
  }
}

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    setServerStatus(state, action: PayloadAction<boolean>) {
      state.serverStatus.isOnline = action.payload
      state.serverStatus.lastCheckedAt = Date.now()
    }
  }
})

export const { setServerStatus } = adminSlice.actions
export default adminSlice.reducer
