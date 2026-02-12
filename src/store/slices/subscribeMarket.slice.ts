// marketSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface PricePayload {
  ltp: number
  open?: number
  high?: number
  low?: number
  close?: number
}

interface MarketState {
  symbols: string[] // master subscription list
  prices: Record<string, PricePayload>
}

const initialState: MarketState = {
  symbols: [],
  prices: {}
}

const marketSlice = createSlice({
  name: 'market',
  initialState,
  reducers: {
    requestSubscribe(state, action: PayloadAction<string | string[]>) {
      const list = Array.isArray(action.payload) ? action.payload : [action.payload]

      list.forEach(symbol => {
        if (!state.symbols.includes(symbol)) {
          state.symbols.push(symbol)
        }
      })
    },

    requestUnsubscribe(state, action: PayloadAction<string>) {
      state.symbols = state.symbols.filter(s => s !== action.payload)
      delete state.prices[action.payload]
    },

    updatePrice(state, action: PayloadAction<{ symbol: string; data: PricePayload }>) {
      state.prices[action.payload.symbol] = action.payload.data
    },

    resetMarket: () => initialState
  }
})

export const { requestSubscribe, requestUnsubscribe, updatePrice, resetMarket } = marketSlice.actions

export default marketSlice.reducer
