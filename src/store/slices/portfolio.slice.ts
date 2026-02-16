import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { MyPortfolio, PortfolioType } from 'src/types/portfolio'

interface PortfolioState {
  portfolioTypes: PortfolioType[]
  myPortfolios: MyPortfolio[]
  selectedPortfolioId: string | null
}

const initialState: PortfolioState = {
  portfolioTypes: [],
  myPortfolios: [],
  selectedPortfolioId: null
}

const portfolioSlice = createSlice({
  name: 'portfolio',
  initialState,
  reducers: {
    setPortfolioTypes(state, action: PayloadAction<PortfolioType[]>) {
      state.portfolioTypes = action.payload
    },
    setMyPortfolios(state, action: PayloadAction<MyPortfolio[]>) {
      state.myPortfolios = action.payload
      if (!state.selectedPortfolioId && action.payload.length > 0) {
        state.selectedPortfolioId = action.payload[0]._id
      }
    },
    setSelectedPortfolioId(state, action: PayloadAction<string | null>) {
      state.selectedPortfolioId = action.payload
    },
    clearPortfolioState(state) {
      state.portfolioTypes = []
      state.myPortfolios = []
      state.selectedPortfolioId = null
    }
  }
})

export const { setPortfolioTypes, setMyPortfolios, setSelectedPortfolioId, clearPortfolioState } =
  portfolioSlice.actions

export default portfolioSlice.reducer
