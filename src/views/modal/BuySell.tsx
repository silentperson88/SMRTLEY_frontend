import { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Button
} from '@mui/material'
import { TrendingUp, TrendingDown } from 'mdi-material-ui'
import CloseIcon from '@mui/icons-material/Close'
import { useMutationSWR } from 'src/hooks/swr/swrhooks'
import { ENDURL } from 'src/utils/constants/endurl.utils'
import type { MyPortfolio } from 'src/types/portfolio'
import { useSnackbar } from 'src/layouts/components/SnackbarContext'

interface BuySellOrderModalProps {
  open: boolean
  onClose: () => void
  mode?: 'BUY' | 'SELL'
  portfolioId?: string
  portfolios?: MyPortfolio[]
  selectedPortfolioId?: string | null
  onSelectPortfolio?: (id: string) => void
  activeStockId: string
  stockSymbol: string
  stockOptions?: { id: string; symbol: string }[]
  onSelectStock?: (stock: { id: string; symbol: string }) => void
  ltp?: number
  simulatedTradeDate?: string
  onSuccess?: () => void
}

interface OrderResponse {
  symbol: string
  exchange: string
  type: string
  order_type: string
  order_price: number
  order_quantity: number
  executed_quantity: number
  remaining_quantity: number
  avg_execution_price: number
  status: 'COMPLETED' | 'OPEN' | 'PARTIALLY_FILLED' | 'CANCELLED' | 'EXPIRED'
  executions: [
    {
      quantity: number
      price: number
      executed_at: '2026-02-07T10:16:23.417Z'
    }
  ]
  id: string
  sell_allocation: []
}

export default function BuySellOrderModal({
  open,
  onClose,
  mode = 'BUY',
  portfolioId,
  portfolios = [],
  selectedPortfolioId,
  onSelectPortfolio,
  activeStockId,
  stockSymbol,
  stockOptions = [],
  onSelectStock,
  ltp = 1067.5,
  simulatedTradeDate,
  onSuccess
}: BuySellOrderModalProps) {
  const isBuy = mode === 'BUY'

  const snackBar = useSnackbar()
  const [price, setPrice] = useState(ltp)
  const [quantity, setQuantity] = useState(1)
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT'>('MARKET')
  const resTypes = {
    COMPLETED: 'Order Executed Successfully',
    OPEN: 'Order Placed',
    REJECTED: 'Order Rejected',
    CANCELLED: 'Order Cancelled',
    EXPIRED: 'Order Expired',
    PARTIALLY_FILLED: 'Order Partially Executed'
  }

  const { trigger, isMutating } = useMutationSWR<{ order: OrderResponse }, any>(ENDURL.CREATE_ORDER)

  if (!open) return null

  const effectivePrice = orderType === 'MARKET' ? ltp : price
  const total = effectivePrice * quantity

  const effectivePortfolioId = portfolioId || selectedPortfolioId || null
  const canSubmit =
    effectivePortfolioId && activeStockId && quantity > 0 && (orderType === 'MARKET' || price > 0) && !isMutating

  const handleSubmit = async () => {
    if (!effectivePortfolioId) return

    const payload = {
      portfolio_id: effectivePortfolioId,
      active_stock_id: activeStockId,
      type: mode,
      order_type: orderType,
      stock_symbol: stockSymbol,
      quantity,
      price: effectivePrice,
      simulated_trade_date: simulatedTradeDate
    }

    try {
      const res = await trigger(payload)
      console.log('res', res)

      if (!res) return

      snackBar.showSnackbar(resTypes[res.order.status || 'OPEN'], 'success')
      onSuccess?.()
      onClose()
    } catch (error: any) {
      console.log('error', error)

      snackBar.showSnackbar(error.response.data.message || 'Something went wrong', 'error')
    }
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 1300,
        backgroundColor: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <Card sx={{ width: 420, borderRadius: 3 }}>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {isBuy ? <TrendingUp /> : <TrendingDown />}
              <Typography variant='h6' sx={{ color: isBuy ? 'success.main' : 'error.main' }}>
                {mode} {stockSymbol}
              </Typography>
            </Box>
          }
          action={
            <Button onClick={onClose}>
              <CloseIcon />
            </Button>
          }
        />

        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {!portfolioId && (
            <FormControl fullWidth>
              <InputLabel>Portfolio</InputLabel>
              <Select
                value={selectedPortfolioId ?? ''}
                label='Portfolio'
                onChange={e => onSelectPortfolio?.(e.target.value as string)}
              >
                {portfolios.map(p => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {stockOptions.length > 0 && !activeStockId && (
            <FormControl fullWidth>
              <InputLabel>Stock</InputLabel>
              <Select
                value={stockSymbol || ''}
                label='Stock'
                onChange={e => {
                  const s = stockOptions.find(x => x.symbol === e.target.value)
                  if (s) onSelectStock?.(s)
                }}
              >
                {stockOptions.map(s => (
                  <MenuItem key={s.id} value={s.symbol}>
                    {s.symbol}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <FormControl fullWidth>
            <InputLabel>Order Type</InputLabel>
            <Select
              value={orderType}
              label='Order Type'
              onChange={e => setOrderType(e.target.value as 'MARKET' | 'LIMIT')}
            >
              <MenuItem value='MARKET'>Market</MenuItem>
              <MenuItem value='LIMIT'>Limit</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label='Price'
            type='number'
            value={orderType === 'MARKET' ? ltp : price}
            disabled={orderType === 'MARKET'}
            onChange={e => setPrice(Number(e.target.value))}
            helperText={`LTP: ₹${ltp}`}
          />

          <TextField
            label='Quantity'
            type='number'
            value={quantity}
            onChange={e => setQuantity(Number(e.target.value))}
          />

          <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 2 }}>
            <Typography variant='body2' display='flex' justifyContent='space-between'>
              <span>Total</span>
              <strong>₹{total.toFixed(2)}</strong>
            </Typography>
          </Box>

          <Button
            fullWidth
            variant='contained'
            color={isBuy ? 'success' : 'error'}
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            {isMutating ? 'Placing Order…' : `${mode} NOW`}
          </Button>
        </CardContent>
      </Card>
    </Box>
  )
}
