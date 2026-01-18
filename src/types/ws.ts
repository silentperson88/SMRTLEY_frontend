export type PricePayload = {
  ltp: number
  open?: number
  high?: number
  low?: number
  close?: number
  volume?: number
  timestamp: number
}

export type WsMessage =
  | {
      type: 'PRICE_UPDATE'
      symbol: string
      data: PricePayload
    }
  | {
      type: 'MARKET_STATE'
      state: 'OPEN' | 'CLOSED' | 'OHLC_RUNNING'
    }
