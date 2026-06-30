import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Card,
  CardContent,
  CardHeader,
  Button,
  Chip,
  Divider,
  Grid,
  LinearProgress,
  ClickAwayListener,
  InputAdornment,
  ListItemButton,
  ListItemText,
  Paper,
  Popper,
  Tab,
  Tabs,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import Magnify from 'mdi-material-ui/Magnify'
import { ApexOptions } from 'apexcharts'
import { useRouter } from 'next/router'
import axiosInstance from 'src/api/axios/axiosBaseQuery'
import { ENDURL } from 'src/utils/constants/endurl.utils'
import { usePaginatedSWR } from 'src/hooks/swr/swrhooks'
import { useRef } from 'react'
import ApexChartWrapper from 'src/@core/styles/libs/react-apexcharts'
import ReactApexcharts from 'src/@core/components/react-apexcharts'

type TrendState = 'Strong Uptrend' | 'Uptrend' | 'Sideways' | 'Downtrend' | 'Strong Downtrend'

interface EodCandle {
  symbol?: string
  exchange?: string
  trade_date: string
  open: number | string
  high: number | string
  low: number | string
  close: number | string
  volume?: number | string
}

interface ActiveStock {
  master_id?: string
  name: string
  symbol: string
  exchange?: string
}

interface SearchList {
  id: string
  name: string
  symbol: string
}

