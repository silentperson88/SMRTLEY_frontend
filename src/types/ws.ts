export interface Candles {
  o: number
  h: number
  l: number
  c: number
  t: string
}

export type PricePayload = {
  ltp: number
  open: number
  high: number
  low: number
  close: number
  volume: number
  timestamp: string
  dayCandles: Candles[]
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
