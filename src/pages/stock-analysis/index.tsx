import { useEffect, useMemo, useState } from 'react'
import type { NextPage } from 'next'
import { useRouter } from 'next/router'
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  LinearProgress,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import { ApexOptions } from 'apexcharts'
import CandlestickChartOutlinedIcon from '@mui/icons-material/CandlestickChartOutlined'
import ShowChartOutlinedIcon from '@mui/icons-material/ShowChartOutlined'
import TimelineOutlinedIcon from '@mui/icons-material/TimelineOutlined'
import HorizontalRuleOutlinedIcon from '@mui/icons-material/HorizontalRuleOutlined'
import GestureOutlinedIcon from '@mui/icons-material/GestureOutlined'
import ZoomInOutlinedIcon from '@mui/icons-material/ZoomInOutlined'
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import OpenInFullOutlinedIcon from '@mui/icons-material/OpenInFullOutlined'
import MoreHorizOutlinedIcon from '@mui/icons-material/MoreHorizOutlined'
import axiosInstance from 'src/api/axios/axiosBaseQuery'
import ReactApexcharts from 'src/@core/components/react-apexcharts'
import ApexChartWrapper from 'src/@core/styles/libs/react-apexcharts'
import { ENDURL } from 'src/utils/constants/endurl.utils'
import { useDebounce } from 'src/utils/useDebounce'

type RangeKey = '1W' | '1M' | '3M' | '6M' | '1Y' | '5Y' | 'ALL'

interface ActiveStock {
  master_id?: string
  symbol: string
  name: string
  exchange?: string
  hasHistoryData?: boolean
  historyDataFromDate?: string | null
  historyDataToDate?: string | null
}

interface EodCandle {
  trade_date: string
  open: number | string
  high: number | string
  low: number | string
  close: number | string
  volume?: number | string
}

interface ParsedCandle {
  x: number
  y: [number, number, number, number]
  close: number
  volume: number
}

const RANGE_BUTTONS: RangeKey[] = ['1W', '1M', '3M', '6M', '1Y', '5Y', 'ALL']
const CHART_TABS = ['Chart', 'Overview', 'Option Chain']

const formatDate = (d: Date) => d.toISOString().slice(0, 10)