interface ParsedCandle {
  ts: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

interface TrendPoint extends ParsedCandle {
  sma20: number | null
  sma50: number | null
  sma200: number | null
  volumeAvg20: number | null
  sma20SlopePct: number | null
  sma50SlopePct: number | null
  sma200SlopePct: number | null
  momentum63Pct: number | null
  momentum126Pct: number | null
  momentum252Pct: number | null
  week52High: number | null
  week52Low: number | null
  week52PositionPct: number | null
  trend: TrendState
  trendStrengthPct: number | null
  trendScore: number
  volumeRatio: number | null
  volumeConfirmation: 'Above Average' | 'Below Average' | 'Neutral'
}

interface TrendDuration {
  startTs: number
  sessions: number
  calendarDays: number
}

interface TrendAnalysisResult {
  rows: TrendPoint[]
  latest: TrendPoint | null
  transitions: TrendPoint[]
  currentTrendDuration: TrendDuration | null
}

type VolatilityState = 'Very Low Volatility' | 'Low Volatility' | 'Moderate Volatility' | 'High Volatility' | 'Very High Volatility'

const isPresent = <T,>(value: T | null | undefined): value is T => value !== null && value !== undefined

interface VolatilityPoint extends ParsedCandle {
  trueRange: number
  atr14: number | null
  atrPct: number | null
  dailyRangePct: number
  volatilityState: VolatilityState
  volatilityScore: number
  atrSlopePct: number | null
}

interface VolatilityDuration {
  startTs: number
  sessions: number
  calendarDays: number
}

interface VolatilityAnalysisResult {
  rows: VolatilityPoint[]
  latest: VolatilityPoint | null
  transitions: VolatilityPoint[]
  currentVolatilityDuration: VolatilityDuration | null
}

type BollingerState = 'Overbought' | 'Oversold' | 'Squeeze (Big Move Coming)' | 'Normal'

interface BollingerPoint extends ParsedCandle {
  bbMid: number | null
  bbStd: number | null
  bbUpper: number | null
  bbLower: number | null
  bbBandwidth: number | null
  bbPosition: number | null
  bbSignal: BollingerState
  bbScore: number
}

interface BollingerDuration {
  startTs: number
  sessions: number
  calendarDays: number
}

interface BollingerAnalysisResult {
  rows: BollingerPoint[]
  latest: BollingerPoint | null
  transitions: BollingerPoint[]
  currentBollingerDuration: BollingerDuration | null
}

type ReturnVolatilityState = 'Calm' | 'Normal' | 'Elevated' | 'High' | 'Very High'

interface ReturnVolatilityPoint extends ParsedCandle {
  logReturn: number | null
  volatility30d: number | null
  volatility90d: number | null
  volatility1yr: number | null
  volatilityState30d: ReturnVolatilityState
  volatilityState90d: ReturnVolatilityState
  volatilityState1yr: ReturnVolatilityState
}

interface ReturnVolatilityAnalysisResult {
  rows: ReturnVolatilityPoint[]
  latest: ReturnVolatilityPoint | null
}

type MomentumSignal = 'Strong Bullish' | 'Bullish' | 'Neutral' | 'Bearish' | 'Strong Bearish'

interface MomentumPoint extends ParsedCandle {
  rsi14: number | null
  rsiSignal: 'Overbought' | 'Oversold' | 'Bullish' | 'Bearish' | 'Neutral'
  macdLine: number | null
  signalLine: number | null
  macdHistogram: number | null
  macdSignal: 'Bullish Crossover' | 'Bearish Crossover' | 'Bullish' | 'Bearish' | 'Neutral'
  roc10: number | null
  roc20: number | null
  roc60: number | null
  roc1y: number | null
  stochK: number | null
  stochD: number | null
  stochSignal: 'Overbought' | 'Oversold' | 'Neutral'
  momentumScore: MomentumSignal
}

interface MomentumAnalysisResult {
  rows: MomentumPoint[]
  latest: MomentumPoint | null
}

type BreakoutType =
  | '52W Breakout (Confirmed)'
  | '52W Breakout (Unconfirmed)'
  | '50D Breakout (Confirmed)'
  | '50D Breakout (Unconfirmed)'
  | '52W Breakdown (Confirmed)'
  | '52W Breakdown (Unconfirmed)'
  | '50D Breakdown (Confirmed)'
  | '50D Breakdown (Unconfirmed)'
  | 'No Breakout'

type BreakoutReadiness = 'Imminent Breakout' | 'Near Breakout' | 'Watching Zone' | 'Far From Breakout'
type ConsolidationSignal = 'Tight Consolidation (Breakout Setup)' | 'Moderate Consolidation' | 'Wide Range (No Setup)'
type BreakoutStatus = 'False Breakout' | 'Breakout Holding' | 'No Breakout'

interface BreakoutPoint extends ParsedCandle {
  resistance20d: number | null
  resistance50d: number | null
  resistance52w: number | null
  support20d: number | null
  support50d: number | null
  support52w: number | null
  priorResistance50d: number | null
  priorResistance52w: number | null
  priorSupport50d: number | null
  priorSupport52w: number | null
  avgVol20d: number | null
  volumeRatio: number | null
  pctFromResistance52w: number | null
  pctFromSupport52w: number | null
  breakoutType: BreakoutType
  breakoutReadiness: BreakoutReadiness
  consolidationSignal: ConsolidationSignal
  breakoutStatus: BreakoutStatus
  falseBreakout: boolean
}

interface BreakoutDuration {
  startTs: number
  sessions: number
  calendarDays: number
}

interface BreakoutAnalysisResult {
  rows: BreakoutPoint[]
  latest: BreakoutPoint | null
  transitions: BreakoutPoint[]
  currentBreakoutDuration: BreakoutDuration | null
}

interface SeasonalityMonthPoint {
  month: number
  monthName: string
  avgReturnPct: number | null
  bestReturnPct: number | null
  worstReturnPct: number | null
  volatility: number | null
  positiveYears: number
  totalYears: number
  winRatePct: number | null
}

interface SeasonalityQuarterPoint {
  quarter: number
  quarterLabel: string
  avgReturnPct: number | null
  bestReturnPct: number | null
  worstReturnPct: number | null
  positiveYears: number
  totalYears: number
  winRatePct: number | null
}

interface SeasonalityDayPoint {
  dayNum: number
  dayName: string
  avgReturnPct: number | null
  volatility: number | null
  positiveDays: number
  totalDays: number
  winRatePct: number | null
}

interface SeasonalityYearPoint {
  year: number
  yearOpen: number | null
  yearClose: number | null
  yearHigh: number | null
  yearLow: number | null
  yearlyReturnPct: number | null
  yearResult: 'Positive' | 'Negative' | 'Flat'
}

interface SeasonalityAnalysisResult {
  monthlyRows: SeasonalityMonthPoint[]
  quarterlyRows: SeasonalityQuarterPoint[]
  dayRows: SeasonalityDayPoint[]
  yearlyRows: SeasonalityYearPoint[]
  bestMonth: SeasonalityMonthPoint | null
  worstMonth: SeasonalityMonthPoint | null
  bestQuarter: SeasonalityQuarterPoint | null
  worstQuarter: SeasonalityQuarterPoint | null
}

type VolumeSpikeState = 'Extreme Spike' | 'High Spike' | 'Moderate Spike' | 'Normal'
type FlowSignal = 'Accumulation' | 'Distribution'
type PriceVolumeSignal = 'Strong Bullish' | 'Weak Bullish' | 'Neutral' | 'Weak Bearish' | 'Strong Bearish'

interface VolumePoint extends ParsedCandle {
  avgVol10d: number | null
  avgVol20d: number | null
  avgVol50d: number | null
  volumeRatio: number | null
  volumeSignal: VolumeSpikeState
  obvChange: number
  obv: number
  obvSignal: FlowSignal
  flowConsensus: 'Accumulation' | 'Distribution' | 'Mixed'
  vptChange: number | null
  vpt: number | null
  moneyFlowMultiplier: number | null
  moneyFlowVolume: number | null
  adLine: number | null
  adSignal: FlowSignal
  priceChangePct: number | null
  priceVolumeSignal: PriceVolumeSignal
}

interface VolumeAnalysisResult {
  rows: VolumePoint[]
  latest: VolumePoint | null
  transitions: VolumePoint[]
}

const HISTORY_FROM_DATE = '2007-01-01'
const HISTORY_TO_DATE = new Date().toISOString().slice(0, 10)
type AnalysisTab = 'trend' | 'risk' | 'momentum' | 'volume' | 'breakout' | 'seasonality'

const TREND_RULES: Record<TrendState, string> = {
  'Strong Uptrend': 'Close > SMA20 > SMA50 > SMA200',
  Uptrend: 'Close > SMA50 > SMA200',
  Sideways: 'Mixed alignment / no clear trend',
  Downtrend: 'Close < SMA50 < SMA200',
  'Strong Downtrend': 'Close < SMA20 < SMA50 < SMA200'
}

const getTrendColor = (trend: TrendState) => {
  if (trend === 'Strong Uptrend' || trend === 'Uptrend') return 'success'
  if (trend === 'Strong Downtrend' || trend === 'Downtrend') return 'error'
  
return 'warning'
}

const getVolatilityColor = (state: VolatilityState) => {
  if (state === 'Very Low Volatility') return 'info'
  if (state === 'Low Volatility') return 'success'
  if (state === 'Moderate Volatility') return 'warning'
  
return 'error'
}

const getBollingerColor = (state: BollingerState) => {
  if (state === 'Overbought') return 'error'
  if (state === 'Oversold') return 'success'
  if (state === 'Squeeze (Big Move Coming)') return 'warning'
  
return 'primary'
}

const getReturnVolatilityColor = (state: ReturnVolatilityState) => {
  if (state === 'Calm') return 'success'
  if (state === 'Normal') return 'primary'
  if (state === 'Elevated') return 'warning'
  
return 'error'
}

const getBreakoutTypeColor = (signal: BreakoutType) => {
  if (signal.includes('Breakout (Confirmed)')) return 'success'
  if (signal.includes('Breakout (Unconfirmed)')) return 'warning'
  if (signal.includes('Breakdown (Confirmed)')) return 'error'
  if (signal.includes('Breakdown (Unconfirmed)')) return 'warning'
  
return 'primary'
}

const getBreakoutReadinessColor = (signal: BreakoutReadiness) => {
  if (signal === 'Imminent Breakout') return 'error'
  if (signal === 'Near Breakout') return 'warning'
  if (signal === 'Watching Zone') return 'info'
  
return 'primary'
}

const getConsolidationColor = (signal: ConsolidationSignal) => {
  if (signal === 'Tight Consolidation (Breakout Setup)') return 'success'
  if (signal === 'Moderate Consolidation') return 'warning'
  
return 'primary'
}

const getBreakoutStatusColor = (signal: BreakoutStatus) => {
  if (signal === 'False Breakout') return 'error'
  if (signal === 'Breakout Holding') return 'success'
  
return 'primary'
}

const getSeasonalityColor = (value: number | null) => {
  if (value === null || !Number.isFinite(value)) return 'primary'
  if (value > 0) return value >= 5 ? 'success' : 'info'
  if (value < 0) return value <= -5 ? 'error' : 'warning'
  
return 'primary'
}

const getVolumeSpikeColor = (state: VolumeSpikeState) => {
  if (state === 'Extreme Spike') return 'error'
  if (state === 'High Spike') return 'warning'
  if (state === 'Moderate Spike') return 'info'
  
return 'success'
}

const getFlowColor = (signal: FlowSignal) => {
  return signal === 'Accumulation' ? 'success' : 'error'
}

const getFlowConsensusColor = (signal: 'Accumulation' | 'Distribution' | 'Mixed') => {
  if (signal === 'Accumulation') return 'success'
  if (signal === 'Distribution') return 'error'
  
return 'warning'
}

const getPriceVolumeColor = (signal: PriceVolumeSignal) => {
  if (signal === 'Strong Bullish') return 'success'
  if (signal === 'Weak Bullish') return 'info'
  if (signal === 'Weak Bearish') return 'warning'
  if (signal === 'Strong Bearish') return 'error'
  
return 'primary'
}

const getMomentumColor = (signal: string) => {
  const normalized = signal.toLowerCase()
  if (normalized.includes('strong bullish') || normalized.includes('bullish crossover') || normalized === 'bullish') {
    return 'success'
  }
  if (normalized.includes('strong bearish') || normalized.includes('bearish crossover') || normalized === 'bearish') {
    return 'error'
  }
  if (normalized.includes('overbought')) {
    return 'warning'
  }
  if (normalized.includes('oversold')) {
    return 'success'
  }
  
return 'primary'
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const average = (values: Array<number | null | undefined>) => {
  const filtered = values.filter((value): value is number => typeof value === 'number' && Number.isFinite(value))
  if (!filtered.length) return null

  return filtered.reduce((sum, value) => sum + value, 0) / filtered.length
}

const stddev = (values: Array<number | null | undefined>) => {
  const filtered = values.filter((value): value is number => typeof value === 'number' && Number.isFinite(value))
  if (filtered.length < 2) return null

  const mean = average(filtered)
  if (mean === null) return null

  const variance = filtered.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / (filtered.length - 1)
  
return Math.sqrt(variance)
}

const percentChange = (current: number, previous: number | null | undefined) => {
  if (!Number.isFinite(current) || previous === null || previous === undefined || !Number.isFinite(previous) || previous === 0) {
    return null
  }

  return ((current - previous) / previous) * 100
}

const formatPct = (value: number | null, digits = 2) => {
  if (value === null || value === undefined || !Number.isFinite(value)) return '-'
  
return `${value >= 0 ? '+' : ''}${value.toFixed(digits)}%`
}

const formatPosPct = (value: number | null, digits = 2) => {
  if (value === null || value === undefined || !Number.isFinite(value)) return '-'
  
return `${value.toFixed(digits)}%`
}

const formatBandPosPct = (value: number | null, digits = 2) => {
  if (value === null || value === undefined || !Number.isFinite(value)) return '-'
  
return `${(value * 100).toFixed(digits)}%`
}

const renderSummaryChip = (label: string, color: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info') => (
  <Chip label={label} color={color} size='small' variant='outlined' sx={{ mr: 1, mb: 1 }} />
)

const renderMeaningChip = (label: string, color: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info') => (
  <Chip label={label} color={color} size='small' sx={{ mr: 1, mb: 1 }} />
)

const classifyVolatility = (atrPct: number | null): VolatilityState => {
  if (atrPct === null || !Number.isFinite(atrPct)) return 'Moderate Volatility'
  if (atrPct < 1.5) return 'Very Low Volatility'
  if (atrPct < 3) return 'Low Volatility'
  if (atrPct < 5) return 'Moderate Volatility'
  if (atrPct < 8) return 'High Volatility'
  
return 'Very High Volatility'
}

const classifyBollinger = (params: { close: number; upper: number; lower: number; bandwidth: number }): BollingerState => {
  const { close, upper, lower, bandwidth } = params
  if (close >= upper) return 'Overbought'
  if (close <= lower) return 'Oversold'
  if (bandwidth < 5) return 'Squeeze (Big Move Coming)'
  
return 'Normal'
}

const classifyReturnVolatility = (value: number | null): ReturnVolatilityState => {
  if (value === null || !Number.isFinite(value)) return 'Normal'
  if (value < 10) return 'Calm'
  if (value < 20) return 'Normal'
  if (value < 30) return 'Elevated'
  if (value < 45) return 'High'
  
return 'Very High'
}

const toValidDate = (value: string | Date) => {
  const direct = new Date(value)
  if (!Number.isNaN(direct.getTime())) return direct

  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const dateOnly = new Date(`${value}T00:00:00.000Z`)
    if (!Number.isNaN(dateOnly.getTime())) return dateOnly
  }

  return null
}

const computeTrendAnalysis = (candles: EodCandle[]): TrendAnalysisResult => {
  const source = (candles
    .map(c => {
      const d = toValidDate(c.trade_date)
      const open = Number(c.open)
      const high = Number(c.high)
      const low = Number(c.low)
      const close = Number(c.close)
      const volume = Number(c.volume ?? 0)
      if (!d || !Number.isFinite(open) || !Number.isFinite(high) || !Number.isFinite(low) || !Number.isFinite(close)) {
        return null
      }

      return {
        ts: d.getTime(),
        open,
        high,
        low,
        close,
        volume: Number.isFinite(volume) ? volume : 0
      }
    })
    .filter(isPresent) as ParsedCandle[]).sort((a, b) => a.ts - b.ts)

  if (!source.length) {
    return {
      rows: [] as TrendPoint[],
      latest: null as TrendPoint | null,
      transitions: [] as TrendPoint[],
      currentTrendDuration: null as TrendDuration | null
    }
  }

  const closes = source.map(c => c.close)
  const volumes = source.map(c => c.volume)
  const prefix = [0]
  for (const close of closes) {
    prefix.push(prefix[prefix.length - 1] + close)
  }
  const volumePrefix = [0]
  for (const volume of volumes) {
    volumePrefix.push(volumePrefix[volumePrefix.length - 1] + volume)
  }

  const rollingAverage = (idx: number, window: number) => {
    if (idx + 1 < window) return null
    const end = idx + 1
    const sum = prefix[end] - prefix[end - window]
    
return sum / window
  }

  const rollingVolumeAverage = (idx: number, window: number) => {
    if (idx + 1 < window) return null
    const end = idx + 1
    const sum = volumePrefix[end] - volumePrefix[end - window]
    
return sum / window
  }

  const classifyTrend = (close: number, sma20: number, sma50: number, sma200: number): TrendState => {
    if (close > sma20 && sma20 > sma50 && sma50 > sma200) return 'Strong Uptrend'
    if (close > sma50 && sma50 > sma200) return 'Uptrend'
    if (close < sma20 && sma20 < sma50 && sma50 < sma200) return 'Strong Downtrend'
    if (close < sma50 && sma50 < sma200) return 'Downtrend'
    
return 'Sideways'
  }

  const baseRows = source
    .map((c, idx) => {
      const sma20 = rollingAverage(idx, 20)
      const sma50 = rollingAverage(idx, 50)
      const sma200 = rollingAverage(idx, 200)
      if (sma20 === null || sma50 === null || sma200 === null) return null

      const trend = classifyTrend(c.close, sma20, sma50, sma200)
      const trendStrengthPct = sma200 !== 0 ? ((c.close - sma200) / sma200) * 100 : null
      const volumeAvg20 = rollingVolumeAverage(idx, 20)

      return {
        ...c,
        sma20,
        sma50,
        sma200,
        volumeAvg20,
        trend,
        trendStrengthPct
      }
    })
    .filter(isPresent) as TrendPoint[]

  const rows = baseRows.map((row, idx) => {
    const sma20Lag = idx >= 5 ? baseRows[idx - 5]?.sma20 ?? null : null
    const sma50Lag = idx >= 5 ? baseRows[idx - 5]?.sma50 ?? null : null
    const sma200Lag = idx >= 5 ? baseRows[idx - 5]?.sma200 ?? null : null
    const sma20SlopePct = percentChange(row.sma20 ?? 0, sma20Lag)
    const sma50SlopePct = percentChange(row.sma50 ?? 0, sma50Lag)
    const sma200SlopePct = percentChange(row.sma200 ?? 0, sma200Lag)
    const momentum63Pct = percentChange(row.close, idx >= 63 ? baseRows[idx - 63]?.close : null)
    const momentum126Pct = percentChange(row.close, idx >= 126 ? baseRows[idx - 126]?.close : null)
    const momentum252Pct = percentChange(row.close, idx >= 252 ? baseRows[idx - 252]?.close : null)

    const windowStart = Math.max(0, idx - 251)
    const windowSlice = source.slice(windowStart, idx + 1)
    const week52High = windowSlice.length ? Math.max(...windowSlice.map(item => item.high)) : null
    const week52Low = windowSlice.length ? Math.min(...windowSlice.map(item => item.low)) : null
    const week52PositionPct =
      week52High !== null && week52Low !== null && week52High !== week52Low
        ? ((row.close - week52Low) / (week52High - week52Low)) * 100
        : null
    const volumeRatio =
      row.volumeAvg20 && row.volumeAvg20 > 0 ? row.volume / row.volumeAvg20 : null
    const volumeConfirmation: TrendPoint['volumeConfirmation'] =
      volumeRatio === null ? 'Neutral' : volumeRatio >= 1.1 ? 'Above Average' : volumeRatio <= 0.9 ? 'Below Average' : 'Neutral'

    const slopes = [sma20SlopePct, sma50SlopePct, sma200SlopePct].filter(
      (value): value is number => typeof value === 'number' && Number.isFinite(value)
    )
    const positiveSlopes = slopes.filter(value => value > 0).length
    const avgSlope = average(slopes) ?? 0
    const avgMomentum = average([momentum63Pct, momentum126Pct, momentum252Pct]) ?? 0

    let trendScore = 0
    if (row.trend === 'Strong Uptrend') trendScore += 42
    else if (row.trend === 'Uptrend') trendScore += 30
    else if (row.trend === 'Sideways') trendScore += 16
    else if (row.trend === 'Downtrend') trendScore += 8

    trendScore += positiveSlopes >= 3 ? 16 : positiveSlopes === 2 ? 11 : positiveSlopes === 1 ? 6 : 0
    trendScore += avgSlope > 2 ? 12 : avgSlope > 1 ? 9 : avgSlope > 0 ? 6 : avgSlope > -1 ? 2 : 0

    if (volumeRatio !== null) {
      trendScore += volumeRatio >= 1.5 ? 12 : volumeRatio >= 1.1 ? 8 : volumeRatio >= 1 ? 5 : volumeRatio >= 0.85 ? 2 : 0
    }

    trendScore += avgMomentum > 25 ? 18 : avgMomentum > 15 ? 14 : avgMomentum > 5 ? 10 : avgMomentum > 0 ? 6 : avgMomentum > -5 ? 3 : 0

    if (week52PositionPct !== null) {
      trendScore += week52PositionPct >= 80 ? 10 : week52PositionPct >= 65 ? 8 : week52PositionPct >= 50 ? 6 : week52PositionPct >= 35 ? 3 : 0
    }

    return {
      ...row,
      sma20SlopePct,
      sma50SlopePct,
      sma200SlopePct,
      momentum63Pct,
      momentum126Pct,
      momentum252Pct,
      week52High,
      week52Low,
      week52PositionPct,
      volumeRatio,
      volumeConfirmation,
      trendScore: clamp(Math.round(trendScore), 0, 100)
    }
  })

  const transitions: TrendPoint[] = []
  rows.forEach((row, idx) => {
    const prev = idx > 0 ? rows?.[idx - 1] ?? null : null
    if (idx === 0 || row.trend !== prev?.trend) {
      transitions.push(row)
    }
  })

  const latest = rows[rows.length - 1] || null
  let currentTrendStartIdx = rows.length - 1
  if (latest) {
    while (currentTrendStartIdx > 0 && rows[currentTrendStartIdx - 1].trend === latest.trend) {
      currentTrendStartIdx -= 1
    }
  }

  const currentTrendStart = rows[currentTrendStartIdx] || null
  const currentTrendDuration =
    latest && currentTrendStart
      ? {
          startTs: currentTrendStart.ts,
          sessions: rows.length - currentTrendStartIdx,
          calendarDays: Math.max(1, Math.floor((latest.ts - currentTrendStart.ts) / (1000 * 60 * 60 * 24)) + 1)
        }
      : null

  return {
    rows,
    latest,
    transitions: transitions.slice(-10),
    currentTrendDuration
  }
}

const computeVolatilityAnalysis = (candles: EodCandle[]): VolatilityAnalysisResult => {
  const source = (candles
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
    .filter(isPresent) as ParsedCandle[]).sort((a, b) => a.ts - b.ts)

  if (!source.length) {
    return {
      rows: [],
      latest: null,
      transitions: [],
      currentVolatilityDuration: null
    }
  }

  const trueRanges = source.map((c, idx) => {
    const prevClose = idx > 0 ? source?.[idx - 1]?.close ?? null : null
    const intradayRange = c.high - c.low
    const gapHigh = prevClose === null ? intradayRange : Math.abs(c.high - prevClose)
    const gapLow = prevClose === null ? intradayRange : Math.abs(c.low - prevClose)
    const trueRange = Math.max(intradayRange, gapHigh, gapLow)

    return {
      ...c,
      trueRange
    }
  })

  const trPrefix = [0]
  for (const row of trueRanges) {
    trPrefix.push(trPrefix[trPrefix.length - 1] + row.trueRange)
  }

  const rollingAtr = (idx: number, window: number) => {
    if (idx + 1 < window) return null
    const end = idx + 1
    const sum = trPrefix[end] - trPrefix[end - window]
    
return sum / window
  }

  const atrSeries = trueRanges.map((_, idx) => rollingAtr(idx, 14))

  const rows = trueRanges
    .map((row, idx) => {
      const atr14 = atrSeries[idx]
      if (atr14 === null) return null

      const atrPct = row.close !== 0 ? (atr14 / row.close) * 100 : null
      const dailyRangePct = row.close !== 0 ? ((row.high - row.low) / row.close) * 100 : 0
      const prevAtr = idx >= 5 ? atrSeries[idx - 5] : null
      const atrSlopePct = percentChange(atr14, prevAtr)
      const volatilityState = classifyVolatility(atrPct)
      const volatilityScore = clamp(Math.round((atrPct || 0) * 10), 0, 100)

      return {
        ...row,
        atr14,
        atrPct,
        dailyRangePct,
        volatilityState,
        volatilityScore,
        atrSlopePct
      }
    })
    .filter(isPresent) as VolatilityPoint[]

  const transitions: VolatilityPoint[] = []
  rows.forEach((row, idx) => {
    const prev = idx > 0 ? rows?.[idx - 1] ?? null : null
    if (idx === 0 || row.volatilityState !== prev?.volatilityState) {
      transitions.push(row)
    }
  })

  const latest = rows[rows.length - 1] || null
  let currentStartIdx = rows.length - 1
  if (latest) {
    while (currentStartIdx > 0 && rows[currentStartIdx - 1].volatilityState === latest.volatilityState) {
      currentStartIdx -= 1
    }
  }

  const currentStart = rows[currentStartIdx] || null
  const currentVolatilityDuration =
    latest && currentStart
      ? {
          startTs: currentStart.ts,
          sessions: rows.length - currentStartIdx,
          calendarDays: Math.max(1, Math.floor((latest.ts - currentStart.ts) / (1000 * 60 * 60 * 24)) + 1)
        }
      : null

  return {
    rows,
    latest,
    transitions: transitions.slice(-10),
    currentVolatilityDuration
  }
}

const computeBollingerAnalysis = (candles: EodCandle[]): BollingerAnalysisResult => {
  const source = candles
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
    .filter(isPresent)
    .sort((a, b) => a.ts - b.ts) as ParsedCandle[]

  if (!source.length) {
    return {
      rows: [],
      latest: null,
      transitions: [],
      currentBollingerDuration: null
    }
  }

  const closes = source.map(item => item.close)
  const prefix = [0]
  for (const close of closes) {
    prefix.push(prefix[prefix.length - 1] + close)
  }

  const rollingSma = (idx: number, window: number) => {
    if (idx + 1 < window) return null
    const end = idx + 1
    const sum = prefix[end] - prefix[end - window]
    
return sum / window
  }

  const rollingStdDev = (idx: number, window: number) => {
    if (idx + 1 < window) return null
    const start = idx - window + 1
    const slice = closes.slice(start, idx + 1)
    const mean = slice.reduce((sum, value) => sum + value, 0) / slice.length
    const variance = slice.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / Math.max(slice.length - 1, 1)
    
return Math.sqrt(variance)
  }

  const rows = source
    .map((row, idx) => {
      const bbMid = rollingSma(idx, 20)
      const bbStd = rollingStdDev(idx, 20)
      if (bbMid === null || bbStd === null) return null

      const bbUpper = bbMid + 2 * bbStd
      const bbLower = bbMid - 2 * bbStd
      const bbBandwidth = bbMid !== 0 ? ((4 * bbStd) / bbMid) * 100 : null
      const bbPosition = bbUpper !== bbLower ? (row.close - bbLower) / (bbUpper - bbLower) : null
      const bbSignal =
        bbBandwidth === null
          ? 'Normal'
          : classifyBollinger({
              close: row.close,
              upper: bbUpper,
              lower: bbLower,
              bandwidth: bbBandwidth
            })

      const bbScore =
        bbSignal === 'Oversold'
          ? 82
          : bbSignal === 'Squeeze (Big Move Coming)'
            ? 76
            : bbSignal === 'Overbought'
              ? 68
              : clamp(Math.round(100 - Math.min(Math.max(bbBandwidth || 0, 0), 25) * 3), 0, 100)

      return {
        ...row,
        bbMid,
        bbStd,
        bbUpper,
        bbLower,
        bbBandwidth,
        bbPosition,
        bbSignal,
        bbScore
      }
    })
    .filter(isPresent) as BollingerPoint[]

  const transitions: BollingerPoint[] = []
  rows.forEach((row, idx) => {
    const prev = idx > 0 ? rows?.[idx - 1] ?? null : null
    if (idx === 0 || row.bbSignal !== prev?.bbSignal) {
      transitions.push(row)
    }
  })

  const latest = rows[rows.length - 1] || null
  let currentStartIdx = rows.length - 1
  if (latest) {
    while (currentStartIdx > 0 && rows[currentStartIdx - 1].bbSignal === latest.bbSignal) {
      currentStartIdx -= 1
    }
  }

  const currentStart = rows[currentStartIdx] || null
  const currentBollingerDuration =
    latest && currentStart
      ? {
          startTs: currentStart.ts,
          sessions: rows.length - currentStartIdx,
          calendarDays: Math.max(1, Math.floor((latest.ts - currentStart.ts) / (1000 * 60 * 60 * 24)) + 1)
        }
      : null

  return {
    rows,
    latest,
    transitions: transitions.slice(-10),
    currentBollingerDuration
  }
}

const computeReturnVolatilityAnalysis = (candles: EodCandle[]): ReturnVolatilityAnalysisResult => {
  const source = candles
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
    .filter(isPresent)
    .sort((a, b) => a.ts - b.ts) as ParsedCandle[]

  if (source.length < 2) {
    return {
      rows: [],
      latest: null
    }
  }

  const logReturns = source.map((row, idx) => {
    if (idx === 0) return null
    const prev = source?.[idx - 1]?.close ?? null
    if (!prev || !Number.isFinite(prev) || prev <= 0 || row.close <= 0) return null
    
return Math.log(row.close / prev)
  })

  const annualizeVolatility = (idx: number, window: number) => {
    if (idx < window) return null
    const slice = logReturns.slice(idx - window + 1, idx + 1).filter((value): value is number => typeof value === 'number' && Number.isFinite(value))
    if (slice.length < window) return null
    const mean = slice.reduce((sum, value) => sum + value, 0) / slice.length
    const variance = slice.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / Math.max(slice.length - 1, 1)
    
return Math.sqrt(variance) * Math.sqrt(252) * 100
  }

  const rows = source
    .map((row, idx) => {
      const logReturn = logReturns[idx]
      const volatility30d = annualizeVolatility(idx, 30)
      const volatility90d = annualizeVolatility(idx, 90)
      const volatility1yr = annualizeVolatility(idx, 365)

      if (logReturn === null) return null

      return {
        ...row,
        logReturn,
        volatility30d,
        volatility90d,
        volatility1yr,
        volatilityState30d: classifyReturnVolatility(volatility30d),
        volatilityState90d: classifyReturnVolatility(volatility90d),
        volatilityState1yr: classifyReturnVolatility(volatility1yr)
      }
    })
    .filter(isPresent) as ReturnVolatilityPoint[]

  return {
    rows,
    latest: rows[rows.length - 1] || null
  }
}

const computeVolumeAnalysis = (candles: EodCandle[]): VolumeAnalysisResult => {
  const source = candles
    .map(c => {
      const d = toValidDate(c.trade_date)
      const open = Number(c.open)
      const high = Number(c.high)
      const low = Number(c.low)
      const close = Number(c.close)
      const volume = Number(c.volume ?? 0)
      if (!d || !Number.isFinite(open) || !Number.isFinite(high) || !Number.isFinite(low) || !Number.isFinite(close)) {
        return null
      }

      return {
        ts: d.getTime(),
        open,
        high,
        low,
        close,
        volume: Number.isFinite(volume) ? volume : 0
      }
    })
    .filter(isPresent)
    .sort((a, b) => a.ts - b.ts) as ParsedCandle[]

  if (!source.length) {
    return {
      rows: [],
      latest: null,
      transitions: []
    }
  }

  const volumePrefix = [0]
  for (const candle of source) {
    volumePrefix.push(volumePrefix[volumePrefix.length - 1] + candle.volume)
  }

  const rollingVolumeAverage = (idx: number, window: number) => {
    if (idx + 1 < window) return null
    const end = idx + 1
    const sum = volumePrefix[end] - volumePrefix[end - window]
    
return sum / window
  }

  const rows: VolumePoint[] = []
  const obvHistory: number[] = []
  const adHistory: number[] = []
  let obvRunning = 0
  let vptRunning = 0
  let adRunning = 0

  for (let idx = 0; idx < source.length; idx += 1) {
    const row = source[idx]
    const prevClose = idx > 0 ? source?.[idx - 1]?.close ?? null : null
    const avgVol10d = rollingVolumeAverage(idx, 10)
    const avgVol20d = rollingVolumeAverage(idx, 20)
    const avgVol50d = rollingVolumeAverage(idx, 50)
    const volumeRatio = avgVol20d && avgVol20d > 0 ? row.volume / avgVol20d : null

    const volumeSignal: VolumeSpikeState =
      avgVol20d === null || !Number.isFinite(avgVol20d) || avgVol20d <= 0
        ? 'Normal'
        : row.volume >= 3 * avgVol20d
          ? 'Extreme Spike'
          : row.volume >= 2 * avgVol20d
            ? 'High Spike'
            : row.volume >= 1.5 * avgVol20d
              ? 'Moderate Spike'
              : 'Normal'

    const obvChange = prevClose === null ? 0 : row.close > prevClose ? row.volume : row.close < prevClose ? -row.volume : 0
    obvRunning += obvChange
    obvHistory.push(obvRunning)
    const obvAvg20 = obvHistory.length >= 20 ? average(obvHistory.slice(-20)) : null
    const obvSignal: FlowSignal =
      obvAvg20 === null ? 'Distribution' : obvRunning >= obvAvg20 ? 'Accumulation' : 'Distribution'

    const vptChange =
      prevClose === null || prevClose === 0 ? null : Number((row.volume * ((row.close - prevClose) / prevClose)).toFixed(2))
    vptRunning += vptChange ?? 0

    const mfm =
      row.high === row.low ? 0 : Number((((row.close - row.low) - (row.high - row.close)) / (row.high - row.low)).toFixed(4))
    const moneyFlowVolume = Number((mfm * row.volume).toFixed(2))
    adRunning += moneyFlowVolume
    adHistory.push(adRunning)
    const adSignal: FlowSignal = adHistory.length >= 6 && adRunning > (adHistory[adHistory.length - 6] ?? adRunning)
      ? 'Accumulation'
      : 'Distribution'
    const flowConsensus: VolumePoint['flowConsensus'] =
      obvSignal === adSignal ? obvSignal : obvSignal === 'Accumulation' || adSignal === 'Accumulation' ? 'Mixed' : 'Distribution'

    const priceChangePct = percentChange(row.close, prevClose)
    const priceVolumeSignal: PriceVolumeSignal =
      prevClose === null || avgVol20d === null || avgVol20d <= 0
        ? 'Neutral'
        : row.close > prevClose && row.volume > 1.5 * avgVol20d
          ? 'Strong Bullish'
          : row.close > prevClose && row.volume < 0.7 * avgVol20d
            ? 'Weak Bullish'
            : row.close < prevClose && row.volume > 1.5 * avgVol20d
              ? 'Strong Bearish'
              : row.close < prevClose && row.volume < 0.7 * avgVol20d
                ? 'Weak Bearish'
                : 'Neutral'

    rows.push({
      ...row,
      avgVol10d,
      avgVol20d,
      avgVol50d,
      volumeRatio,
      volumeSignal,
      obvChange,
      obv: obvRunning,
      obvSignal,
      flowConsensus,
      vptChange,
      vpt: Number(vptRunning.toFixed(2)),
      moneyFlowMultiplier: mfm,
      moneyFlowVolume,
      adLine: Number(adRunning.toFixed(2)),
      adSignal,
      priceChangePct,
      priceVolumeSignal
    })
  }

  const transitions: VolumePoint[] = []
  rows.forEach((row, idx) => {
    const prev = idx > 0 ? rows?.[idx - 1] ?? null : null
    if (idx === 0 || row.volumeSignal !== prev?.volumeSignal || row.obvSignal !== prev?.obvSignal || row.priceVolumeSignal !== prev?.priceVolumeSignal) {
      transitions.push(row)
    }
  })

  return {
    rows,
    latest: rows[rows.length - 1] || null,
    transitions: transitions.slice(-10)
  }
}

const computeMomentumAnalysis = (candles: EodCandle[]): MomentumAnalysisResult => {
  const source = candles
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
    .filter(isPresent)
    .sort((a, b) => a.ts - b.ts) as ParsedCandle[]

  if (!source.length) {
    return {
      rows: [],
      latest: null
    }
  }

  const closes = source.map(item => item.close)
  const prefix = [0]
  for (const close of closes) {
    prefix.push(prefix[prefix.length - 1] + close)
  }

  const rollingAverage = (idx: number, window: number) => {
    if (idx + 1 < window) return null
    const end = idx + 1
    const sum = prefix[end] - prefix[end - window]
    
return sum / window
  }

  const gains = [0]
  const losses = [0]
  for (let idx = 1; idx < source.length; idx += 1) {
    const prevClose = source?.[idx - 1]?.close ?? source[idx].close
    const diff = source[idx].close - prevClose
    gains.push(diff > 0 ? diff : 0)
    losses.push(diff < 0 ? Math.abs(diff) : 0)
  }

  const macdHistory: Array<number | null> = []
  const stochHistory: Array<number | null> = []
  const rows: MomentumPoint[] = []

  for (let idx = 0; idx < source.length; idx += 1) {
    const row = source[idx]
    const rsiGainAvg = idx >= 13 ? average(gains.slice(idx - 13, idx + 1)) : null
    const rsiLossAvg = idx >= 13 ? average(losses.slice(idx - 13, idx + 1)) : null
    const rsiValue =
      rsiGainAvg === null || rsiLossAvg === null
        ? null
        : rsiLossAvg === 0 && rsiGainAvg === 0
          ? 50
          : rsiLossAvg === 0
            ? 100
            : 100 - 100 / (1 + rsiGainAvg / rsiLossAvg)
    const rsi14 = rsiValue === null ? null : Number(rsiValue.toFixed(2))
    const rsiSignal: MomentumPoint['rsiSignal'] =
      rsi14 === null ? 'Neutral' : rsi14 >= 70 ? 'Overbought' : rsi14 <= 30 ? 'Oversold' : rsi14 >= 50 ? 'Bullish' : 'Bearish'

    const ema12 = rollingAverage(idx, 12)
    const ema26 = rollingAverage(idx, 26)
    const macdLine = ema12 === null || ema26 === null ? null : Number((ema12 - ema26).toFixed(2))
    macdHistory.push(macdLine)
    const signalCandidates = macdHistory.slice(-9).filter((value): value is number => typeof value === 'number' && Number.isFinite(value))
    const signalLine = signalCandidates.length === 9 ? Number((average(signalCandidates) ?? 0).toFixed(2)) : null
    const macdHistogram = macdLine === null || signalLine === null ? null : Number((macdLine - signalLine).toFixed(2))
    const prevMacd = rows.length ? rows[rows.length - 1].macdLine : null
    const prevSignal = rows.length ? rows[rows.length - 1].signalLine : null
    const macdSignal: MomentumPoint['macdSignal'] =
      macdLine === null || signalLine === null
        ? 'Neutral'
        : macdLine > signalLine && (prevMacd === null || prevSignal === null || prevMacd <= prevSignal)
          ? 'Bullish Crossover'
          : macdLine < signalLine && (prevMacd === null || prevSignal === null || prevMacd >= prevSignal)
            ? 'Bearish Crossover'
            : macdLine > signalLine
              ? 'Bullish'
              : 'Bearish'

    const roc10 = idx >= 10 && source[idx - 10].close !== 0 ? Number((((row.close - source[idx - 10].close) / source[idx - 10].close) * 100).toFixed(2)) : null
    const roc20 = idx >= 20 && source[idx - 20].close !== 0 ? Number((((row.close - source[idx - 20].close) / source[idx - 20].close) * 100).toFixed(2)) : null
    const roc60 = idx >= 60 && source[idx - 60].close !== 0 ? Number((((row.close - source[idx - 60].close) / source[idx - 60].close) * 100).toFixed(2)) : null
    const roc1y = idx >= 252 && source[idx - 252].close !== 0 ? Number((((row.close - source[idx - 252].close) / source[idx - 252].close) * 100).toFixed(2)) : null

    const stochWindow = source.slice(Math.max(0, idx - 13), idx + 1)
    const lowest14 = stochWindow.length ? Math.min(...stochWindow.map(item => item.low)) : null
    const highest14 = stochWindow.length ? Math.max(...stochWindow.map(item => item.high)) : null
    const stochK =
      lowest14 === null || highest14 === null || highest14 === lowest14
        ? null
        : Number((((row.close - lowest14) / (highest14 - lowest14)) * 100).toFixed(2))
    stochHistory.push(stochK)
    const stochCandidates = stochHistory.slice(-3).filter((value): value is number => typeof value === 'number' && Number.isFinite(value))
    const stochD = stochCandidates.length === 3 ? Number((average(stochCandidates) ?? 0).toFixed(2)) : null
    const stochSignal: MomentumPoint['stochSignal'] =
      stochK === null ? 'Neutral' : stochK >= 80 ? 'Overbought' : stochK <= 20 ? 'Oversold' : 'Neutral'

    const bullishCount = [rsiSignal, macdSignal, stochSignal].filter(value => {
      const normalized = value.toLowerCase()
      
return normalized.includes('bullish') || normalized.includes('oversold')
    }).length
    const bearishCount = [rsiSignal, macdSignal, stochSignal].filter(value => {
      const normalized = value.toLowerCase()
      
return normalized.includes('bearish') || normalized.includes('overbought')
    }).length

    const momentumScore: MomentumSignal =
      bullishCount >= 2 && (roc20 ?? 0) > 0
        ? 'Strong Bullish'
        : bullishCount >= 1 && (roc20 ?? 0) > 0
          ? 'Bullish'
          : bearishCount >= 2 && (roc20 ?? 0) < 0
            ? 'Strong Bearish'
            : bearishCount >= 1 && (roc20 ?? 0) < 0
              ? 'Bearish'
              : 'Neutral'

    rows.push({
      ...row,
      rsi14,
      rsiSignal,
      macdLine,
      signalLine,
      macdHistogram,
      macdSignal,
      roc10,
      roc20,
      roc60,
      roc1y,
      stochK,
      stochD,
      stochSignal,
      momentumScore
    })
  }

  return {
    rows,
    latest: rows[rows.length - 1] || null
  }
}

const computeBreakoutAnalysis = (candles: EodCandle[]): BreakoutAnalysisResult => {
  const source = candles
    .map(c => {
      const d = toValidDate(c.trade_date)
      const open = Number(c.open)
      const high = Number(c.high)
      const low = Number(c.low)
      const close = Number(c.close)
      const volume = Number(c.volume ?? 0)
      if (!d || !Number.isFinite(open) || !Number.isFinite(high) || !Number.isFinite(low) || !Number.isFinite(close)) {
        return null
      }

      return {
        ts: d.getTime(),
        open,
        high,
        low,
        close,
        volume: Number.isFinite(volume) ? volume : 0
      }
    })
    .filter(isPresent)
    .sort((a, b) => a.ts - b.ts) as ParsedCandle[]

  if (!source.length) {
    return {
      rows: [],
      latest: null,
      transitions: [],
      currentBreakoutDuration: null
    }
  }

  const sliceWindow = (idx: number, window: number, includeCurrent = true) => {
    const end = includeCurrent ? idx + 1 : idx
    const start = Math.max(0, end - window)
    
return source.slice(start, end)
  }

  const rangeMax = (items: ParsedCandle[], key: 'high' | 'low') =>
    items.length ? Math.max(...items.map(item => item[key])) : null
  const rangeMin = (items: ParsedCandle[], key: 'high' | 'low') =>
    items.length ? Math.min(...items.map(item => item[key])) : null
  const rangeAvg = (items: ParsedCandle[]) => (items.length ? average(items.map(item => item.volume)) : null)

  const rows: BreakoutPoint[] = source.map((row, idx) => {
    const current20 = sliceWindow(idx, 20, true)
    const current50 = sliceWindow(idx, 50, true)
    const current52w = sliceWindow(idx, 252, true)
    const prior50 = idx > 0 ? sliceWindow(idx, 50, false) : []
    const prior52w = idx > 0 ? sliceWindow(idx, 252, false) : []

    const resistance20d = rangeMax(current20, 'high')
    const resistance50d = rangeMax(current50, 'high')
    const resistance52w = rangeMax(current52w, 'high')
    const support20d = rangeMin(current20, 'low')
    const support50d = rangeMin(current50, 'low')
    const support52w = rangeMin(current52w, 'low')
    const priorResistance50d = rangeMax(prior50, 'high')
    const priorResistance52w = rangeMax(prior52w, 'high')
    const priorSupport50d = rangeMin(prior50, 'low')
    const priorSupport52w = rangeMin(prior52w, 'low')
    const avgVol20d = rangeAvg(current20)
    const volumeRatio = avgVol20d && avgVol20d > 0 ? row.volume / avgVol20d : null

    const breakoutType: BreakoutType =
      priorResistance52w !== null && row.close > priorResistance52w && avgVol20d !== null && row.volume > 1.5 * avgVol20d
        ? '52W Breakout (Confirmed)'
        : priorResistance52w !== null && row.close > priorResistance52w
          ? '52W Breakout (Unconfirmed)'
          : priorResistance50d !== null && row.close > priorResistance50d && avgVol20d !== null && row.volume > 1.5 * avgVol20d
            ? '50D Breakout (Confirmed)'
            : priorResistance50d !== null && row.close > priorResistance50d
              ? '50D Breakout (Unconfirmed)'
              : priorSupport52w !== null && row.close < priorSupport52w && avgVol20d !== null && row.volume > 1.5 * avgVol20d
                ? '52W Breakdown (Confirmed)'
                : priorSupport52w !== null && row.close < priorSupport52w
                  ? '52W Breakdown (Unconfirmed)'
                  : priorSupport50d !== null && row.close < priorSupport50d && avgVol20d !== null && row.volume > 1.5 * avgVol20d
                    ? '50D Breakdown (Confirmed)'
                    : priorSupport50d !== null && row.close < priorSupport50d
                      ? '50D Breakdown (Unconfirmed)'
                      : 'No Breakout'

    const pctFromResistance52w =
      resistance52w && resistance52w !== 0 ? Number((((resistance52w - row.close) / resistance52w) * 100).toFixed(2)) : null
    const pctFromSupport52w =
      support52w && support52w !== 0 ? Number((((row.close - support52w) / support52w) * 100).toFixed(2)) : null

    const breakoutReadiness: BreakoutReadiness =
      pctFromResistance52w !== null && pctFromResistance52w <= 1
        ? 'Imminent Breakout'
        : pctFromResistance52w !== null && pctFromResistance52w <= 2
          ? 'Near Breakout'
          : pctFromResistance52w !== null && pctFromResistance52w <= 5
            ? 'Watching Zone'
            : 'Far From Breakout'

    const range20d = support20d !== null && resistance20d !== null && support20d !== 0 ? ((resistance20d - support20d) / support20d) * 100 : null
    const consolidationSignal: ConsolidationSignal =
      range20d !== null && range20d < 5
        ? 'Tight Consolidation (Breakout Setup)'
        : range20d !== null && range20d < 10
          ? 'Moderate Consolidation'
          : 'Wide Range (No Setup)'

    const prev = idx > 0 ? rows?.[idx - 1] ?? null : null
    const brokeOutYesterday =
      !!prev &&
      ((prev.breakoutType.includes('Breakout') && prev.breakoutType.includes('Confirmed')) ||
        prev.breakoutType.includes('Breakout (Unconfirmed)') ||
        prev.breakoutType.includes('Breakdown'))
    const breakoutStatus: BreakoutStatus =
      prev && brokeOutYesterday && prev.priorResistance52w !== null && prev.breakoutType.includes('Breakout')
        ? row.close < prev.priorResistance52w
          ? 'False Breakout'
          : 'Breakout Holding'
        : prev && brokeOutYesterday && prev.priorSupport52w !== null && prev.breakoutType.includes('Breakdown')
          ? row.close > prev.priorSupport52w
            ? 'False Breakout'
            : 'Breakout Holding'
          : 'No Breakout'

    const falseBreakout = breakoutStatus === 'False Breakout'

    return {
      ...row,
      resistance20d,
      resistance50d,
      resistance52w,
      support20d,
      support50d,
      support52w,
      priorResistance50d,
      priorResistance52w,
      priorSupport50d,
      priorSupport52w,
      avgVol20d,
      volumeRatio,
      pctFromResistance52w,
      pctFromSupport52w,
      breakoutType,
      breakoutReadiness,
      consolidationSignal,
      breakoutStatus,
      falseBreakout
    }
  })

  const transitions: BreakoutPoint[] = []
  rows.forEach((row, idx) => {
    const prev = idx > 0 ? rows?.[idx - 1] ?? null : null
    if (
      idx === 0 ||
      row.breakoutType !== prev?.breakoutType ||
      row.breakoutReadiness !== prev?.breakoutReadiness ||
      row.consolidationSignal !== prev?.consolidationSignal ||
      row.breakoutStatus !== prev?.breakoutStatus
    ) {
      transitions.push(row)
    }
  })

  const latest = rows[rows.length - 1] || null
  let currentBreakoutDuration: BreakoutDuration | null = null
  if (latest && latest.breakoutType !== 'No Breakout') {
    let startIdx = rows.length - 1
    while (startIdx > 0 && rows[startIdx - 1].breakoutType === latest.breakoutType) {
      startIdx -= 1
    }
    currentBreakoutDuration = {
      startTs: rows[startIdx].ts,
      sessions: rows.length - startIdx,
      calendarDays: Math.max(1, Math.round((latest.ts - rows[startIdx].ts) / (1000 * 60 * 60 * 24)) + 1)
    }
  }

  return {
    rows,
    latest,
    transitions: transitions.slice(-10),
    currentBreakoutDuration
  }
}

const computeSeasonalityAnalysis = (candles: EodCandle[]): SeasonalityAnalysisResult => {
  const safeFirst = <T,>(items: T[]) => (items?.length ? items[0] : null)
  const safeLast = <T,>(items: T[]) => (items?.length ? items[items.length - 1] : null)

  const source = candles
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
    .filter(isPresent)
    .sort((a, b) => a.ts - b.ts) as ParsedCandle[]

  if (!source.length) {
    return {
      monthlyRows: [],
      quarterlyRows: [],
      dayRows: [],
      yearlyRows: [],
      bestMonth: null,
      worstMonth: null,
      bestQuarter: null,
      worstQuarter: null
    }
  }

  const monthGroups = new Map<string, ParsedCandle[]>()
  const quarterGroups = new Map<string, ParsedCandle[]>()
  const yearGroups = new Map<string, ParsedCandle[]>()
  const dayGroups = new Map<number, number[]>()

  source.forEach((row, idx) => {
    const date = new Date(row.ts)
    const year = date.getUTCFullYear()
    const month = date.getUTCMonth() + 1
    const quarter = Math.ceil(month / 3)
    const monthKey = `${year}-${month}`
    const quarterKey = `${year}-${quarter}`
    const yearKey = `${year}`

    if (!monthGroups.has(monthKey)) monthGroups.set(monthKey, [])
    if (!quarterGroups.has(quarterKey)) quarterGroups.set(quarterKey, [])
    if (!yearGroups.has(yearKey)) yearGroups.set(yearKey, [])

    monthGroups.get(monthKey)!.push(row)
    quarterGroups.get(quarterKey)!.push(row)
    yearGroups.get(yearKey)!.push(row)

    if (idx > 0) {
      const prev = source?.[idx - 1]
      if (!prev) return
      const dow = date.getUTCDay()
      const dailyReturn = prev.close !== 0 ? ((row.close - prev.close) / prev.close) * 100 : null
      if (dailyReturn !== null && Number.isFinite(dailyReturn)) {
        if (!dayGroups.has(dow)) dayGroups.set(dow, [])
        dayGroups.get(dow)!.push(dailyReturn)
      }
    }
  })

  const monthOrder = [
    { month: 1, name: 'Jan' },
    { month: 2, name: 'Feb' },
    { month: 3, name: 'Mar' },
    { month: 4, name: 'Apr' },
    { month: 5, name: 'May' },
    { month: 6, name: 'Jun' },
    { month: 7, name: 'Jul' },
    { month: 8, name: 'Aug' },
    { month: 9, name: 'Sep' },
    { month: 10, name: 'Oct' },
    { month: 11, name: 'Nov' },
    { month: 12, name: 'Dec' }
  ]

  const monthlyRows: SeasonalityMonthPoint[] = monthOrder.map(({ month, name }) => {
    const returns: number[] = []
    Array.from(monthGroups.entries())
      .forEach(([key, items]) => {
        if (!Array.isArray(items) || !items.length) return
        const groupMonth = Number(key.split('-')[1] || 0)
        if (groupMonth !== month) return
        const first = safeFirst(items)
        const last = safeLast(items)
        if (!first || !last) return
        if (first.close === 0) return
        returns.push(((last.close - first.close) / first.close) * 100)
      })

    const avgReturnPct = returns.length ? Number(average(returns)?.toFixed(2) ?? 0) : null
    const bestReturnPct = returns.length ? Number(Math.max(...returns).toFixed(2)) : null
    const worstReturnPct = returns.length ? Number(Math.min(...returns).toFixed(2)) : null
    const volatility = returns.length > 1 ? Number((stddev(returns) ?? 0).toFixed(2)) : null
    const positiveYears = returns.filter(value => value > 0).length
    const totalYears = returns.length
    const winRatePct = totalYears ? Number(((positiveYears / totalYears) * 100).toFixed(0)) : null
    
return {
      month,
      monthName: name,
      avgReturnPct,
      bestReturnPct,
      worstReturnPct,
      volatility,
      positiveYears,
      totalYears,
      winRatePct
    }
  })

  const quarterOrder = [
    { quarter: 1, label: 'Q1' },
    { quarter: 2, label: 'Q2' },
    { quarter: 3, label: 'Q3' },
    { quarter: 4, label: 'Q4' }
  ]

  const quarterlyRows: SeasonalityQuarterPoint[] = quarterOrder.map(({ quarter, label }) => {
    const returns: number[] = []
    Array.from(quarterGroups.entries())
      .forEach(([key, items]) => {
        if (!Array.isArray(items) || !items.length) return
        const groupQuarter = Number(key.split('-')[1] || 0)
        if (groupQuarter !== quarter) return
        const first = safeFirst(items)
        const last = safeLast(items)
        if (!first || !last) return
        if (first.close === 0) return
        returns.push(((last.close - first.close) / first.close) * 100)
      })
    const avgReturnPct = returns.length ? Number(average(returns)?.toFixed(2) ?? 0) : null
    const bestReturnPct = returns.length ? Number(Math.max(...returns).toFixed(2)) : null
    const worstReturnPct = returns.length ? Number(Math.min(...returns).toFixed(2)) : null
    const positiveYears = returns.filter(value => value > 0).length
    const totalYears = returns.length
    const winRatePct = totalYears ? Number(((positiveYears / totalYears) * 100).toFixed(0)) : null
    
return {
      quarter,
      quarterLabel: label,
      avgReturnPct,
      bestReturnPct,
      worstReturnPct,
      positiveYears,
      totalYears,
      winRatePct
    }
  })

  const dayOrder = [
    { dayNum: 0, name: 'Sun' },
    { dayNum: 1, name: 'Mon' },
    { dayNum: 2, name: 'Tue' },
    { dayNum: 3, name: 'Wed' },
    { dayNum: 4, name: 'Thu' },
    { dayNum: 5, name: 'Fri' },
    { dayNum: 6, name: 'Sat' }
  ]

  const dayRows: SeasonalityDayPoint[] = dayOrder.map(({ dayNum, name }) => {
    const values = dayGroups.get(dayNum) || []
    const avgReturnPct = values.length ? Number(average(values)?.toFixed(2) ?? 0) : null
    const volatility = values.length > 1 ? Number((stddev(values) ?? 0).toFixed(2)) : null
    const positiveDays = values.filter(value => value > 0).length
    const totalDays = values.length
    const winRatePct = totalDays ? Number(((positiveDays / totalDays) * 100).toFixed(0)) : null
    
return {
      dayNum,
      dayName: name,
      avgReturnPct,
      volatility,
      positiveDays,
      totalDays,
      winRatePct
    }
  })

  const yearlyRows: SeasonalityYearPoint[] = Array.from(yearGroups.entries())
    .map(([yearStr, items]) => {
      if (!Array.isArray(items) || !items.length) {
        return null
      }
      const year = Number(yearStr)
      const yearOpen = safeFirst(items)?.close ?? null
      const yearClose = safeLast(items)?.close ?? null
      const yearHigh = items.length ? Math.max(...items.map(item => item.high)) : null
      const yearLow = items.length ? Math.min(...items.map(item => item.low)) : null
      const yearlyReturnPct =
        yearOpen && yearOpen !== 0 && yearClose !== null ? Number((((yearClose - yearOpen) / yearOpen) * 100).toFixed(2)) : null
      const yearResult: SeasonalityYearPoint['yearResult'] =
        yearlyReturnPct === null ? 'Flat' : yearlyReturnPct > 0 ? 'Positive' : yearlyReturnPct < 0 ? 'Negative' : 'Flat'
      
return {
        year,
        yearOpen,
        yearClose,
        yearHigh,
        yearLow,
        yearlyReturnPct,
        yearResult
      }
    })
    .filter((item): item is SeasonalityYearPoint => Boolean(item))
    .sort((a, b) => b.year - a.year)

  const monthlySorted = [...monthlyRows].filter(row => row.avgReturnPct !== null).sort((a, b) => (b.avgReturnPct ?? 0) - (a.avgReturnPct ?? 0))
  const quarterlySorted = [...quarterlyRows].filter(row => row.avgReturnPct !== null).sort((a, b) => (b.avgReturnPct ?? 0) - (a.avgReturnPct ?? 0))

  return {
    monthlyRows,
    quarterlyRows,
    dayRows,
    yearlyRows,
    bestMonth: monthlySorted[0] || null,
    worstMonth: monthlySorted[monthlySorted.length - 1] || null,
    bestQuarter: quarterlySorted[0] || null,
    worstQuarter: quarterlySorted[quarterlySorted.length - 1] || null
  }
}

const EodTrendPage = () => {
  const router = useRouter()
  const theme = useTheme()
  const [stockSearch, setStockSearch] = useState('')
  const [searchAnchorEl, setSearchAnchorEl] = useState<null | HTMLElement>(null)
  const [viewMode, setViewMode] = useState<'dashboard' | 'deepDive'>('dashboard')
  const [activeTab, setActiveTab] = useState<AnalysisTab>('trend')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [loadedSymbol, setLoadedSymbol] = useState('')
  const [loadedExchange, setLoadedExchange] = useState('')
  const [candles, setCandles] = useState<EodCandle[]>([])
  const inputWrapperRef = useRef<HTMLInputElement | null>(null)
  const dashboardRef = useRef<HTMLDivElement | null>(null)
  const deepDiveRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const targetRef = viewMode === 'deepDive' ? deepDiveRef : dashboardRef
    targetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [viewMode])

