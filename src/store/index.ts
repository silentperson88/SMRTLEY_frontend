import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import adminReducer from './slices/admin.slice'
import SubbscribeMArketSlice from './slices/subscribeMarket.slice'
import portfolioReducer from './slices/portfolio.slice'

export const store = configureStore({
  reducer: {
    admin: adminReducer,
    market: SubbscribeMArketSlice,
    portfolio: portfolioReducer
  }

  //   middleware: getDefaultMiddleware => getDefaultMiddleware().concat(stockApi.middleware)
})

// Enable listener behavior for RTK Query
setupListeners(store.dispatch)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export default store
