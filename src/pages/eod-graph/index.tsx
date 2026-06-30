import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Autocomplete,
  Alert,
  Box,
  Button,
  ButtonGroup,
  Card,
  CardContent,
  CardHeader,
  Grid,
  LinearProgress,
  MenuItem,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography
} from '@mui/material'
import { ApexOptions } from 'apexcharts'
import ApexChartWrapper from 'src/@core/styles/libs/react-apexcharts'
import ReactApexcharts from 'src/@core/components/react-apexcharts'
import axiosInstance from 'src/api/axios/axiosBaseQuery'
import { ENDURL } from 'src/utils/constants/endurl.utils'
import { useRouter } from 'next/router'
import { useDebounce } from 'src/utils/useDebounce'

type RangeKey = '1M' | '1Y' | '5Y' | 'ALL' | 'CUSTOM'

interface ActiveStock {
  master_id?: string
  name: string
  symbol: string
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
  ts: number
  open: number
  high: number
  low: number
  close: number
}

interface LinePoint {
  ts: number
  price: number
}

interface TrendLine {
  id: string
  start: LinePoint
  end: LinePoint
}

interface ChannelLine {
  id: string
  a: LinePoint
  b: LinePoint
  c: LinePoint
}

interface RectShape {
  id: string
  a: LinePoint
  b: LinePoint
}

interface FibShape {
  id: string
  a: LinePoint
  b: LinePoint
}

interface ThreePointShape {
  id: string
  a: LinePoint
  b: LinePoint
  c: LinePoint
}

type DrawTool =
  | 'none'
  | 'select'
  | 'trend'
  | 'ray'
  | 'xline'
  | 'hline'
  | 'hray'
  | 'vline'
  | 'cross'
  | 'info'
  | 'angle'
  | 'regression'
  | 'channel'
  | 'flat_tb'
  | 'disjoint_channel'
  | 'pitchfork'
  | 'schiff_pitchfork'
  | 'mod_schiff_pitchfork'
  | 'inside_pitchfork'
  | 'rect'
  | 'fib'
type LongRangeInterval = 'W' | 'M'
type ChartType = 'candlestick' | 'ohlc' | 'heikin' | 'area'
type ToolGroup = 'line' | 'trend' | 'pattern' | 'other'
type BreakoutType = 'none' | 'ath' | 'swing20' | 'range20' | 'range55' | 'regression50'
type PredictionType = 'none' | 'base40'

type DrawingKind =
  | 'trend'
  | 'ray'
  | 'xline'
  | 'info'
  | 'angle'
  | 'regression'
  | 'hline'
  | 'hray'
  | 'vline'
  | 'cross'
  | 'channel'
  | 'flat_tb'
  | 'disjoint_channel'
  | 'pitchfork'
  | 'schiff_pitchfork'
  | 'mod_schiff_pitchfork'
  | 'inside_pitchfork'
  | 'rect'
  | 'fib'

interface SelectedDrawing {
  kind: DrawingKind
  id: string
}

interface BreakoutEvent {
  ts: number
  direction: 'up' | 'down'
  level: number
  close: number
  changePct: number
  label: string
  details: string
}

interface PredictionSignal {
  ts: number
  kind: 'setup' | 'confirmed'
  score: number
  breakoutLevel: number
  stopLevel: number
  details: string
}

const indiaDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Kolkata',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

const formatDate = (d: Date) => indiaDateFormatter.format(d)

const toValidDate = (value: string | Date) => {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const dateOnly = new Date(`${value}T00:00:00+05:30`)
    if (!Number.isNaN(dateOnly.getTime())) return dateOnly
  }

  const direct = new Date(value)
  if (!Number.isNaN(direct.getTime())) return direct

  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const dateOnly = new Date(`${value}T00:00:00.000Z`)
    if (!Number.isNaN(dateOnly.getTime())) return dateOnly
  }

  return null
}

const candleDateToIso = (value: string | Date) => {
  const d = toValidDate(value)
  if (!d) return ''

  return formatDate(d)
}

const subtractFromDate = (toDate: string, years = 0, months = 0) => {
  const parsed = toValidDate(toDate)
  if (!parsed) return ''

  const d = new Date(parsed)
  d.setUTCFullYear(d.getUTCFullYear() - years)
  d.setUTCMonth(d.getUTCMonth() - months)

  return formatDate(d)
}

const getWeekStartTs = (ts: number) => {
  const d = new Date(ts)
  const day = d.getUTCDay() // 0=Sun ... 6=Sat
  const diffToMonday = (day + 6) % 7
  d.setUTCDate(d.getUTCDate() - diffToMonday)
  d.setUTCHours(0, 0, 0, 0)
  
return d.getTime()
}

const getMonthStartTs = (ts: number) => {
  const d = new Date(ts)
  d.setUTCDate(1)
  d.setUTCHours(0, 0, 0, 0)
  
return d.getTime()
}

const DRAW_TOOL_LABEL: Record<DrawTool, string> = {
  none: 'Pan/Zoom',
  select: 'Select',
  trend: 'Trend Line',
  ray: 'Ray',
  xline: 'Extended Line',
  hline: 'Horizontal Line',
  hray: 'Horizontal Ray',
  vline: 'Vertical Line',
  cross: 'Cross Line',
  info: 'Info Line',
  angle: 'Trend Angle',
  regression: 'Regression Trend',
  channel: 'Parallel Channel',
  flat_tb: 'Flat Top/Bottom',
  disjoint_channel: 'Disjoint Channel',
  pitchfork: 'Pitchfork',
  schiff_pitchfork: 'Schiff Pitchfork',
  mod_schiff_pitchfork: 'Modified Schiff Pitchfork',
  inside_pitchfork: 'Inside Pitchfork',
  rect: 'Rectangle',
  fib: 'Fib Retracement'
}

const GROUP_TOOLS: Record<ToolGroup, DrawTool[]> = {
  line: ['none', 'select', 'trend', 'ray', 'xline', 'hline', 'hray', 'vline', 'cross', 'info', 'angle'],
  trend: ['regression', 'channel', 'flat_tb', 'disjoint_channel', 'pitchfork', 'schiff_pitchfork', 'mod_schiff_pitchfork', 'inside_pitchfork'],
  pattern: ['rect', 'fib'],
  other: ['none', 'select']
}

const TOOL_GROUP_LABEL: Record<ToolGroup, string> = {
  line: 'Line',
  trend: 'Trend',
  pattern: 'Pattern',
  other: 'Other'
}

const BREAKOUT_LABEL: Record<BreakoutType, string> = {
  none: 'None',
  ath: 'All-Time High Break',
  swing20: 'Swing High Break (20)',
  range20: 'Range Breakout (20)',
  range55: 'Range Breakout (55)',
  regression50: 'Regression Channel Break (50)'
}

const PREDICTION_LABEL: Record<PredictionType, string> = {
  none: 'None',
  base40: 'Base Breakout Predictor (40)'
}

