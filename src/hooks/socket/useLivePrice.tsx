import { useEffect, useRef, useState } from 'react'
import { WsMessage, PricePayload } from '../../types/ws'

export function useLivePrices(symbols: string[]) {
  const wsRef = useRef<WebSocket | null>(null)
  const [prices, setPrices] = useState<Record<string, PricePayload>>({})

  useEffect(() => {
    console.log('symbols', symbols)
    if (symbols.length === 0) return

    const ws = new WebSocket('ws://localhost:8080')
    wsRef.current = ws

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          type: 'SUBSCRIBE',
          symbols
        })
      )
    }

    ws.onmessage = (event: MessageEvent) => {
      const msg: WsMessage = JSON.parse(event.data)

      if (msg.type === 'PRICE_UPDATE') {
        setPrices(prev => ({
          ...prev,
          [msg.symbol]: msg.data
        }))
      }
    }

    ws.onerror = err => {
      console.error('WS error', err)
    }

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: 'UNSUBSCRIBE',
            symbols
          })
        )
      }
      ws.close()
    }
  }, [symbols.join(',')])

  return prices
}