  const trend = useMemo(() => computeTrendAnalysis(candles), [candles])
  const volatility = useMemo(() => computeVolatilityAnalysis(candles), [candles])
  const bollinger = useMemo(() => computeBollingerAnalysis(candles), [candles])
  const returnVolatility = useMemo(() => computeReturnVolatilityAnalysis(candles), [candles])
  const volume = useMemo(() => computeVolumeAnalysis(candles), [candles])
  const breakout = useMemo(() => computeBreakoutAnalysis(candles), [candles])
  const seasonality = useMemo(() => computeSeasonalityAnalysis(candles), [candles])
  const momentum = useMemo(() => computeMomentumAnalysis(candles), [candles])
  const formatChartDate = (ts: number) =>
    new Date(ts).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  const overviewChartSeries = useMemo(() => {
    const chartRows = trend.rows.slice(-260)
    
return [
      {
        name: 'Close',
        type: 'line',
        data: chartRows.map(row => ({ x: row.ts, y: Number(row.close.toFixed(2)) }))
      },
      {
        name: 'SMA 20',
        type: 'line',
        data: chartRows.map(row => ({ x: row.ts, y: row.sma20 === null ? null : Number(row.sma20.toFixed(2)) }))
      },
      {
        name: 'SMA 50',
        type: 'line',
        data: chartRows.map(row => ({ x: row.ts, y: row.sma50 === null ? null : Number(row.sma50.toFixed(2)) }))
      },
      {
        name: 'SMA 200',
        type: 'line',
        data: chartRows.map(row => ({ x: row.ts, y: row.sma200 === null ? null : Number(row.sma200.toFixed(2)) }))
      }
    ]
  }, [trend.rows])

