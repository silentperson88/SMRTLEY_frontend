import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'
import axiosInstance from 'src/api/axios/axiosBaseQuery'
import { simpleGet } from 'src/api/common/fetchers'
import { useMutationSWR, usePatchSWR, useSimpleSWR } from 'src/hooks/swr/swrhooks'
import useSWR, { useSWRConfig } from 'swr'
import { ENDURL } from 'src/utils/constants/endurl.utils'
import { TC } from 'src/utils/constants/text.constants'
import BuySellOrderModal from 'src/views/modal/BuySell'
import { useSnackbar } from 'src/layouts/components/SnackbarContext'

interface Holding {
  active_stock_id: string
  symbol: string
  quantity: number
  locked_sell_quantity: number
  avg_buy_price: number
  invested_value: number
  last_updated_at: string
}

interface Order {
  id: string
  symbol: string
  type: 'BUY' | 'SELL'
  order_type: string
  order_price?: number
  order_quantity?: number
  executed_quantity: number
  avg_execution_price: number
  status: string
  createdAt: string
}

interface OrdersResponse {
  order_count: number
  orders: Order[]
}

interface PortfolioResponse {
  portfolio_id: string
  portfolio_name: string
  portfolio_type: {
    code?: string
    display_name: string
    risk_level: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH'
  }
  holdings: Holding[]
  meta?: {
    mode?: 'BACKTEST'
    as_of_date?: string | null
    query?: string
    watchlist_master_ids?: number[]
    enabled_versions?: string[]
  }
  available_fund: number
  initial_fund: number
  status: string
}

interface ActiveStockOption {
  id: string
  symbol: string
}

interface BacktestWatchlistRow {
  master_id: number
  id: string
  symbol: string
  name: string
  exchange?: string
  trade_date?: string | null
  close?: number
  ltp?: number
  volume?: number
  dma_50?: number
  dma_200?: number
  atr_14?: number
  rsi_14?: number
  adx_14?: number
  supertrend_signal?: number
  is_liquid?: boolean | null
}

interface BulkBuyPayload {
  portfolio_id: string
  active_stock_id: string
  stock_symbol: string
  type: 'BUY'
  order_type: 'MARKET'
  quantity: number
  price: number
  simulated_trade_date: string
}

interface VersionMetaPayload {
  meta: {
    enabled_versions: string[]
  }
}

interface BacktestAnalyticsRow {
  master_id: number
  candle_count: number
  peak_price: number | null
  peak_trade_date?: string | null
  latest_trade_date?: string | null
  latest_close?: number | null
  latest_atr_14?: number | null
  latest_dma_50?: number | null
  latest_dma_200?: number | null
  latest_rsi_14?: number | null
  latest_adx_14?: number | null
  latest_supertrend_signal?: number | null
}

const getRiskColor = (risk: string) => {
  switch (risk) {
    case 'HIGH':
      return 'error'
    case 'MEDIUM':
      return 'warning'
    case 'LOW':
      return 'success'
    default:
      return 'info'
  }
}

const getTodayIsoDate = () => {
  const now = new Date()
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000)

  return local.toISOString().slice(0, 10)
}

const formatCurrency = (value: number) => `Rs ${Number(value || 0).toFixed(2)}`