const toValidDate = (value: string | Date | undefined | null) => {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const shiftFromDate = (toDate: string, { weeks = 0, months = 0, years = 0 }) => {
  const parsed = toValidDate(toDate)
  if (!parsed) return ''

  const d = new Date(parsed)
  if (weeks) d.setUTCDate(d.getUTCDate() - weeks * 7)
  if (months) d.setUTCMonth(d.getUTCMonth() - months)
  if (years) d.setUTCFullYear(d.getUTCFullYear() - years)

  return formatDate(d)
}

const toNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const formatPrice = (value: number) => {
  if (!Number.isFinite(value)) return '-'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(value)
}

const formatCompactNumber = (value: number) => {
  if (!Number.isFinite(value)) return '-'
  return new Intl.NumberFormat('en-IN', {
    notation: 'compact',
    maximumFractionDigits: 2
  }).format(value)
}

const toolbarIcons = [
  { icon: CandlestickChartOutlinedIcon, label: 'Candles' },
  { icon: ShowChartOutlinedIcon, label: 'Trend line' },
  { icon: TimelineOutlinedIcon, label: 'Indicators' },
  { icon: HorizontalRuleOutlinedIcon, label: 'Horizontal line' },
  { icon: GestureOutlinedIcon, label: 'Draw' },
  { icon: ZoomInOutlinedIcon, label: 'Zoom tools' },
  { icon: SearchOutlinedIcon, label: 'Search' }
]

const StockAnalysisPage: NextPage = () => {
  const theme = useTheme()
  const router = useRouter()
  const queryMasterId = String(router.query?.master_id || '')
  const querySymbol = String(router.query?.symbol || '').trim().toUpperCase()

  const [stocks, setStocks] = useState<ActiveStock[]>([])
  const [searchInput, setSearchInput] = useState('')
  const [stocksLoading, setStocksLoading] = useState(false)
  const [candlesLoading, setCandlesLoading] = useState(false)
  const [selectedStock, setSelectedStock] = useState<ActiveStock | null>(null)
  const [candles, setCandles] = useState<EodCandle[]>([])
  const [range, setRange] = useState<RangeKey>('6M')
  const [error, setError] = useState('')
  const debouncedSearchInput = useDebounce(searchInput, 350)

  useEffect(() => {
    let active = true

    const loadStocks = async () => {
      try {
        setStocksLoading(true)
        setError('')
        const res = await axiosInstance.get(ENDURL.GET_ALL_ACTIVE_STOCKS, {
          params: { page: 1, pageSize: 20, search: debouncedSearchInput || querySymbol || '' }
        })
        if (!active) return

        const rows: ActiveStock[] = Array.isArray(res?.data?.data) ? res.data.data : []
        setStocks(rows)

        setSelectedStock(prev => {
          if (prev?.master_id && rows.some(item => String(item.master_id) === String(prev.master_id))) {
            return rows.find(item => String(item.master_id) === String(prev.master_id)) || prev
          }

          return (
            rows.find(item => String(item.master_id) === queryMasterId) ||
            rows.find(item => String(item.symbol || '').toUpperCase() === querySymbol) ||
            prev ||
            null
          )
        })
      } catch (e: any) {
        if (!active) return
        setError(e?.response?.data?.message || 'Failed to load stocks')
      } finally {
        if (active) setStocksLoading(false)
      }
    }

    loadStocks()

    return () => {
      active = false
    }
  }, [debouncedSearchInput, queryMasterId, querySymbol])

  const requestedRange = useMemo(() => {
    if (!selectedStock?.historyDataToDate) return null

    const toDate = selectedStock.historyDataToDate
    const candidateFromDate =
      range === '1W'
        ? shiftFromDate(toDate, { weeks: 1 })
        : range === '1M'
          ? shiftFromDate(toDate, { months: 1 })
          : range === '3M'
            ? shiftFromDate(toDate, { months: 3 })
            : range === '6M'
              ? shiftFromDate(toDate, { months: 6 })
              : range === '1Y'
                ? shiftFromDate(toDate, { years: 1 })
                : range === '5Y'
                  ? shiftFromDate(toDate, { years: 5 })
                  : selectedStock.historyDataFromDate || shiftFromDate(toDate, { years: 20 })

    return {
      fromDate:
        selectedStock.historyDataFromDate && candidateFromDate < selectedStock.historyDataFromDate
          ? selectedStock.historyDataFromDate
          : candidateFromDate,
      toDate
    }
  }, [range, selectedStock?.historyDataFromDate, selectedStock?.historyDataToDate])

  useEffect(() => {
    const loadCandles = async () => {
      if (!selectedStock?.master_id || !requestedRange?.fromDate || !requestedRange?.toDate) {
        setCandles([])
        return
      }

      try {
        setCandlesLoading(true)
        setError('')
        const res = await axiosInstance.get(`${ENDURL.GET_EOD_MASTER_RANGE}/${selectedStock.master_id}`, {
          params: {
            fromDate: requestedRange.fromDate,
            toDate: requestedRange.toDate,
            limit: range === 'ALL' ? 25000 : 5000
          }
        })
        const rows: EodCandle[] = Array.isArray(res?.data?.data) ? res.data.data : []
        setCandles(rows)
      } catch (e: any) {
        setError(e?.response?.data?.message || 'Failed to load EOD candles')
      } finally {
        setCandlesLoading(false)
      }
    }

    loadCandles()
  }, [range, requestedRange?.fromDate, requestedRange?.toDate, selectedStock?.master_id])

  useEffect(() => {
    if (!selectedStock?.master_id) return

    const nextQuery = {
      master_id: String(selectedStock.master_id),
      symbol: String(selectedStock.symbol || '')
    }

    if (queryMasterId === nextQuery.master_id && querySymbol === nextQuery.symbol.toUpperCase()) return

    router.replace({ pathname: '/stock-analysis', query: nextQuery }, undefined, { shallow: true })
  }, [queryMasterId, querySymbol, router, selectedStock?.master_id, selectedStock?.symbol])

  const parsedCandles = useMemo<ParsedCandle[]>(() => {
    return candles
      .map(item => {
        const date = toValidDate(item.trade_date)
        if (!date) return null

        const open = toNumber(item.open, NaN)
        const high = toNumber(item.high, NaN)
        const low = toNumber(item.low, NaN)
        const close = toNumber(item.close, NaN)
        const volume = toNumber(item.volume, 0)
        if (![open, high, low, close].every(Number.isFinite)) return null

        return {
          x: date.getTime(),
          y: [open, high, low, close],
          close,
          volume
        }
      })
      .filter(Boolean) as ParsedCandle[]
  }, [candles])

  const latestCandle = parsedCandles[parsedCandles.length - 1] || null
  const firstCandle = parsedCandles[0] || null
  const latestOhlc = latestCandle?.y || null
  const percentChange =
    latestCandle && firstCandle && firstCandle.close
      ? ((latestCandle.close - firstCandle.close) / firstCandle.close) * 100
      : 0
  const chartWidth = Math.max(1280, parsedCandles.length * 14)

  const candleSeries = useMemo(
    () => [
      {
        name: 'Price',
        data: parsedCandles.map(item => ({
          x: item.x,
          y: item.y
        }))
      }
    ],
    [parsedCandles]
  )

  const candleOptions = useMemo<ApexOptions>(
    () => ({
      chart: {
        type: 'candlestick',
        toolbar: {
          show: true,
          tools: {
            download: false,
            selection: false,
            zoom: true,
            zoomin: true,
            zoomout: true,
            pan: true,
            reset: true
          }
        },
        zoom: { enabled: true },
        animations: { enabled: false },
        background: 'transparent',
        fontFamily: theme.typography.fontFamily
      },
      stroke: {
        width: 1
      },
      grid: {
        borderColor: alpha(theme.palette.text.primary, 0.08),
        strokeDashArray: 0,
        xaxis: {
          lines: { show: true }
        },
        yaxis: {
          lines: { show: true }
        }
      },
      xaxis: {
        type: 'datetime',
        labels: {
          datetimeUTC: false,
          style: {
            colors: theme.palette.text.secondary,
            fontSize: '11px'
          }
        },
        axisBorder: { show: false },
        axisTicks: { show: false },
        tooltip: { enabled: false }
      },
      yaxis: {
        opposite: true,
        tooltip: { enabled: true },
        labels: {
          style: {
            colors: theme.palette.text.secondary,
            fontSize: '11px'
          },
          formatter: value => value.toFixed(2)
        }
      },
      tooltip: {
        shared: false,
        x: { format: 'dd MMM yyyy' },
        theme: theme.palette.mode === 'dark' ? 'dark' : 'light'
      },
      plotOptions: {
        candlestick: {
          colors: {
            upward: '#089981',
            downward: '#f23645'
          },
          wick: {
            useFillColor: true
          }
        }
      },
      states: {
        active: {
          allowMultipleDataPointsSelection: false,
          filter: { type: 'none' }
        }
      }
    }),
    [theme, theme.palette.mode]
  )

  return (
    <ApexChartWrapper>
      <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: 'background.default' }}>
        <Stack spacing={2.5}>
          {error ? <Alert severity='error'>{error}</Alert> : null}

          <Box
            sx={{
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.divider, 0.9)}`,
              bgcolor: theme.palette.background.paper,
              overflow: 'hidden',
              boxShadow: theme.shadows[2]
            }}
          >
            <Tabs
              value={0}
              variant='scrollable'
              scrollButtons='auto'
              sx={{
                px: 2,
                minHeight: 50,
                borderBottom: `1px solid ${alpha(theme.palette.divider, 0.9)}`,
                '& .MuiTab-root': {
                  minHeight: 50,
                  textTransform: 'none',
                  fontWeight: 600
                }
              }}
            >
              {CHART_TABS.map(tab => (
                <Tab key={tab} label={tab} />
              ))}
            </Tabs>

            <Stack
              direction={{ xs: 'column', lg: 'row' }}
              alignItems={{ xs: 'stretch', lg: 'center' }}
              justifyContent='space-between'
              spacing={1.5}
              sx={{ px: 2, py: 1.25, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.9)}` }}
            >
              <Autocomplete
                sx={{ minWidth: { xs: '100%', lg: 420 } }}
                loading={stocksLoading}
                options={stocks}
                value={selectedStock}
                inputValue={searchInput}
                onInputChange={(_, value, reason) => {
                  if (reason !== 'reset') setSearchInput(value)
                }}
                onChange={(_, value) => {
                  setSelectedStock(value)
                }}
                getOptionLabel={option => `${option.symbol} - ${option.name}`}
                isOptionEqualToValue={(option, value) => String(option.master_id) === String(value.master_id)}
                filterOptions={options => options}
                renderInput={params => (
                  <TextField {...params} size='small' label='Search stock' placeholder='Type symbol or company name' />
                )}
              />

              <Stack direction='row' alignItems='center' spacing={0.75} flexWrap='wrap' useFlexGap>
                <Chip label='1D' size='small' color='primary' variant='outlined' />
                <Chip label='NSE' size='small' variant='outlined' />
                {selectedStock?.historyDataToDate ? (
                  <Chip label={`As of ${selectedStock.historyDataToDate}`} size='small' variant='outlined' />
                ) : null}
                <Tooltip title='Chart settings'>
                  <IconButton size='small'>
                    <SettingsOutlinedIcon fontSize='small' />
                  </IconButton>
                </Tooltip>
                <Tooltip title='Expand'>
                  <IconButton size='small'>
                    <OpenInFullOutlinedIcon fontSize='small' />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Stack>

            <Stack
              direction='row'
              alignItems='stretch'
              divider={<Divider orientation='vertical' flexItem />}
              sx={{ minHeight: 760 }}
            >
              <Stack
                spacing={0.5}
                sx={{
                  width: 56,
                  py: 1.25,
                  px: 0.5,
                  alignItems: 'center',
                  bgcolor: alpha(theme.palette.primary.main, 0.02),
                  flexShrink: 0
                }}
              >
                {toolbarIcons.map(({ icon: Icon, label }) => (
                  <Tooltip key={label} title={label} placement='right'>
                    <IconButton size='small' sx={{ color: 'text.secondary' }}>
                      <Icon fontSize='small' />
                    </IconButton>
                  </Tooltip>
                ))}
                <Box sx={{ flexGrow: 1 }} />
                <Tooltip title='More'>
                  <IconButton size='small' sx={{ color: 'text.secondary' }}>
                    <MoreHorizOutlinedIcon fontSize='small' />
                  </IconButton>
                </Tooltip>
              </Stack>

              <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                <Stack
                  direction={{ xs: 'column', md: 'row' }}
                  spacing={1.5}
                  justifyContent='space-between'
                  sx={{ px: 2, py: 1.5, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.9)}` }}
                >
                  <Box>
                    <Typography variant='h6' sx={{ fontWeight: 700 }}>
                      {selectedStock ? `${selectedStock.symbol} · ${selectedStock.exchange || 'NSE'}` : 'Select a stock'}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      {selectedStock?.name || 'Choose a stock to load EOD candles.'}
                    </Typography>
                  </Box>

                  {selectedStock && latestCandle && latestOhlc ? (
                    <Stack direction='row' spacing={1.5} flexWrap='wrap' useFlexGap alignItems='center'>
                      <Chip label={`O ${latestOhlc[0].toFixed(2)}`} size='small' variant='outlined' />
                      <Chip label={`H ${latestOhlc[1].toFixed(2)}`} size='small' variant='outlined' />
                      <Chip label={`L ${latestOhlc[2].toFixed(2)}`} size='small' variant='outlined' />
                      <Chip label={`C ${latestOhlc[3].toFixed(2)}`} size='small' variant='outlined' />
                      <Chip label={`Vol ${formatCompactNumber(latestCandle.volume)}`} size='small' variant='outlined' />
                      <Chip
                        label={`${percentChange >= 0 ? '+' : ''}${percentChange.toFixed(2)}%`}
                        size='small'
                        sx={{
                          bgcolor: alpha(percentChange >= 0 ? theme.palette.success.main : theme.palette.error.main, 0.12),
                          color: percentChange >= 0 ? theme.palette.success.main : theme.palette.error.main,
                          fontWeight: 700
                        }}
                      />
                    </Stack>
                  ) : null}
                </Stack>

                {(candlesLoading || stocksLoading) && <LinearProgress />}

                {!selectedStock ? (
                  <Box sx={{ p: 2 }}>
                    <Alert severity='info'>Select a stock to begin analysis.</Alert>
                  </Box>
                ) : null}

                {selectedStock && !selectedStock.hasHistoryData ? (
                  <Box sx={{ p: 2 }}>
                    <Alert severity='warning'>This stock does not yet have EOD history in the local dataset.</Alert>
                  </Box>
                ) : null}

                {!candlesLoading && selectedStock?.hasHistoryData && !parsedCandles.length ? (
                  <Box sx={{ p: 2 }}>
                    <Alert severity='info'>No EOD candles available for the selected stock and range.</Alert>
                  </Box>
                ) : null}

                {parsedCandles.length ? (
                  <>
                    <Box
                      sx={{
                        flex: 1,
                        minHeight: 0,
                        overflowX: 'auto',
                        overflowY: 'hidden',
                        bgcolor: alpha(theme.palette.background.default, 0.35),
                        '&::-webkit-scrollbar': {
                          height: 10
                        },
                        '&::-webkit-scrollbar-thumb': {
                          backgroundColor: alpha(theme.palette.text.primary, 0.22),
                          borderRadius: 999
                        }
                      }}
                    >
                      <Box sx={{ minWidth: chartWidth, width: chartWidth, p: 1.5 }}>
                        <ReactApexcharts
                          type='candlestick'
                          height={620}
                          width={chartWidth - 24}
                          options={candleOptions}
                          series={candleSeries}
                        />
                      </Box>
                    </Box>

                    <Stack
                      direction={{ xs: 'column', md: 'row' }}
                      justifyContent='space-between'
                      spacing={1}
                      sx={{ px: 2, py: 1.5, borderTop: `1px solid ${alpha(theme.palette.divider, 0.9)}` }}
                    >
                      <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                        {RANGE_BUTTONS.map(item => (
                          <Button
                            key={item}
                            size='small'
                            variant={range === item ? 'contained' : 'text'}
                            onClick={() => setRange(item)}
                            sx={{ minWidth: 54, borderRadius: 999 }}
                          >
                            {item === 'ALL' ? 'All' : item}
                          </Button>
                        ))}
                      </Stack>

                      <Typography variant='caption' color='text.secondary'>
                        Drag the bottom scrollbar to move left and right. Use the chart toolbar to zoom and reset.
                      </Typography>
                    </Stack>
                  </>
                ) : null}
              </Box>
            </Stack>
          </Box>
        </Stack>
      </Box>
    </ApexChartWrapper>
  )
}

export default StockAnalysisPage