  const overviewChartOptions = useMemo<ApexOptions>(
    () => ({
      chart: {
        type: 'line',
        toolbar: { show: false },
        zoom: { enabled: false },
        foreColor: theme.palette.text.secondary,
        parentHeightOffset: 0
      },
      stroke: {
        curve: 'smooth',
        width: [2.5, 1.6, 1.6, 1.6]
      },
      markers: { size: 0 },
      colors: [theme.palette.primary.main, theme.palette.success.main, theme.palette.warning.main, theme.palette.error.main],
      grid: {
        borderColor: theme.palette.divider,
        strokeDashArray: 6
      },
      dataLabels: { enabled: false },
      xaxis: {
        type: 'datetime',
        tickAmount: 6,
        labels: {
          rotate: -45,
          style: { colors: theme.palette.text.secondary },
          formatter: (value: string, timestamp?: number) =>
            typeof timestamp === 'number' ? formatChartDate(timestamp) : value
        }
      },
      yaxis: {
        decimalsInFloat: 2,
        labels: {
          style: { colors: theme.palette.text.secondary }
        }
      },
      tooltip: {
        theme: theme.palette.mode,
        shared: true,
        intersect: false,
        x: {
          formatter: (value: number) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        }
      },
      legend: {
        position: 'top',
        horizontalAlign: 'left',
        labels: {
          colors: theme.palette.text.secondary
        },
        markers: {
          width: 10,
          height: 10
        }
      }
    }),
    [theme]
  )

  const volumeChartSeries = useMemo(
    () => [
      {
        name: 'Volume',
        data: volume.rows.slice(-120).map(row => ({
          x: row.ts,
          y: Number((row.volume ?? 0).toFixed(0))
        }))
      }
    ],
    [volume.rows]
  )

  const volumeChartOptions = useMemo<ApexOptions>(
    () => ({
      chart: {
        type: 'bar',
        toolbar: { show: false },
        zoom: { enabled: false },
        foreColor: theme.palette.text.secondary,
        parentHeightOffset: 0
      },
      plotOptions: {
        bar: {
          columnWidth: '70%',
          borderRadius: 4
        }
      },
      colors: [theme.palette.primary.main],
      dataLabels: { enabled: false },
      grid: {
        borderColor: theme.palette.divider,
        strokeDashArray: 6
      },
      xaxis: {
        type: 'datetime',
        tickAmount: 6,
        labels: {
          rotate: -45,
          style: { colors: theme.palette.text.secondary },
          formatter: (value: string, timestamp?: number) =>
            typeof timestamp === 'number' ? formatChartDate(timestamp) : value
        }
      },
      yaxis: {
        labels: {
          style: { colors: theme.palette.text.secondary }
        }
      },
      tooltip: {
        theme: theme.palette.mode,
        x: {
          formatter: (value: number) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        }
      }
    }),
    [theme]
  )

  const latestTrend = trend.latest
  const latestVolume = volume.latest
  const latestBreakout = breakout.latest
  const latestRisk = volatility.latest ?? returnVolatility.latest ?? bollinger.latest
  const latestSeasonality = seasonality.yearlyRows.length ? seasonality : null
  const { data: searchList, isLoading: isSearching } = usePaginatedSWR<SearchList[]>(ENDURL.GET_MASTER_STOCKS, {
    page: 0,
    limit: 5,
    search: stockSearch.length > 1 ? stockSearch : ''
  })

  const overallVerdict = useMemo(() => {
    if (!latestTrend) {
      return {
        label: 'Load a stock',
        color: 'primary' as const,
        helper: 'Pick a stock to see the summary dashboard.'
      }
    }

    const trendScore = latestTrend.trendScore
    const breakoutReadiness = latestBreakout?.breakoutReadiness || 'Far From Breakout'
    const volumeRatio = latestVolume?.volumeRatio ?? null

    const bullishSignals =
      (latestTrend.trend === 'Strong Uptrend' ? 2 : latestTrend.trend === 'Uptrend' ? 1 : 0) +
      (trendScore >= 70 ? 2 : trendScore >= 55 ? 1 : 0) +
      (breakoutReadiness === 'Imminent Breakout' || breakoutReadiness === 'Near Breakout' ? 1 : 0) +
      (volumeRatio !== null && volumeRatio >= 1.2 ? 1 : 0)

    const riskState =
      latestRisk && 'volatilityState' in latestRisk
        ? latestRisk.volatilityState
        : null
    const riskSignals =
      (riskState === 'High Volatility' || riskState === 'Very High Volatility' ? 1 : 0) +
      (latestRisk && 'atrPct' in latestRisk && (latestRisk.atrPct ?? 0) >= 5 ? 1 : 0)

    if (bullishSignals >= 4 && riskSignals <= 1) {
      return { label: 'Bullish setup', color: 'success' as const, helper: 'Trend, participation, and setup quality are aligned.' }
    }
    if (bullishSignals >= 2 && riskSignals <= 2) {
      return { label: 'Watchlist setup', color: 'warning' as const, helper: 'Some signals are supportive, but confirmation is still needed.' }
    }
    if (riskSignals >= 2) {
      return { label: 'Risky / choppy', color: 'error' as const, helper: 'Price action looks noisy or stretched. Use caution.' }
    }
    
return { label: 'Neutral', color: 'info' as const, helper: 'No strong edge yet. Wait for better confirmation.' }
  }, [latestTrend, latestRisk, latestBreakout, latestVolume])

  const breakoutChartAnnotations = useMemo<ApexOptions['annotations']>(() => {
    if (!latestBreakout) {
      return undefined
    }

    const yaxis: NonNullable<NonNullable<ApexOptions['annotations']>['yaxis']> = []
    const points: NonNullable<NonNullable<ApexOptions['annotations']>['points']> = []

    const addRange = (
      low: number,
      high: number,
      labelText: string,
      borderColor: string,
      fillColor: string,
      opacity = 0.12
    ) => {
      const y = Math.min(low, high)
      const y2 = Math.max(low, high)
      if (Number.isFinite(y) && Number.isFinite(y2) && y !== y2) {
        yaxis.push({
          y,
          y2,
          borderColor,
          fillColor,
          opacity,
          label: {
            text: labelText,
            style: {
              color: theme.palette.getContrastText(fillColor),
              background: fillColor
            }
          }
        })
      }
    }

    const addLine = (value: number, labelText: string, borderColor: string, dashArray = 4) => {
      if (Number.isFinite(value)) {
        yaxis.push({
          y: value,
          borderColor,
          strokeDashArray: dashArray,
          label: {
            text: labelText,
            style: {
              color: theme.palette.getContrastText(borderColor),
              background: borderColor
            }
          }
        })
      }
    }

    if (latestBreakout.support20d !== null && latestBreakout.support52w !== null) {
      addRange(
        latestBreakout.support20d,
        latestBreakout.support52w,
        'Support zone',
        theme.palette.success.main,
        theme.palette.success.light
      )
    }
    if (latestBreakout.resistance20d !== null && latestBreakout.resistance52w !== null) {
      addRange(
        latestBreakout.resistance20d,
        latestBreakout.resistance52w,
        'Resistance zone',
        theme.palette.error.main,
        theme.palette.error.light
      )
    }

    if (latestBreakout.support20d !== null) {
      addLine(latestBreakout.support20d, 'Sup 20D', theme.palette.info.main)
    }
    if (latestBreakout.support52w !== null) {
      addLine(latestBreakout.support52w, 'Sup 52W', theme.palette.success.main, 0)
    }
    if (latestBreakout.resistance20d !== null) {
      addLine(latestBreakout.resistance20d, 'Res 20D', theme.palette.warning.main)
    }
    if (latestBreakout.resistance52w !== null) {
      addLine(latestBreakout.resistance52w, 'Res 52W', theme.palette.error.main, 0)
    }

    const resistance = latestBreakout.resistance52w ?? latestBreakout.resistance20d
    const support = latestBreakout.support52w ?? latestBreakout.support20d
    const latestClose = latestBreakout.close
    const latestTs = latestBreakout.ts
    const isFalseBreakout = latestBreakout.breakoutStatus === 'False Breakout'
    const hasBullishBreakout =
      latestBreakout.breakoutType !== 'No Breakout' &&
      latestBreakout.breakoutType.includes('Breakout') &&
      !latestBreakout.breakoutType.includes('Breakdown') &&
      (resistance !== null ? latestClose > resistance : true)
    const hasBearishBreakdown =
      (latestBreakout.breakoutType !== 'No Breakout' && latestBreakout.breakoutType.includes('Breakdown')) ||
      (support !== null && latestClose < support)

    if (resistance !== null && support !== null) {
      const target =
        !isFalseBreakout && hasBullishBreakout && resistance > support
          ? resistance + (resistance - support) * 0.5
          : !isFalseBreakout && hasBearishBreakdown && resistance > support
            ? support - (resistance - support) * 0.5
            : null

      if (target !== null && Number.isFinite(target)) {
        yaxis.push({
          y: target,
          borderColor: theme.palette.warning.dark,
          strokeDashArray: 2,
          label: {
            text: 'Target ref',
            style: {
              color: theme.palette.getContrastText(theme.palette.warning.dark),
              background: theme.palette.warning.dark
            }
          }
        })
      }
    }

    const markerLabel = isFalseBreakout ? 'False breakout' : hasBearishBreakdown ? 'Breakdown' : hasBullishBreakout ? 'Breakout' : null

    if (latestTs && markerLabel) {
      points.push({
        x: latestTs,
        y: latestClose,
        marker: {
          size: 6,
          fillColor:
            isFalseBreakout || hasBearishBreakdown ? theme.palette.error.main : theme.palette.success.main,
          strokeColor: theme.palette.background.paper,
          strokeWidth: 2
        },
        label: {
          text: markerLabel,
          borderColor:
            isFalseBreakout || hasBearishBreakdown ? theme.palette.error.main : theme.palette.success.main,
          offsetY: -6,
          style: {
            color: theme.palette.common.white,
            background:
              isFalseBreakout || hasBearishBreakdown ? theme.palette.error.main : theme.palette.success.main
          }
        }
      })
    }

    return {
      yaxis,
      points
    }
  }, [latestBreakout, theme])

  const breakoutChartBounds = useMemo(() => {
    const chartRows = breakout.rows.slice(-180)
    const values: number[] = []

    chartRows.forEach(row => {
      values.push(row.low, row.high, row.close)
    })

    if (latestBreakout) {
      ;[
        latestBreakout.support20d,
        latestBreakout.support52w,
        latestBreakout.resistance20d,
        latestBreakout.resistance52w,
        latestBreakout.close
      ].forEach(value => {
        if (value !== null && Number.isFinite(value)) {
          values.push(value)
        }
      })
    }

    const finiteValues = values.filter(Number.isFinite)
    if (!finiteValues.length) {
      return null
    }

    const min = Math.min(...finiteValues)
    const max = Math.max(...finiteValues)
    const span = Math.max(max - min, 1)
    const lowerPad = Math.max(span * 0.08, min * 0.005)
    const upperPad = Math.max(span * 0.06, max * 0.005)

    return {
      min: Math.max(0, min - lowerPad),
      max: max + upperPad
    }
  }, [breakout.rows, latestBreakout])

  const breakoutCandlestickSeries = useMemo(() => {
    const chartRows = breakout.rows.slice(-180)
    
return [
      {
        name: 'OHLC',
        data: chartRows.map(row => ({
          x: row.ts,
          y: [row.open, row.high, row.low, row.close].map(value => Number(Number(value).toFixed(2))) as [
            number,
            number,
            number,
            number
          ]
        }))
      }
    ]
  }, [breakout.rows])

  const breakoutCandlestickOptions = useMemo<ApexOptions>(
    () => ({
      chart: {
        type: 'candlestick',
        toolbar: { show: false },
        zoom: { enabled: false },
        foreColor: theme.palette.text.secondary,
        parentHeightOffset: 0
      },
      plotOptions: {
        candlestick: {
          colors: {
            upward: theme.palette.success.main,
            downward: theme.palette.error.main
          },
          wick: {
            useFillColor: true
          }
        }
      },
      grid: {
        borderColor: theme.palette.divider,
        strokeDashArray: 6
      },
      dataLabels: { enabled: false },
      xaxis: {
        type: 'datetime',
        tickAmount: 6,
        labels: {
          rotate: -45,
          style: { colors: theme.palette.text.secondary },
          formatter: (value: string, timestamp?: number) =>
            typeof timestamp === 'number' ? formatChartDate(timestamp) : value
        }
      },
      yaxis: {
        min: breakoutChartBounds?.min,
        max: breakoutChartBounds?.max,
        decimalsInFloat: 2,
        labels: {
          style: { colors: theme.palette.text.secondary }
        }
      },
      tooltip: {
        theme: theme.palette.mode,
        shared: true,
        intersect: false,
        x: {
          formatter: (value: number) =>
            new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        }
      },
      legend: {
        position: 'top',
        horizontalAlign: 'left',
        labels: {
          colors: theme.palette.text.secondary
        }
      },
      annotations: breakoutChartAnnotations
    }),
    [theme, breakoutChartAnnotations, breakoutChartBounds]
  )

