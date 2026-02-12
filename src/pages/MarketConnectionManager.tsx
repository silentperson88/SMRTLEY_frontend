'use client'

import { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { updatePrice } from 'src/store/slices/subscribeMarket.slice'
import { WsMessage } from 'src/types/ws'

export default function MarketConnectionManager() {
  const dispatch = useDispatch()
  const wsRef = useRef<WebSocket | null>(null)
  const prevSymbolsRef = useRef<string[]>([])

  const symbols = useSelector((state: any) => state.market.symbols)

  useEffect(() => {
    if (symbols.length === 0) return

    // 1️⃣ Open WS only once
    if (!wsRef.current) {
      const ws = new WebSocket('ws://localhost:8080')
      wsRef.current = ws

      ws.onopen = () => {
        console.log('WS connected')
        ws.send(
          JSON.stringify({
            type: 'SUBSCRIBE',
            symbols
          })
        )
        prevSymbolsRef.current = symbols
      }

      ws.onmessage = (event: MessageEvent) => {
        const msg: WsMessage = JSON.parse(event.data)

        if (msg.type === 'PRICE_UPDATE') {
          dispatch(
            updatePrice({
              symbol: msg.symbol,
              data: msg.data
            })
          )
        }
      }

      ws.onerror = err => {
        console.error('WS error', err)
      }

      return
    }

    // 2️⃣ Incremental subscribe (new symbols only)
    const newSymbols = symbols.filter((s: string) => !prevSymbolsRef.current.includes(s))

    if (newSymbols.length && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'SUBSCRIBE',
          symbols: newSymbols
        })
      )
    }

    prevSymbolsRef.current = symbols
  }, [symbols.join(',')])

  // 3️⃣ Cleanup (optional – usually on logout)
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [])

  return null // invisible engine
}