const EodGraphPage = () => {
  const router = useRouter()
  const queryMasterId = String(router.query?.master_id || '').trim()
  const querySymbol = String(router.query?.symbol || '').trim().toUpperCase()
  const [stocks, setStocks] = useState<ActiveStock[]>([])
  const [isStocksLoading, setIsStocksLoading] = useState(false)
  const [isCandlesLoading, setIsCandlesLoading] = useState(false)
  const [selectedMasterId, setSelectedMasterId] = useState<string>('')
  const [searchInput, setSearchInput] = useState('')
  const [range, setRange] = useState<RangeKey>('5Y')
  const [showCustomRangeForm, setShowCustomRangeForm] = useState(false)
  const [customFromDate, setCustomFromDate] = useState('')
  const [customToDate, setCustomToDate] = useState('')
  const [customRangeError, setCustomRangeError] = useState('')
  const [longRangeInterval, setLongRangeInterval] = useState<LongRangeInterval>('W')
  const [chartType, setChartType] = useState<ChartType>('candlestick')
  const [magnetMode, setMagnetMode] = useState(false)
  const [toolGroup, setToolGroup] = useState<ToolGroup>('line')
  const [breakoutType, setBreakoutType] = useState<BreakoutType>('none')
  const [predictionType, setPredictionType] = useState<PredictionType>('none')
  const [allCandles, setAllCandles] = useState<EodCandle[]>([])
  const [error, setError] = useState<string>('')
  const [viewTab, setViewTab] = useState<'chart' | 'table'>('chart')
  const [viewport, setViewport] = useState<{ min: number; max: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [drawTool, setDrawTool] = useState<DrawTool>('none')
  const [selectedDrawing, setSelectedDrawing] = useState<SelectedDrawing | null>(null)
  const [pendingPoints, setPendingPoints] = useState<LinePoint[]>([])
  const [trendLines, setTrendLines] = useState<TrendLine[]>([])
  const [rayLines, setRayLines] = useState<TrendLine[]>([])
  const [extendedLines, setExtendedLines] = useState<TrendLine[]>([])
  const [infoLines, setInfoLines] = useState<TrendLine[]>([])
  const [angleLines, setAngleLines] = useState<TrendLine[]>([])
  const [regressionLines, setRegressionLines] = useState<TrendLine[]>([])
  const [horizontalLines, setHorizontalLines] = useState<Array<{ id: string; price: number }>>([])
  const [horizontalRays, setHorizontalRays] = useState<Array<{ id: string; ts: number; price: number }>>([])
  const [verticalLines, setVerticalLines] = useState<Array<{ id: string; ts: number }>>([])
  const [crossLines, setCrossLines] = useState<Array<{ id: string; ts: number; price: number }>>([])
  const [channelLines, setChannelLines] = useState<ChannelLine[]>([])
  const [flatTopBottomShapes, setFlatTopBottomShapes] = useState<ThreePointShape[]>([])
  const [disjointChannels, setDisjointChannels] = useState<ThreePointShape[]>([])
  const [pitchforks, setPitchforks] = useState<ThreePointShape[]>([])
  const [schiffPitchforks, setSchiffPitchforks] = useState<ThreePointShape[]>([])
  const [modifiedSchiffPitchforks, setModifiedSchiffPitchforks] = useState<ThreePointShape[]>([])
  const [insidePitchforks, setInsidePitchforks] = useState<ThreePointShape[]>([])
  const [rectangles, setRectangles] = useState<RectShape[]>([])
  const [fibs, setFibs] = useState<FibShape[]>([])
  const [plotRect, setPlotRect] = useState<{ left: number; top: number; width: number; height: number }>({
    left: 0,
    top: 0,
    width: 0,
    height: 0
  })
  const chartViewportRef = useRef<HTMLDivElement | null>(null)
  const dragRef = useRef<{ active: boolean; startX: number; min: number; max: number } | null>(null)
  const debouncedSearchInput = useDebounce(searchInput, 350)
  const selectedStock = useMemo(
    () => stocks.find(stock => String(stock.master_id) === String(selectedMasterId)) || null,
    [stocks, selectedMasterId]
  )

  useEffect(() => {
    let active = true

    const loadStocks = async () => {
      try {
        setIsStocksLoading(true)
        setError('')
        const res = await axiosInstance.get(ENDURL.GET_ALL_ACTIVE_STOCKS, {
          params: { page: 1, pageSize: 20, search: debouncedSearchInput || querySymbol || '' }
        })
        if (!active) return
        const rows: ActiveStock[] = Array.isArray(res?.data?.data) ? res.data.data : []
        const historyReady = rows.filter(item => item.hasHistoryData && item.historyDataFromDate && item.historyDataToDate)
        const merged = [...historyReady]
        if (
          selectedStock?.master_id &&
          !merged.some(item => String(item.master_id) === String(selectedStock.master_id))
        ) {
          merged.push(selectedStock)
        }
        setStocks(merged)

        setSelectedMasterId(prev => {
          const matched =
            merged.find(item => String(item.master_id) === queryMasterId) ||
            merged.find(item => String(item.symbol || '').toUpperCase() === querySymbol)

          if (matched?.master_id) return String(matched.master_id)
          if (prev && merged.some(item => String(item.master_id) === String(prev))) return prev
          
return merged[0]?.master_id ? String(merged[0].master_id) : ''
        })
      } catch (e: any) {
        if (!active) return
        setError(e?.response?.data?.message || 'Failed to load active stocks')
      } finally {
        if (active) setIsStocksLoading(false)
      }
    }

    loadStocks()

    return () => {
      active = false
    }
  }, [debouncedSearchInput, queryMasterId, querySymbol, selectedStock?.master_id, selectedStock?.name, selectedStock?.symbol, selectedStock?.historyDataFromDate, selectedStock?.historyDataToDate])

  useEffect(() => {
    if (!selectedStock?.master_id) return

    const nextQuery = {
      master_id: String(selectedStock.master_id),
      symbol: String(selectedStock.symbol || '')
    }

    if (String(router.query.master_id || '') === nextQuery.master_id && String(router.query.symbol || '').toUpperCase() === nextQuery.symbol.toUpperCase()) {
      return
    }

    router.replace({ pathname: '/eod-graph', query: nextQuery }, undefined, { shallow: true })
  }, [router, selectedStock?.master_id, selectedStock?.symbol])

  useEffect(() => {
    if (!selectedStock?.historyDataFromDate || !selectedStock?.historyDataToDate) return
    setCustomFromDate(selectedStock.historyDataFromDate)
    setCustomToDate(selectedStock.historyDataToDate)
    setCustomRangeError('')
  }, [selectedStock?.master_id, selectedStock?.historyDataFromDate, selectedStock?.historyDataToDate])

  useEffect(() => {
    if (!selectedStock?.master_id || !selectedStock.historyDataFromDate || !selectedStock.historyDataToDate) return

    const loadCandles = async () => {
      try {
        setError('')
        setIsCandlesLoading(true)
        const res = await axiosInstance.get(`${ENDURL.GET_EOD_MASTER_RANGE}/${selectedStock.master_id}`, {
          params: {
            fromDate: selectedStock.historyDataFromDate,
            toDate: selectedStock.historyDataToDate,
            limit: 20000
          }
        })
        setAllCandles(Array.isArray(res?.data?.data) ? res.data.data : [])
      } catch (e: any) {
        setError(e?.response?.data?.message || 'Failed to load EOD candles')
      } finally {
        setIsCandlesLoading(false)
      }
    }

    loadCandles()
  }, [selectedStock?.master_id, selectedStock?.historyDataFromDate, selectedStock?.historyDataToDate])

  const filteredCandles = useMemo(() => {
    if (!allCandles.length) return []
    if (range === 'ALL') return allCandles
    if (range === 'CUSTOM') {
      if (!customFromDate || !customToDate) return allCandles
      
return allCandles.filter(c => {
        const tradeDate = candleDateToIso(c.trade_date)
        
return tradeDate ? tradeDate >= customFromDate && tradeDate <= customToDate : false
      })
    }

    const maxTradeDate = candleDateToIso(allCandles[allCandles.length - 1]?.trade_date)
    if (!maxTradeDate) return allCandles

    const fromDate =
      range === '1M'
        ? subtractFromDate(maxTradeDate, 0, 1)
        : range === '1Y'
          ? subtractFromDate(maxTradeDate, 1, 0)
          : subtractFromDate(maxTradeDate, 5, 0)

    if (!fromDate) return allCandles

    return allCandles.filter(c => {
      const tradeDate = candleDateToIso(c.trade_date)
      
return tradeDate ? tradeDate >= fromDate : false
    })
  }, [allCandles, customFromDate, customToDate, range])

  const isCustomRangeLarge = useMemo(() => {
    if (range !== 'CUSTOM' || !customFromDate || !customToDate) return false
    const from = toValidDate(customFromDate)
    const to = toValidDate(customToDate)
    if (!from || !to || to <= from) return false
    const diffMs = to.getTime() - from.getTime()
    
return diffMs > 1000 * 60 * 60 * 24 * 365.25 * 5
  }, [customFromDate, customToDate, range])

  const rangeCandles = useMemo(() => {
    const shouldAggregate = range === '5Y' || range === 'ALL' || (range === 'CUSTOM' && isCustomRangeLarge)
    if (!shouldAggregate) return filteredCandles

    const parsed = filteredCandles
      .map(c => {
        const d = toValidDate(c.trade_date)
        const open = Number(c.open)
        const high = Number(c.high)
        const low = Number(c.low)
        const close = Number(c.close)
        if (!d || !Number.isFinite(open) || !Number.isFinite(high) || !Number.isFinite(low) || !Number.isFinite(close)) {
          return null
        }
        
return {
          ts: d.getTime(),
          open,
          high,
          low,
          close
        }
      })
      .filter(Boolean) as ParsedCandle[]

    if (!parsed.length) return filteredCandles

    const grouped = new Map<number, ParsedCandle>()

    for (const c of parsed) {
      const interval: LongRangeInterval = range === 'CUSTOM' && isCustomRangeLarge ? 'M' : longRangeInterval
      const bucketTs = interval === 'M' ? getMonthStartTs(c.ts) : getWeekStartTs(c.ts)
      const existing = grouped.get(bucketTs)
      if (!existing) {
        grouped.set(bucketTs, {
          ts: bucketTs,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close
        })
        continue
      }

      existing.high = Math.max(existing.high, c.high)
      existing.low = Math.min(existing.low, c.low)
      existing.close = c.close
    }

    return Array.from(grouped.values())
      .sort((a, b) => a.ts - b.ts)
      .map(c => ({
        trade_date: new Date(c.ts).toISOString(),
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close
      }))
  }, [filteredCandles, isCustomRangeLarge, longRangeInterval, range])

  const plottedCandles = useMemo(() => {
    if (chartType !== 'heikin') return rangeCandles

    const source = rangeCandles
      .map(c => {
        const d = toValidDate(c.trade_date)
        const open = Number(c.open)
        const high = Number(c.high)
        const low = Number(c.low)
        const close = Number(c.close)
        if (!d || !Number.isFinite(open) || !Number.isFinite(high) || !Number.isFinite(low) || !Number.isFinite(close)) {
          return null
        }
        
return { d, open, high, low, close }
      })
      .filter(Boolean) as Array<{ d: Date; open: number; high: number; low: number; close: number }>

    if (!source.length) return rangeCandles

    const out: EodCandle[] = []
    let prevHaOpen = (source[0].open + source[0].close) / 2
    let prevHaClose = (source[0].open + source[0].high + source[0].low + source[0].close) / 4

    for (let i = 0; i < source.length; i += 1) {
      const row = source[i]
      const haClose = (row.open + row.high + row.low + row.close) / 4
      const haOpen = i === 0 ? (row.open + row.close) / 2 : (prevHaOpen + prevHaClose) / 2
      const haHigh = Math.max(row.high, haOpen, haClose)
      const haLow = Math.min(row.low, haOpen, haClose)

      out.push({
        trade_date: row.d.toISOString(),
        open: haOpen,
        high: haHigh,
        low: haLow,
        close: haClose
      })

      prevHaOpen = haOpen
      prevHaClose = haClose
    }

    return out
  }, [chartType, rangeCandles])

  const parsedCandles = useMemo<ParsedCandle[]>(() => {
    return plottedCandles
      .map(c => {
        const d = toValidDate(c.trade_date)
        const open = Number(c.open)
        const high = Number(c.high)
        const low = Number(c.low)
        const close = Number(c.close)
        if (!d || !Number.isFinite(open) || !Number.isFinite(high) || !Number.isFinite(low) || !Number.isFinite(close)) {
          return null
        }

        return {
          ts: d.getTime(),
          open,
          high,
          low,
          close
        }
      })
      .filter(Boolean) as ParsedCandle[]
  }, [plottedCandles])

  const breakoutEvents = useMemo<BreakoutEvent[]>(() => {
    if (breakoutType === 'none' || parsedCandles.length < 3) return []

    const events: BreakoutEvent[] = []

    const pushEvent = (
      ts: number,
      direction: 'up' | 'down',
      level: number,
      close: number,
      label: string,
      details: string
    ) => {
      if (!Number.isFinite(level) || !Number.isFinite(close) || level === 0) return
      const changePct = ((close - level) / Math.abs(level)) * 100
      events.push({ ts, direction, level, close, changePct, label, details })
    }

    if (breakoutType === 'ath') {
      let ath = parsedCandles[0].high
      for (let i = 1; i < parsedCandles.length; i += 1) {
        const c = parsedCandles[i]
        if (c.close > ath) {
          pushEvent(c.ts, 'up', ath, c.close, 'ATH Breakout', 'Close moved above the previous all-time high.')
        }
        ath = Math.max(ath, c.high)
      }
      
return events
    }

    const runRangeBreak = (lookback: number) => {
      for (let i = lookback; i < parsedCandles.length; i += 1) {
        const prev = parsedCandles.slice(i - lookback, i)
        const prevHigh = Math.max(...prev.map(p => p.high))
        const prevLow = Math.min(...prev.map(p => p.low))
        const c = parsedCandles[i]

        if (breakoutType === 'swing20') {
          if (c.close > prevHigh) {
            pushEvent(c.ts, 'up', prevHigh, c.close, `Swing${lookback} High Break`, `Close broke above ${lookback}-bar swing high.`)
          }
          continue
        }

        if (c.close > prevHigh) {
          pushEvent(c.ts, 'up', prevHigh, c.close, `Range${lookback} Up Break`, `Close broke above ${lookback}-bar range high.`)
        } else if (c.close < prevLow) {
          pushEvent(c.ts, 'down', prevLow, c.close, `Range${lookback} Down Break`, `Close broke below ${lookback}-bar range low.`)
        }
      }
    }

    if (breakoutType === 'swing20') {
      runRangeBreak(20)
      
return events
    }

    if (breakoutType === 'range20') {
      runRangeBreak(20)
      
return events
    }

    if (breakoutType === 'range55') {
      runRangeBreak(55)
      
return events
    }

    if (breakoutType === 'regression50') {
      const lookback = 50
      for (let i = lookback; i < parsedCandles.length; i += 1) {
        const prev = parsedCandles.slice(i - lookback, i)
        const xs = prev.map((_, idx) => idx)
        const ys = prev.map(p => p.close)
        const meanX = xs.reduce((a, b) => a + b, 0) / xs.length
        const meanY = ys.reduce((a, b) => a + b, 0) / ys.length

        let num = 0
        let den = 0
        for (let j = 0; j < xs.length; j += 1) {
          num += (xs[j] - meanX) * (ys[j] - meanY)
          den += (xs[j] - meanX) ** 2
        }
        const slope = den === 0 ? 0 : num / den
        const intercept = meanY - slope * meanX
        const residuals = ys.map((y, j) => y - (slope * xs[j] + intercept))
        const variance = residuals.reduce((a, b) => a + b * b, 0) / residuals.length
        const std = Math.sqrt(Math.max(variance, 0))

        const predicted = slope * lookback + intercept
        const upper = predicted + 2 * std
        const lower = predicted - 2 * std
        const c = parsedCandles[i]

        if (c.close > upper) {
          pushEvent(c.ts, 'up', upper, c.close, 'Regression Up Break', 'Close moved above the 2σ regression channel.')
        } else if (c.close < lower) {
          pushEvent(c.ts, 'down', lower, c.close, 'Regression Down Break', 'Close moved below the 2σ regression channel.')
        }
      }
      
return events
    }

    return events
  }, [breakoutType, parsedCandles])

  const latestBreakout = useMemo(() => {
    if (!breakoutEvents.length) return null
    
return breakoutEvents[breakoutEvents.length - 1]
  }, [breakoutEvents])

  const breakoutAnnotations = useMemo(() => {
    if (!breakoutEvents.length) return undefined
    const recent = breakoutEvents.slice(-20)
    const latest = recent[recent.length - 1]
    
return {
      points: recent.map(ev => ({
        x: ev.ts,
        y: ev.close,
        marker: {
          size: 4,
          fillColor: ev.direction === 'up' ? '#2e7d32' : '#c62828',
          strokeColor: '#ffffff',
          strokeWidth: 1
        },
        label: {
          borderColor: ev.direction === 'up' ? '#2e7d32' : '#c62828',
          offsetY: -8,
          style: {
            background: ev.direction === 'up' ? '#2e7d32' : '#c62828',
            color: '#fff',
            fontSize: '10px'
          },
          text: ev.direction === 'up' ? 'BO↑' : 'BO↓'
        }
      })),
      yaxis: latest
        ? [
            {
              y: latest.level,
              borderColor: latest.direction === 'up' ? '#2e7d32' : '#c62828',
              strokeDashArray: 5,
              label: {
                style: {
                  background: latest.direction === 'up' ? '#2e7d32' : '#c62828',
                  color: '#fff'
                },
                text: `Break Level ${latest.level.toFixed(2)}`
              }
            }
          ]
        : []
    }
  }, [breakoutEvents])

  const predictionSignals = useMemo<PredictionSignal[]>(() => {
    if (predictionType === 'none' || parsedCandles.length < 90) return []

    const signals: PredictionSignal[] = []
    const lookback = 40
    const slopeBars = 20
    const atrPeriod = 14

    const calcSlope = (vals: number[]) => {
      const n = vals.length
      if (!n) return 0
      const xs = vals.map((_, i) => i)
      const meanX = xs.reduce((a, b) => a + b, 0) / n
      const meanY = vals.reduce((a, b) => a + b, 0) / n
      let num = 0
      let den = 0
      for (let i = 0; i < n; i += 1) {
        num += (xs[i] - meanX) * (vals[i] - meanY)
        den += (xs[i] - meanX) ** 2
      }
      
return den === 0 ? 0 : num / den
    }

    const calcAtr = (endIdx: number) => {
      if (endIdx < atrPeriod) return 0
      let sum = 0
      for (let i = endIdx - atrPeriod + 1; i <= endIdx; i += 1) {
        const c = parsedCandles[i]
        const prevClose = parsedCandles[i - 1]?.close ?? c.close
        const tr = Math.max(c.high - c.low, Math.abs(c.high - prevClose), Math.abs(c.low - prevClose))
        sum += tr
      }
      
return sum / atrPeriod
    }

    for (let i = Math.max(lookback, slopeBars, atrPeriod) + 1; i < parsedCandles.length; i += 1) {
      const c = parsedCandles[i]
      const w = parsedCandles.slice(i - lookback, i)
      if (!w.length) continue

      const rangeHigh = Math.max(...w.map(x => x.high))
      const rangeLow = Math.min(...w.map(x => x.low))
      const rangeWidth = rangeHigh - rangeLow
      const rangePct = c.close > 0 ? rangeWidth / c.close : 0

      const lows = parsedCandles.slice(i - slopeBars, i).map(x => x.low)
      const lowSlope = calcSlope(lows)
      const slopePct = c.close > 0 ? lowSlope / c.close : 0

      const atr = calcAtr(i)
      const atrPct = c.close > 0 ? atr / c.close : 0
      const nearResistance = rangeHigh > 0 ? (rangeHigh - c.close) / rangeHigh <= 0.04 : false
      const confirmed = c.close > rangeHigh * 1.01

      let score = 0
      if (rangePct <= 0.15) score += 30
      else if (rangePct <= 0.22) score += 15

      if (atrPct <= 0.02) score += 25
      else if (atrPct <= 0.03) score += 10

      if (slopePct > 0) score += 20
      if (nearResistance) score += 25

      if (confirmed) {
        signals.push({
          ts: c.ts,
          kind: 'confirmed',
          score: Math.max(score, 80),
          breakoutLevel: rangeHigh,
          stopLevel: rangeLow,
          details: 'Close crossed above base resistance by 1% (confirmation).'
        })
      } else if (score >= 65) {
        signals.push({
          ts: c.ts,
          kind: 'setup',
          score,
          breakoutLevel: rangeHigh,
          stopLevel: rangeLow,
          details: 'Compression + higher-lows near resistance (pre-breakout setup).'
        })
      }
    }

    return signals
  }, [predictionType, parsedCandles])

  const latestPrediction = useMemo(() => {
    if (!predictionSignals.length) return null
    
return predictionSignals[predictionSignals.length - 1]
  }, [predictionSignals])

  const predictionAnnotations = useMemo(() => {
    if (!predictionSignals.length) return undefined
    const recent = predictionSignals.slice(-20)
    const latest = recent[recent.length - 1]

    return {
      points: recent.map(s => ({
        x: s.ts,
        y: s.kind === 'confirmed' ? s.breakoutLevel : s.breakoutLevel * 0.995,
        marker: {
          size: 4,
          fillColor: s.kind === 'confirmed' ? '#2e7d32' : '#ed6c02',
          strokeColor: '#ffffff',
          strokeWidth: 1
        },
        label: {
          borderColor: s.kind === 'confirmed' ? '#2e7d32' : '#ed6c02',
          offsetY: -8,
          style: {
            background: s.kind === 'confirmed' ? '#2e7d32' : '#ed6c02',
            color: '#fff',
            fontSize: '10px'
          },
          text: s.kind === 'confirmed' ? 'GO' : 'SET'
        }
      })),
      yaxis: latest
        ? [
            {
              y: latest.breakoutLevel,
              borderColor: '#ed6c02',
              strokeDashArray: 4,
              label: {
                style: {
                  background: '#ed6c02',
                  color: '#fff'
                },
                text: `Pred Level ${latest.breakoutLevel.toFixed(2)}`
              }
            }
          ]
        : []
    }
  }, [predictionSignals])

  const mergedAnnotations = useMemo(() => {
    const bPoints = breakoutAnnotations?.points || []
    const bYaxis = breakoutAnnotations?.yaxis || []
    const pPoints = predictionAnnotations?.points || []
    const pYaxis = predictionAnnotations?.yaxis || []
    if (!bPoints.length && !bYaxis.length && !pPoints.length && !pYaxis.length) return undefined
    
return {
      points: [...bPoints, ...pPoints],
      yaxis: [...bYaxis, ...pYaxis]
    }
  }, [breakoutAnnotations, predictionAnnotations])

  const series = useMemo(
    () => {
      if (chartType === 'area') {
        return [
          {
            name: 'Close',
            data: plottedCandles
              .map(c => {
                const x = toValidDate(c.trade_date)
                const close = Number(c.close)
                if (!x || !Number.isFinite(close)) return null
                
return { x, y: close }
              })
              .filter(Boolean)
          }
        ]
      }

      return [
        {
          name: chartType === 'heikin' ? 'Heikin Ashi' : 'EOD',
          data: plottedCandles
            .map(c => {
              const x = toValidDate(c.trade_date)
              if (!x) return null

              return {
                x,
                y: [Number(c.open), Number(c.high), Number(c.low), Number(c.close)]
              }
            })
            .filter(Boolean)
        }
      ]
    },
    [chartType, plottedCandles]
  )

  const dataBounds = useMemo(() => {
    const points = (series?.[0]?.data as Array<{ x: Date }>) || []
    if (!points.length) return null

    const min = points[0].x.getTime()
    const max = points[points.length - 1].x.getTime()
    if (!Number.isFinite(min) || !Number.isFinite(max) || min >= max) return null

    return { min, max }
  }, [series])

  const visibleBounds = useMemo(() => {
    const minTs = viewport?.min ?? dataBounds?.min ?? null
    const maxTs = viewport?.max ?? dataBounds?.max ?? null
    if (!Number.isFinite(minTs) || !Number.isFinite(maxTs) || !parsedCandles.length) return null

    const visible = parsedCandles.filter(c => c.ts >= Number(minTs) && c.ts <= Number(maxTs))
    const source = visible.length ? visible : parsedCandles
    const low = Math.min(...source.map(c => c.low))
    const high = Math.max(...source.map(c => c.high))
    if (!Number.isFinite(low) || !Number.isFinite(high) || low >= high) return null

    const pad = (high - low) * 0.05
    
return {
      minTs: Number(minTs),
      maxTs: Number(maxTs),
      minPrice: low - pad,
      maxPrice: high + pad
    }
  }, [parsedCandles, viewport?.min, viewport?.max, dataBounds?.min, dataBounds?.max])

  useEffect(() => {
    if (!chartViewportRef.current) return

    const node = chartViewportRef.current
    const update = () => {
      const rect = node.getBoundingClientRect()

      const gridEl = node.querySelector('.apexcharts-grid') as SVGGraphicsElement | null
      if (gridEl) {
        const gRect = gridEl.getBoundingClientRect()
        setPlotRect({
          left: Math.max(0, gRect.left - rect.left),
          top: Math.max(0, gRect.top - rect.top),
          width: Math.max(0, gRect.width),
          height: Math.max(0, gRect.height)
        })
      }
    }

    update()
    const observer = new ResizeObserver(update)
    observer.observe(node)
    window.addEventListener('resize', update)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [selectedStock?.master_id, range, viewport?.min, viewport?.max])

  useEffect(() => {
    if (!dataBounds) {
      setViewport(null)
      
return
    }

    setViewport({ min: dataBounds.min, max: dataBounds.max })
  }, [dataBounds?.min, dataBounds?.max, selectedStock?.master_id, range])

  useEffect(() => {
    setPendingPoints([])
    setTrendLines([])
    setRayLines([])
    setExtendedLines([])
    setInfoLines([])
    setAngleLines([])
    setRegressionLines([])
    setHorizontalLines([])
    setHorizontalRays([])
    setVerticalLines([])
    setCrossLines([])
    setChannelLines([])
    setFlatTopBottomShapes([])
    setDisjointChannels([])
    setPitchforks([])
    setSchiffPitchforks([])
    setModifiedSchiffPitchforks([])
    setInsidePitchforks([])
    setRectangles([])
    setFibs([])
    setDrawTool('none')
    setSelectedDrawing(null)
  }, [selectedStock?.master_id, range])

  const clampViewport = (min: number, max: number) => {
    if (!dataBounds) return null
    const fullMin = dataBounds.min
    const fullMax = dataBounds.max
    const fullSpan = fullMax - fullMin
    if (fullSpan <= 0) return null

    const minSpan = 1000 * 60 * 60 * 24 * 7 // 7 days
    const requestedSpan = Math.max(max - min, minSpan)
    const span = Math.min(requestedSpan, fullSpan)

    let nextMin = min
    let nextMax = min + span
    if (nextMin < fullMin) {
      nextMin = fullMin
      nextMax = fullMin + span
    }
    if (nextMax > fullMax) {
      nextMax = fullMax
      nextMin = fullMax - span
    }

    return { min: nextMin, max: nextMax }
  }

  const handleWheelZoom = (e: any) => {
    if (drawTool !== 'none') return
    if (!dataBounds || !viewport || !chartViewportRef.current) return
    e.preventDefault()

    const rect = chartViewportRef.current.getBoundingClientRect()
    const width = Math.max(rect.width, 1)
    const pointerRatio = Math.min(Math.max((e.clientX - rect.left) / width, 0), 1)

    const currentSpan = viewport.max - viewport.min
    if (currentSpan <= 0) return

    const zoomFactor = e.deltaY < 0 ? 0.85 : 1.15
    const nextSpan = currentSpan * zoomFactor
    const focusTs = viewport.min + currentSpan * pointerRatio

    const proposedMin = focusTs - nextSpan * pointerRatio
    const proposedMax = proposedMin + nextSpan
    const clamped = clampViewport(proposedMin, proposedMax)
    if (clamped) setViewport(clamped)
  }

  const handlePointerDown = (e: any) => {
    if (drawTool !== 'none' || !visibleBounds || !chartViewportRef.current) return
    if (!viewport) return
    if (typeof e?.currentTarget?.setPointerCapture === 'function') {
      e.currentTarget.setPointerCapture(e.pointerId)
    }
    setIsDragging(true)
    dragRef.current = {
      active: true,
      startX: e.clientX,
      min: viewport.min,
      max: viewport.max
    }
  }

  const handlePointerMove = (e: any) => {
    if (drawTool !== 'none') return
    if (!dragRef.current?.active || !chartViewportRef.current) return
    e.preventDefault()

    const width = Math.max(chartViewportRef.current.getBoundingClientRect().width, 1)
    const start = dragRef.current
    const span = start.max - start.min
    if (span <= 0) return

    const dx = e.clientX - start.startX
    const shift = (-dx / width) * span

    const clamped = clampViewport(start.min + shift, start.max + shift)
    if (clamped) setViewport(clamped)
  }

  const handlePointerUp = () => {
    if (dragRef.current) {
      dragRef.current.active = false
    }
    setIsDragging(false)
  }

  const mapEventToPoint = (e: any): LinePoint | null => {
    if (!chartViewportRef.current || !visibleBounds) return null
    const rect = chartViewportRef.current.getBoundingClientRect()
    const width = Math.max(plotRect.width, 1)
    const height = Math.max(plotRect.height, 1)
    const px = Math.min(Math.max(e.clientX - rect.left - plotRect.left, 0), width)
    const py = Math.min(Math.max(e.clientY - rect.top - plotRect.top, 0), height)

    const xRatio = px / width
    const yRatio = py / height
    const ts = visibleBounds.minTs + xRatio * (visibleBounds.maxTs - visibleBounds.minTs)
    const price = visibleBounds.maxPrice - yRatio * (visibleBounds.maxPrice - visibleBounds.minPrice)

    if (!Number.isFinite(ts) || !Number.isFinite(price)) return null
    
return { ts, price }
  }

  const applyMagnet = (point: LinePoint): LinePoint => {
    if (!magnetMode || !parsedCandles.length) return point

    let nearest = parsedCandles[0]
    let best = Math.abs(parsedCandles[0].ts - point.ts)
    for (let i = 1; i < parsedCandles.length; i += 1) {
      const dist = Math.abs(parsedCandles[i].ts - point.ts)
      if (dist < best) {
        best = dist
        nearest = parsedCandles[i]
      }
    }

    const prices = [nearest.open, nearest.high, nearest.low, nearest.close]
    let snapPrice = prices[0]
    let snapDiff = Math.abs(prices[0] - point.price)
    for (let i = 1; i < prices.length; i += 1) {
      const diff = Math.abs(prices[i] - point.price)
      if (diff < snapDiff) {
        snapDiff = diff
        snapPrice = prices[i]
      }
    }

    return { ts: nearest.ts, price: snapPrice }
  }

  const isSelected = (kind: DrawingKind, id: string) =>
    selectedDrawing?.kind === kind && selectedDrawing?.id === id

  const getNearestDrawing = (point: LinePoint): SelectedDrawing | null => {
    if (!visibleBounds) return null
    const cx = toPixelX(point.ts)
    const cy = toPixelY(point.price)
    const candidates: Array<{ kind: DrawingKind; id: string; x: number; y: number }> = []

    const push = (kind: DrawingKind, id: string, p: LinePoint) => {
      candidates.push({ kind, id, x: toPixelX(p.ts), y: toPixelY(p.price) })
    }

    trendLines.forEach(d => {
      push('trend', d.id, d.start)
      push('trend', d.id, d.end)
    })
    rayLines.forEach(d => {
      push('ray', d.id, d.start)
      push('ray', d.id, d.end)
    })
    extendedLines.forEach(d => {
      push('xline', d.id, d.start)
      push('xline', d.id, d.end)
    })
    infoLines.forEach(d => {
      push('info', d.id, d.start)
      push('info', d.id, d.end)
    })
    angleLines.forEach(d => {
      push('angle', d.id, d.start)
      push('angle', d.id, d.end)
    })
    regressionLines.forEach(d => {
      push('regression', d.id, d.start)
      push('regression', d.id, d.end)
    })
    horizontalLines.forEach(d => push('hline', d.id, { ts: (visibleBounds.minTs + visibleBounds.maxTs) / 2, price: d.price }))
    horizontalRays.forEach(d => push('hray', d.id, { ts: d.ts, price: d.price }))
    verticalLines.forEach(d => push('vline', d.id, { ts: d.ts, price: (visibleBounds.minPrice + visibleBounds.maxPrice) / 2 }))
    crossLines.forEach(d => push('cross', d.id, { ts: d.ts, price: d.price }))

    channelLines.forEach(d => {
      push('channel', d.id, d.a)
      push('channel', d.id, d.b)
      push('channel', d.id, d.c)
    })
    flatTopBottomShapes.forEach(d => {
      push('flat_tb', d.id, d.a)
      push('flat_tb', d.id, d.b)
      push('flat_tb', d.id, d.c)
    })
    disjointChannels.forEach(d => {
      push('disjoint_channel', d.id, d.a)
      push('disjoint_channel', d.id, d.b)
      push('disjoint_channel', d.id, d.c)
    })
    pitchforks.forEach(d => {
      push('pitchfork', d.id, d.a)
      push('pitchfork', d.id, d.b)
      push('pitchfork', d.id, d.c)
    })
    schiffPitchforks.forEach(d => {
      push('schiff_pitchfork', d.id, d.a)
      push('schiff_pitchfork', d.id, d.b)
      push('schiff_pitchfork', d.id, d.c)
    })
    modifiedSchiffPitchforks.forEach(d => {
      push('mod_schiff_pitchfork', d.id, d.a)
      push('mod_schiff_pitchfork', d.id, d.b)
      push('mod_schiff_pitchfork', d.id, d.c)
    })
    insidePitchforks.forEach(d => {
      push('inside_pitchfork', d.id, d.a)
      push('inside_pitchfork', d.id, d.b)
      push('inside_pitchfork', d.id, d.c)
    })
    rectangles.forEach(d => {
      push('rect', d.id, d.a)
      push('rect', d.id, d.b)
    })
    fibs.forEach(d => {
      push('fib', d.id, d.a)
      push('fib', d.id, d.b)
    })

    if (!candidates.length) return null
    let best: { kind: DrawingKind; id: string; dist: number } | null = null
    for (const c of candidates) {
      const dist = Math.hypot(c.x - cx, c.y - cy)
      if (!best || dist < best.dist) {
        best = { kind: c.kind, id: c.id, dist }
      }
    }
    if (!best || best.dist > 14) return null
    
return { kind: best.kind, id: best.id }
  }

  const moveSelectedDrawing = (deltaTs: number, deltaPrice: number) => {
    if (!selectedDrawing) return
    const moveP = (p: LinePoint) => ({ ts: p.ts + deltaTs, price: p.price + deltaPrice })

    const { kind, id } = selectedDrawing
    if (kind === 'trend') setTrendLines(prev => prev.map(d => (d.id === id ? { ...d, start: moveP(d.start), end: moveP(d.end) } : d)))
    else if (kind === 'ray') setRayLines(prev => prev.map(d => (d.id === id ? { ...d, start: moveP(d.start), end: moveP(d.end) } : d)))
    else if (kind === 'xline')
      setExtendedLines(prev => prev.map(d => (d.id === id ? { ...d, start: moveP(d.start), end: moveP(d.end) } : d)))
    else if (kind === 'info') setInfoLines(prev => prev.map(d => (d.id === id ? { ...d, start: moveP(d.start), end: moveP(d.end) } : d)))
    else if (kind === 'angle') setAngleLines(prev => prev.map(d => (d.id === id ? { ...d, start: moveP(d.start), end: moveP(d.end) } : d)))
    else if (kind === 'regression')
      setRegressionLines(prev => prev.map(d => (d.id === id ? { ...d, start: moveP(d.start), end: moveP(d.end) } : d)))
    else if (kind === 'hline') setHorizontalLines(prev => prev.map(d => (d.id === id ? { ...d, price: d.price + deltaPrice } : d)))
    else if (kind === 'hray')
      setHorizontalRays(prev => prev.map(d => (d.id === id ? { ...d, ts: d.ts + deltaTs, price: d.price + deltaPrice } : d)))
    else if (kind === 'vline') setVerticalLines(prev => prev.map(d => (d.id === id ? { ...d, ts: d.ts + deltaTs } : d)))
    else if (kind === 'cross')
      setCrossLines(prev => prev.map(d => (d.id === id ? { ...d, ts: d.ts + deltaTs, price: d.price + deltaPrice } : d)))
    else if (kind === 'channel')
      setChannelLines(prev => prev.map(d => (d.id === id ? { ...d, a: moveP(d.a), b: moveP(d.b), c: moveP(d.c) } : d)))
    else if (kind === 'flat_tb')
      setFlatTopBottomShapes(prev => prev.map(d => (d.id === id ? { ...d, a: moveP(d.a), b: moveP(d.b), c: moveP(d.c) } : d)))
    else if (kind === 'disjoint_channel')
      setDisjointChannels(prev => prev.map(d => (d.id === id ? { ...d, a: moveP(d.a), b: moveP(d.b), c: moveP(d.c) } : d)))
    else if (kind === 'pitchfork')
      setPitchforks(prev => prev.map(d => (d.id === id ? { ...d, a: moveP(d.a), b: moveP(d.b), c: moveP(d.c) } : d)))
    else if (kind === 'schiff_pitchfork')
      setSchiffPitchforks(prev => prev.map(d => (d.id === id ? { ...d, a: moveP(d.a), b: moveP(d.b), c: moveP(d.c) } : d)))
    else if (kind === 'mod_schiff_pitchfork')
      setModifiedSchiffPitchforks(prev => prev.map(d => (d.id === id ? { ...d, a: moveP(d.a), b: moveP(d.b), c: moveP(d.c) } : d)))
    else if (kind === 'inside_pitchfork')
      setInsidePitchforks(prev => prev.map(d => (d.id === id ? { ...d, a: moveP(d.a), b: moveP(d.b), c: moveP(d.c) } : d)))
    else if (kind === 'rect') setRectangles(prev => prev.map(d => (d.id === id ? { ...d, a: moveP(d.a), b: moveP(d.b) } : d)))
    else if (kind === 'fib') setFibs(prev => prev.map(d => (d.id === id ? { ...d, a: moveP(d.a), b: moveP(d.b) } : d)))
  }

  const deleteSelectedDrawing = () => {
    if (!selectedDrawing) return
    const { kind, id } = selectedDrawing
    if (kind === 'trend') setTrendLines(prev => prev.filter(d => d.id !== id))
    else if (kind === 'ray') setRayLines(prev => prev.filter(d => d.id !== id))
    else if (kind === 'xline') setExtendedLines(prev => prev.filter(d => d.id !== id))
    else if (kind === 'info') setInfoLines(prev => prev.filter(d => d.id !== id))
    else if (kind === 'angle') setAngleLines(prev => prev.filter(d => d.id !== id))
    else if (kind === 'regression') setRegressionLines(prev => prev.filter(d => d.id !== id))
    else if (kind === 'hline') setHorizontalLines(prev => prev.filter(d => d.id !== id))
    else if (kind === 'hray') setHorizontalRays(prev => prev.filter(d => d.id !== id))
    else if (kind === 'vline') setVerticalLines(prev => prev.filter(d => d.id !== id))
    else if (kind === 'cross') setCrossLines(prev => prev.filter(d => d.id !== id))
    else if (kind === 'channel') setChannelLines(prev => prev.filter(d => d.id !== id))
    else if (kind === 'flat_tb') setFlatTopBottomShapes(prev => prev.filter(d => d.id !== id))
    else if (kind === 'disjoint_channel') setDisjointChannels(prev => prev.filter(d => d.id !== id))
    else if (kind === 'pitchfork') setPitchforks(prev => prev.filter(d => d.id !== id))
    else if (kind === 'schiff_pitchfork') setSchiffPitchforks(prev => prev.filter(d => d.id !== id))
    else if (kind === 'mod_schiff_pitchfork') setModifiedSchiffPitchforks(prev => prev.filter(d => d.id !== id))
    else if (kind === 'inside_pitchfork') setInsidePitchforks(prev => prev.filter(d => d.id !== id))
    else if (kind === 'rect') setRectangles(prev => prev.filter(d => d.id !== id))
    else if (kind === 'fib') setFibs(prev => prev.filter(d => d.id !== id))
    setSelectedDrawing(null)
  }

  const handleChartClick = (e: any) => {
    if (drawTool === 'none' || isDragging) return
    const rawPoint = mapEventToPoint(e)
    if (!rawPoint) return

    if (drawTool === 'select') {
      setSelectedDrawing(getNearestDrawing(rawPoint))
      
return
    }

    const point = applyMagnet(rawPoint)

    if (drawTool === 'hline') {
      setHorizontalLines(prev => [...prev, { id: `${Date.now()}-${Math.random()}`, price: point.price }])
      
return
    }

    if (drawTool === 'hray') {
      setHorizontalRays(prev => [...prev, { id: `${Date.now()}-${Math.random()}`, ts: point.ts, price: point.price }])
      
return
    }

    if (drawTool === 'vline') {
      setVerticalLines(prev => [...prev, { id: `${Date.now()}-${Math.random()}`, ts: point.ts }])
      
return
    }

    if (drawTool === 'cross') {
      setCrossLines(prev => [...prev, { id: `${Date.now()}-${Math.random()}`, ts: point.ts, price: point.price }])
      
return
    }

    const nextPending = [...pendingPoints, point]

    if (
      drawTool === 'channel' ||
      drawTool === 'flat_tb' ||
      drawTool === 'disjoint_channel' ||
      drawTool === 'pitchfork' ||
      drawTool === 'schiff_pitchfork' ||
      drawTool === 'mod_schiff_pitchfork' ||
      drawTool === 'inside_pitchfork'
    ) {
      if (nextPending.length < 3) {
        setPendingPoints(nextPending)
        
return
      }

      const [a, b, c] = nextPending
      if (drawTool === 'channel') {
        setChannelLines(prev => [...prev, { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, a, b, c }])
      } else if (drawTool === 'flat_tb') {
        setFlatTopBottomShapes(prev => [...prev, { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, a, b, c }])
      } else if (drawTool === 'disjoint_channel') {
        setDisjointChannels(prev => [...prev, { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, a, b, c }])
      } else if (drawTool === 'pitchfork') {
        setPitchforks(prev => [...prev, { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, a, b, c }])
      } else if (drawTool === 'schiff_pitchfork') {
        setSchiffPitchforks(prev => [...prev, { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, a, b, c }])
      } else if (drawTool === 'mod_schiff_pitchfork') {
        setModifiedSchiffPitchforks(prev => [...prev, { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, a, b, c }])
      } else {
        setInsidePitchforks(prev => [...prev, { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, a, b, c }])
      }
      setPendingPoints([])
      
return
    }

    if (drawTool === 'rect') {
      if (nextPending.length < 2) {
        setPendingPoints(nextPending)
        
return
      }
      const [a, b] = nextPending
      setRectangles(prev => [...prev, { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, a, b }])
      setPendingPoints([])
      
return
    }

    if (drawTool === 'fib') {
      if (nextPending.length < 2) {
        setPendingPoints(nextPending)
        
return
      }
      const [a, b] = nextPending
      setFibs(prev => [...prev, { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, a, b }])
      setPendingPoints([])
      
return
    }

    if (nextPending.length < 2) {
      setPendingPoints(nextPending)
      
return
    }

    const [start, end] = nextPending

    const line: TrendLine = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      start,
      end
    }
    if (drawTool === 'trend') {
      setTrendLines(prev => [...prev, line])
    } else if (drawTool === 'ray') {
      setRayLines(prev => [...prev, line])
    } else if (drawTool === 'xline') {
      setExtendedLines(prev => [...prev, line])
    } else if (drawTool === 'info') {
      setInfoLines(prev => [...prev, line])
    } else if (drawTool === 'angle') {
      setAngleLines(prev => [...prev, line])
    } else if (drawTool === 'regression') {
      setRegressionLines(prev => [...prev, line])
    }
    setPendingPoints([])
  }

  const toPixelX = (ts: number) => {
    if (!visibleBounds || plotRect.width <= 0) return 0
    const span = visibleBounds.maxTs - visibleBounds.minTs
    if (span <= 0) return 0
    
return ((ts - visibleBounds.minTs) / span) * plotRect.width
  }

  const toPixelY = (price: number) => {
    if (!visibleBounds || plotRect.height <= 0) return 0
    const span = visibleBounds.maxPrice - visibleBounds.minPrice
    if (span <= 0) return 0
    
return ((visibleBounds.maxPrice - price) / span) * plotRect.height
  }

  const getInfiniteLineEndpoints = (start: LinePoint, end: LinePoint) => {
    const x1 = toPixelX(start.ts)
    const y1 = toPixelY(start.price)
    const x2 = toPixelX(end.ts)
    const y2 = toPixelY(end.price)
    const dx = x2 - x1
    const dy = y2 - y1
    const w = plotRect.width
    const h = plotRect.height

    if (Math.abs(dx) < 1e-6 && Math.abs(dy) < 1e-6) return null

    const candidates: Array<{ x: number; y: number; t: number }> = []
    const push = (x: number, y: number, t: number) => {
      if (x >= -1 && x <= w + 1 && y >= -1 && y <= h + 1 && Number.isFinite(t)) {
        candidates.push({ x, y, t })
      }
    }

    if (Math.abs(dx) > 1e-6) {
      const tL = (0 - x1) / dx
      const yL = y1 + tL * dy
      push(0, yL, tL)
      const tR = (w - x1) / dx
      const yR = y1 + tR * dy
      push(w, yR, tR)
    }
    if (Math.abs(dy) > 1e-6) {
      const tT = (0 - y1) / dy
      const xT = x1 + tT * dx
      push(xT, 0, tT)
      const tB = (h - y1) / dy
      const xB = x1 + tB * dx
      push(xB, h, tB)
    }

    if (candidates.length < 2) return null
    const uniq: Array<{ x: number; y: number; t: number }> = []
    for (const c of candidates) {
      const exists = uniq.some(u => Math.abs(u.x - c.x) < 0.5 && Math.abs(u.y - c.y) < 0.5)
      if (!exists) uniq.push(c)
    }
    if (uniq.length < 2) return null

    uniq.sort((a, b) => a.t - b.t)
    
return { first: uniq[0], last: uniq[uniq.length - 1], startPx: { x: x1, y: y1 } }
  }

  const getRayEndpoint = (start: LinePoint, end: LinePoint) => {
    const inf = getInfiniteLineEndpoints(start, end)
    if (!inf) return null
    const target = inf.last.t >= 0 ? inf.last : inf.first
    
return { start: inf.startPx, end: { x: target.x, y: target.y } }
  }

  const clipPixelLine = (x1: number, y1: number, x2: number, y2: number) => {
    const dx = x2 - x1
    const dy = y2 - y1
    const w = plotRect.width
    const h = plotRect.height
    if (Math.abs(dx) < 1e-6 && Math.abs(dy) < 1e-6) return null

    const candidates: Array<{ x: number; y: number; t: number }> = []
    const push = (x: number, y: number, t: number) => {
      if (x >= -1 && x <= w + 1 && y >= -1 && y <= h + 1 && Number.isFinite(t)) {
        candidates.push({ x, y, t })
      }
    }

    if (Math.abs(dx) > 1e-6) {
      const tL = (0 - x1) / dx
      push(0, y1 + tL * dy, tL)
      const tR = (w - x1) / dx
      push(w, y1 + tR * dy, tR)
    }
    if (Math.abs(dy) > 1e-6) {
      const tT = (0 - y1) / dy
      push(x1 + tT * dx, 0, tT)
      const tB = (h - y1) / dy
      push(x1 + tB * dx, h, tB)
    }

    if (candidates.length < 2) return null
    const uniq: Array<{ x: number; y: number; t: number }> = []
    for (const c of candidates) {
      const exists = uniq.some(u => Math.abs(u.x - c.x) < 0.5 && Math.abs(u.y - c.y) < 0.5)
      if (!exists) uniq.push(c)
    }
    if (uniq.length < 2) return null
    uniq.sort((a, b) => a.t - b.t)
    
return { first: uniq[0], last: uniq[uniq.length - 1] }
  }

  const renderPitchfork = (shape: ThreePointShape, mode: 'standard' | 'schiff' | 'modified' | 'inside') => {
    const a = { x: toPixelX(shape.a.ts), y: toPixelY(shape.a.price) }
    const b = { x: toPixelX(shape.b.ts), y: toPixelY(shape.b.price) }
    const c = { x: toPixelX(shape.c.ts), y: toPixelY(shape.c.price) }

    const midBC = { x: (b.x + c.x) / 2, y: (b.y + c.y) / 2 }
    let pivot = a
    if (mode === 'schiff') {
      pivot = { x: (a.x + b.x) / 2, y: a.y }
    } else if (mode === 'modified') {
      pivot = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
    } else if (mode === 'inside') {
      pivot = { x: (a.x + midBC.x) / 2, y: (a.y + midBC.y) / 2 }
    }

    const dir = { x: midBC.x - pivot.x, y: midBC.y - pivot.y }
    if (Math.abs(dir.x) < 1e-6 && Math.abs(dir.y) < 1e-6) return null

    const median = clipPixelLine(pivot.x, pivot.y, pivot.x + dir.x, pivot.y + dir.y)
    const upper = clipPixelLine(b.x, b.y, b.x + dir.x, b.y + dir.y)
    const lower = clipPixelLine(c.x, c.y, c.x + dir.x, c.y + dir.y)
    if (!median || !upper || !lower) return null

    const lines: Array<{ x1: number; y1: number; x2: number; y2: number; dash?: string }> = [
      { x1: median.first.x, y1: median.first.y, x2: median.last.x, y2: median.last.y },
      { x1: upper.first.x, y1: upper.first.y, x2: upper.last.x, y2: upper.last.y, dash: '5 4' },
      { x1: lower.first.x, y1: lower.first.y, x2: lower.last.x, y2: lower.last.y, dash: '5 4' }
    ]

    if (mode === 'inside') {
      const in1Base = { x: (b.x + midBC.x) / 2, y: (b.y + midBC.y) / 2 }
      const in2Base = { x: (c.x + midBC.x) / 2, y: (c.y + midBC.y) / 2 }
      const in1 = clipPixelLine(in1Base.x, in1Base.y, in1Base.x + dir.x, in1Base.y + dir.y)
      const in2 = clipPixelLine(in2Base.x, in2Base.y, in2Base.x + dir.x, in2Base.y + dir.y)
      if (in1) lines.push({ x1: in1.first.x, y1: in1.first.y, x2: in1.last.x, y2: in1.last.y, dash: '2 3' })
      if (in2) lines.push({ x1: in2.first.x, y1: in2.first.y, x2: in2.last.x, y2: in2.last.y, dash: '2 3' })
    }

    return lines
  }

  const getRegressionMeta = (line: TrendLine) => {
    const tMin = Math.min(line.start.ts, line.end.ts)
    const tMax = Math.max(line.start.ts, line.end.ts)
    const pts = parsedCandles.filter(c => c.ts >= tMin && c.ts <= tMax)
    if (pts.length < 2) return null

    const xs = pts.map(p => p.ts)
    const ys = pts.map(p => p.close)
    const meanX = xs.reduce((a, b) => a + b, 0) / xs.length
    const meanY = ys.reduce((a, b) => a + b, 0) / ys.length
    let num = 0
    let den = 0
    for (let i = 0; i < xs.length; i += 1) {
      num += (xs[i] - meanX) * (ys[i] - meanY)
      den += (xs[i] - meanX) ** 2
    }
    const slope = den === 0 ? 0 : num / den
    const intercept = meanY - slope * meanX

    const residuals = ys.map((y, i) => y - (slope * xs[i] + intercept))
    const variance = residuals.reduce((a, b) => a + b * b, 0) / residuals.length
    const std = Math.sqrt(Math.max(variance, 0))

    const y1 = slope * tMin + intercept
    const y2 = slope * tMax + intercept

    return { tMin, tMax, y1, y2, std }
  }

  const getInfoLabel = (line: TrendLine) => {
    const delta = line.end.price - line.start.price
    const pct = line.start.price !== 0 ? (delta / line.start.price) * 100 : 0
    const days = Math.round(Math.abs(line.end.ts - line.start.ts) / (1000 * 60 * 60 * 24))
    
return `${delta >= 0 ? '+' : ''}${delta.toFixed(2)} (${pct.toFixed(2)}%) | ${days}d`
  }

  const getAngleLabel = (line: TrendLine) => {
    const x1 = toPixelX(line.start.ts)
    const y1 = toPixelY(line.start.price)
    const x2 = toPixelX(line.end.ts)
    const y2 = toPixelY(line.end.price)
    const angle = (Math.atan2(y1 - y2, x2 - x1) * 180) / Math.PI
    
return `${angle.toFixed(1)}°`
  }

  const options: ApexOptions = {
    chart: {
      type: chartType === 'area' ? 'area' : 'candlestick',
      zoom: {
        enabled: false
      },
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: false,
          zoom: false,
          zoomin: false,
          zoomout: false,
          pan: false,
          reset: false
        }
      },
      animations: { enabled: false }
    },
    plotOptions: {
      candlestick: {
        wick: {
          useFillColor: true
        }
      },
      bar: {
        columnWidth: '60%'
      }
    },
    xaxis: {
      type: 'datetime',
      min: viewport?.min,
      max: viewport?.max
    },
    yaxis: {
      min: visibleBounds?.minPrice,
      max: visibleBounds?.maxPrice,
      tooltip: { enabled: true }
    },
    annotations: mergedAnnotations,
    noData: { text: 'No candles available' }
  }

  const visibleToolOptions = GROUP_TOOLS[toolGroup]

  useEffect(() => {
    if (visibleToolOptions.includes(drawTool)) return
    setDrawTool(visibleToolOptions[0] || 'none')
    setPendingPoints([])
  }, [drawTool, visibleToolOptions])

  return (
    <ApexChartWrapper>
      <Grid container spacing={6}>
        <Grid item xs={12}>
          <Card>
            <CardHeader title='EOD Stock Graph' />
            <CardContent>
              {isStocksLoading && <LinearProgress />}
              {!!error && <Alert severity='error'>{error}</Alert>}
              {!stocks.length && !isStocksLoading ? (
                <Typography variant='body2'>No stock with history data found yet.</Typography>
              ) : (
                <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center', mb: 3 }}>
                  <Autocomplete
                    sx={{ minWidth: 360, flex: '1 1 360px', maxWidth: 520 }}
                    loading={isStocksLoading}
                    options={stocks}
                    value={selectedStock}
                    inputValue={searchInput}
                    onInputChange={(_, value, reason) => {
                      if (reason !== 'reset') setSearchInput(value)
                    }}
                    onChange={(_, value) => {
                      setSelectedMasterId(value?.master_id ? String(value.master_id) : '')
                    }}
                    getOptionLabel={option => `${option.symbol} - ${option.name}`}
                    isOptionEqualToValue={(option, value) => String(option.master_id) === String(value.master_id)}
                    filterOptions={options => options}
                    renderInput={params => (
                      <TextField
                        {...params}
                        size='small'
                        label='Search stock'
                        placeholder='Type symbol or company name'
                      />
                    )}
                  />

                  <ButtonGroup size='small' variant='outlined'>
                    {(['1M', '1Y', '5Y', 'ALL', 'CUSTOM'] as RangeKey[]).map(btn => (
                      <Button
                        key={btn}
                        variant={range === btn ? 'contained' : 'outlined'}
                        onClick={() => {
                          setRange(btn)
                          if (btn === 'CUSTOM') {
                            setShowCustomRangeForm(true)
                          } else {
                            setShowCustomRangeForm(false)
                            setCustomRangeError('')
                          }
                        }}
                      >
                        {btn === 'CUSTOM' ? 'Custom' : btn}
                      </Button>
                    ))}
                  </ButtonGroup>

                  {(range === '5Y' || range === 'ALL') && (
                    <ButtonGroup size='small' variant='outlined'>
                      <Button
                        variant={longRangeInterval === 'W' ? 'contained' : 'outlined'}
                        onClick={() => setLongRangeInterval('W')}
                      >
                        Weekly
                      </Button>
                      <Button
                        variant={longRangeInterval === 'M' ? 'contained' : 'outlined'}
                        onClick={() => setLongRangeInterval('M')}
                      >
                        Monthly
                      </Button>
                    </ButtonGroup>
                  )}

                  {(showCustomRangeForm || range === 'CUSTOM') && (
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                      <TextField
                        size='small'
                        type='date'
                        label='From'
                        value={customFromDate}
                        onChange={e => setCustomFromDate(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                      />
                      <TextField
                        size='small'
                        type='date'
                        label='To'
                        value={customToDate}
                        onChange={e => setCustomToDate(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                      />
                      <Button
                        size='small'
                        variant='contained'
                        onClick={() => {
                          if (!customFromDate || !customToDate) {
                            setCustomRangeError('Please select both from and to dates.')
                            
return
                          }
                          if (customFromDate > customToDate) {
                            setCustomRangeError('From date must be before To date.')
                            
return
                          }
                          setCustomRangeError('')
                          setRange('CUSTOM')
                        }}
                      >
                        Apply
                      </Button>
                    </Box>
                  )}

                  <ButtonGroup size='small' variant='outlined'>
                    <Button
                      variant={chartType === 'candlestick' ? 'contained' : 'outlined'}
                      onClick={() => setChartType('candlestick')}
                    >
                      Candle
                    </Button>
                    <Button
                      variant={chartType === 'ohlc' ? 'contained' : 'outlined'}
                      onClick={() => setChartType('ohlc')}
                    >
                      OHLC
                    </Button>
                    <Button
                      variant={chartType === 'heikin' ? 'contained' : 'outlined'}
                      onClick={() => setChartType('heikin')}
                    >
                      Heikin
                    </Button>
                    <Button
                      variant={chartType === 'area' ? 'contained' : 'outlined'}
                      onClick={() => setChartType('area')}
                    >
                      Area
                    </Button>
                  </ButtonGroup>

                  <ButtonGroup size='small' variant='outlined'>
                    <Button
                      variant={magnetMode ? 'contained' : 'outlined'}
                      onClick={() => setMagnetMode(prev => !prev)}
                    >
                      Magnet
                    </Button>
                  </ButtonGroup>

                  <TextField
                    select
                    size='small'
                    label='Auto Breakout'
                    value={breakoutType}
                    onChange={e => setBreakoutType(e.target.value as BreakoutType)}
                    sx={{ minWidth: 240 }}
                  >
                    {(Object.keys(BREAKOUT_LABEL) as BreakoutType[]).map(key => (
                      <MenuItem key={key} value={key}>
                        {BREAKOUT_LABEL[key]}
                      </MenuItem>
                    ))}
                  </TextField>

                  <TextField
                    select
                    size='small'
                    label='Prediction'
                    value={predictionType}
                    onChange={e => setPredictionType(e.target.value as PredictionType)}
                    sx={{ minWidth: 250 }}
                  >
                    {(Object.keys(PREDICTION_LABEL) as PredictionType[]).map(key => (
                      <MenuItem key={key} value={key}>
                        {PREDICTION_LABEL[key]}
                      </MenuItem>
                    ))}
                  </TextField>

                  <TextField
                    select
                    size='small'
                    label='Group'
                    value={toolGroup}
                    onChange={e => {
                      const nextGroup = e.target.value as ToolGroup
                      setToolGroup(nextGroup)
                      const nextTools = GROUP_TOOLS[nextGroup]
                      if (!nextTools.includes(drawTool)) {
                        setDrawTool(nextTools[0] || 'none')
                      }
                      setPendingPoints([])
                    }}
                    sx={{ minWidth: 140 }}
                  >
                    {Object.entries(TOOL_GROUP_LABEL).map(([key, label]) => (
                      <MenuItem key={key} value={key}>
                        {label}
                      </MenuItem>
                    ))}
                  </TextField>

                  <TextField
                    select
                    size='small'
                    label='Tool'
                    value={drawTool}
                    onChange={e => {
                      setDrawTool(e.target.value as DrawTool)
                      setPendingPoints([])
                    }}
                    sx={{ minWidth: 220 }}
                  >
                    {visibleToolOptions.map(tool => (
                      <MenuItem key={tool} value={tool}>
                        {DRAW_TOOL_LABEL[tool]}
                      </MenuItem>
                    ))}
                  </TextField>

                  <ButtonGroup size='small' variant='outlined'>
                    <Button
                      onClick={() => {
                        if (trendLines.length) {
                          setTrendLines(prev => prev.slice(0, -1))
                        } else if (rayLines.length) {
                          setRayLines(prev => prev.slice(0, -1))
                        } else if (extendedLines.length) {
                          setExtendedLines(prev => prev.slice(0, -1))
                        } else if (infoLines.length) {
                          setInfoLines(prev => prev.slice(0, -1))
                        } else if (angleLines.length) {
                          setAngleLines(prev => prev.slice(0, -1))
                        } else if (regressionLines.length) {
                          setRegressionLines(prev => prev.slice(0, -1))
                        } else if (horizontalLines.length) {
                          setHorizontalLines(prev => prev.slice(0, -1))
                        } else if (horizontalRays.length) {
                          setHorizontalRays(prev => prev.slice(0, -1))
                        } else if (verticalLines.length) {
                          setVerticalLines(prev => prev.slice(0, -1))
                        } else if (crossLines.length) {
                          setCrossLines(prev => prev.slice(0, -1))
                        } else if (channelLines.length) {
                          setChannelLines(prev => prev.slice(0, -1))
                        } else if (flatTopBottomShapes.length) {
                          setFlatTopBottomShapes(prev => prev.slice(0, -1))
                        } else if (disjointChannels.length) {
                          setDisjointChannels(prev => prev.slice(0, -1))
                        } else if (pitchforks.length) {
                          setPitchforks(prev => prev.slice(0, -1))
                        } else if (schiffPitchforks.length) {
                          setSchiffPitchforks(prev => prev.slice(0, -1))
                        } else if (modifiedSchiffPitchforks.length) {
                          setModifiedSchiffPitchforks(prev => prev.slice(0, -1))
                        } else if (insidePitchforks.length) {
                          setInsidePitchforks(prev => prev.slice(0, -1))
                        } else if (rectangles.length) {
                          setRectangles(prev => prev.slice(0, -1))
                        } else if (fibs.length) {
                          setFibs(prev => prev.slice(0, -1))
                        }
                        setPendingPoints([])
                      }}
                      disabled={
                        !trendLines.length &&
                        !rayLines.length &&
                        !extendedLines.length &&
                        !infoLines.length &&
                        !angleLines.length &&
                        !regressionLines.length &&
                        !horizontalLines.length &&
                        !horizontalRays.length &&
                        !verticalLines.length &&
                        !crossLines.length &&
                        !channelLines.length &&
                        !flatTopBottomShapes.length &&
                        !disjointChannels.length &&
                        !pitchforks.length &&
                        !schiffPitchforks.length &&
                        !modifiedSchiffPitchforks.length &&
                        !insidePitchforks.length &&
                        !rectangles.length &&
                        !fibs.length
                      }
                    >
                      Undo
                    </Button>
                    <Button
                      onClick={() => {
                        setTrendLines([])
                        setRayLines([])
                        setExtendedLines([])
                        setInfoLines([])
                        setAngleLines([])
                        setRegressionLines([])
                        setHorizontalLines([])
                        setHorizontalRays([])
                        setVerticalLines([])
                        setCrossLines([])
                        setChannelLines([])
                        setFlatTopBottomShapes([])
                        setDisjointChannels([])
                        setPitchforks([])
                        setSchiffPitchforks([])
                        setModifiedSchiffPitchforks([])
                        setInsidePitchforks([])
                        setRectangles([])
                        setFibs([])
                        setPendingPoints([])
                        setSelectedDrawing(null)
                      }}
                      disabled={
                        !trendLines.length &&
                        !rayLines.length &&
                        !extendedLines.length &&
                        !infoLines.length &&
                        !angleLines.length &&
                        !regressionLines.length &&
                        !horizontalLines.length &&
                        !horizontalRays.length &&
                        !verticalLines.length &&
                        !crossLines.length &&
                        !channelLines.length &&
                        !flatTopBottomShapes.length &&
                        !disjointChannels.length &&
                        !pitchforks.length &&
                        !schiffPitchforks.length &&
                        !modifiedSchiffPitchforks.length &&
                        !insidePitchforks.length &&
                        !rectangles.length &&
                        !fibs.length &&
                        !pendingPoints.length
                      }
                    >
                      Clear
                    </Button>
                  </ButtonGroup>

                  {selectedDrawing && visibleBounds ? (
                    <ButtonGroup size='small' variant='outlined'>
                      <Button
                        onClick={() => moveSelectedDrawing(-(visibleBounds.maxTs - visibleBounds.minTs) * 0.03, 0)}
                      >
                        ←
                      </Button>
                      <Button
                        onClick={() => moveSelectedDrawing((visibleBounds.maxTs - visibleBounds.minTs) * 0.03, 0)}
                      >
                        →
                      </Button>
                      <Button
                        onClick={() => moveSelectedDrawing(0, (visibleBounds.maxPrice - visibleBounds.minPrice) * 0.02)}
                      >
                        ↑
                      </Button>
                      <Button
                        onClick={() => moveSelectedDrawing(0, -(visibleBounds.maxPrice - visibleBounds.minPrice) * 0.02)}
                      >
                        ↓
                      </Button>
                      <Button color='error' onClick={deleteSelectedDrawing}>
                        Delete
                      </Button>
                    </ButtonGroup>
                  ) : null}

                  {selectedStock?.historyDataFromDate && selectedStock?.historyDataToDate ? (
                    <Typography variant='body2' color='text.secondary'>
                      Available: {selectedStock.historyDataFromDate} to {selectedStock.historyDataToDate}
                    </Typography>
                  ) : null}
                  {!!customRangeError && (
                    <Typography variant='body2' color='error'>
                      {customRangeError}
                    </Typography>
                  )}
                  {range === 'CUSTOM' && isCustomRangeLarge && (
                    <Typography variant='body2' color='text.secondary'>
                      Custom range is more than 5 years, so chart is auto-aggregated to monthly candles.
                    </Typography>
                  )}
                </Box>
              )}

              {breakoutType !== 'none' ? (
                <Box sx={{ mb: 3, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  {latestBreakout ? (
                    <>
                      <Typography variant='subtitle2'>
                        Latest: {latestBreakout.label} ({latestBreakout.direction === 'up' ? 'UP' : 'DOWN'}) on{' '}
                        {new Date(latestBreakout.ts).toISOString().slice(0, 10)}
                      </Typography>
                      <Typography variant='body2' color='text.secondary'>
                        Level: {latestBreakout.level.toFixed(2)} | Close: {latestBreakout.close.toFixed(2)} | Move:{' '}
                        {latestBreakout.changePct >= 0 ? '+' : ''}
                        {latestBreakout.changePct.toFixed(2)}%
                      </Typography>
                      <Typography variant='body2' color='text.secondary'>
                        {latestBreakout.details}
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        Total signals: {breakoutEvents.length}
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        {breakoutEvents
                          .slice(-5)
                          .reverse()
                          .map(ev => (
                            <Typography key={`${ev.ts}-${ev.label}`} variant='caption' display='block' color='text.secondary'>
                              {new Date(ev.ts).toISOString().slice(0, 10)} | {ev.label} | {ev.direction === 'up' ? 'UP' : 'DOWN'} |{' '}
                              {ev.changePct >= 0 ? '+' : ''}
                              {ev.changePct.toFixed(2)}%
                            </Typography>
                          ))}
                      </Box>
                    </>
                  ) : (
                    <Typography variant='body2' color='text.secondary'>
                      No breakout found for selected model and current range.
                    </Typography>
                  )}
                </Box>
              ) : null}

              <Tabs value={viewTab} onChange={(_, value) => setViewTab(value)} sx={{ mb: 3 }}>
                <Tab value='chart' label='Chart' />
                <Tab value='table' label='Data Table' />
              </Tabs>

              {predictionType !== 'none' ? (
                <Box sx={{ mb: 3, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  {latestPrediction ? (
                    <>
                      <Typography variant='subtitle2'>
                        Prediction: {latestPrediction.kind === 'confirmed' ? 'Confirmed Breakout' : 'Pre-Breakout Setup'} on{' '}
                        {new Date(latestPrediction.ts).toISOString().slice(0, 10)}
                      </Typography>
                      <Typography variant='body2' color='text.secondary'>
                        Score: {latestPrediction.score}/100 | Breakout Level: {latestPrediction.breakoutLevel.toFixed(2)} | Risk Level:{' '}
                        {latestPrediction.stopLevel.toFixed(2)}
                      </Typography>
                      <Typography variant='body2' color='text.secondary'>
                        {latestPrediction.details}
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        Signals: {predictionSignals.length} (SET=setup, GO=confirmed)
                      </Typography>
                    </>
                  ) : (
                    <Typography variant='body2' color='text.secondary'>
                      No predictive setup found in current range.
                    </Typography>
                  )}
                </Box>
              ) : null}

              {isCandlesLoading ? (
                <LinearProgress />
              ) : viewTab === 'table' ? (
                <TableContainer sx={{ maxHeight: 720 }}>
                  <Table stickyHeader size='small'>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell align='right'>Open</TableCell>
                        <TableCell align='right'>High</TableCell>
                        <TableCell align='right'>Low</TableCell>
                        <TableCell align='right'>Close</TableCell>
                        <TableCell align='right'>Volume</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredCandles.length ? (
                        [...filteredCandles].reverse().map((row, index) => (
                          <TableRow key={`${row.trade_date}-${index}`} hover>
                            <TableCell>{candleDateToIso(row.trade_date) || '-'}</TableCell>
                            <TableCell align='right'>{Number(row.open).toFixed(2)}</TableCell>
                            <TableCell align='right'>{Number(row.high).toFixed(2)}</TableCell>
                            <TableCell align='right'>{Number(row.low).toFixed(2)}</TableCell>
                            <TableCell align='right'>{Number(row.close).toFixed(2)}</TableCell>
                            <TableCell align='right'>{Number(row.volume || 0).toLocaleString('en-IN')}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6}>
                            <Typography variant='body2' color='text.secondary'>
                              No EOD rows available for the selected range.
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <>
                  <Box
                    ref={chartViewportRef}
                    onWheel={handleWheelZoom}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                    sx={{
                      cursor: drawTool !== 'none' ? 'crosshair' : isDragging ? 'grabbing' : 'grab',
                      touchAction: 'none',
                      position: 'relative'
                    }}
                  >
                    <ReactApexcharts
                      type={chartType === 'area' ? 'area' : chartType === 'ohlc' ? 'ohlc' : 'candlestick'}
                      height={520}
                      options={options}
                      series={series}
                    />
                    {drawTool !== 'none' ? (
                      <Box
                        onPointerDown={handleChartClick}
                        sx={{
                          position: 'absolute',
                          left: plotRect.left,
                          top: plotRect.top,
                          width: plotRect.width,
                          height: plotRect.height,
                          zIndex: 2
                        }}
                      />
                    ) : null}
                    <svg
                      width={plotRect.width}
                      height={plotRect.height}
                      style={{ position: 'absolute', top: plotRect.top, left: plotRect.left, pointerEvents: 'none', zIndex: 3 }}
                    >
                    {trendLines.map(line => (
                      <line
                        key={line.id}
                        x1={toPixelX(line.start.ts)}
                        y1={toPixelY(line.start.price)}
                        x2={toPixelX(line.end.ts)}
                        y2={toPixelY(line.end.price)}
                        stroke={isSelected('trend', line.id) ? '#f44336' : '#1976d2'}
                        strokeWidth={isSelected('trend', line.id) ? '3' : '2'}
                      />
                    ))}
                    {rayLines.map(line => {
                      const ray = getRayEndpoint(line.start, line.end)
                      if (!ray) return null
                      
return (
                        <line
                          key={line.id}
                          x1={ray.start.x}
                          y1={ray.start.y}
                          x2={ray.end.x}
                          y2={ray.end.y}
                          stroke={isSelected('ray', line.id) ? '#f44336' : '#00897b'}
                          strokeWidth={isSelected('ray', line.id) ? '3' : '2'}
                        />
                      )
                    })}
                    {extendedLines.map(line => {
                      const inf = getInfiniteLineEndpoints(line.start, line.end)
                      if (!inf) return null
                      
return (
                        <line
                          key={line.id}
                          x1={inf.first.x}
                          y1={inf.first.y}
                          x2={inf.last.x}
                          y2={inf.last.y}
                          stroke={isSelected('xline', line.id) ? '#f44336' : '#455a64'}
                          strokeWidth={isSelected('xline', line.id) ? '3' : '1.8'}
                        />
                      )
                    })}
                    {infoLines.map(line => {
                      const x1 = toPixelX(line.start.ts)
                      const y1 = toPixelY(line.start.price)
                      const x2 = toPixelX(line.end.ts)
                      const y2 = toPixelY(line.end.price)
                      const mx = (x1 + x2) / 2
                      const my = (y1 + y2) / 2
                      
return (
                        <g key={line.id}>
                          <line
                            x1={x1}
                            y1={y1}
                            x2={x2}
                            y2={y2}
                            stroke={isSelected('info', line.id) ? '#f44336' : '#2e7d32'}
                            strokeWidth={isSelected('info', line.id) ? '3' : '2'}
                          />
                          <text x={mx + 4} y={my - 4} fontSize='10' fill='#2e7d32'>
                            {getInfoLabel(line)}
                          </text>
                        </g>
                      )
                    })}
                    {angleLines.map(line => {
                      const x1 = toPixelX(line.start.ts)
                      const y1 = toPixelY(line.start.price)
                      const x2 = toPixelX(line.end.ts)
                      const y2 = toPixelY(line.end.price)
                      const mx = (x1 + x2) / 2
                      const my = (y1 + y2) / 2
                      
return (
                        <g key={line.id}>
                          <line
                            x1={x1}
                            y1={y1}
                            x2={x2}
                            y2={y2}
                            stroke={isSelected('angle', line.id) ? '#f44336' : '#00695c'}
                            strokeWidth={isSelected('angle', line.id) ? '3' : '2'}
                          />
                          <text x={mx + 4} y={my - 4} fontSize='10' fill='#00695c'>
                            {getAngleLabel(line)}
                          </text>
                        </g>
                      )
                    })}
                    {regressionLines.map(line => {
                      const meta = getRegressionMeta(line)
                      if (!meta) return null
                      const x1 = toPixelX(meta.tMin)
                      const x2 = toPixelX(meta.tMax)
                      const y1 = toPixelY(meta.y1)
                      const y2 = toPixelY(meta.y2)
                      const y1u = toPixelY(meta.y1 + meta.std)
                      const y2u = toPixelY(meta.y2 + meta.std)
                      const y1l = toPixelY(meta.y1 - meta.std)
                      const y2l = toPixelY(meta.y2 - meta.std)
                      const poly = `${x1},${y1u} ${x2},${y2u} ${x2},${y2l} ${x1},${y1l}`
                      
return (
                        <g key={line.id}>
                          <polygon points={poly} fill='rgba(25,118,210,0.12)' />
                          <line
                            x1={x1}
                            y1={y1}
                            x2={x2}
                            y2={y2}
                            stroke={isSelected('regression', line.id) ? '#f44336' : '#1976d2'}
                            strokeWidth={isSelected('regression', line.id) ? '3' : '2'}
                          />
                          <line x1={x1} y1={y1u} x2={x2} y2={y2u} stroke='#1976d2' strokeWidth='1.2' strokeDasharray='4 4' />
                          <line x1={x1} y1={y1l} x2={x2} y2={y2l} stroke='#1976d2' strokeWidth='1.2' strokeDasharray='4 4' />
                        </g>
                      )
                    })}
                    {horizontalLines.map(line => (
                      <line
                        key={line.id}
                        x1={0}
                        y1={toPixelY(line.price)}
                        x2={plotRect.width}
                        y2={toPixelY(line.price)}
                        stroke={isSelected('hline', line.id) ? '#f44336' : '#ef6c00'}
                        strokeWidth={isSelected('hline', line.id) ? '2.5' : '1.6'}
                        strokeDasharray='4 4'
                      />
                    ))}
                    {horizontalRays.map(line => (
                      <line
                        key={line.id}
                        x1={toPixelX(line.ts)}
                        y1={toPixelY(line.price)}
                        x2={plotRect.width}
                        y2={toPixelY(line.price)}
                        stroke={isSelected('hray', line.id) ? '#f44336' : '#fb8c00'}
                        strokeWidth={isSelected('hray', line.id) ? '2.5' : '1.8'}
                        strokeDasharray='6 4'
                      />
                    ))}
                    {verticalLines.map(line => (
                      <line
                        key={line.id}
                        x1={toPixelX(line.ts)}
                        y1={0}
                        x2={toPixelX(line.ts)}
                        y2={plotRect.height}
                        stroke={isSelected('vline', line.id) ? '#f44336' : '#6a1b9a'}
                        strokeWidth={isSelected('vline', line.id) ? '2.5' : '1.6'}
                        strokeDasharray='4 4'
                      />
                    ))}
                    {crossLines.map(line => (
                      <g key={line.id}>
                        <line
                          x1={0}
                          y1={toPixelY(line.price)}
                          x2={plotRect.width}
                          y2={toPixelY(line.price)}
                          stroke={isSelected('cross', line.id) ? '#f44336' : '#263238'}
                          strokeWidth='1.2'
                          strokeDasharray='4 4'
                        />
                        <line
                          x1={toPixelX(line.ts)}
                          y1={0}
                          x2={toPixelX(line.ts)}
                          y2={plotRect.height}
                          stroke={isSelected('cross', line.id) ? '#f44336' : '#263238'}
                          strokeWidth='1.2'
                          strokeDasharray='4 4'
                        />
                      </g>
                    ))}
                    {channelLines.map(line => {
                      const ax = toPixelX(line.a.ts)
                      const ay = toPixelY(line.a.price)
                      const bx = toPixelX(line.b.ts)
                      const by = toPixelY(line.b.price)
                      const cx = toPixelX(line.c.ts)
                      const cy = toPixelY(line.c.price)
                      const dx = bx - ax
                      const dy = by - ay
                      const dx2 = cx + dx
                      const dy2 = cy + dy
                      
return (
                        <g key={line.id}>
                          <line x1={ax} y1={ay} x2={bx} y2={by} stroke='#5e35b1' strokeWidth='1.8' />
                          <line
                            x1={cx}
                            y1={cy}
                            x2={dx2}
                            y2={dy2}
                            stroke={isSelected('channel', line.id) ? '#f44336' : '#5e35b1'}
                            strokeWidth={isSelected('channel', line.id) ? '2.6' : '1.8'}
                          />
                          <line x1={ax} y1={ay} x2={cx} y2={cy} stroke='#7e57c2' strokeWidth='1.4' strokeDasharray='4 4' />
                          <line x1={bx} y1={by} x2={dx2} y2={dy2} stroke='#7e57c2' strokeWidth='1.4' strokeDasharray='4 4' />
                        </g>
                      )
                    })}
                    {flatTopBottomShapes.map(shape => {
                      const ax = toPixelX(shape.a.ts)
                      const ay = toPixelY(shape.a.price)
                      const bx = toPixelX(shape.b.ts)
                      const by = toPixelY(shape.b.price)
                      const cx = toPixelX(shape.c.ts)
                      const cy = toPixelY(shape.c.price)
                      
return (
                        <g key={shape.id}>
                          <line
                            x1={ax}
                            y1={ay}
                            x2={bx}
                            y2={by}
                            stroke={isSelected('flat_tb', shape.id) ? '#f44336' : '#3949ab'}
                            strokeWidth={isSelected('flat_tb', shape.id) ? '2.6' : '1.8'}
                          />
                          <line
                            x1={Math.min(ax, bx)}
                            y1={cy}
                            x2={Math.max(ax, bx)}
                            y2={cy}
                            stroke={isSelected('flat_tb', shape.id) ? '#f44336' : '#3949ab'}
                            strokeWidth={isSelected('flat_tb', shape.id) ? '2.6' : '1.8'}
                          />
                          <line x1={ax} y1={ay} x2={ax} y2={cy} stroke='#7986cb' strokeWidth='1.2' strokeDasharray='3 3' />
                          <line x1={bx} y1={by} x2={bx} y2={cy} stroke='#7986cb' strokeWidth='1.2' strokeDasharray='3 3' />
                        </g>
                      )
                    })}
                    {disjointChannels.map(shape => {
                      const ax = toPixelX(shape.a.ts)
                      const ay = toPixelY(shape.a.price)
                      const bx = toPixelX(shape.b.ts)
                      const by = toPixelY(shape.b.price)
                      const cx = toPixelX(shape.c.ts)
                      const cy = toPixelY(shape.c.price)
                      const dx = bx - ax
                      const dy = by - ay
                      
return (
                        <g key={shape.id}>
                          <line
                            x1={ax}
                            y1={ay}
                            x2={bx}
                            y2={by}
                            stroke={isSelected('disjoint_channel', shape.id) ? '#f44336' : '#8e24aa'}
                            strokeWidth={isSelected('disjoint_channel', shape.id) ? '2.6' : '1.8'}
                          />
                          <line
                            x1={cx}
                            y1={cy}
                            x2={cx + dx}
                            y2={cy + dy}
                            stroke={isSelected('disjoint_channel', shape.id) ? '#f44336' : '#8e24aa'}
                            strokeWidth={isSelected('disjoint_channel', shape.id) ? '2.6' : '1.8'}
                          />
                        </g>
                      )
                    })}
                    {pitchforks.map(shape => {
                      const lines = renderPitchfork(shape, 'standard')
                      if (!lines) return null
                      
return (
                        <g key={shape.id}>
                          {lines.map((ln, idx) => (
                            <line
                              key={`${shape.id}-p-${idx}`}
                              x1={ln.x1}
                              y1={ln.y1}
                              x2={ln.x2}
                              y2={ln.y2}
                              stroke={isSelected('pitchfork', shape.id) ? '#f44336' : '#00838f'}
                              strokeWidth={isSelected('pitchfork', shape.id) ? (idx === 0 ? '2.8' : '2') : idx === 0 ? '2' : '1.4'}
                              strokeDasharray={ln.dash}
                            />
                          ))}
                        </g>
                      )
                    })}
                    {schiffPitchforks.map(shape => {
                      const lines = renderPitchfork(shape, 'schiff')
                      if (!lines) return null
                      
return (
                        <g key={shape.id}>
                          {lines.map((ln, idx) => (
                            <line
                              key={`${shape.id}-s-${idx}`}
                              x1={ln.x1}
                              y1={ln.y1}
                              x2={ln.x2}
                              y2={ln.y2}
                              stroke={isSelected('schiff_pitchfork', shape.id) ? '#f44336' : '#00695c'}
                              strokeWidth={
                                isSelected('schiff_pitchfork', shape.id) ? (idx === 0 ? '2.8' : '2') : idx === 0 ? '2' : '1.4'
                              }
                              strokeDasharray={ln.dash}
                            />
                          ))}
                        </g>
                      )
                    })}
                    {modifiedSchiffPitchforks.map(shape => {
                      const lines = renderPitchfork(shape, 'modified')
                      if (!lines) return null
                      
return (
                        <g key={shape.id}>
                          {lines.map((ln, idx) => (
                            <line
                              key={`${shape.id}-m-${idx}`}
                              x1={ln.x1}
                              y1={ln.y1}
                              x2={ln.x2}
                              y2={ln.y2}
                              stroke={isSelected('mod_schiff_pitchfork', shape.id) ? '#f44336' : '#2e7d32'}
                              strokeWidth={
                                isSelected('mod_schiff_pitchfork', shape.id)
                                  ? idx === 0
                                    ? '2.8'
                                    : '2'
                                  : idx === 0
                                    ? '2'
                                    : '1.4'
                              }
                              strokeDasharray={ln.dash}
                            />
                          ))}
                        </g>
                      )
                    })}
                    {insidePitchforks.map(shape => {
                      const lines = renderPitchfork(shape, 'inside')
                      if (!lines) return null
                      
return (
                        <g key={shape.id}>
                          {lines.map((ln, idx) => (
                            <line
                              key={`${shape.id}-i-${idx}`}
                              x1={ln.x1}
                              y1={ln.y1}
                              x2={ln.x2}
                              y2={ln.y2}
                              stroke={isSelected('inside_pitchfork', shape.id) ? '#f44336' : '#4527a0'}
                              strokeWidth={
                                isSelected('inside_pitchfork', shape.id) ? (idx === 0 ? '2.8' : '2') : idx === 0 ? '2' : '1.2'
                              }
                              strokeDasharray={ln.dash}
                            />
                          ))}
                        </g>
                      )
                    })}
                    {rectangles.map(shape => {
                      const x1 = toPixelX(shape.a.ts)
                      const y1 = toPixelY(shape.a.price)
                      const x2 = toPixelX(shape.b.ts)
                      const y2 = toPixelY(shape.b.price)
                      const left = Math.min(x1, x2)
                      const top = Math.min(y1, y2)
                      const width = Math.abs(x2 - x1)
                      const height = Math.abs(y2 - y1)
                      
return (
                        <rect
                          key={shape.id}
                          x={left}
                          y={top}
                          width={Math.max(width, 1)}
                          height={Math.max(height, 1)}
                          fill={isSelected('rect', shape.id) ? 'rgba(244,67,54,0.12)' : 'rgba(30, 136, 229, 0.12)'}
                          stroke={isSelected('rect', shape.id) ? '#f44336' : '#1e88e5'}
                          strokeWidth={isSelected('rect', shape.id) ? '2.2' : '1.5'}
                        />
                      )
                    })}
                    {fibs.map(fib => {
                      const x1 = toPixelX(fib.a.ts)
                      const x2 = toPixelX(fib.b.ts)
                      const left = Math.min(x1, x2)
                      const right = Math.max(x1, x2)
                      const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1]
                      const priceAt = (lvl: number) => fib.a.price + (fib.b.price - fib.a.price) * lvl
                      
return (
                        <g key={fib.id}>
                          {levels.map(lvl => {
                            const y = toPixelY(priceAt(lvl))
                            
return (
                              <g key={`${fib.id}-${lvl}`}>
                                <line
                                  x1={left}
                                  y1={y}
                                  x2={right}
                                  y2={y}
                                  stroke={isSelected('fib', fib.id) ? '#f44336' : '#c2185b'}
                                  strokeWidth={isSelected('fib', fib.id) ? '2' : '1.2'}
                                />
                                <text x={right + 4} y={y - 2} fontSize='10' fill='#c2185b'>
                                  {lvl.toFixed(3)}
                                </text>
                              </g>
                            )
                          })}
                        </g>
                      )
                    })}
                    {pendingPoints.map((p, idx) => (
                      <circle key={`pending-${idx}`} cx={toPixelX(p.ts)} cy={toPixelY(p.price)} r='4' fill='#d32f2f' />
                    ))}
                    </svg>
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </ApexChartWrapper>
  )
}

export default EodGraphPage