  const activeTabGuide = useMemo(() => {
    switch (activeTab) {
      case 'trend':
        return {
          title: 'Trend guide',
          subtitle: 'Read this tab when you want to know if the stock is structurally strong or weak.',
          legendRows: [
            { label: 'Strong Uptrend', color: 'success' as const, meaning: 'Price is above all major averages and the structure is strongly bullish.' },
            { label: 'Uptrend', color: 'success' as const, meaning: 'Bullish structure, but not as clean as Strong Uptrend.' },
            { label: 'Sideways', color: 'warning' as const, meaning: 'Mixed alignment; there is no clear directional edge yet.' },
            { label: 'Downtrend', color: 'error' as const, meaning: 'Price is weak and the structure is bearish.' }
          ],
          examples: [
            'Strong Uptrend + high trend score usually means buyers are in control.',
            'Sideways + weak slopes usually means the stock is not giving a clear edge.'
          ],
          note: 'Trend is about direction and structure. It does not guarantee the next candle.'
        }
      case 'momentum':
        return {
          title: 'Momentum guide',
          subtitle: 'Read this tab when you want to know whether price pressure is improving or fading.',
          legendRows: [
            { label: 'Bullish', color: 'success' as const, meaning: 'Momentum is improving and price is gaining strength.' },
            { label: 'Strong Bullish', color: 'success' as const, meaning: 'Momentum is very strong and the move has energy behind it.' },
            { label: 'Neutral', color: 'warning' as const, meaning: 'No clear momentum edge right now.' },
            { label: 'Bearish', color: 'error' as const, meaning: 'Momentum is fading and the move is under pressure.' }
          ],
          examples: [
            'RSI above 70 can mean the move is strong, but it may also be stretched.',
            'MACD bullish crossover often means momentum is improving.'
          ],
          note: 'Momentum tells you whether the move has energy behind it.'
        }
      case 'volume':
        return {
          title: 'Volume guide',
          subtitle: 'Read this tab when you want to know whether the move has participation behind it.',
          legendRows: [
            { label: 'Extreme Spike', color: 'error' as const, meaning: 'Volume is far above normal and the stock is getting heavy attention.' },
            { label: 'High Spike', color: 'warning' as const, meaning: 'Volume is clearly above average and the move is being actively traded.' },
            { label: 'Accumulation', color: 'success' as const, meaning: 'Buyers are dominating the flow.' },
            { label: 'Distribution', color: 'error' as const, meaning: 'Sellers are dominating the flow.' },
            { label: 'Mixed', color: 'warning' as const, meaning: 'OBV and A/D do not point the same way, so the flow is mixed.' }
          ],
          examples: [
            'High Spike + Accumulation usually means buyers are active.',
            'Normal volume + Weak Bullish price action can mean the move is not well supported.'
          ],
          note: 'Volume is about participation, not direction by itself.'
        }
      case 'breakout':
        return {
          title: 'Breakout guide',
          subtitle: 'Read this tab when you want to know if price is escaping a range or failing at it.',
          legendRows: [
            { label: '52W Breakout', color: 'success' as const, meaning: 'Price has moved above the recent yearly range and is attempting an upside expansion.' },
            { label: 'Near Breakout', color: 'warning' as const, meaning: 'Price is close to resistance and may move soon.' },
            { label: 'False Breakout', color: 'error' as const, meaning: 'Price moved through a level but failed to hold it.' },
            { label: 'Tight Consolidation', color: 'success' as const, meaning: 'Price has been coiling in a narrow range and may be building pressure.' }
          ],
          examples: [
            'Near Breakout means the stock is close to resistance and may move soon.',
            'False Breakout means it popped above a level but could not hold it.'
          ],
          note: 'Breakout quality improves when volume confirms the move.'
        }
      case 'seasonality':
        return {
          title: 'Seasonality guide',
          subtitle: 'Read this tab when you want historical context by month, quarter, weekday, and year.',
          legendRows: [
            { label: 'Best Month', color: 'success' as const, meaning: 'A month that has historically delivered stronger average returns.' },
            { label: 'Worst Month', color: 'error' as const, meaning: 'A month that has historically been weaker on average.' },
            { label: 'Positive', color: 'success' as const, meaning: 'That period finished higher more often than it finished lower.' },
            { label: 'Negative', color: 'error' as const, meaning: 'That period finished lower more often than it finished higher.' },
            { label: 'Flat', color: 'warning' as const, meaning: 'That period has not shown a strong directional edge.' }
          ],
          examples: [
            'A best month with positive win rate means that period has historically been friendlier.',
            'A weak quarter means the stock has often struggled in that season.'
          ],
          note: 'Seasonality is context, not prediction. Use it with trend and setup signals.'
        }
      case 'risk':
      default:
        return {
          title: 'Risk guide',
          subtitle: 'Read this tab when you want to know how calm or choppy the stock is.',
          legendRows: [
            { label: 'Very Low', color: 'info' as const, meaning: 'Very quiet price action and smaller daily swings.' },
            { label: 'Low', color: 'success' as const, meaning: 'Calmer movement that is usually easier to hold through.' },
            { label: 'Moderate', color: 'warning' as const, meaning: 'Normal movement with a balanced amount of noise.' },
            { label: 'High', color: 'error' as const, meaning: 'Larger swings and more risk of getting shaken out.' }
          ],
          examples: [
            'Low ATR and low return volatility usually mean the stock is calmer.',
            'High Bollinger bandwidth or very high return volatility means bigger swings and more risk.'
          ],
          note: 'Risk helps you size positions and avoid getting shaken out by noise.'
        }
    }
  }, [activeTab])