const formatDisplayDate = (value?: string | null) => {
  if (!value) return '-'

  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const diffInDays = (from?: string | null, to?: string | null) => {
  if (!from || !to) return null
  const start = new Date(`${from.slice(0, 10)}T00:00:00`)
  const end = new Date(`${to.slice(0, 10)}T00:00:00`)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null

  return Math.max(0, Math.floor((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)))
}

const SummaryCard = ({ title, value, color }: any) => {
  const theme = useTheme()

  return (
    <Grid item xs={12} sm={6} md={3}>
      <Card
        sx={{
          borderRadius: 4,
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: theme.shadows[2],
        }}
      >
        <CardContent>
          <Typography variant='caption' color='text.secondary' fontWeight={700}>
            {title}
          </Typography>
          <Typography variant='h5' fontWeight={800} mt={1}>
            {value}
          </Typography>
          <Box sx={{ width: 30, height: 4, bgcolor: `${color}.main`, mt: 2, borderRadius: 2 }} />
        </CardContent>
      </Card>
    </Grid>
  )
}

const OrdersTable = ({ orders, title }: { orders: Order[]; title: string }) => {
  if (!orders.length) {
    return (
      <Typography variant='caption' color='text.secondary' sx={{ mt: 2, display: 'block' }}>
        No orders found.
      </Typography>
    )
  }

  return (
    <Box mt={2}>
      <Typography variant='subtitle2' fontWeight={800} mb={1}>
        {title}
      </Typography>

      <Table size='small'>
        <TableHead>
          <TableRow>
            <TableCell>Type</TableCell>
            <TableCell>Order</TableCell>
            <TableCell align='right'>Qty</TableCell>
            <TableCell align='right'>Price</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Time</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {orders.map(o => (
            <TableRow key={o.id}>
              <TableCell>
                <Chip size='small' label={o.type} color={o.type === 'BUY' ? 'success' : 'error'} />
              </TableCell>
              <TableCell>{o.order_type}</TableCell>
              <TableCell align='right'>{o.order_quantity ?? o.executed_quantity}</TableCell>
              <TableCell align='right'>Rs {o.order_price ?? o.avg_execution_price}</TableCell>
              <TableCell>
                <Chip size='small' label={o.status} color={o.status === 'COMPLETED' ? 'success' : 'warning'} />
              </TableCell>
              <TableCell>
                {new Date(o.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  )
}

const PortfolioDetailPage = () => {
  const theme = useTheme()
  const router = useRouter()
  const { id } = router.query
  const [expandedSymbol, setExpandedSymbol] = useState<string | null>(null)
  const [orderModal, setOrderModal] = useState<{ open: boolean; mode: 'BUY' | 'SELL'; holding?: Holding }>({
    open: false,
    mode: 'BUY',
  })
  const [selectedStock, setSelectedStock] = useState<ActiveStockOption | null>(null)
  const [watchlistRows, setWatchlistRows] = useState<BacktestWatchlistRow[]>([])
  const [watchlistLoading, setWatchlistLoading] = useState(false)
  const [watchlistError, setWatchlistError] = useState('')
  const [analyticsRows, setAnalyticsRows] = useState<BacktestAnalyticsRow[]>([])
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [analyticsError, setAnalyticsError] = useState('')
  const [selectedEvaluationDate, setSelectedEvaluationDate] = useState('')
  const [bulkBuyOpen, setBulkBuyOpen] = useState(false)
  const [bulkBuyAmount, setBulkBuyAmount] = useState<number | ''>('')
  const [bulkBuyError, setBulkBuyError] = useState('')
  const { mutate } = useSWRConfig()
  const { showSnackbar } = useSnackbar()
  const { trigger: placeOrderTrigger, isMutating: placingBulkOrders } = useMutationSWR<any, BulkBuyPayload>(
    ENDURL.CREATE_ORDER
  )
  const { trigger: updateBacktestMetaTrigger, isMutating: updatingBacktestMeta } = usePatchSWR<any, VersionMetaPayload>(
    ENDURL.UPDATE_BACKTEST_PORTFOLIO_META.replace(':portfolioId', String(id || ''))
  )

  const ORDER_REFRESH_MS = TC.ORDER_REFRESH_MS

  const detailUrl = id ? ENDURL.GET_PORTFOLIO_DETAILS.replace(':portfolioId', String(id)) : null
  const { data, isLoading } = useSimpleSWR<PortfolioResponse>(detailUrl as string)
  const { data: activeStocks } = useSimpleSWR<ActiveStockOption[]>(ENDURL.GET_ALL_ACTIVE_STOCKS)

  const selectedHolding = data?.holdings.find(h => h.symbol === expandedSymbol)
  const ordersUrl =
    id && selectedHolding?.active_stock_id
      ? ENDURL.GET_PORTFOLIO_HOLDING_ORDERS.replace(':portfolioId', String(id)).replace(
          ':activeStockId',
          selectedHolding.active_stock_id
        )
      : null

  const { data: ordersData, isLoading: ordersLoading } = useSWR<OrdersResponse>(ordersUrl, simpleGet, {
    refreshInterval: ORDER_REFRESH_MS,
    revalidateOnFocus: false,
  })

  const openOrdersUrl = id ? ENDURL.GET_OPEN_ORDERS.replace(':portfolioId', String(id)) : null
  const { data: openOrdersData, isLoading: openOrdersLoading } = useSWR<Order[]>(openOrdersUrl, simpleGet, {
    refreshInterval: rows => (rows?.length ? ORDER_REFRESH_MS : 0),
    revalidateOnFocus: false,
  })

  const isBacktestingPortfolio =
    String(data?.portfolio_type?.code || '').toUpperCase() === 'BACKTESTING' || data?.meta?.mode === 'BACKTEST'
  const portfolioAsOfDate = data?.meta?.as_of_date || ''
  const todayIsoDate = useMemo(() => getTodayIsoDate(), [])
  const effectiveEvaluationDate = selectedEvaluationDate || portfolioAsOfDate
  const enabledVersions = useMemo(
    () =>
      Array.from(
        new Set((data?.meta?.enabled_versions || []).map(version => String(version || '').trim().toUpperCase()))
      ),
    [data?.meta?.enabled_versions]
  )
  const plusEnabled = enabledVersions.includes('PLUS') || enabledVersions.includes('PRO')
  const proEnabled = enabledVersions.includes('PRO')

  const watchlistMasterIds = useMemo(
    () =>
      Array.from(
        new Set(
          (data?.meta?.watchlist_master_ids || [])
            .map(value => Number(value))
            .filter(value => Number.isFinite(value) && value > 0)
        )
      ),
    [data?.meta?.watchlist_master_ids]
  )
  const watchlistKey = useMemo(() => watchlistMasterIds.join(','), [watchlistMasterIds])

  useEffect(() => {
    if (!portfolioAsOfDate) {
      setSelectedEvaluationDate('')

      return
    }

    setSelectedEvaluationDate(current => {
      if (!current || current < portfolioAsOfDate || current > todayIsoDate) {
        return portfolioAsOfDate
      }

      return current
    })
  }, [portfolioAsOfDate, todayIsoDate])

  useEffect(() => {
    let active = true

    const loadWatchlistSnapshot = async () => {
      if (!isBacktestingPortfolio || !effectiveEvaluationDate || !watchlistMasterIds.length) {
        setWatchlistRows([])
        setWatchlistError('')
        setWatchlistLoading(false)

        return
      }

      try {
        setWatchlistLoading(true)
        setWatchlistError('')
        const res = await axiosInstance.post(ENDURL.POST_ACTIVE_STOCK_WATCHLIST_SNAPSHOT, {
          as_of_date: effectiveEvaluationDate,
          master_ids: watchlistMasterIds,
        })

        if (!active) return
        setWatchlistRows(Array.isArray(res?.data?.data?.rows) ? res.data.data.rows : [])
      } catch (error: any) {
        if (!active) return
        setWatchlistRows([])
        setWatchlistError(error?.response?.data?.message || 'Failed to load backtesting watchlist snapshot')
      } finally {
        if (active) setWatchlistLoading(false)
      }
    }

    void loadWatchlistSnapshot()

    return () => {
      active = false
    }
  }, [effectiveEvaluationDate, isBacktestingPortfolio, watchlistKey, watchlistMasterIds])

  useEffect(() => {
    let active = true

    const loadAnalytics = async () => {
      if (!isBacktestingPortfolio || !portfolioAsOfDate || !effectiveEvaluationDate || !watchlistMasterIds.length) {
        setAnalyticsRows([])
        setAnalyticsError('')
        setAnalyticsLoading(false)

        return
      }

      try {
        setAnalyticsLoading(true)
        setAnalyticsError('')
        const res = await axiosInstance.post(ENDURL.POST_ACTIVE_STOCK_BACKTEST_ANALYTICS, {
          from_date: portfolioAsOfDate,
          to_date: effectiveEvaluationDate,
          master_ids: watchlistMasterIds,
        })

        if (!active) return
        setAnalyticsRows(Array.isArray(res?.data?.data?.rows) ? res.data.data.rows : [])
      } catch (error: any) {
        if (!active) return
        setAnalyticsRows([])
        setAnalyticsError(error?.response?.data?.message || 'Failed to load backtest analytics')
      } finally {
        if (active) setAnalyticsLoading(false)
      }
    }

    void loadAnalytics()

    return () => {
      active = false
    }
  }, [effectiveEvaluationDate, isBacktestingPortfolio, portfolioAsOfDate, watchlistKey, watchlistMasterIds])

  const totalQty = (data?.holdings || []).reduce((sum, holding) => sum + holding.quantity, 0)
  const totalInvested = (data?.holdings || []).reduce((sum, holding) => sum + holding.invested_value, 0)
  const riskColor = getRiskColor(data?.portfolio_type?.risk_level || 'NONE')
  const eligibleBulkRows = watchlistRows.filter(row => Number(row.close ?? row.ltp ?? 0) > 0 && row.id)
  const watchlistRowByActiveStockId = useMemo(
    () => new Map(watchlistRows.map(row => [String(row.id), row])),
    [watchlistRows]
  )
  const analyticsByMasterId = useMemo(
    () => new Map(analyticsRows.map(row => [String(row.master_id), row])),
    [analyticsRows]
  )
  const backtestHoldingRows = useMemo(
    () =>
      (data?.holdings || []).map(holding => {
        const snapshot = watchlistRowByActiveStockId.get(String(holding.active_stock_id))
        const analytics = analyticsByMasterId.get(String(snapshot?.master_id || ''))
        const snapshotPrice = Number(snapshot?.close ?? snapshot?.ltp ?? 0)
        const currentValue = holding.quantity * snapshotPrice
        const pnl = currentValue - holding.invested_value
        const pnlPercent = holding.invested_value > 0 ? (pnl / holding.invested_value) * 100 : 0
        const daysHeld = diffInDays(holding.last_updated_at, effectiveEvaluationDate)
        const atr = Number(snapshot?.atr_14 ?? 0)
        const peakPrice = Number(analytics?.peak_price ?? snapshotPrice ?? 0)
        const drawdownFromPeakPercent = peakPrice > 0 ? ((peakPrice - snapshotPrice) / peakPrice) * 100 : 0
        const trailingStop = peakPrice > 0 ? Math.max(holding.avg_buy_price, peakPrice - atr * 2) : holding.avg_buy_price
        const atrStopLevel = atr > 0 ? Math.max(0, snapshotPrice - atr * 2) : null
        const targetPrice1 = Math.max(holding.avg_buy_price * 1.12, holding.avg_buy_price + atr * 2)
        const targetPrice2 = Math.max(holding.avg_buy_price * 1.2, holding.avg_buy_price + atr * 4)
        const nearFyEnd = effectiveEvaluationDate ? effectiveEvaluationDate.slice(5) >= '02-15' : false
        const taxBucket = daysHeld !== null && daysHeld >= 365 ? 'LTCG' : 'STCG'
        const reasons: string[] = []
        let suggestedAction = 'Hold'
        let suggestedPercent = 0

        if (snapshotPrice >= targetPrice2 || pnlPercent >= 20) {
          suggestedAction = 'Book 50%'
          suggestedPercent = 50
          reasons.push('Price reached the second auto target band.')
        } else if (snapshotPrice >= targetPrice1 || pnlPercent >= 12) {
          suggestedAction = 'Book 25%'
          suggestedPercent = 25
          reasons.push('Price reached the first auto target band.')
        }

        if (pnlPercent >= 15 && (daysHeld ?? 999) <= 20) {
          reasons.push('Fast rally in a short holding period.')
          if (!suggestedPercent) {
            suggestedAction = 'Book 25%'
            suggestedPercent = 25
          }
        }

        if (nearFyEnd && taxBucket === 'STCG' && pnlPercent >= 8) {
          reasons.push('FY-end review: consider trimming short-term winners before year end.')
          if (!suggestedPercent) {
            suggestedAction = 'Review Booking'
          }
        }

        let exitScore = 0
        const proReasons: string[] = []

        if (drawdownFromPeakPercent >= 8) {
          exitScore += 30
          proReasons.push('Price has fallen materially from peak.')
        }
        if (snapshotPrice > 0 && trailingStop > 0 && snapshotPrice < trailingStop) {
          exitScore += 25
          proReasons.push('Price slipped below trailing stop.')
        }
        if (Number(snapshot?.supertrend_signal ?? 0) < 0) {
          exitScore += 15
          proReasons.push('Supertrend turned negative.')
        }
        if (Number(snapshot?.rsi_14 ?? 100) < 45) {
          exitScore += 10
          proReasons.push('RSI weakened below 45.')
        }
        if (Number(snapshot?.adx_14 ?? 100) < 18) {
          exitScore += 10
          proReasons.push('ADX suggests weak trend strength.')
        }
        if (snapshotPrice > 0 && Number(snapshot?.dma_50 ?? 0) > 0 && snapshotPrice < Number(snapshot?.dma_50 ?? 0)) {
          exitScore += 10
          proReasons.push('Price is below 50 DMA.')
        }
        exitScore = Math.min(100, exitScore)

        let proSignal = 'Hold'
        if (exitScore >= 70) proSignal = 'Exit'
        else if (exitScore >= 50) proSignal = 'Reduce'
        else if (exitScore >= 25) proSignal = 'Caution'

        return {
          ...holding,
          snapshotPrice,
          atr,
          peakPrice,
          drawdownFromPeakPercent,
          trailingStop,
          atrStopLevel,
          currentValue,
          pnl,
          pnlPercent,
          daysHeld,
          taxBucket,
          targetPrice1,
          targetPrice2,
          suggestedAction,
          suggestedPercent,
          suggestionReasons: reasons,
          exitScore,
          proSignal,
          proReasons,
          tradeDate: snapshot?.trade_date || effectiveEvaluationDate || portfolioAsOfDate || '-',
        }
      }),
    [analyticsByMasterId, data?.holdings, effectiveEvaluationDate, portfolioAsOfDate, watchlistRowByActiveStockId]
  )
  const backtestCurrentValue = backtestHoldingRows.reduce((sum, holding) => sum + holding.currentValue, 0)
  const backtestUnrealizedPnL = backtestCurrentValue - totalInvested

  const handleOrderSuccess = () => {
    if (detailUrl) mutate(detailUrl)
    if (openOrdersUrl) mutate(openOrdersUrl)
    if (ordersUrl) mutate(ordersUrl)
  }

  const handleEnableVersion = async (version: 'PLUS' | 'PRO') => {
    if (!detailUrl || !data) return

    try {
      const nextVersions = Array.from(new Set([...(enabledVersions || []), version]))
      await updateBacktestMetaTrigger({
        meta: {
          enabled_versions: nextVersions,
        },
      })
      await mutate(detailUrl)
      showSnackbar(`${version === 'PLUS' ? 'Plus' : 'Pro'} mode activated.`, 'success')
    } catch (error: any) {
      showSnackbar(error?.response?.data?.message || 'Failed to update backtesting version.', 'error')
    }
  }

  const handlePartialBooking = async (holding: any, percent: number) => {
    if (!data || !percent || percent <= 0) return

    const quantity = Math.max(1, Math.floor((Number(holding.quantity || 0) * percent) / 100))
    if (!quantity || Number(holding.snapshotPrice || 0) <= 0) {
      showSnackbar('Unable to create partial booking for this holding.', 'warning')

      return
    }

    try {
      await placeOrderTrigger({
        portfolio_id: data.portfolio_id,
        active_stock_id: String(holding.active_stock_id),
        stock_symbol: holding.symbol,
        type: 'SELL',
        order_type: 'MARKET',
        quantity,
        price: Number(holding.snapshotPrice),
        simulated_trade_date: effectiveEvaluationDate,
      })

      if (detailUrl) await mutate(detailUrl)
      if (openOrdersUrl) await mutate(openOrdersUrl)
      if (ordersUrl) await mutate(ordersUrl)

      showSnackbar(`Booked ${percent}% profit in ${holding.symbol}.`, 'success')
    } catch (error: any) {
      showSnackbar(error?.response?.data?.message || 'Failed to execute partial booking.', 'error')
    }
  }

  if (isLoading) {
    return (
      <Box display='flex' justifyContent='center' mt={10}>
        <CircularProgress />
      </Box>
    )
  }

  if (!data) {
    return (
      <Box display='flex' justifyContent='center' mt={10}>
        <Alert severity='warning'>No data found.</Alert>
      </Box>
    )
  }

  const handleBulkBuy = async () => {
    const totalAmount = Number(bulkBuyAmount || 0)
    if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
      setBulkBuyError('Enter a valid total amount to deploy.')

      return
    }

    if (totalAmount > Number(data.available_fund || 0)) {
      setBulkBuyError('Amount is greater than available fund.')

      return
    }

    if (!eligibleBulkRows.length) {
      setBulkBuyError('No watchlist stocks are eligible for equal allocation buy.')

      return
    }

    const perStockAmount = totalAmount / eligibleBulkRows.length
    const buyPlans = eligibleBulkRows
      .map(row => {
        const price = Number(row.close ?? row.ltp ?? 0)
        const quantity = Math.floor(perStockAmount / price)

        return {
          row,
          price,
          quantity,
        }
      })
      .filter(plan => Number.isFinite(plan.price) && plan.price > 0 && plan.quantity > 0)

    if (!buyPlans.length) {
      setBulkBuyError('Equal split is too small to buy even 1 quantity of any watchlist stock.')

      return
    }

    try {
      setBulkBuyError('')
      const failed: string[] = []
      let placed = 0

      for (const plan of buyPlans) {
        try {
          await placeOrderTrigger({
            portfolio_id: data.portfolio_id,
            active_stock_id: String(plan.row.id),
            stock_symbol: plan.row.symbol,
            type: 'BUY',
            order_type: 'MARKET',
            quantity: plan.quantity,
            price: plan.price,
            simulated_trade_date: effectiveEvaluationDate,
          })
          placed += 1
        } catch (error: any) {
          failed.push(`${plan.row.symbol}: ${error?.response?.data?.message || 'failed'}`)
        }
      }

      if (detailUrl) await mutate(detailUrl)
      if (openOrdersUrl) await mutate(openOrdersUrl)

      setBulkBuyOpen(false)
      setBulkBuyAmount('')

      if (failed.length) {
        showSnackbar(`Placed ${placed} orders. Failed ${failed.length}.`, 'warning')
      } else {
        showSnackbar(`Placed ${placed} equal-allocation buy orders successfully.`, 'success')
      }
    } catch (error: any) {
      setBulkBuyError(error?.response?.data?.message || 'Failed to place equal-allocation buy orders.')
    }
  }

  return (
    <Box p={4}>
      <Box mb={4}>
        <Box display='flex' justifyContent='space-between' alignItems='center' flexWrap='wrap' gap={2}>
          <Box>
            <Typography variant='h4' fontWeight={900}>
              {data.portfolio_name}
            </Typography>
            <Box display='flex' gap={1.5} mt={2} flexWrap='wrap'>
              <Chip label={data.portfolio_type.display_name} />
              <Chip
                label={`Risk: ${data.portfolio_type.risk_level}`}
                sx={{
                  bgcolor: alpha(theme.palette[riskColor].main, 0.15),
                  color: theme.palette[riskColor].main,
                  fontWeight: 700,
                }}
              />
              <Chip label={data.status} color='info' />
              {isBacktestingPortfolio && data.meta?.as_of_date ? (
                <Chip label={`As Of Date: ${data.meta.as_of_date}`} color='secondary' variant='outlined' />
              ) : null}
            </Box>
          </Box>

          {!isBacktestingPortfolio ? (
            <Box display='flex' gap={1.5}>
              <Chip
                label='Buy'
                color='success'
                onClick={() => {
                  setSelectedStock(null)
                  setOrderModal({ open: true, mode: 'BUY' })
                }}
              />
              <Chip
                label='Sell'
                color='error'
                onClick={() => {
                  setSelectedStock(null)
                  setOrderModal({ open: true, mode: 'SELL' })
                }}
              />
            </Box>
          ) : null}
        </Box>
      </Box>

      <Grid container spacing={3} mb={5}>
        <SummaryCard title='Total Qty' value={totalQty.toFixed(2)} color='warning' />
        <SummaryCard title='Invested' value={formatCurrency(totalInvested)} color='error' />
        <SummaryCard title='Available Fund' value={formatCurrency(data.available_fund)} color='info' />
        <SummaryCard
          title={isBacktestingPortfolio ? 'Watchlist Stocks' : 'Initial Fund'}
          value={isBacktestingPortfolio ? String(watchlistRows.length) : formatCurrency(data.initial_fund)}
          color='secondary'
        />
        {isBacktestingPortfolio ? (
          <>
            <SummaryCard title='Evaluation Date' value={effectiveEvaluationDate || '-'} color='primary' />
            <SummaryCard title='Current Value' value={formatCurrency(backtestCurrentValue)} color='success' />
            <SummaryCard title='Unrealized P/L' value={formatCurrency(backtestUnrealizedPnL)} color='warning' />
          </>
        ) : null}
      </Grid>

      {isBacktestingPortfolio ? (
        <>
          <Alert severity='info' sx={{ mb: 4 }}>
            This portfolio is in backtesting mode. We use historical prices on or before the selected evaluation date.
            You can move the date forward from the original as-of date up to today to inspect current value and
            unrealized P/L.
          </Alert>

          <Card sx={{ mb: 4, borderRadius: 4, border: `1px solid ${theme.palette.divider}` }}>
            <CardContent>
              <Box display='flex' justifyContent='space-between' alignItems='center' flexWrap='wrap' gap={2}>
                <Box>
                  <Typography variant='subtitle1' fontWeight={800}>
                    Strategy Versions
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Keep the base backtest simple by default. Activate Plus or Pro only when you want guided portfolio
                    actions.
                  </Typography>
                </Box>

                <Box display='flex' gap={1} flexWrap='wrap'>
                  <Chip label='Basic Active' color='primary' variant='outlined' />
                  {plusEnabled ? (
                    <Chip label='Plus Active' color='success' />
                  ) : (
                    <Button variant='outlined' disabled={updatingBacktestMeta} onClick={() => handleEnableVersion('PLUS')}>
                      Activate Plus
                    </Button>
                  )}
                  {proEnabled ? (
                    <Chip label='Pro Active' color='secondary' />
                  ) : (
                    <Button variant='outlined' disabled={updatingBacktestMeta} onClick={() => handleEnableVersion('PRO')}>
                      Activate Pro
                    </Button>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ mb: 4, borderRadius: 4, border: `1px solid ${theme.palette.divider}` }}>
            <CardContent>
              <Box display='flex' justifyContent='space-between' alignItems='center' flexWrap='wrap' gap={2}>
                <Box>
                  <Typography variant='subtitle1' fontWeight={800}>
                    Forward Date Check
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Move forward from the original backtest date and see what the holdings would be worth on that day.
                  </Typography>
                </Box>

                <TextField
                  type='date'
                  label='Evaluation Date'
                  value={effectiveEvaluationDate}
                  onChange={event => {
                    const nextDate = event.target.value

                    if (!nextDate) return
                    if (portfolioAsOfDate && nextDate < portfolioAsOfDate) {
                      setSelectedEvaluationDate(portfolioAsOfDate)

                      return
                    }
                    if (nextDate > todayIsoDate) {
                      setSelectedEvaluationDate(todayIsoDate)

                      return
                    }

                    setSelectedEvaluationDate(nextDate)
                  }}
                  inputProps={{
                    min: portfolioAsOfDate || undefined,
                    max: todayIsoDate,
                  }}
                  helperText={`Allowed range: ${portfolioAsOfDate || '-'} to ${todayIsoDate}`}
                  sx={{ minWidth: 260 }}
                  InputLabelProps={{ shrink: true }}
                />
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ mb: 4, borderRadius: 4, border: `1px solid ${theme.palette.divider}` }}>
            <CardContent>
              <Typography variant='subtitle1' fontWeight={800} mb={2}>
                Simulated Holdings
              </Typography>
              {backtestHoldingRows.length ? (
                <Table size='small'>
                  <TableHead>
                    <TableRow>
                      <TableCell>Stock</TableCell>
                      <TableCell align='right'>Qty</TableCell>
                      <TableCell align='right'>Avg Buy</TableCell>
                      <TableCell align='right'>Invested</TableCell>
                      <TableCell>Trade Date</TableCell>
                      <TableCell align='right'>Eval Price</TableCell>
                      <TableCell align='right'>Current Value</TableCell>
                      <TableCell align='right'>P/L</TableCell>
                      <TableCell align='right'>P/L %</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {backtestHoldingRows.map(holding => (
                      <TableRow key={`${holding.active_stock_id}-${holding.symbol}`}>
                        <TableCell>
                          <Typography variant='body2' fontWeight={700}>
                            {holding.symbol}
                          </Typography>
                        </TableCell>
                        <TableCell align='right'>{holding.quantity}</TableCell>
                        <TableCell align='right'>{formatCurrency(holding.avg_buy_price)}</TableCell>
                        <TableCell align='right'>{formatCurrency(holding.invested_value)}</TableCell>
                        <TableCell>{formatDisplayDate(holding.tradeDate)}</TableCell>
                        <TableCell align='right'>{formatCurrency(holding.snapshotPrice)}</TableCell>
                        <TableCell align='right'>{formatCurrency(holding.currentValue)}</TableCell>
                        <TableCell align='right'>
                          <Typography
                            variant='body2'
                            fontWeight={700}
                            color={holding.pnl >= 0 ? 'success.main' : 'error.main'}
                          >
                            {formatCurrency(holding.pnl)}
                          </Typography>
                        </TableCell>
                        <TableCell align='right'>
                          <Typography
                            variant='body2'
                            fontWeight={700}
                            color={holding.pnlPercent >= 0 ? 'success.main' : 'error.main'}
                          >
                            {holding.pnlPercent.toFixed(2)}%
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Typography variant='body2' color='text.secondary'>
                  No backtesting holdings yet. Buy from the watchlist below to start simulating this portfolio.
                </Typography>
              )}
            </CardContent>
          </Card>

          {plusEnabled ? (
            <Card sx={{ mb: 4, borderRadius: 4, border: `1px solid ${theme.palette.divider}` }}>
              <CardContent>
                <Typography variant='subtitle1' fontWeight={800} mb={1}>
                  Plus Mode: Automatic Profit Booking Suggestions
                </Typography>
                <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
                  Targets are generated automatically from entry price, ATR, rally speed, and FY-end tax context. You
                  do not need to set custom booking targets manually.
                </Typography>

                {backtestHoldingRows.length ? (
                  <Table size='small'>
                    <TableHead>
                      <TableRow>
                        <TableCell>Stock</TableCell>
                        <TableCell align='right'>Days Held</TableCell>
                        <TableCell>Tax Bucket</TableCell>
                        <TableCell align='right'>Target 1</TableCell>
                        <TableCell align='right'>Target 2</TableCell>
                        <TableCell>Suggested Action</TableCell>
                        <TableCell>Reason</TableCell>
                        <TableCell>Execute</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {backtestHoldingRows.map(holding => (
                        <TableRow key={`plus-${holding.active_stock_id}-${holding.symbol}`}>
                          <TableCell>
                            <Typography variant='body2' fontWeight={700}>
                              {holding.symbol}
                            </Typography>
                          </TableCell>
                          <TableCell align='right'>{holding.daysHeld ?? '-'}</TableCell>
                          <TableCell>{holding.taxBucket}</TableCell>
                          <TableCell align='right'>{formatCurrency(holding.targetPrice1)}</TableCell>
                          <TableCell align='right'>{formatCurrency(holding.targetPrice2)}</TableCell>
                          <TableCell>
                            <Chip
                              size='small'
                              label={holding.suggestedAction}
                              color={holding.suggestedPercent > 0 ? 'warning' : 'default'}
                            />
                          </TableCell>
                          <TableCell>
                            {holding.suggestionReasons.length ? holding.suggestionReasons.join(' ') : 'No booking signal yet.'}
                          </TableCell>
                          <TableCell>
                            {holding.suggestedPercent > 0 ? (
                              <Button
                                size='small'
                                variant='outlined'
                                disabled={placingBulkOrders}
                                onClick={() => handlePartialBooking(holding, holding.suggestedPercent)}
                              >
                                {holding.suggestedAction}
                              </Button>
                            ) : (
                              <Typography variant='caption' color='text.secondary'>
                                -
                              </Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <Typography variant='body2' color='text.secondary'>
                    Plus suggestions appear after the portfolio has active holdings.
                  </Typography>
                )}
              </CardContent>
            </Card>
          ) : null}

          {proEnabled ? (
            <Card sx={{ mb: 4, borderRadius: 4, border: `1px solid ${theme.palette.divider}` }}>
              <CardContent>
                <Typography variant='subtitle1' fontWeight={800} mb={1}>
                  Pro Mode: Exit Signals
                </Typography>
                <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
                  These signals combine drawdown, trailing-stop pressure, ATR, DMA, RSI, ADX, and supertrend behavior
                  into a single score.
                </Typography>

                {analyticsLoading ? (
                  <Box display='flex' justifyContent='center' py={4}>
                    <CircularProgress size={24} />
                  </Box>
                ) : analyticsError ? (
                  <Alert severity='error'>{analyticsError}</Alert>
                ) : backtestHoldingRows.length ? (
                  <Table size='small'>
                    <TableHead>
                      <TableRow>
                        <TableCell>Stock</TableCell>
                        <TableCell align='right'>Peak Price</TableCell>
                        <TableCell align='right'>Drawdown %</TableCell>
                        <TableCell align='right'>Trailing Stop</TableCell>
                        <TableCell align='right'>ATR Stop</TableCell>
                        <TableCell align='right'>Exit Score</TableCell>
                        <TableCell>Signal</TableCell>
                        <TableCell>Reason</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {backtestHoldingRows.map(holding => (
                        <TableRow key={`pro-${holding.active_stock_id}-${holding.symbol}`}>
                          <TableCell>
                            <Typography variant='body2' fontWeight={700}>
                              {holding.symbol}
                            </Typography>
                          </TableCell>
                          <TableCell align='right'>{formatCurrency(holding.peakPrice)}</TableCell>
                          <TableCell align='right'>{holding.drawdownFromPeakPercent.toFixed(2)}%</TableCell>
                          <TableCell align='right'>{formatCurrency(holding.trailingStop)}</TableCell>
                          <TableCell align='right'>
                            {holding.atrStopLevel !== null ? formatCurrency(holding.atrStopLevel) : '-'}
                          </TableCell>
                          <TableCell align='right'>{holding.exitScore}</TableCell>
                          <TableCell>
                            <Chip
                              size='small'
                              label={holding.proSignal}
                              color={
                                holding.proSignal === 'Exit'
                                  ? 'error'
                                  : holding.proSignal === 'Reduce'
                                    ? 'warning'
                                    : holding.proSignal === 'Caution'
                                      ? 'info'
                                      : 'success'
                              }
                            />
                          </TableCell>
                          <TableCell>{holding.proReasons.length ? holding.proReasons.join(' ') : 'Trend remains healthy.'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <Typography variant='body2' color='text.secondary'>
                    Pro signals appear after the portfolio has active holdings.
                  </Typography>
                )}
              </CardContent>
            </Card>
          ) : null}

          <Card sx={{ mb: 4, borderRadius: 4, border: `1px solid ${theme.palette.divider}` }}>
            <CardContent>
              <Box display='flex' justifyContent='space-between' alignItems='center' flexWrap='wrap' gap={2}>
                <Box>
                  <Typography variant='subtitle1' fontWeight={800}>
                    Batch Trading
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Buy all watchlist stocks with equal allocation in one go using the historical price for the current
                    evaluation date.
                  </Typography>
                </Box>
                <Button
                  variant='contained'
                  disabled={!eligibleBulkRows.length || placingBulkOrders}
                  onClick={() => {
                    setBulkBuyError('')
                    setBulkBuyAmount('')
                    setBulkBuyOpen(true)
                  }}
                >
                  Buy All Equally
                </Button>
              </Box>
            </CardContent>
          </Card>

          {data.meta?.query ? (
            <Card sx={{ mb: 4, borderRadius: 4, border: `1px solid ${theme.palette.divider}` }}>
              <CardContent>
                <Typography variant='subtitle1' fontWeight={800} mb={1}>
                  Saved Query
                </Typography>
                <Typography variant='body2' sx={{ whiteSpace: 'pre-wrap' }}>
                  {data.meta.query}
                </Typography>
              </CardContent>
            </Card>
          ) : null}

          <Typography variant='h6' fontWeight={800} mb={3}>
            Watchlist Snapshot
          </Typography>

          <Card sx={{ borderRadius: 4, border: `1px solid ${theme.palette.divider}` }}>
            <CardContent>
              {watchlistLoading ? (
                <Box display='flex' justifyContent='center' py={6}>
                  <CircularProgress />
                </Box>
              ) : watchlistError ? (
                <Alert severity='error'>{watchlistError}</Alert>
              ) : watchlistRows.length ? (
                <Table size='small'>
                  <TableHead>
                    <TableRow>
                      <TableCell>Stock</TableCell>
                      <TableCell>Exchange</TableCell>
                      <TableCell>Trade Date</TableCell>
                      <TableCell align='right'>Price</TableCell>
                      <TableCell align='right'>Volume</TableCell>
                      <TableCell align='right'>RSI</TableCell>
                      <TableCell align='right'>ADX</TableCell>
                      <TableCell align='right'>Supertrend</TableCell>
                      <TableCell>Liquid</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {watchlistRows.map(row => (
                      <TableRow key={`${row.master_id}-${row.symbol}`}>
                        <TableCell>
                          <Box>
                            <Typography variant='body2' fontWeight={700}>
                              {row.symbol}
                            </Typography>
                            <Typography variant='caption' color='text.secondary'>
                              {row.name}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{row.exchange || '-'}</TableCell>
                        <TableCell>{formatDisplayDate(row.trade_date || data.meta?.as_of_date || '-')}</TableCell>
                        <TableCell align='right'>Rs {Number(row.close ?? row.ltp ?? 0).toFixed(2)}</TableCell>
                        <TableCell align='right'>{Number(row.volume || 0).toLocaleString()}</TableCell>
                        <TableCell align='right'>
                          {row.rsi_14 === null || row.rsi_14 === undefined ? '-' : Number(row.rsi_14).toFixed(2)}
                        </TableCell>
                        <TableCell align='right'>
                          {row.adx_14 === null || row.adx_14 === undefined ? '-' : Number(row.adx_14).toFixed(2)}
                        </TableCell>
                        <TableCell align='right'>
                          {row.supertrend_signal === null || row.supertrend_signal === undefined
                            ? '-'
                            : Number(row.supertrend_signal)}
                        </TableCell>
                        <TableCell>
                          {row.is_liquid === null || row.is_liquid === undefined ? (
                            '-'
                          ) : (
                            <Chip size='small' label={row.is_liquid ? 'Yes' : 'No'} color={row.is_liquid ? 'success' : 'default'} />
                          )}
                        </TableCell>
                        <TableCell>
                          <Box display='flex' gap={1}>
                            <Chip
                              label='Buy'
                              color='success'
                              size='small'
                              onClick={() => {
                                setSelectedStock({ id: row.id, symbol: row.symbol })
                                setOrderModal({ open: true, mode: 'BUY' })
                              }}
                            />
                            <Chip
                              label='Sell'
                              color='error'
                              size='small'
                              onClick={() => {
                                setSelectedStock({ id: row.id, symbol: row.symbol })
                                setOrderModal({ open: true, mode: 'SELL' })
                              }}
                            />
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Alert severity='warning'>No watchlist stocks are saved for this backtesting portfolio yet.</Alert>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          <Typography variant='h6' fontWeight={800} mb={3}>
            Holdings
          </Typography>

          <Card sx={{ mb: 4, borderRadius: 4, border: `1px solid ${theme.palette.divider}` }}>
            <CardContent>
              <Typography variant='subtitle1' fontWeight={800} mb={1}>
                Open / Partially Filled Orders (All Stocks)
              </Typography>
              {openOrdersLoading ? (
                <Box mt={2} display='flex' justifyContent='center'>
                  <CircularProgress size={20} />
                </Box>
              ) : openOrdersData && openOrdersData.length > 0 ? (
                <OrdersTable orders={openOrdersData} title='Open Orders' />
              ) : (
                <Typography variant='caption' color='text.secondary' sx={{ display: 'block' }}>
                  No open or partially filled orders right now.
                </Typography>
              )}
            </CardContent>
          </Card>

          <Grid container spacing={3}>
            {data.holdings.length > 0 ? (
              data.holdings.map(holding => {
                const isExpanded = expandedSymbol === holding.symbol

                return (
                  <Grid item xs={12} md={6} key={holding.symbol}>
                    <Card
                      onClick={() => setExpandedSymbol(prev => (prev === holding.symbol ? null : holding.symbol))}
                      sx={{
                        cursor: 'pointer',
                        borderRadius: 4,
                        border: `1px solid ${theme.palette.divider}`,
                        transition: '0.2s',
                        '&:hover': {
                          boxShadow: theme.shadows[8],
                          borderColor: theme.palette.primary.main,
                        },
                      }}
                    >
                      <CardContent>
                        <Box display='flex' justifyContent='space-between'>
                          <Typography variant='h5' fontWeight={900}>
                            {holding.symbol}
                          </Typography>
                          <Box display='flex' gap={1}>
                            <Chip label={`QTY ${holding.quantity}`} />
                            <Chip
                              label='Buy'
                              color='success'
                              size='small'
                              onClick={event => {
                                event.stopPropagation()
                                setSelectedStock(null)
                                setOrderModal({ open: true, mode: 'BUY', holding })
                              }}
                            />
                            <Chip
                              label='Sell'
                              color='error'
                              size='small'
                              onClick={event => {
                                event.stopPropagation()
                                setSelectedStock(null)
                                setOrderModal({ open: true, mode: 'SELL', holding })
                              }}
                            />
                          </Box>
                        </Box>

                        <Divider sx={{ my: 2 }} />

                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Typography variant='caption'>Avg Buy</Typography>
                            <Typography fontWeight={700}>Rs {holding.avg_buy_price}</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant='caption'>Invested</Typography>
                            <Typography fontWeight={700} color='primary.main'>
                              Rs {holding.invested_value.toFixed(2)}
                            </Typography>
                          </Grid>
                        </Grid>

                        <Typography
                          variant='caption'
                          sx={{ mt: 2, display: 'block', color: 'primary.main', fontWeight: 700 }}
                        >
                          {isExpanded ? 'Hide Orders ▲' : `View Orders ${ordersData?.order_count ?? ''} ▼`}
                        </Typography>

                        {isExpanded ? (
                          <>
                            {ordersLoading ? (
                              <Box mt={2} display='flex' justifyContent='center'>
                                <CircularProgress size={20} />
                              </Box>
                            ) : ordersData?.orders?.length ? (
                              <OrdersTable orders={ordersData.orders} title={`${holding.symbol} Orders`} />
                            ) : (
                              <Typography variant='caption' color='text.secondary' sx={{ mt: 2, display: 'block' }}>
                                No orders found for this holding.
                              </Typography>
                            )}
                          </>
                        ) : null}
                      </CardContent>
                    </Card>
                  </Grid>
                )
              })
            ) : (
              <Grid item xs={12}>
                <Alert
                  severity='info'
                  sx={{
                    borderRadius: 3,
                    alignItems: 'center',
                    '& .MuiAlert-message': { width: '100%' },
                  }}
                >
                  <Typography fontWeight={700}>No holdings yet</Typography>
                  <Typography variant='body2' color='text.secondary'>
                    You haven&apos;t placed any trades in this portfolio. Start trading when you&apos;re ready and build
                    your positions gradually.
                  </Typography>
                </Alert>
              </Grid>
            )}
          </Grid>
        </>
      )}

      <BuySellOrderModal
        open={orderModal.open}
        onClose={() => setOrderModal({ open: false, mode: 'BUY' })}
        mode={orderModal.mode}
        portfolioId={data.portfolio_id}
        activeStockId={orderModal.holding?.active_stock_id || selectedStock?.id || ''}
        stockSymbol={orderModal.holding?.symbol || selectedStock?.symbol || ''}
        ltp={
          orderModal.holding?.avg_buy_price ||
          Number(
            watchlistRows.find(row => row.id === selectedStock?.id)?.close ??
              watchlistRows.find(row => row.id === selectedStock?.id)?.ltp ??
              0
          )
        }
        stockOptions={isBacktestingPortfolio ? [] : activeStocks || []}
        onSelectStock={setSelectedStock}
        simulatedTradeDate={isBacktestingPortfolio ? effectiveEvaluationDate : undefined}
        onSuccess={handleOrderSuccess}
      />

      <Dialog open={bulkBuyOpen} onClose={() => setBulkBuyOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>Buy All Watchlist Stocks Equally</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1, display: 'grid', gap: 2 }}>
            <Alert severity='info'>
              Total amount will be split equally across {eligibleBulkRows.length} watchlist stocks. Quantity is rounded
              down per stock using the historical price shown on this page.
            </Alert>
            <TextField
              fullWidth
              type='number'
              label='Total Amount to Deploy'
              value={bulkBuyAmount}
              onChange={event => setBulkBuyAmount(event.target.value === '' ? '' : Number(event.target.value))}
              inputProps={{ min: 1 }}
              helperText={`Available fund: Rs ${Number(data.available_fund || 0).toFixed(2)}`}
            />
            {bulkBuyError ? <Alert severity='error'>{bulkBuyError}</Alert> : null}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkBuyOpen(false)} color='secondary'>
            Cancel
          </Button>
          <Button variant='contained' disabled={placingBulkOrders} onClick={handleBulkBuy}>
            {placingBulkOrders ? 'Placing Orders...' : 'Place Equal Buy Orders'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default PortfolioDetailPage
