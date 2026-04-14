import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface LiveStockRow {
  master_id?: string
  symbol: string
  token: string
  exchange: string
  ltp: number
  open: number
  high: number
  low: number
  close: number
  percentChange: number
  id: string
  status: string
  name: string
  hasHistoryData?: boolean
  historyDataFromDate?: string | null
  historyDataToDate?: string | null
}

interface LiveStocksState {
  searchKey: string
  stocks: LiveStockRow[]
  nextPage: number
  hasMore: boolean
}

const initialState: LiveStocksState = {
  searchKey: '',
  stocks: [],
  nextPage: 1,
  hasMore: true
}

const liveStocksSlice = createSlice({
  name: 'liveStocks',
  initialState,
  reducers: {
    setLiveStocksSnapshot(
      state,
      action: PayloadAction<{
        searchKey: string
        stocks: LiveStockRow[]
        nextPage: number
        hasMore: boolean
      }>
    ) {
      state.searchKey = action.payload.searchKey
      state.stocks = action.payload.stocks
      state.nextPage = action.payload.nextPage
      state.hasMore = action.payload.hasMore
    },
    clearLiveStocksSnapshot(state) {
      state.searchKey = ''
      state.stocks = []
      state.nextPage = 1
      state.hasMore = true
    }
  }
})

export const { setLiveStocksSnapshot, clearLiveStocksSnapshot } = liveStocksSlice.actions

export default liveStocksSlice.reducer