  const loadTrend = async (stock: ActiveStock) => {
    const id = String(stock?.master_id || '').trim()
    if (!id) {
      setError('Selected stock does not have a master id.')
      
return
    }

    try {
      setLoading(true)
      setError('')
      setCandles([])
      setLoadedSymbol('')
      setLoadedExchange('')
      setViewMode('dashboard')

      const res = await axiosInstance.get(`${ENDURL.GET_EOD_MASTER_RANGE}/${id}`, {
        params: {
          fromDate: HISTORY_FROM_DATE,
          toDate: HISTORY_TO_DATE,
          limit: 20000
        }
      })

      const rows: EodCandle[] = Array.isArray(res?.data?.data) ? res.data.data : []
      setCandles(rows)
      setLoadedSymbol(String(rows?.[0]?.symbol || ''))
      setLoadedExchange(String(rows?.[0]?.exchange || ''))
      setStockSearch(`${stock.name} ${stock.symbol}`)
      setSearchAnchorEl(null)
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load trend data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const queryMasterId = String(router.query.master_id || '').trim()
    if (queryMasterId) {
      loadTrend({ master_id: queryMasterId, name: '', symbol: '' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.query.master_id])

  return (
    <Box sx={{ p: 4 }}>
      <Stack spacing={3}>
        <Card>
          <CardHeader title='EOD Trend Analysis' subheader='Frontend-only trend behavior using the last available EOD candle set.' />
          <CardContent>
            <Stack spacing={2}>
              <Typography variant='body2' color='text.secondary'>
                This page calculates SMA20, SMA50, and SMA200 in the browser and classifies the latest available trend. No backend
                calculation is used.
              </Typography>

              <Stack spacing={2}>
                <TextField
                  label='Search stock by name or symbol'
                  size='small'
                  value={stockSearch}
                  onChange={e => {
                    const value = e.target.value
                    setStockSearch(value)
                    setSearchAnchorEl(value.length > 1 ? e.currentTarget : null)
                  }}
                  onFocus={e => {
                    if (stockSearch.length > 1) setSearchAnchorEl(e.currentTarget)
                  }}
                  inputRef={inputWrapperRef}
                  helperText='Type part of the stock name or symbol, then pick a stock from the list below.'
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position='start'>
                        <Magnify fontSize='small' />
                      </InputAdornment>
                    )
                  }}
                />

                <Popper
                  open={Boolean(searchAnchorEl && stockSearch.length >= 2)}
                  anchorEl={searchAnchorEl}
                  placement='bottom-start'
                  style={{ zIndex: 1300 }}
                  modifiers={[
                    {
                      name: 'width',
                      enabled: true,
                      phase: 'beforeWrite',
                      requires: ['computeStyles'],
                      fn: ({ state }) => {
                        state.styles.popper.width = `${state.rects.reference.width}px`
                      }
                    }
                  ]}
                >
                  <ClickAwayListener onClickAway={() => setSearchAnchorEl(null)}>
                    <Paper sx={{ maxHeight: 300, overflowY: 'auto' }}>
                      <Stack>
                        {isSearching && (
                          <ListItemButton disabled>
                            <ListItemText primary='Searching...' />
                          </ListItemButton>
                        )}

                        {!isSearching && searchList?.length === 0 && (
                          <ListItemButton disabled>
                            <ListItemText primary='No results' />
                          </ListItemButton>
                        )}

                        {searchList?.map(item => (
                          <ListItemButton
                            key={item.id}
                            onClick={() => {
                              const masterId = String(item.id || '').trim()
                              if (!masterId) {
                                setError('Selected stock is missing a master id.')
                                
return
                              }

                              setStockSearch(item.name || item.symbol || '')
                              setSearchAnchorEl(null)
                              loadTrend({
                                master_id: masterId,
                                name: item.name,
                                symbol: item.symbol
                              })
                            }}
                          >
                            <ListItemText primary={item.name} secondary={item.symbol} />
                          </ListItemButton>
                        ))}
                      </Stack>
                    </Paper>
                  </ClickAwayListener>
                </Popper>

                <Typography variant='caption' color='text.secondary'>
                  Default range: {HISTORY_FROM_DATE} to {HISTORY_TO_DATE}
                </Typography>
              </Stack>

              {!!error && <Alert severity='error'>{error}</Alert>}
              {loading && <LinearProgress />}
            </Stack>
          </CardContent>
        </Card>

        <Card variant='outlined' ref={dashboardRef}>
          <CardHeader
            title='Main Dashboard'
            subheader='The quickest read on trend, risk, participation, and setup quality.'
            action={
              <Stack direction='row' spacing={1}>
                <Button
                  variant='contained'
                  onClick={() => setViewMode(viewMode === 'dashboard' ? 'deepDive' : 'dashboard')}
                  disabled={!candles.length}
                >
                  {viewMode === 'dashboard' ? 'Deep Dive' : 'Back to Home'}
                </Button>
              </Stack>
            }
          />
          <CardContent>
            {!candles.length ? (
              <Typography variant='body2' color='text.secondary'>
                Load a stock to see the dashboard summary.
              </Typography>
            ) : (
              <Stack spacing={2}>
                <Grid container spacing={2}>
                  <Grid item xs={12} lg={8}>
                    <Stack spacing={2}>
                      <ApexChartWrapper>
                        <Card variant='outlined'>
                          <CardHeader
                            title='Overview Chart'
                            subheader='Close price with SMA 20 / 50 / 200 for a quick structural read.'
                          />
                          <CardContent sx={{ pt: 0 }}>
                            <Box sx={{ height: 320 }}>
                              <ReactApexcharts
                                type='line'
                                height='100%'
                                options={overviewChartOptions}
                                series={overviewChartSeries}
                              />
                            </Box>
                          </CardContent>
                        </Card>
                      </ApexChartWrapper>

                      <Card variant='outlined'>
                        <CardContent>
                          <Stack spacing={1.5}>
                            <Typography variant='subtitle2'>How to read the averages</Typography>
                            <Grid container spacing={1.5}>
                              <Grid item xs={12} md={4}>
                                <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                                  <Stack spacing={1}>
                                    <Chip label='SMA 20' color='primary' size='small' sx={{ alignSelf: 'flex-start' }} />
                                    <Typography variant='body2' color='text.secondary'>
                                      Price above SMA20 usually means short-term momentum is healthy. A touch or cross below often
                                      means the stock is cooling off.
                                    </Typography>
                                  </Stack>
                                </Box>
                              </Grid>
                              <Grid item xs={12} md={4}>
                                <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                                  <Stack spacing={1}>
                                    <Chip label='SMA 50' color='warning' size='small' sx={{ alignSelf: 'flex-start' }} />
                                    <Typography variant='body2' color='text.secondary'>
                                      Price above SMA50 usually means the medium-term trend is holding. Below it often suggests the
                                      move is losing balance.
                                    </Typography>
                                  </Stack>
                                </Box>
                              </Grid>
                              <Grid item xs={12} md={4}>
                                <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                                  <Stack spacing={1}>
                                    <Chip label='SMA 200' color='success' size='small' sx={{ alignSelf: 'flex-start' }} />
                                    <Typography variant='body2' color='text.secondary'>
                                      Price above SMA200 usually means the long-term structure is positive. Below it often means the
                                      stock is still under long-term pressure.
                                    </Typography>
                                  </Stack>
                                </Box>
                              </Grid>
                            </Grid>
                            <Typography variant='caption' color='text.secondary'>
                              Simple rule of thumb: above the average is constructive, below the average is weak, and frequent
                              crossings can mean the stock is noisy or stuck in a range.
                            </Typography>
                          </Stack>
                        </CardContent>
                      </Card>

                      <ApexChartWrapper>
                        <Card variant='outlined'>
                          <CardHeader
                            title='Volume Chart'
                            subheader='Recent volume bars to show participation and spikes.'
                          />
                          <CardContent sx={{ pt: 0 }}>
                            <Box sx={{ height: 220 }}>
                              <ReactApexcharts type='bar' height='100%' options={volumeChartOptions} series={volumeChartSeries} />
                            </Box>
                          </CardContent>
                        </Card>
                      </ApexChartWrapper>
                    </Stack>
                  </Grid>

                  <Grid item xs={12} lg={4}>
                    <Stack spacing={2}>
                      <Box>
                        {renderSummaryChip(overallVerdict.label, overallVerdict.color)}
                        {latestTrend ? renderSummaryChip(`Trend: ${latestTrend.trend}`, getTrendColor(latestTrend.trend)) : null}
                        {latestRisk && 'volatilityState' in latestRisk
                          ? renderSummaryChip(`Risk: ${latestRisk.volatilityState}`, getVolatilityColor(latestRisk.volatilityState))
                          : null}
                        {latestBreakout
                          ? renderSummaryChip(`Setup: ${latestBreakout.breakoutReadiness}`, getBreakoutReadinessColor(latestBreakout.breakoutReadiness))
                          : null}
                        {latestVolume
                          ? renderSummaryChip(
                              `Volume: ${latestVolume.volumeSignal}`,
                              getVolumeSpikeColor(latestVolume.volumeSignal)
                            )
                          : null}
                      </Box>

                      <Typography variant='body2' color='text.secondary'>
                        {overallVerdict.helper}
                      </Typography>

                      <Card variant='outlined'>
                        <CardContent>
                          <Typography variant='overline' color='text.secondary'>
                            Trend
                          </Typography>
                          <Typography variant='h6'>{latestTrend?.trend || '-'}</Typography>
                          <Typography variant='body2' color='text.secondary'>
                            Score: {latestTrend ? latestTrend.trendScore : '-'} / 100
                          </Typography>
                          <Typography variant='body2' color='text.secondary'>
                            Age: {trend.currentTrendDuration ? `${trend.currentTrendDuration.sessions} bars` : '-'}
                          </Typography>
                        </CardContent>
                      </Card>

                      <Card variant='outlined'>
                        <CardContent>
                          <Typography variant='overline' color='text.secondary'>
                            Risk
                          </Typography>
                          <Typography variant='h6'>
                            {volatility.latest?.volatilityState || returnVolatility.latest?.volatilityState30d || '-'}
                          </Typography>
                          <Typography variant='body2' color='text.secondary'>
                            ATR%: {volatility.latest ? formatPosPct(volatility.latest.atrPct) : '-'}
                          </Typography>
                          <Typography variant='body2' color='text.secondary'>
                            BB: {bollinger.latest?.bbSignal || '-'}
                          </Typography>
                        </CardContent>
                      </Card>

                      <Card variant='outlined'>
                        <CardContent>
                          <Typography variant='overline' color='text.secondary'>
                            Participation
                          </Typography>
                          <Typography variant='h6'>
                            {latestVolume ? latestVolume.volumeSignal : '-'}
                          </Typography>
                          <Typography variant='body2' color='text.secondary'>
                            Ratio:{' '}
                            {latestVolume?.volumeRatio !== null && latestVolume?.volumeRatio !== undefined
                              ? `${latestVolume.volumeRatio.toFixed(2)}x`
                              : '-'}
                          </Typography>
                          <Typography variant='body2' color='text.secondary'>
                            Flow: {latestVolume?.flowConsensus || '-'}
                          </Typography>
                        </CardContent>
                      </Card>

                      <Card variant='outlined'>
                        <CardContent>
                          <Typography variant='overline' color='text.secondary'>
                            Setup
                          </Typography>
                          <Typography variant='h6'>{latestBreakout?.breakoutReadiness || '-'}</Typography>
                          <Typography variant='body2' color='text.secondary'>
                            Type: {latestBreakout?.breakoutType || '-'}
                          </Typography>
                          <Typography variant='body2' color='text.secondary'>
                            Distance:{' '}
                            {latestBreakout?.pctFromResistance52w !== null && latestBreakout?.pctFromResistance52w !== undefined
                              ? `${latestBreakout.pctFromResistance52w.toFixed(2)}%`
                              : '-'}
                          </Typography>
                        </CardContent>
                      </Card>

                      <Card variant='outlined'>
                        <CardContent>
                          <Typography variant='subtitle2' sx={{ mb: 1 }}>
                            Context
                          </Typography>
                          <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                            {latestSeasonality?.bestMonth
                              ? renderMeaningChip(`Best Month: ${latestSeasonality.bestMonth.monthName}`, 'success')
                              : null}
                            {latestSeasonality?.worstMonth
                              ? renderMeaningChip(`Weak Month: ${latestSeasonality.worstMonth.monthName}`, 'error')
                              : null}
                            {latestSeasonality?.bestQuarter
                              ? renderMeaningChip(`Best Quarter: ${latestSeasonality.bestQuarter.quarterLabel}`, 'success')
                              : null}
                            {latestSeasonality?.worstQuarter
                              ? renderMeaningChip(`Weak Quarter: ${latestSeasonality.worstQuarter.quarterLabel}`, 'error')
                              : null}
                          </Stack>
                        </CardContent>
                      </Card>

                      <Card variant='outlined'>
                        <CardContent>
                          <Typography variant='subtitle2' sx={{ mb: 1 }}>
                            Quick Read
                          </Typography>
                          <Typography variant='body2' color='text.secondary'>
                            Use this dashboard first. If you want the exact calculations, transition history, and deeper pattern read,
                            switch to Deep Dive.
                          </Typography>
                        </CardContent>
                      </Card>
                    </Stack>
                  </Grid>
                </Grid>
              </Stack>
            )}
          </CardContent>
        </Card>

        <Box ref={deepDiveRef} sx={{ borderBottom: 1, borderColor: 'divider', display: viewMode === 'deepDive' ? 'block' : 'none' }}>
          <Tabs
            value={activeTab}
            onChange={(_, value) => setActiveTab(value as AnalysisTab)}
            aria-label='trend risk tabs'
          >
            <Tab value='trend' label='Trending' />
            <Tab value='momentum' label='Momentum' />
            <Tab value='volume' label='Volume' />
            <Tab value='breakout' label='Breakout' />
            <Tab value='seasonality' label='Seasonality' />
            <Tab value='risk' label='Risk' />
          </Tabs>
        </Box>

        <Box sx={{ display: viewMode === 'deepDive' && activeTab === 'trend' ? 'block' : 'none' }}>
          <Card>
          <CardHeader
            title='Trend Summary'
            subheader={
              trend.latest
                ? `${loadedSymbol || 'Stock'} ${loadedExchange ? `(${loadedExchange})` : ''} | Latest candle: ${new Date(
                    trend.latest.ts
                  ).toISOString().slice(0, 10)}`
                : 'Load a stock to see the current trend summary.'
            }
          />
          <CardContent>
            {!trend.latest ? (
              <Typography variant='body2' color='text.secondary'>
                Need at least 200 candles to classify trend using SMA20, SMA50, and SMA200.
              </Typography>
            ) : (
              <Stack spacing={3}>

                <Box
                  sx={{
                    p: 2,
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.paper'
                  }}
                >
                  <Stack direction='row' spacing={1.25} alignItems='center' flexWrap='wrap'>
                    <Chip label={trend.latest.trend} color={getTrendColor(trend.latest.trend)} />
                    <Chip
                      label={`Score ${trend.latest.trendScore}/100`}
                      color={trend.latest.trendScore >= 70 ? 'success' : trend.latest.trendScore >= 45 ? 'warning' : 'default'}
                      variant='outlined'
                    />
                    <Chip
                      label={`Volume ${trend.latest.volumeConfirmation}`}
                      color={
                        trend.latest.volumeConfirmation === 'Above Average'
                          ? 'success'
                          : trend.latest.volumeConfirmation === 'Below Average'
                            ? 'error'
                            : 'warning'
                      }
                      variant='outlined'
                    />
                    <Chip
                      label={`52W Pos ${formatPosPct(trend.latest.week52PositionPct)}`}
                      color={
                        trend.latest.week52PositionPct === null
                          ? 'default'
                          : trend.latest.week52PositionPct >= 70
                            ? 'success'
                            : trend.latest.week52PositionPct >= 40
                              ? 'warning'
                              : 'error'
                      }
                      variant='outlined'
                    />
                    <Chip
                      label={
                        trend.currentTrendDuration
                          ? `Trend Age ${trend.currentTrendDuration.sessions} sessions / ${trend.currentTrendDuration.calendarDays} days`
                          : 'Trend Age -'
                      }
                      variant='outlined'
                      color='primary'
                    />
                  </Stack>

                  <Typography variant='body2' color='text.secondary' sx={{ mt: 1.25 }}>
                    {TREND_RULES[trend.latest.trend]}
                  </Typography>

                  <Divider sx={{ my: 2 }} />

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={2}>
                      <Typography variant='caption' color='text.secondary'>
                        Latest Close
                      </Typography>
                      <Typography variant='h6'>{trend.latest.close.toFixed(2)}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                      <Typography variant='caption' color='text.secondary'>
                        SMA 20
                      </Typography>
                      <Typography variant='h6'>{trend.latest.sma20?.toFixed(2)}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                      <Typography variant='caption' color='text.secondary'>
                        SMA 50
                      </Typography>
                      <Typography variant='h6'>{trend.latest.sma50?.toFixed(2)}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                      <Typography variant='caption' color='text.secondary'>
                        SMA 200
                      </Typography>
                      <Typography variant='h6'>{trend.latest.sma200?.toFixed(2)}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                      <Typography variant='caption' color='text.secondary'>
                        Trend Strength
                      </Typography>
                      <Typography
                        variant='h6'
                        sx={{
                          color: (trend.latest.trendStrengthPct || 0) >= 0 ? 'success.main' : 'error.main'
                        }}
                      >
                        {formatPct(trend.latest.trendStrengthPct)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                      <Typography variant='caption' color='text.secondary'>
                        Volume vs Avg20
                      </Typography>
                      <Typography variant='h6'>
                        {trend.latest.volumeRatio === null ? '-' : `${trend.latest.volumeRatio.toFixed(2)}x`}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                      <Typography variant='caption' color='text.secondary'>
                        Trend Age
                      </Typography>
                      <Typography variant='h6'>
                        {trend.currentTrendDuration ? `${trend.currentTrendDuration.sessions} bars` : '-'}
                      </Typography>
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 2 }} />

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant='caption' color='text.secondary'>
                        SMA20 Slope
                      </Typography>
                      <Typography variant='h6' sx={{ color: (trend.latest.sma20SlopePct || 0) >= 0 ? 'success.main' : 'error.main' }}>
                        {formatPct(trend.latest.sma20SlopePct)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant='caption' color='text.secondary'>
                        SMA50 Slope
                      </Typography>
                      <Typography variant='h6' sx={{ color: (trend.latest.sma50SlopePct || 0) >= 0 ? 'success.main' : 'error.main' }}>
                        {formatPct(trend.latest.sma50SlopePct)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant='caption' color='text.secondary'>
                        SMA200 Slope
                      </Typography>
                      <Typography variant='h6' sx={{ color: (trend.latest.sma200SlopePct || 0) >= 0 ? 'success.main' : 'error.main' }}>
                        {formatPct(trend.latest.sma200SlopePct)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant='caption' color='text.secondary'>
                        52W Range / Position
                      </Typography>
                      <Typography variant='h6'>
                        {trend.latest.week52Low === null || trend.latest.week52High === null
                          ? '-'
                          : `${trend.latest.week52Low.toFixed(2)} - ${trend.latest.week52High.toFixed(2)} (${formatPosPct(trend.latest.week52PositionPct)})`}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant='caption' color='text.secondary'>
                        Trend Started On
                      </Typography>
                      <Typography variant='h6'>
                        {trend.currentTrendDuration ? new Date(trend.currentTrendDuration.startTs).toISOString().slice(0, 10) : '-'}
                      </Typography>
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 2 }} />

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={4}>
                      <Typography variant='caption' color='text.secondary'>
                        3M Momentum
                      </Typography>
                      <Typography variant='h6' sx={{ color: (trend.latest.momentum63Pct || 0) >= 0 ? 'success.main' : 'error.main' }}>
                        {formatPct(trend.latest.momentum63Pct)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <Typography variant='caption' color='text.secondary'>
                        6M Momentum
                      </Typography>
                      <Typography variant='h6' sx={{ color: (trend.latest.momentum126Pct || 0) >= 0 ? 'success.main' : 'error.main' }}>
                        {formatPct(trend.latest.momentum126Pct)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <Typography variant='caption' color='text.secondary'>
                        1Y Momentum
                      </Typography>
                      <Typography variant='h6' sx={{ color: (trend.latest.momentum252Pct || 0) >= 0 ? 'success.main' : 'error.main' }}>
                        {formatPct(trend.latest.momentum252Pct)}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Card variant='outlined'>
                      <CardContent>
                        <Typography variant='caption' color='text.secondary'>
                          Total candles loaded
                        </Typography>
                        <Typography variant='h5'>{candles.length}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Card variant='outlined'>
                      <CardContent>
                        <Typography variant='caption' color='text.secondary'>
                          Latest trend date
                        </Typography>
                        <Typography variant='h5'>{new Date(trend.latest.ts).toISOString().slice(0, 10)}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Card variant='outlined'>
                      <CardContent>
                        <Typography variant='caption' color='text.secondary'>
                          History coverage
                        </Typography>
                        <Typography variant='h5'>
                          {candles.length ? `${candles[0]?.trade_date?.slice(0, 10)} → ${candles[candles.length - 1]?.trade_date?.slice(0, 10)}` : '-'}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                <Box>
                  <Typography variant='subtitle2' sx={{ mb: 1 }}>
                    Trend Behavior Changes
                  </Typography>
                  {trend.transitions.length ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {trend.transitions
                        .slice()
                        .reverse()
                        .map(row => (
                          <Card key={`${row.ts}-${row.trend}`} variant='outlined'>
                            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
                                <Chip size='small' label={row.trend} color={getTrendColor(row.trend)} />
                                <Typography variant='body2'>
                                  {new Date(row.ts).toISOString().slice(0, 10)}
                                </Typography>
                                <Typography variant='body2' color='text.secondary'>
                                  Close: {row.close.toFixed(2)}
                                </Typography>
                                <Typography variant='body2' color='text.secondary'>
                                  Strength:{' '}
                                  {row.trendStrengthPct === null
                                    ? '-'
                                    : formatPct(row.trendStrengthPct)}
                                </Typography>
                                <Typography variant='body2' color='text.secondary'>
                                  Score: {row.trendScore}/100
                                </Typography>
                                <Typography variant='body2' color='text.secondary'>
                                  Vol: {row.volumeRatio === null ? '-' : `${row.volumeRatio.toFixed(2)}x`}
                                </Typography>
                              </Stack>
                            </CardContent>
                          </Card>
                        ))}
                    </Box>
                  ) : (
                    <Typography variant='body2' color='text.secondary'>
                      No trend transitions yet for the loaded history window.
                    </Typography>
                  )}
                </Box>
              </Stack>
            )}
          </CardContent>
          </Card>
        </Box>

        <Box sx={{ display: viewMode === 'deepDive' && activeTab === 'momentum' ? 'block' : 'none' }}>
          <Card>
            <CardHeader
              title='Momentum Summary'
              subheader={
                momentum.latest
                  ? `${loadedSymbol || 'Stock'} ${loadedExchange ? `(${loadedExchange})` : ''} | Latest candle: ${new Date(
                      momentum.latest.ts
                    ).toISOString().slice(0, 10)}`
                  : 'Load a stock to see the current momentum snapshot.'
              }
            />
            <CardContent>
              {!momentum.latest ? (
                <Typography variant='body2' color='text.secondary'>
                  Need at least 26 candles to calculate RSI and MACD, and more history for the longer ROC windows.
                </Typography>
              ) : (
                <Stack spacing={3}>

                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: 'background.paper'
                    }}
                  >
                    <Stack direction='row' spacing={1.25} alignItems='center' flexWrap='wrap'>
                      <Chip label={momentum.latest.momentumScore} color={getMomentumColor(momentum.latest.momentumScore)} />
                      <Chip label={`RSI ${momentum.latest.rsi14 === null ? '-' : momentum.latest.rsi14.toFixed(2)}`} variant='outlined' />
                      <Chip label={`MACD ${momentum.latest.macdLine === null ? '-' : momentum.latest.macdLine.toFixed(2)}`} variant='outlined' />
                      <Chip label={`ROC 20D ${formatPct(momentum.latest.roc20)}`} variant='outlined' />
                      <Chip label={`Stoch %K ${momentum.latest.stochK === null ? '-' : momentum.latest.stochK.toFixed(2)}`} variant='outlined' />
                    </Stack>

                    <Typography variant='body2' color='text.secondary' sx={{ mt: 1.25 }}>
                      Momentum Score is a quick blended read: bullish signals across RSI, MACD, and Stochastic push the score up,
                      while bearish combinations pull it down.
                    </Typography>

                    <Divider sx={{ my: 2 }} />

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant='caption' color='text.secondary'>
                          RSI 14
                        </Typography>
                        <Typography variant='h6'>{momentum.latest.rsi14 === null ? '-' : momentum.latest.rsi14.toFixed(2)}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant='caption' color='text.secondary'>
                          RSI Signal
                        </Typography>
                        <Typography variant='h6'>{momentum.latest.rsiSignal}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant='caption' color='text.secondary'>
                          MACD Line
                        </Typography>
                        <Typography variant='h6'>{momentum.latest.macdLine === null ? '-' : momentum.latest.macdLine.toFixed(2)}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant='caption' color='text.secondary'>
                          Signal Line
                        </Typography>
                        <Typography variant='h6'>{momentum.latest.signalLine === null ? '-' : momentum.latest.signalLine.toFixed(2)}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant='caption' color='text.secondary'>
                          MACD Histogram
                        </Typography>
                        <Typography variant='h6'>
                          {momentum.latest.macdHistogram === null ? '-' : momentum.latest.macdHistogram.toFixed(2)}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant='caption' color='text.secondary'>
                          ROC 10D / 20D
                        </Typography>
                        <Typography variant='h6'>
                          {formatPct(momentum.latest.roc10)} / {formatPct(momentum.latest.roc20)}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant='caption' color='text.secondary'>
                          ROC 60D / 1Y
                        </Typography>
                        <Typography variant='h6'>
                          {formatPct(momentum.latest.roc60)} / {formatPct(momentum.latest.roc1y)}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant='caption' color='text.secondary'>
                          Stochastic %K / %D
                        </Typography>
                        <Typography variant='h6'>
                          {momentum.latest.stochK === null ? '-' : momentum.latest.stochK.toFixed(2)} /{' '}
                          {momentum.latest.stochD === null ? '-' : momentum.latest.stochD.toFixed(2)}
                        </Typography>
                      </Grid>
                    </Grid>

                    <Divider sx={{ my: 2 }} />

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6} md={4}>
                        <Typography variant='caption' color='text.secondary'>
                          Latest Close
                        </Typography>
                        <Typography variant='h6'>{momentum.latest.close.toFixed(2)}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                        <Typography variant='caption' color='text.secondary'>
                          Latest Candle Date
                        </Typography>
                        <Typography variant='h6'>{new Date(momentum.latest.ts).toISOString().slice(0, 10)}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                        <Typography variant='caption' color='text.secondary'>
                          Window Coverage
                        </Typography>
                        <Typography variant='h6'>
                          {candles.length
                            ? `${candles[0]?.trade_date?.slice(0, 10)} -> ${candles[candles.length - 1]?.trade_date?.slice(0, 10)}`
                            : '-'}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                </Stack>
              )}
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ display: viewMode === 'deepDive' && activeTab === 'volume' ? 'block' : 'none' }}>
          <Card>
            <CardHeader
              title='Volume Summary'
              subheader={
                volume.latest
                  ? `${loadedSymbol || 'Stock'} ${loadedExchange ? `(${loadedExchange})` : ''} | Latest candle: ${new Date(
                      volume.latest.ts
                    ).toISOString().slice(0, 10)}`
                  : 'Load a stock to see the volume summary.'
              }
            />
            <CardContent>
              {!volume.latest ? (
                <Typography variant='body2' color='text.secondary'>
                  Need at least 2 candles to compute volume relationships.
                </Typography>
              ) : (
                <Stack spacing={3}>

                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: 'background.paper'
                    }}
                  >
                    <Stack direction='row' spacing={1.25} alignItems='center' flexWrap='wrap'>
                      <Chip label={`Spike: ${volume.latest.volumeSignal}`} color={getVolumeSpikeColor(volume.latest.volumeSignal)} />
                      <Chip
                        label={`Flow: ${volume.latest.flowConsensus}`}
                        color={getFlowConsensusColor(volume.latest.flowConsensus)}
                        variant='outlined'
                      />
                      <Chip
                        label={`Price + Volume: ${volume.latest.priceVolumeSignal}`}
                        color={getPriceVolumeColor(volume.latest.priceVolumeSignal)}
                        variant='outlined'
                      />
                    </Stack>

                    <Typography variant='body2' color='text.secondary' sx={{ mt: 1.25 }}>
                      The top chips summarize the latest session: spike = participation, flow = whether volume pressure is leaning
                      toward accumulation or distribution, and price + volume = whether price and participation are pointing in the
                      same direction.
                    </Typography>

                    <Typography variant='body2' color='text.secondary' sx={{ mt: 0.75 }}>
                      OBV and A/D are still shown below for detail. If they disagree, the Flow chip can show Mixed — that is normal
                      because they measure volume pressure in different ways.
                    </Typography>

                    <Divider sx={{ my: 2 }} />

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6} md={2}>
                        <Typography variant='caption' color='text.secondary'>
                          Avg Vol 10D
                        </Typography>
                        <Typography variant='h6'>{volume.latest.avgVol10d === null ? '-' : volume.latest.avgVol10d.toFixed(0)}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={2}>
                        <Typography variant='caption' color='text.secondary'>
                          Avg Vol 20D
                        </Typography>
                        <Typography variant='h6'>{volume.latest.avgVol20d === null ? '-' : volume.latest.avgVol20d.toFixed(0)}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={2}>
                        <Typography variant='caption' color='text.secondary'>
                          Avg Vol 50D
                        </Typography>
                        <Typography variant='h6'>{volume.latest.avgVol50d === null ? '-' : volume.latest.avgVol50d.toFixed(0)}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={2}>
                        <Typography variant='caption' color='text.secondary'>
                          Volume
                        </Typography>
                        <Typography variant='h6'>{volume.latest.volume.toFixed(0)}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={2}>
                        <Typography variant='caption' color='text.secondary'>
                          Volume Ratio
                        </Typography>
                        <Typography variant='h6'>{volume.latest.volumeRatio === null ? '-' : `${volume.latest.volumeRatio.toFixed(2)}x`}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={2}>
                        <Typography variant='caption' color='text.secondary'>
                          Price Change %
                        </Typography>
                        <Typography variant='h6'>{formatPct(volume.latest.priceChangePct)}</Typography>
                      </Grid>
                    </Grid>

                    <Divider sx={{ my: 2 }} />

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant='caption' color='text.secondary'>
                          OBV
                        </Typography>
                        <Typography variant='h6'>{volume.latest.obv.toFixed(0)}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant='caption' color='text.secondary'>
                          OBV Change
                        </Typography>
                        <Typography variant='h6'>{volume.latest.obvChange.toFixed(0)}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant='caption' color='text.secondary'>
                          VPT
                        </Typography>
                        <Typography variant='h6'>{volume.latest.vpt === null ? '-' : volume.latest.vpt.toFixed(2)}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant='caption' color='text.secondary'>
                          VPT Change
                        </Typography>
                        <Typography variant='h6'>{volume.latest.vptChange === null ? '-' : volume.latest.vptChange.toFixed(2)}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant='caption' color='text.secondary'>
                          MFM
                        </Typography>
                        <Typography variant='h6'>
                          {volume.latest.moneyFlowMultiplier === null ? '-' : volume.latest.moneyFlowMultiplier.toFixed(4)}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant='caption' color='text.secondary'>
                          Money Flow Vol
                        </Typography>
                        <Typography variant='h6'>
                          {volume.latest.moneyFlowVolume === null ? '-' : volume.latest.moneyFlowVolume.toFixed(2)}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant='caption' color='text.secondary'>
                          A/D Line
                        </Typography>
                        <Typography variant='h6'>{volume.latest.adLine === null ? '-' : volume.latest.adLine.toFixed(2)}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant='caption' color='text.secondary'>
                          Latest Candle Date
                        </Typography>
                        <Typography variant='h6'>{new Date(volume.latest.ts).toISOString().slice(0, 10)}</Typography>
                      </Grid>
                    </Grid>

                    <Divider sx={{ my: 2 }} />

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6} md={4}>
                        <Typography variant='caption' color='text.secondary'>
                          Latest Close
                        </Typography>
                        <Typography variant='h6'>{volume.latest.close.toFixed(2)}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                        <Typography variant='caption' color='text.secondary'>
                          Window Coverage
                        </Typography>
                        <Typography variant='h6'>
                          {candles.length
                            ? `${candles[0]?.trade_date?.slice(0, 10)} -> ${candles[candles.length - 1]?.trade_date?.slice(0, 10)}`
                            : '-'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                        <Typography variant='caption' color='text.secondary'>
                          Latest Signal
                        </Typography>
                        <Typography variant='h6'>{volume.latest.priceVolumeSignal}</Typography>
                      </Grid>
                    </Grid>
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <Card variant='outlined'>
                        <CardContent>
                          <Typography variant='caption' color='text.secondary'>
                            Total candles loaded
                          </Typography>
                          <Typography variant='h5'>{candles.length}</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Card variant='outlined'>
                        <CardContent>
                          <Typography variant='caption' color='text.secondary'>
                            Latest volume date
                          </Typography>
                          <Typography variant='h5'>{new Date(volume.latest.ts).toISOString().slice(0, 10)}</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Card variant='outlined'>
                        <CardContent>
                          <Typography variant='caption' color='text.secondary'>
                            Signal changes
                          </Typography>
                          <Typography variant='h5'>{volume.transitions.length}</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>

                  <Box>
                    <Typography variant='subtitle2' sx={{ mb: 1 }}>
                      Volume Signal Changes
                    </Typography>
                    {volume.transitions.length ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {volume.transitions
                          .slice()
                          .reverse()
                          .map(row => (
                            <Card key={`${row.ts}-${row.volumeSignal}-${row.priceVolumeSignal}`} variant='outlined'>
                              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
                                  <Chip size='small' label={row.volumeSignal} color={getVolumeSpikeColor(row.volumeSignal)} />
                                  <Chip size='small' label={row.obvSignal} color={getFlowColor(row.obvSignal)} variant='outlined' />
                                  <Chip
                                    size='small'
                                    label={row.priceVolumeSignal}
                                    color={getPriceVolumeColor(row.priceVolumeSignal)}
                                    variant='outlined'
                                  />
                                  <Typography variant='body2'>{new Date(row.ts).toISOString().slice(0, 10)}</Typography>
                                  <Typography variant='body2' color='text.secondary'>
                                    Vol: {row.volume.toFixed(0)}
                                  </Typography>
                                  <Typography variant='body2' color='text.secondary'>
                                    Ratio: {row.volumeRatio === null ? '-' : row.volumeRatio.toFixed(2)}x
                                  </Typography>
                                  <Typography variant='body2' color='text.secondary'>
                                    OBV: {row.obv.toFixed(0)}
                                  </Typography>
                                </Stack>
                              </CardContent>
                            </Card>
                          ))}
                      </Box>
                    ) : (
                      <Typography variant='body2' color='text.secondary'>
                        No volume signal changes yet for the loaded history window.
                      </Typography>
                    )}
                  </Box>
                </Stack>
              )}
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ display: viewMode === 'deepDive' && activeTab === 'breakout' ? 'block' : 'none' }}>
          <Card>
            <CardHeader
              title='Breakout Summary'
              subheader={
                breakout.latest
                  ? `${loadedSymbol || 'Stock'} ${loadedExchange ? `(${loadedExchange})` : ''} | Latest candle: ${new Date(
                      breakout.latest.ts
                    ).toISOString().slice(0, 10)}`
                  : 'Load a stock to see breakout behavior.'
              }
            />
            <CardContent>
              {!breakout.latest ? (
                <Typography variant='body2' color='text.secondary'>
                  Need enough history to calculate support, resistance, consolidation, and breakout conditions.
                </Typography>
              ) : (
                <Stack spacing={3}>

                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: 'background.paper'
                    }}
                  >
                    <Stack direction='row' spacing={1.25} alignItems='center' flexWrap='wrap'>
                      <Chip label={breakout.latest.breakoutType} color={getBreakoutTypeColor(breakout.latest.breakoutType)} />
                      <Chip
                        label={breakout.latest.breakoutReadiness}
                        color={getBreakoutReadinessColor(breakout.latest.breakoutReadiness)}
                        variant='outlined'
                      />
                      <Chip
                        label={breakout.latest.consolidationSignal}
                        color={getConsolidationColor(breakout.latest.consolidationSignal)}
                        variant='outlined'
                      />
                      <Chip
                        label={breakout.latest.breakoutStatus}
                        color={getBreakoutStatusColor(breakout.latest.breakoutStatus)}
                        variant='outlined'
                      />
                    </Stack>

                    <Typography variant='body2' color='text.secondary' sx={{ mt: 1.25 }}>
                      Breakout analysis is about range escape. When price moves above resistance with enough volume, it can trigger a
                      larger upward move. When it falls below support, it can signal a weaker structure or a downside breakdown.
                    </Typography>

                      <ApexChartWrapper>
                        <Card variant='outlined' sx={{ mt: 2 }}>
                          <CardHeader
                            title='Breakout Candles'
                            subheader='Candlestick view with the same support / resistance zones and breakout marker.'
                          />
                          <CardContent sx={{ pt: 0 }}>
                            <Box sx={{ height: 360 }}>
                              <ReactApexcharts
                                type='candlestick'
                                height='100%'
                                options={breakoutCandlestickOptions}
                                series={breakoutCandlestickSeries}
                              />
                            </Box>
                          </CardContent>
                        </Card>
                      </ApexChartWrapper>

                    <Divider sx={{ my: 2 }} />

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6} md={2}>
                        <Stack spacing={0.75}>
                          <Chip label='Resistance 20D' color='warning' size='small' sx={{ alignSelf: 'flex-start' }} />
                          <Typography variant='h6'>
                            {breakout.latest.resistance20d === null ? '-' : breakout.latest.resistance20d.toFixed(2)}
                          </Typography>
                        </Stack>
                      </Grid>
                      <Grid item xs={12} sm={6} md={2}>
                        <Stack spacing={0.75}>
                          <Chip label='Resistance 50D' color='warning' variant='outlined' size='small' sx={{ alignSelf: 'flex-start' }} />
                          <Typography variant='h6'>
                            {breakout.latest.resistance50d === null ? '-' : breakout.latest.resistance50d.toFixed(2)}
                          </Typography>
                        </Stack>
                      </Grid>
                      <Grid item xs={12} sm={6} md={2}>
                        <Stack spacing={0.75}>
                          <Chip label='Resistance 52W' color='error' size='small' sx={{ alignSelf: 'flex-start' }} />
                          <Typography variant='h6'>
                            {breakout.latest.resistance52w === null ? '-' : breakout.latest.resistance52w.toFixed(2)}
                          </Typography>
                        </Stack>
                      </Grid>
                      <Grid item xs={12} sm={6} md={2}>
                        <Stack spacing={0.75}>
                          <Chip label='Support 20D' color='info' size='small' sx={{ alignSelf: 'flex-start' }} />
                          <Typography variant='h6'>
                            {breakout.latest.support20d === null ? '-' : breakout.latest.support20d.toFixed(2)}
                          </Typography>
                        </Stack>
                      </Grid>
                      <Grid item xs={12} sm={6} md={2}>
                        <Stack spacing={0.75}>
                          <Chip label='Support 50D' color='info' variant='outlined' size='small' sx={{ alignSelf: 'flex-start' }} />
                          <Typography variant='h6'>
                            {breakout.latest.support50d === null ? '-' : breakout.latest.support50d.toFixed(2)}
                          </Typography>
                        </Stack>
                      </Grid>
                      <Grid item xs={12} sm={6} md={2}>
                        <Stack spacing={0.75}>
                          <Chip label='Support 52W' color='success' size='small' sx={{ alignSelf: 'flex-start' }} />
                          <Typography variant='h6'>
                            {breakout.latest.support52w === null ? '-' : breakout.latest.support52w.toFixed(2)}
                          </Typography>
                        </Stack>
                      </Grid>
                    </Grid>

                    <Divider sx={{ my: 2 }} />

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant='caption' color='text.secondary'>
                          Pct to Resistance 52W
                        </Typography>
                        <Typography variant='h6'>{breakout.latest.pctFromResistance52w === null ? '-' : `${breakout.latest.pctFromResistance52w.toFixed(2)}%`}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant='caption' color='text.secondary'>
                          Pct from Support 52W
                        </Typography>
                        <Typography variant='h6'>{breakout.latest.pctFromSupport52w === null ? '-' : `${breakout.latest.pctFromSupport52w.toFixed(2)}%`}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant='caption' color='text.secondary'>
                          Avg Vol 20D
                        </Typography>
                        <Typography variant='h6'>{breakout.latest.avgVol20d === null ? '-' : breakout.latest.avgVol20d.toFixed(0)}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant='caption' color='text.secondary'>
                          Volume Ratio
                        </Typography>
                        <Typography variant='h6'>{breakout.latest.volumeRatio === null ? '-' : `${breakout.latest.volumeRatio.toFixed(2)}x`}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant='caption' color='text.secondary'>
                          Latest Close
                        </Typography>
                        <Typography variant='h6'>{breakout.latest.close.toFixed(2)}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant='caption' color='text.secondary'>
                          Current Breakout Age
                        </Typography>
                        <Typography variant='h6'>
                          {breakout.currentBreakoutDuration
                            ? `${breakout.currentBreakoutDuration.sessions} bars`
                            : 'No active breakout'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant='caption' color='text.secondary'>
                          Latest Candle Date
                        </Typography>
                        <Typography variant='h6'>{new Date(breakout.latest.ts).toISOString().slice(0, 10)}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant='caption' color='text.secondary'>
                          False Breakouts
                        </Typography>
                        <Typography variant='h6'>{breakout.rows.filter(row => row.falseBreakout).length}</Typography>
                      </Grid>
                    </Grid>
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <Card variant='outlined'>
                        <CardContent>
                          <Typography variant='caption' color='text.secondary'>
                            Total candles loaded
                          </Typography>
                          <Typography variant='h5'>{candles.length}</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Card variant='outlined'>
                        <CardContent>
                          <Typography variant='caption' color='text.secondary'>
                            Breakout changes
                          </Typography>
                          <Typography variant='h5'>{breakout.transitions.length}</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Card variant='outlined'>
                        <CardContent>
                          <Typography variant='caption' color='text.secondary'>
                            Setup state
                          </Typography>
                          <Typography variant='h5'>{breakout.latest.consolidationSignal}</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>

                  <Box>
                    <Typography variant='subtitle2' sx={{ mb: 1 }}>
                      Breakout Signal Changes
                    </Typography>
                    {breakout.transitions.length ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {breakout.transitions
                          .slice()
                          .reverse()
                          .map(row => (
                            <Card key={`${row.ts}-${row.breakoutType}-${row.breakoutReadiness}-${row.breakoutStatus}`} variant='outlined'>
                              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
                                  <Chip size='small' label={row.breakoutType} color={getBreakoutTypeColor(row.breakoutType)} />
                                  <Chip
                                    size='small'
                                    label={row.breakoutReadiness}
                                    color={getBreakoutReadinessColor(row.breakoutReadiness)}
                                    variant='outlined'
                                  />
                                  <Chip
                                    size='small'
                                    label={row.consolidationSignal}
                                    color={getConsolidationColor(row.consolidationSignal)}
                                    variant='outlined'
                                  />
                                  <Typography variant='body2'>{new Date(row.ts).toISOString().slice(0, 10)}</Typography>
                                  <Typography variant='body2' color='text.secondary'>
                                    Close: {row.close.toFixed(2)}
                                  </Typography>
                                  <Typography variant='body2' color='text.secondary'>
                                    Vol Ratio: {row.volumeRatio === null ? '-' : `${row.volumeRatio.toFixed(2)}x`}
                                  </Typography>
                                  <Typography variant='body2' color='text.secondary'>
                                    Status: {row.breakoutStatus}
                                  </Typography>
                                </Stack>
                              </CardContent>
                            </Card>
                          ))}
                      </Box>
                    ) : (
                      <Typography variant='body2' color='text.secondary'>
                        No breakout regime changes yet for the loaded history window.
                      </Typography>
                    )}
                  </Box>
                </Stack>
              )}
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ display: viewMode === 'deepDive' && activeTab === 'seasonality' ? 'block' : 'none' }}>
          <Card>
            <CardHeader
              title='Seasonality Summary'
              subheader={
                seasonality.yearlyRows.length
                  ? `${loadedSymbol || 'Stock'} ${loadedExchange ? `(${loadedExchange})` : ''} | Based on ${seasonality.yearlyRows.length} yearly samples`
                  : 'Load a stock to see seasonality behavior.'
              }
            />
            <CardContent>
              {!seasonality.yearlyRows.length ? (
                <Typography variant='body2' color='text.secondary'>
                  Need enough history to calculate monthly, quarterly, day-of-week, and yearly seasonality.
                </Typography>
              ) : (
                <Stack spacing={3}>

                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: 'background.paper'
                    }}
                  >
                    <Stack direction='row' spacing={1.25} alignItems='center' flexWrap='wrap'>
                      <Chip
                        label={
                          seasonality.bestMonth
                            ? `Best Month: ${seasonality.bestMonth.monthName} ${formatPct(seasonality.bestMonth.avgReturnPct)}`
                            : 'Best Month -'
                        }
                        color='success'
                      />
                      <Chip
                        label={
                          seasonality.worstMonth
                            ? `Worst Month: ${seasonality.worstMonth.monthName} ${formatPct(seasonality.worstMonth.avgReturnPct)}`
                            : 'Worst Month -'
                        }
                        color='error'
                      />
                      <Chip
                        label={
                          seasonality.bestQuarter
                            ? `Best Quarter: ${seasonality.bestQuarter.quarterLabel} ${formatPct(seasonality.bestQuarter.avgReturnPct)}`
                            : 'Best Quarter -'
                        }
                        color='success'
                        variant='outlined'
                      />
                      <Chip
                        label={
                          seasonality.worstQuarter
                            ? `Worst Quarter: ${seasonality.worstQuarter.quarterLabel} ${formatPct(seasonality.worstQuarter.avgReturnPct)}`
                            : 'Worst Quarter -'
                        }
                        color='error'
                        variant='outlined'
                      />
                    </Stack>

                    <Typography variant='body2' color='text.secondary' sx={{ mt: 1.25 }}>
                      Positive average return means that month or quarter has usually finished higher than it opened. Negative
                      average return means it has usually been weaker.
                    </Typography>

                    <Divider sx={{ my: 2 }} />

                    <Typography variant='subtitle2' sx={{ mb: 1 }}>
                      Monthly Heatmap
                    </Typography>
                    <Grid container spacing={1.5}>
                      {seasonality.monthlyRows.map(row => (
                        <Grid item xs={6} sm={4} md={2} key={row.month}>
                          <Card variant='outlined' sx={{ bgcolor: 'background.paper', borderColor: 'divider' }}>
                            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                              <Stack spacing={0.75}>
                                <Typography variant='subtitle2'>{row.monthName}</Typography>
                                <Chip
                                  label={row.avgReturnPct === null ? '-' : formatPct(row.avgReturnPct)}
                                  color={getSeasonalityColor(row.avgReturnPct)}
                                  size='small'
                                />
                                <Typography variant='caption' color='text.secondary'>
                                  Win rate: {row.winRatePct === null ? '-' : `${row.winRatePct}%`}
                                </Typography>
                                <Typography variant='caption' color='text.secondary'>
                                  Best / Worst: {row.bestReturnPct === null ? '-' : formatPct(row.bestReturnPct)} /{' '}
                                  {row.worstReturnPct === null ? '-' : formatPct(row.worstReturnPct)}
                                </Typography>
                              </Stack>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Card variant='outlined'>
                        <CardContent>
                          <Typography variant='subtitle2' sx={{ mb: 1 }}>
                            Quarterly Seasonality
                          </Typography>
                          <Stack spacing={1}>
                            {seasonality.quarterlyRows.map(row => (
                              <Stack key={row.quarter} direction='row' spacing={1.5} alignItems='center' flexWrap='wrap'>
                                <Chip label={row.quarterLabel} color={getSeasonalityColor(row.avgReturnPct)} size='small' />
                                <Typography variant='body2'>{formatPct(row.avgReturnPct)}</Typography>
                                <Typography variant='body2' color='text.secondary'>
                                  Win rate: {row.winRatePct === null ? '-' : `${row.winRatePct}%`}
                                </Typography>
                                <Typography variant='body2' color='text.secondary'>
                                  Best / Worst: {row.bestReturnPct === null ? '-' : formatPct(row.bestReturnPct)} /{' '}
                                  {row.worstReturnPct === null ? '-' : formatPct(row.worstReturnPct)}
                                </Typography>
                              </Stack>
                            ))}
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Card variant='outlined'>
                        <CardContent>
                          <Typography variant='subtitle2' sx={{ mb: 1 }}>
                            Day of Week
                          </Typography>
                          <Stack spacing={1}>
                            {seasonality.dayRows.map(row => (
                              <Stack key={row.dayNum} direction='row' spacing={1.5} alignItems='center' flexWrap='wrap'>
                                <Chip label={row.dayName} color={getSeasonalityColor(row.avgReturnPct)} size='small' />
                                <Typography variant='body2'>{formatPct(row.avgReturnPct)}</Typography>
                                <Typography variant='body2' color='text.secondary'>
                                  Win rate: {row.winRatePct === null ? '-' : `${row.winRatePct}%`}
                                </Typography>
                                <Typography variant='body2' color='text.secondary'>
                                  Volatility: {row.volatility === null ? '-' : `${row.volatility.toFixed(2)}%`}
                                </Typography>
                              </Stack>
                            ))}
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>

                  <Card variant='outlined'>
                    <CardContent>
                      <Typography variant='subtitle2' sx={{ mb: 1 }}>
                        Yearly Performance
                      </Typography>
                      <Grid container spacing={1.5}>
                        {seasonality.yearlyRows.slice(0, 10).map(row => (
                          <Grid item xs={12} sm={6} md={4} key={row.year}>
                            <Box
                              sx={{
                                p: 1.5,
                                borderRadius: 1,
                                border: '1px solid',
                                borderColor: 'divider',
                                bgcolor: 'background.paper'
                              }}
                            >
                              <Stack spacing={0.75}>
                                <Typography variant='subtitle2'>{row.year}</Typography>
                                <Chip label={row.yearResult} color={getSeasonalityColor(row.yearlyReturnPct)} size='small' />
                                <Typography variant='body2' color='text.secondary'>
                                  Return: {formatPct(row.yearlyReturnPct)}
                                </Typography>
                                <Typography variant='body2' color='text.secondary'>
                                  Open / Close: {row.yearOpen === null ? '-' : row.yearOpen.toFixed(2)} /{' '}
                                  {row.yearClose === null ? '-' : row.yearClose.toFixed(2)}
                                </Typography>
                                <Typography variant='body2' color='text.secondary'>
                                  High / Low: {row.yearHigh === null ? '-' : row.yearHigh.toFixed(2)} /{' '}
                                  {row.yearLow === null ? '-' : row.yearLow.toFixed(2)}
                                </Typography>
                              </Stack>
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    </CardContent>
                  </Card>
                </Stack>
              )}
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ display: viewMode === 'deepDive' && activeTab === 'risk' ? 'block' : 'none' }}>
          <Card>
            <CardHeader
              title='Volatility Summary'
              subheader={
                volatility.latest
                  ? `${loadedSymbol || 'Stock'} ${loadedExchange ? `(${loadedExchange})` : ''} | Latest candle: ${new Date(
                      volatility.latest.ts
                    ).toISOString().slice(0, 10)}`
                  : 'Load a stock to see the current volatility summary.'
              }
            />
            <CardContent>
              {!volatility.latest ? (
                <Typography variant='body2' color='text.secondary'>
                  Need at least 14 candles to calculate ATR14 and daily volatility.
                </Typography>
            ) : (
              <Stack spacing={3}>

                <Box
                  sx={{
                    p: 2,
                    borderRadius: 1,
                    border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: 'background.paper'
                    }}
                  >
                    <Stack direction='row' spacing={1.25} alignItems='center' flexWrap='wrap'>
                      <Chip label={volatility.latest.volatilityState} color={getVolatilityColor(volatility.latest.volatilityState)} />
                      <Chip
                        label={`ATR Score ${volatility.latest.volatilityScore}/100`}
                        color={
                          volatility.latest.volatilityScore >= 70
                            ? 'error'
                            : volatility.latest.volatilityScore >= 45
                              ? 'warning'
                              : 'success'
                        }
                        variant='outlined'
                      />
                      <Chip
                        label={
                          volatility.currentVolatilityDuration
                            ? `Volatility Age ${volatility.currentVolatilityDuration.sessions} sessions / ${volatility.currentVolatilityDuration.calendarDays} days`
                            : 'Volatility Age -'
                        }
                        variant='outlined'
                        color='primary'
                      />
                    </Stack>

                    <Typography variant='body2' color='text.secondary' sx={{ mt: 1.25 }}>
                      ATR14 measures the average true daily movement. ATR% normalizes that movement against price so we can compare
                      stocks of different price levels.
                    </Typography>

                    <Divider sx={{ my: 2 }} />

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6} md={2}>
                        <Typography variant='caption' color='text.secondary'>
                          True Range
                        </Typography>
                        <Typography variant='h6'>{volatility.latest.trueRange.toFixed(2)}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={2}>
                        <Typography variant='caption' color='text.secondary'>
                          ATR 14
                        </Typography>
                        <Typography variant='h6'>{volatility.latest.atr14?.toFixed(2)}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={2}>
                        <Typography variant='caption' color='text.secondary'>
                          ATR %
                        </Typography>
                        <Typography variant='h6'>{formatPosPct(volatility.latest.atrPct)}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={2}>
                        <Typography variant='caption' color='text.secondary'>
                          Daily Range %
                        </Typography>
                        <Typography variant='h6'>{formatPosPct(volatility.latest.dailyRangePct)}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={2}>
                        <Typography variant='caption' color='text.secondary'>
                          ATR Slope
                        </Typography>
                        <Typography variant='h6' sx={{ color: (volatility.latest.atrSlopePct || 0) >= 0 ? 'error.main' : 'success.main' }}>
                          {formatPct(volatility.latest.atrSlopePct)}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={2}>
                        <Typography variant='caption' color='text.secondary'>
                          Volatility Age
                        </Typography>
                        <Typography variant='h6'>
                          {volatility.currentVolatilityDuration ? `${volatility.currentVolatilityDuration.sessions} bars` : '-'}
                        </Typography>
                      </Grid>
                    </Grid>

                    <Divider sx={{ my: 2 }} />

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant='caption' color='text.secondary'>
                          Latest Close
                        </Typography>
                        <Typography variant='h6'>{volatility.latest.close.toFixed(2)}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant='caption' color='text.secondary'>
                          Current Regime Start
                        </Typography>
                        <Typography variant='h6'>
                          {volatility.currentVolatilityDuration
                            ? new Date(volatility.currentVolatilityDuration.startTs).toISOString().slice(0, 10)
                            : '-'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant='caption' color='text.secondary'>
                          Regime Range
                        </Typography>
                        <Typography variant='h6'>
                          {volatility.latest.atrPct === null ? '-' : `${formatPct(volatility.latest.atrPct)}`}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant='caption' color='text.secondary'>
                          Latest Candle Date
                        </Typography>
                        <Typography variant='h6'>{new Date(volatility.latest.ts).toISOString().slice(0, 10)}</Typography>
                      </Grid>
                    </Grid>
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <Card variant='outlined'>
                        <CardContent>
                          <Typography variant='caption' color='text.secondary'>
                            Total candles loaded
                          </Typography>
                          <Typography variant='h5'>{candles.length}</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Card variant='outlined'>
                        <CardContent>
                          <Typography variant='caption' color='text.secondary'>
                            Latest volatility date
                          </Typography>
                          <Typography variant='h5'>{new Date(volatility.latest.ts).toISOString().slice(0, 10)}</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Card variant='outlined'>
                        <CardContent>
                          <Typography variant='caption' color='text.secondary'>
                            Volatility coverage
                          </Typography>
                          <Typography variant='h5'>
                            {candles.length
                              ? `${candles[0]?.trade_date?.slice(0, 10)} -> ${candles[candles.length - 1]?.trade_date?.slice(0, 10)}`
                              : '-'}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>

                  <Box>
                    <Typography variant='subtitle2' sx={{ mb: 1 }}>
                      Volatility Regime Changes
                    </Typography>
                    {volatility.transitions.length ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {volatility.transitions
                          .slice()
                          .reverse()
                          .map(row => (
                            <Card key={`${row.ts}-${row.volatilityState}`} variant='outlined'>
                              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
                                  <Chip size='small' label={row.volatilityState} color={getVolatilityColor(row.volatilityState)} />
                                  <Typography variant='body2'>{new Date(row.ts).toISOString().slice(0, 10)}</Typography>
                                  <Typography variant='body2' color='text.secondary'>
                                    ATR: {row.atr14?.toFixed(2)}
                                  </Typography>
                                  <Typography variant='body2' color='text.secondary'>
                                    ATR %: {formatPosPct(row.atrPct)}
                                  </Typography>
                                  <Typography variant='body2' color='text.secondary'>
                                    Score: {row.volatilityScore}/100
                                  </Typography>
                                </Stack>
                              </CardContent>
                            </Card>
                          ))}
                      </Box>
                    ) : (
                      <Typography variant='body2' color='text.secondary'>
                        No volatility transitions yet for the loaded history window.
                      </Typography>
                    )}
                  </Box>
                </Stack>
              )}
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ display: viewMode === 'deepDive' && activeTab === 'risk' ? 'block' : 'none' }}>
          <Card>
            <CardHeader
              title='Bollinger Bands'
              subheader={
                bollinger.latest
                  ? `${loadedSymbol || 'Stock'} ${loadedExchange ? `(${loadedExchange})` : ''} | Latest candle: ${new Date(
                      bollinger.latest.ts
                    ).toISOString().slice(0, 10)}`
                  : 'Load a stock to see the Bollinger Bands summary.'
              }
            />
            <CardContent>
              {!bollinger.latest ? (
                <Typography variant='body2' color='text.secondary'>
                  Need at least 20 candles to calculate Bollinger Bands.
                </Typography>
            ) : (
              <Stack spacing={3}>

                <Box
                  sx={{
                    p: 2,
                    borderRadius: 1,
                    border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: 'background.paper'
                    }}
                  >
                    <Stack direction='row' spacing={1.25} alignItems='center' flexWrap='wrap'>
                      <Chip label={bollinger.latest.bbSignal} color={getBollingerColor(bollinger.latest.bbSignal)} />
                      <Chip
                        label={`BB Score ${bollinger.latest.bbScore}/100`}
                        color={
                          bollinger.latest.bbScore >= 75
                            ? bollinger.latest.bbSignal === 'Oversold'
                              ? 'success'
                              : 'warning'
                            : bollinger.latest.bbScore >= 45
                              ? 'warning'
                              : 'default'
                        }
                        variant='outlined'
                      />
                      <Chip
                        label={
                          bollinger.currentBollingerDuration
                            ? `Band Regime ${bollinger.currentBollingerDuration.sessions} sessions / ${bollinger.currentBollingerDuration.calendarDays} days`
                            : 'Band Regime -'
                        }
                        variant='outlined'
                        color='primary'
                      />
                    </Stack>

                    <Typography variant='body2' color='text.secondary' sx={{ mt: 1.25 }}>
                      Bollinger Bands use a 20-day middle band with 2 standard deviations above and below it. Tight bands suggest a
                      squeeze; price at the upper or lower band suggests extension.
                    </Typography>

                    <Divider sx={{ my: 2 }} />

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6} md={2}>
                        <Typography variant='caption' color='text.secondary'>
                          BB Mid
                        </Typography>
                        <Typography variant='h6'>{bollinger.latest.bbMid?.toFixed(2)}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={2}>
                        <Typography variant='caption' color='text.secondary'>
                          BB Upper
                        </Typography>
                        <Typography variant='h6'>{bollinger.latest.bbUpper?.toFixed(2)}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={2}>
                        <Typography variant='caption' color='text.secondary'>
                          BB Lower
                        </Typography>
                        <Typography variant='h6'>{bollinger.latest.bbLower?.toFixed(2)}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={2}>
                        <Typography variant='caption' color='text.secondary'>
                          Bandwidth
                        </Typography>
                        <Typography variant='h6'>{formatPosPct(bollinger.latest.bbBandwidth)}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={2}>
                        <Typography variant='caption' color='text.secondary'>
                          Position
                        </Typography>
                        <Typography variant='h6'>{formatBandPosPct(bollinger.latest.bbPosition)}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={2}>
                        <Typography variant='caption' color='text.secondary'>
                          Regime Age
                        </Typography>
                        <Typography variant='h6'>
                          {bollinger.currentBollingerDuration ? `${bollinger.currentBollingerDuration.sessions} bars` : '-'}
                        </Typography>
                      </Grid>
                    </Grid>

                    <Divider sx={{ my: 2 }} />

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant='caption' color='text.secondary'>
                          Latest Close
                        </Typography>
                        <Typography variant='h6'>{bollinger.latest.close.toFixed(2)}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant='caption' color='text.secondary'>
                          Current Regime Start
                        </Typography>
                        <Typography variant='h6'>
                          {bollinger.currentBollingerDuration
                            ? new Date(bollinger.currentBollingerDuration.startTs).toISOString().slice(0, 10)
                            : '-'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant='caption' color='text.secondary'>
                          Latest Candle Date
                        </Typography>
                        <Typography variant='h6'>{new Date(bollinger.latest.ts).toISOString().slice(0, 10)}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant='caption' color='text.secondary'>
                          20D Std Dev
                        </Typography>
                        <Typography variant='h6'>{bollinger.latest.bbStd?.toFixed(2)}</Typography>
                      </Grid>
                    </Grid>
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <Card variant='outlined'>
                        <CardContent>
                          <Typography variant='caption' color='text.secondary'>
                            Total candles loaded
                          </Typography>
                          <Typography variant='h5'>{candles.length}</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Card variant='outlined'>
                        <CardContent>
                          <Typography variant='caption' color='text.secondary'>
                            Latest band date
                          </Typography>
                          <Typography variant='h5'>{new Date(bollinger.latest.ts).toISOString().slice(0, 10)}</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Card variant='outlined'>
                        <CardContent>
                          <Typography variant='caption' color='text.secondary'>
                            Band coverage
                          </Typography>
                          <Typography variant='h5'>
                            {candles.length
                              ? `${candles[0]?.trade_date?.slice(0, 10)} -> ${candles[candles.length - 1]?.trade_date?.slice(0, 10)}`
                              : '-'}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>

                  <Box>
                    <Typography variant='subtitle2' sx={{ mb: 1 }}>
                      Bollinger Regime Changes
                    </Typography>
                    {bollinger.transitions.length ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {bollinger.transitions
                          .slice()
                          .reverse()
                          .map(row => (
                            <Card key={`${row.ts}-${row.bbSignal}`} variant='outlined'>
                              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
                                  <Chip size='small' label={row.bbSignal} color={getBollingerColor(row.bbSignal)} />
                                  <Typography variant='body2'>{new Date(row.ts).toISOString().slice(0, 10)}</Typography>
                                  <Typography variant='body2' color='text.secondary'>
                                    Close: {row.close.toFixed(2)}
                                  </Typography>
                                  <Typography variant='body2' color='text.secondary'>
                                    Bandwidth: {formatPosPct(row.bbBandwidth)}
                                  </Typography>
                                  <Typography variant='body2' color='text.secondary'>
                                    Position: {formatBandPosPct(row.bbPosition)}
                                  </Typography>
                                </Stack>
                              </CardContent>
                            </Card>
                          ))}
                      </Box>
                    ) : (
                      <Typography variant='body2' color='text.secondary'>
                        No Bollinger regime transitions yet for the loaded history window.
                      </Typography>
                    )}
                  </Box>
                </Stack>
              )}
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ display: viewMode === 'deepDive' && activeTab === 'risk' ? 'block' : 'none' }}>
          <Card>
            <CardHeader
              title='Return Volatility'
              subheader={
                returnVolatility.latest
                  ? `${loadedSymbol || 'Stock'} ${loadedExchange ? `(${loadedExchange})` : ''} | Latest candle: ${new Date(
                      returnVolatility.latest.ts
                    ).toISOString().slice(0, 10)}`
                  : 'Load a stock to see return-based volatility.'
              }
            />
            <CardContent>
              {!returnVolatility.latest ? (
                <Typography variant='body2' color='text.secondary'>
                  Need at least 2 candles to compute return volatility.
                </Typography>
            ) : (
              <Stack spacing={3}>

                <Box
                  sx={{
                    p: 2,
                    borderRadius: 1,
                    border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: 'background.paper'
                    }}
                  >
                    <Stack direction='row' spacing={1.25} alignItems='center' flexWrap='wrap'>
                      <Chip
                        label={`30D ${returnVolatility.latest.volatilityState30d}`}
                        color={getReturnVolatilityColor(returnVolatility.latest.volatilityState30d)}
                      />
                      <Chip
                        label={`90D ${returnVolatility.latest.volatilityState90d}`}
                        color={getReturnVolatilityColor(returnVolatility.latest.volatilityState90d)}
                      />
                      <Chip
                        label={`1Y ${returnVolatility.latest.volatilityState1yr}`}
                        color={getReturnVolatilityColor(returnVolatility.latest.volatilityState1yr)}
                      />
                    </Stack>

                    <Typography variant='body2' color='text.secondary' sx={{ mt: 1.25 }}>
                      This view calculates annualized volatility from daily log returns. Higher values mean the stock’s return history
                      has been swinging around more.
                    </Typography>

                    <Divider sx={{ my: 2 }} />

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant='caption' color='text.secondary'>
                          Log Return
                        </Typography>
                        <Typography variant='h6'>{formatPct(returnVolatility.latest.logReturn !== null ? returnVolatility.latest.logReturn * 100 : null)}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant='caption' color='text.secondary'>
                          Volatility 30D
                        </Typography>
                        <Typography variant='h6'>
                          {returnVolatility.latest.volatility30d === null ? '-' : `${returnVolatility.latest.volatility30d.toFixed(2)}%`}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant='caption' color='text.secondary'>
                          Volatility 90D
                        </Typography>
                        <Typography variant='h6'>
                          {returnVolatility.latest.volatility90d === null ? '-' : `${returnVolatility.latest.volatility90d.toFixed(2)}%`}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant='caption' color='text.secondary'>
                          Volatility 1Y
                        </Typography>
                        <Typography variant='h6'>
                          {returnVolatility.latest.volatility1yr === null ? '-' : `${returnVolatility.latest.volatility1yr.toFixed(2)}%`}
                        </Typography>
                      </Grid>
                    </Grid>

                    <Divider sx={{ my: 2 }} />

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6} md={4}>
                        <Typography variant='caption' color='text.secondary'>
                          Latest Close
                        </Typography>
                        <Typography variant='h6'>{returnVolatility.latest.close.toFixed(2)}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                        <Typography variant='caption' color='text.secondary'>
                          Latest Candle Date
                        </Typography>
                        <Typography variant='h6'>{new Date(returnVolatility.latest.ts).toISOString().slice(0, 10)}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                        <Typography variant='caption' color='text.secondary'>
                          Window Coverage
                        </Typography>
                        <Typography variant='h6'>
                          {candles.length
                            ? `${candles[0]?.trade_date?.slice(0, 10)} -> ${candles[candles.length - 1]?.trade_date?.slice(0, 10)}`
                            : '-'}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <Card variant='outlined'>
                        <CardContent>
                          <Typography variant='caption' color='text.secondary'>
                            Total candles loaded
                          </Typography>
                          <Typography variant='h5'>{candles.length}</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Card variant='outlined'>
                        <CardContent>
                          <Typography variant='caption' color='text.secondary'>
                            30D State
                          </Typography>
                          <Typography variant='h5'>{returnVolatility.latest.volatilityState30d}</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Card variant='outlined'>
                        <CardContent>
                          <Typography variant='caption' color='text.secondary'>
                            1Y State
                          </Typography>
                          <Typography variant='h5'>{returnVolatility.latest.volatilityState1yr}</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </Stack>
              )}
            </CardContent>
          </Card>
        </Box>

        {viewMode === 'deepDive' ? (
          <Card variant='outlined' sx={{ mt: 2 }}>
            <CardHeader title={activeTabGuide.title} subheader={activeTabGuide.subtitle} />
            <CardContent>
              <Stack spacing={2}>
                <Grid container spacing={1.5}>
                  {activeTabGuide.legendRows.map(row => (
                    <Grid item xs={12} md={6} key={row.label}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                          p: 1.25,
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 1,
                          bgcolor: 'background.paper'
                        }}
                      >
                        <Chip label={row.label} color={row.color} size='small' sx={{ minWidth: 120 }} />
                        <Typography variant='body2' color='text.secondary'>
                          {row.meaning}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
                <Grid container spacing={2}>
                  {activeTabGuide.examples.map(example => (
                    <Grid item xs={12} md={6} key={example}>
                      <Card variant='outlined' sx={{ height: '100%' }}>
                        <CardContent>
                          <Typography variant='body2' color='text.secondary'>
                            {example}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
                <Typography variant='body2' color='text.secondary'>
                  {activeTabGuide.note}
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        ) : null}
      </Stack>
    </Box>
  )
}

export default EodTrendPage

