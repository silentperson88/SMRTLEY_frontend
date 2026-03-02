import {
  Box,
  Typography,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody
} from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { useSimpleSWR } from 'src/hooks/swr/swrhooks'
import useSWR, { useSWRConfig } from 'swr'
import { simpleGet } from 'src/api/common/fetchers'
import { ENDURL } from 'src/utils/constants/endurl.utils'
import BuySellOrderModal from 'src/views/modal/BuySell'
import { TC } from 'src/utils/constants/text.constants'

// -------------------- Types --------------------
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
    display_name: string
    risk_level: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH'
  }
  holdings: Holding[]
  available_fund: number
  initial_fund: number
  status: string
}

interface ActiveStockOption {
  id: string
  symbol: string
}

// -------------------- Helpers --------------------
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

// -------------------- Summary Card --------------------
const SummaryCard = ({ title, value, color }: any) => {
  const theme = useTheme()

  return (
    <Grid item xs={12} sm={6} md={3}>
      <Card
        sx={{
          borderRadius: 4,
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: theme.shadows[2]
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

// -------------------- Orders Table --------------------
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
              <TableCell align='right'>₹{o.order_price ?? o.avg_execution_price}</TableCell>
              <TableCell>
                <Chip size='small' label={o.status} color={o.status === 'COMPLETED' ? 'success' : 'warning'} />
              </TableCell>
              <TableCell>
                {new Date(o.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  )
}

// -------------------- Page --------------------
const PortfolioDetailPage = () => {
  const theme = useTheme()
  const router = useRouter()
  const { id } = router.query
  const [expandedSymbol, setExpandedSymbol] = useState<string | null>(null)
  const [orderModal, setOrderModal] = useState<{ open: boolean; mode: 'BUY' | 'SELL'; holding?: Holding }>({
    open: false,
    mode: 'BUY'
  })
  const [selectedStock, setSelectedStock] = useState<ActiveStockOption | null>(null)
  const { mutate } = useSWRConfig()

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
    revalidateOnFocus: false
  })

  const openOrdersUrl = id ? ENDURL.GET_OPEN_ORDERS.replace(':portfolioId', String(id)) : null
  const { data: openOrdersData, isLoading: openOrdersLoading } = useSWR<Order[]>(openOrdersUrl, simpleGet, {
    refreshInterval: data => (data?.length ? ORDER_REFRESH_MS : 0),
    revalidateOnFocus: false
  })

  console.log('openOrdersData', openOrdersData)

  const handleOrderSuccess = () => {
    if (detailUrl) mutate(detailUrl)
    if (openOrdersUrl) mutate(openOrdersUrl)
    if (ordersUrl) mutate(ordersUrl)
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

  const totalQty = data.holdings.reduce((s, h) => s + h.quantity, 0)
  const totalInvested = data.holdings.reduce((s, h) => s + h.invested_value, 0)
  const riskColor = getRiskColor(data.portfolio_type.risk_level)

  return (
    <Box p={4}>
      {/* Header */}
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
                  fontWeight: 700
                }}
              />
              <Chip label={data.status} color='info' />
            </Box>
          </Box>
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
        </Box>
      </Box>

      {/* Summary */}
      <Grid container spacing={3} mb={5}>
        <SummaryCard title='Total Qty' value={totalQty.toFixed(2)} color='warning' />
        <SummaryCard title='Invested' value={`₹${totalInvested.toFixed(2)}`} color='error' />
        <SummaryCard title='Available Fund' value={`₹${data.available_fund.toFixed(2)}`} color='info' />
        <SummaryCard title='Initial Fund' value={`₹${data.initial_fund.toFixed(2)}`} color='secondary' />
      </Grid>

      {/* Holdings */}
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
          data.holdings.map(h => {
            const isExpanded = expandedSymbol === h.symbol

            return (
              <Grid item xs={12} md={6} key={h.symbol}>
                <Card
                  onClick={() => setExpandedSymbol(prev => (prev === h.symbol ? null : h.symbol))}
                  sx={{
                    cursor: 'pointer',
                    borderRadius: 4,
                    border: `1px solid ${theme.palette.divider}`,
                    transition: '0.2s',
                    '&:hover': {
                      boxShadow: theme.shadows[8],
                      borderColor: theme.palette.primary.main
                    }
                  }}
                >
                  <CardContent>
                    <Box display='flex' justifyContent='space-between'>
                      <Typography variant='h5' fontWeight={900}>
                        {h.symbol}
                      </Typography>
                      <Box display='flex' gap={1}>
                        <Chip label={`QTY ${h.quantity}`} />
                        <Chip
                          label='Buy'
                          color='success'
                          size='small'
                          onClick={e => {
                            e.stopPropagation()
                            setSelectedStock(null)
                            setOrderModal({ open: true, mode: 'BUY', holding: h })
                          }}
                        />
                        <Chip
                          label='Sell'
                          color='error'
                          size='small'
                          onClick={e => {
                            e.stopPropagation()
                            setSelectedStock(null)
                            setOrderModal({ open: true, mode: 'SELL', holding: h })
                          }}
                        />
                      </Box>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant='caption'>Avg Buy</Typography>
                        <Typography fontWeight={700}>₹{h.avg_buy_price}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant='caption'>Invested</Typography>
                        <Typography fontWeight={700} color='primary.main'>
                          ₹{h.invested_value.toFixed(2)}
                        </Typography>
                      </Grid>
                    </Grid>

                    <Typography
                      variant='caption'
                      sx={{ mt: 2, display: 'block', color: 'primary.main', fontWeight: 700 }}
                    >
                      {isExpanded ? 'Hide Orders ▲' : `View Orders ${ordersData?.order_count ?? ''} ▼`}
                    </Typography>

                    {isExpanded && (
                      <>
                        {ordersLoading ? (
                          <Box mt={2} display='flex' justifyContent='center'>
                            <CircularProgress size={20} />
                          </Box>
                        ) : ordersData?.orders?.length ? (
                          <OrdersTable orders={ordersData.orders} title={`${h.symbol} Orders`} />
                        ) : (
                          <Typography variant='caption' color='text.secondary' sx={{ mt: 2, display: 'block' }}>
                            No orders found for this holding.
                          </Typography>
                        )}
                      </>
                    )}
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
                '& .MuiAlert-message': { width: '100%' }
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

      <BuySellOrderModal
        open={orderModal.open}
        onClose={() => setOrderModal({ open: false, mode: 'BUY' })}
        mode={orderModal.mode}
        portfolioId={data.portfolio_id}
        activeStockId={orderModal.holding?.active_stock_id || selectedStock?.id || ''}
        stockSymbol={orderModal.holding?.symbol || selectedStock?.symbol || ''}
        ltp={orderModal.holding?.avg_buy_price || 0}
        stockOptions={activeStocks || []}
        onSelectStock={setSelectedStock}
        onSuccess={handleOrderSuccess}
      />
    </Box>
  )
}

export default PortfolioDetailPage
