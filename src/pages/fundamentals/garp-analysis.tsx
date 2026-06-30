import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import type { NextPage } from 'next'
import { useRouter } from 'next/router'
import axiosInstance from 'src/api/axios/axiosBaseQuery'
import { ENDURL } from 'src/utils/constants/endurl.utils'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import Collapse from '@mui/material/Collapse'
import Divider from '@mui/material/Divider'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import IconButton from '@mui/material/IconButton'
import Alert from '@mui/material/Alert'
import MenuItem from '@mui/material/MenuItem'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import RefreshIcon from '@mui/icons-material/Refresh'
import TuneIcon from '@mui/icons-material/Tune'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import InsightsIcon from '@mui/icons-material/Insights'
import ShowChartIcon from '@mui/icons-material/ShowChart'
import VerifiedIcon from '@mui/icons-material/Verified'
import BalanceIcon from '@mui/icons-material/Balance'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'

type GarpRow = {
  master_id?: string | number | null
  symbol?: string | null
  name?: string | null
  exchange?: string | null
  company_name?: string | null
  overview_last_updated_at?: string | null
  latest_profit_period?: string | null
  latest_cash_period?: string | null
  latest_balance_period?: string | null
  latest_sales?: number | null
  latest_net_profit?: number | null
  latest_eps?: number | null
  latest_borrowings?: number | null
  latest_reserves?: number | null
  latest_equity_capital?: number | null
  latest_total_liabilities?: number | null
  latest_promoters?: number | null
  latest_fiis?: number | null
  latest_diis?: number | null
  garp_metrics?: {
    revenue_cagr_3y?: number | null
    profit_cagr_3y?: number | null
    eps_cagr_3y?: number | null
    opm_percent?: number | null
    roe?: number | null
    roce?: number | null
    debt_to_equity?: number | null
    pe_ratio?: number | null
    price_to_book?: number | null
    peg_ratio?: number | null
    ev_ebitda?: number | null
    interest_coverage?: number | null
    promoters?: number | null
    fiis?: number | null
    diis?: number | null
  }
  analysis?: {
    score?: number
    grade?: string
    recommendation?: string
    reasons?: string[]
    metrics?: Record<string, number | null>
    flags?: Record<string, boolean>
    tier_scores?: Record<string, number>
  }
}

type GarpAnalysisResponse = {
  rows?: GarpRow[]
  total?: number
  buckets?: {
    tier1?: GarpRow[]
    tier2?: GarpRow[]
    tier3?: GarpRow[]
    tier4?: GarpRow[]
  }
  filters?: {
    limit?: number
    grade?: string
    minScore?: number | null
  }
}

const DEFAULT_LIMIT = 50

const getNumeric = (value: unknown) => {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  
return Number.isFinite(parsed) ? parsed : null
}

const formatNumber = (value: unknown, digits = 2) => {
  const numeric = getNumeric(value)
  if (numeric === null) return '?'
  
return numeric.toFixed(digits)
}

const formatPercent = (value: unknown) => {
  const numeric = getNumeric(value)
  if (numeric === null) return '?'
  
return `${numeric.toFixed(2)}%`
}

const formatRatio = (value: unknown) => {
  const numeric = getNumeric(value)
  if (numeric === null) return '?'
  
return numeric.toFixed(2)
}

const formatChange = (value: unknown) => {
  const numeric = getNumeric(value)
  if (numeric === null) return '?'
  const sign = numeric > 0 ? '+' : ''
  
return `${sign}${numeric.toFixed(2)} pp`
}

const gradeColor = (grade?: string) => {
  const value = String(grade || '').toUpperCase()
  if (value.includes('STRONG')) return 'success'
  if (value.includes('BUY')) return 'primary'
  if (value.includes('WATCH')) return 'warning'
  if (value.includes('REJECT')) return 'error'
  switch (value) {
    case 'A':
      return 'success'
    case 'B':
      return 'primary'
    case 'C':
      return 'warning'
    default:
      return 'error'
  }
}

const recommendationColor = (recommendation?: string) => {
  const text = String(recommendation || '')
  if (text.includes('Strong')) return 'success'
  if (text.includes('Buy')) return 'primary'
  if (text.includes('Watch')) return 'warning'
  if (text.includes('Reject')) return 'error'
  
return 'default'
}

const tierCards = [
  {
    title: 'Tier 1 - Quality Gates',
    icon: <VerifiedIcon />,
    color: 'success',
    bullets: [
      'ROCE > 15%',
      'ROE > 15%',
      'Debt to Equity < 1',
      'Operating Cash Flow > 0 for last 3 years',
      'Promoter Holding > 40%',
      'Promoter Single Quarter Drop < 3%',
      'Promoter Net 4Q Change > -5%',
    ],
    note: 'If any one fails, the stock is disqualified immediately.',
  },
  {
    title: 'Tier 2 - Growth Filters',
    icon: <ShowChartIcon />,
    color: 'primary',
    bullets: [
      'Revenue CAGR (3Y) > 15%',
      'Profit CAGR (3Y) > 20%',
      'OPM > 10% and stable or expanding',
      'EPS growth (3Y) > 15%',
    ],
    note: 'This is the actual growth engine behind GARP.',
  },
  {
    title: 'Tier 3 - Valuation Filters',
    icon: <BalanceIcon />,
    color: 'warning',
    bullets: [
      'PEG < 1.5',
      'P/E < 50',
      'Price to Book < 10',
      'EV/EBITDA < 30',
    ],
    note: 'Growth is good, but not if the price is too stretched.',
  },
  {
    title: 'Tier 4 - Stability & Sentiment',
    icon: <TrendingUpIcon />,
    color: 'info',
    bullets: [
      'Promoter Holding trend last 4Q',
      'Promoter max quarter drop in last 4Q',
      'FII trend last 4Q',
      'DII trend last 4Q',
      'Public holding trend last 4Q',
    ],
    note: 'These are bonus signals based on shareholding sentiment.',
  },
]

const GarpAnalysisPage: NextPage = () => {
  const router = useRouter()
  const [workspaceOpen, setWorkspaceOpen] = useState(true)
  const [candidatesOpen, setCandidatesOpen] = useState(false)
  const [rows, setRows] = useState<GarpRow[]>([])
  const [tierBuckets, setTierBuckets] = useState({
    tier1: [] as GarpRow[],
    tier2: [] as GarpRow[],
    tier3: [] as GarpRow[],
    tier4: [] as GarpRow[],
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [limit, setLimit] = useState(DEFAULT_LIMIT)
  const [gradeFilter, setGradeFilter] = useState('ALL')
  const [minScoreFilter, setMinScoreFilter] = useState('')
  const [expandedSymbol, setExpandedSymbol] = useState<string | null>(null)

  const loadAnalysis = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const res = await axiosInstance.get(ENDURL.GET_STOCK_GARP_ANALYSIS, {
        params: {
          limit,
          grade: gradeFilter,
          minScore: minScoreFilter === '' ? undefined : Number(minScoreFilter),
        },
      })
      const payload = (res?.data?.data || {}) as GarpAnalysisResponse
      setRows(Array.isArray(payload.rows) ? payload.rows : [])
      setTierBuckets({
        tier1: Array.isArray(payload?.buckets?.tier1) ? payload.buckets.tier1 : [],
        tier2: Array.isArray(payload?.buckets?.tier2) ? payload.buckets.tier2 : [],
        tier3: Array.isArray(payload?.buckets?.tier3) ? payload.buckets.tier3 : [],
        tier4: Array.isArray(payload?.buckets?.tier4) ? payload.buckets.tier4 : [],
      })
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load GARP analysis')
      setRows([])
      setTierBuckets({
        tier1: [],
        tier2: [],
        tier3: [],
        tier4: [],
      })
    } finally {
      setLoading(false)
    }
  }, [gradeFilter, limit, minScoreFilter])

  useEffect(() => {
    loadAnalysis()
  }, [loadAnalysis])

  const summary = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        const recommendation = String(row?.analysis?.recommendation || '')
        acc.total += 1
        if (recommendation.includes('Strong')) acc.strong += 1
        else if (recommendation === 'Buy') acc.buy += 1
        else if (recommendation === 'Watch') acc.watch += 1
        else acc.reject += 1
        
return acc
      },
      { total: 0, strong: 0, buy: 0, watch: 0, reject: 0 },
    )
  }, [rows])

  const tier1Rows = useMemo(() => tierBuckets.tier1, [tierBuckets.tier1])
  const tier2Rows = useMemo(() => tierBuckets.tier2, [tierBuckets.tier2])
  const tier3Rows = useMemo(() => tierBuckets.tier3, [tierBuckets.tier3])
  const tier4Rows = useMemo(() => tierBuckets.tier4, [tierBuckets.tier4])

  const getTierTint = (tier?: 'T1' | 'T2' | 'T3' | 'T4') => {
    switch (tier) {
      case 'T1':
        return 'rgba(46, 125, 50, 0.12)'
      case 'T2':
        return 'rgba(25, 118, 210, 0.12)'
      case 'T3':
        return 'rgba(237, 108, 2, 0.12)'
      case 'T4':
        return 'rgba(2, 136, 209, 0.12)'
      default:
        return 'transparent'
    }
  }

  const getTierRules = (row: GarpRow, tier: 'T1' | 'T2' | 'T3' | 'T4') => {
    if (tier === 'T1') {
      return [
        { label: 'ROCE', value: formatPercent(row?.garp_metrics?.roce), target: '> 15%', status: row?.analysis?.flags?.roce_gt_15 ? 'Pass' : 'Fail', color: row?.analysis?.flags?.roce_gt_15 ? 'success' : 'error' },
        { label: 'ROE', value: formatPercent(row?.garp_metrics?.roe), target: '> 15%', status: row?.analysis?.flags?.roe_gt_15 ? 'Pass' : 'Fail', color: row?.analysis?.flags?.roe_gt_15 ? 'success' : 'error' },
        { label: 'Debt / Equity', value: formatRatio(row?.garp_metrics?.debt_to_equity), target: '< 1', status: row?.analysis?.flags?.debt_to_equity_lt_1 ? 'Pass' : 'Fail', color: row?.analysis?.flags?.debt_to_equity_lt_1 ? 'success' : 'error' },
        { label: 'Operating Cash Flow', value: row?.analysis?.flags?.ocf_positive_last_3_years ? 'Positive 3/3 years' : 'Negative in 1+ year', target: 'Positive in last 3 years', status: row?.analysis?.flags?.ocf_positive_last_3_years ? 'Pass' : 'Fail', color: row?.analysis?.flags?.ocf_positive_last_3_years ? 'success' : 'error' },
        { label: 'Promoter Holding', value: formatPercent(row?.garp_metrics?.promoters), target: '> 40%', status: row?.analysis?.flags?.promoter_holding_gt_40 ? 'Pass' : 'Fail', color: row?.analysis?.flags?.promoter_holding_gt_40 ? 'success' : 'error' },
        { label: 'Promoter Single Quarter Drop', value: row?.analysis?.metrics?.promoter_max_quarter_drop_4q !== null && row?.analysis?.metrics?.promoter_max_quarter_drop_4q !== undefined ? `${Number(row?.analysis?.metrics?.promoter_max_quarter_drop_4q).toFixed(2)} pp max drop` : '?', target: '< 3% drop in any quarter', status: row?.analysis?.flags?.promoter_single_quarter_drop_lt_3 ? 'Pass' : 'Fail', color: row?.analysis?.flags?.promoter_single_quarter_drop_lt_3 ? 'success' : 'error' },
        { label: 'Promoter Net 4Q Change', value: row?.analysis?.metrics?.promoter_net_change_4q !== null && row?.analysis?.metrics?.promoter_net_change_4q !== undefined ? formatChange(row?.analysis?.metrics?.promoter_net_change_4q) : '?', target: '> -5% over 4Q', status: row?.analysis?.flags?.promoter_net_change_gt_minus_5 ? 'Pass' : 'Fail', color: row?.analysis?.flags?.promoter_net_change_gt_minus_5 ? 'success' : 'error' },
      ]
    }

    if (tier === 'T2') {
      return [
        { label: 'Revenue CAGR (3Y)', value: formatPercent(row?.garp_metrics?.revenue_cagr_3y), target: '> 15%', status: row?.garp_metrics?.revenue_cagr_3y === null ? 'Fail' : Number(row?.garp_metrics?.revenue_cagr_3y) > 15 ? 'Full' : Number(row?.garp_metrics?.revenue_cagr_3y) >= 10 ? 'Partial' : 'Fail', color: row?.garp_metrics?.revenue_cagr_3y === null ? 'error' : Number(row?.garp_metrics?.revenue_cagr_3y) > 15 ? 'success' : Number(row?.garp_metrics?.revenue_cagr_3y) >= 10 ? 'warning' : 'error' },
        { label: 'Profit CAGR (3Y)', value: formatPercent(row?.garp_metrics?.profit_cagr_3y), target: '> 20%', status: row?.garp_metrics?.profit_cagr_3y === null ? 'Fail' : Number(row?.garp_metrics?.profit_cagr_3y) > 20 ? 'Full' : Number(row?.garp_metrics?.profit_cagr_3y) >= 15 ? 'Partial' : 'Fail', color: row?.garp_metrics?.profit_cagr_3y === null ? 'error' : Number(row?.garp_metrics?.profit_cagr_3y) > 20 ? 'success' : Number(row?.garp_metrics?.profit_cagr_3y) >= 15 ? 'warning' : 'error' },
        { label: 'OPM', value: formatPercent(row?.garp_metrics?.opm_percent), target: '> 10% and expanding / stable', status: row?.garp_metrics?.opm_percent === null ? 'Fail' : Number(row?.garp_metrics?.opm_percent) > 10 && Boolean(row?.analysis?.flags?.opm_full) ? 'Full' : Number(row?.garp_metrics?.opm_percent) > 10 && Boolean(row?.analysis?.flags?.opm_partial) ? 'Partial' : 'Fail', color: row?.garp_metrics?.opm_percent === null ? 'error' : Number(row?.garp_metrics?.opm_percent) > 10 && Boolean(row?.analysis?.flags?.opm_full) ? 'success' : Number(row?.garp_metrics?.opm_percent) > 10 && Boolean(row?.analysis?.flags?.opm_partial) ? 'warning' : 'error' },
        { label: 'EPS CAGR (3Y)', value: formatPercent(row?.garp_metrics?.eps_cagr_3y), target: '> 15%', status: row?.garp_metrics?.eps_cagr_3y === null ? 'Fail' : Number(row?.garp_metrics?.eps_cagr_3y) > 15 ? 'Full' : Number(row?.garp_metrics?.eps_cagr_3y) >= 10 ? 'Partial' : 'Fail', color: row?.garp_metrics?.eps_cagr_3y === null ? 'error' : Number(row?.garp_metrics?.eps_cagr_3y) > 15 ? 'success' : Number(row?.garp_metrics?.eps_cagr_3y) >= 10 ? 'warning' : 'error' },
      ]
    }

    if (tier === 'T3') {
      return [
        { label: 'PEG', value: formatNumber(row?.garp_metrics?.peg_ratio), target: '< 1.5', status: row?.garp_metrics?.peg_ratio === null ? 'Fail' : Number(row?.garp_metrics?.peg_ratio) < 1.5 ? 'Full' : Number(row?.garp_metrics?.peg_ratio) <= 2.0 ? 'Partial' : 'Fail', color: row?.garp_metrics?.peg_ratio === null ? 'error' : Number(row?.garp_metrics?.peg_ratio) < 1.5 ? 'success' : Number(row?.garp_metrics?.peg_ratio) <= 2.0 ? 'warning' : 'error' },
        { label: 'P/E', value: formatNumber(row?.garp_metrics?.pe_ratio), target: '< 50', status: row?.garp_metrics?.pe_ratio === null ? 'Fail' : Number(row?.garp_metrics?.pe_ratio) < 50 ? 'Full' : Number(row?.garp_metrics?.pe_ratio) <= 70 ? 'Partial' : 'Fail', color: row?.garp_metrics?.pe_ratio === null ? 'error' : Number(row?.garp_metrics?.pe_ratio) < 50 ? 'success' : Number(row?.garp_metrics?.pe_ratio) <= 70 ? 'warning' : 'error' },
        { label: 'Price / Book', value: formatNumber(row?.garp_metrics?.price_to_book), target: '< 10', status: row?.garp_metrics?.price_to_book === null ? 'Fail' : Number(row?.garp_metrics?.price_to_book) < 10 ? 'Full' : Number(row?.garp_metrics?.price_to_book) <= 15 ? 'Partial' : 'Fail', color: row?.garp_metrics?.price_to_book === null ? 'error' : Number(row?.garp_metrics?.price_to_book) < 10 ? 'success' : Number(row?.garp_metrics?.price_to_book) <= 15 ? 'warning' : 'error' },
        { label: 'EV / EBITDA', value: formatNumber(row?.garp_metrics?.ev_ebitda), target: '< 30', status: row?.garp_metrics?.ev_ebitda === null ? 'Fail' : Number(row?.garp_metrics?.ev_ebitda) < 30 ? 'Full' : Number(row?.garp_metrics?.ev_ebitda) <= 40 ? 'Partial' : 'Fail', color: row?.garp_metrics?.ev_ebitda === null ? 'error' : Number(row?.garp_metrics?.ev_ebitda) < 30 ? 'success' : Number(row?.garp_metrics?.ev_ebitda) <= 40 ? 'warning' : 'error' },
      ]
    }

    return [
      { label: 'Promoter Holding Trend', value: formatChange(row?.analysis?.metrics?.promoter_net_change_4q), target: 'Increasing / Stable', status: row?.analysis?.metrics?.promoter_net_change_4q === null ? 'Fail' : Number(row?.analysis?.metrics?.promoter_net_change_4q) > 0.5 ? 'Full' : Math.abs(Number(row?.analysis?.metrics?.promoter_net_change_4q)) <= 0.5 ? 'Partial' : 'Fail', color: row?.analysis?.metrics?.promoter_net_change_4q === null ? 'error' : Number(row?.analysis?.metrics?.promoter_net_change_4q) > 0.5 ? 'success' : Math.abs(Number(row?.analysis?.metrics?.promoter_net_change_4q)) <= 0.5 ? 'warning' : 'error' },
      { label: 'Promoter Max Quarter Drop', value: row?.analysis?.metrics?.promoter_max_quarter_drop_4q !== null && row?.analysis?.metrics?.promoter_max_quarter_drop_4q !== undefined ? `${Number(row?.analysis?.metrics?.promoter_max_quarter_drop_4q).toFixed(2)} pp` : '?', target: 'No quarter > 1% drop', status: row?.analysis?.metrics?.promoter_max_quarter_drop_4q === null ? 'Fail' : Number(row?.analysis?.metrics?.promoter_max_quarter_drop_4q) <= 1 ? 'Full' : Number(row?.analysis?.metrics?.promoter_max_quarter_drop_4q) <= 2 ? 'Partial' : 'Fail', color: row?.analysis?.metrics?.promoter_max_quarter_drop_4q === null ? 'error' : Number(row?.analysis?.metrics?.promoter_max_quarter_drop_4q) <= 1 ? 'success' : Number(row?.analysis?.metrics?.promoter_max_quarter_drop_4q) <= 2 ? 'warning' : 'error' },
      { label: 'FII Trend', value: formatChange(row?.analysis?.metrics?.fii_net_change_4q), target: 'Increasing / Stable', status: row?.analysis?.metrics?.fii_net_change_4q === null ? 'Fail' : Number(row?.analysis?.metrics?.fii_net_change_4q) > 0.5 ? 'Full' : Math.abs(Number(row?.analysis?.metrics?.fii_net_change_4q)) <= 0.5 ? 'Partial' : 'Fail', color: row?.analysis?.metrics?.fii_net_change_4q === null ? 'error' : Number(row?.analysis?.metrics?.fii_net_change_4q) > 0.5 ? 'success' : Math.abs(Number(row?.analysis?.metrics?.fii_net_change_4q)) <= 0.5 ? 'warning' : 'error' },
      { label: 'DII Trend', value: formatChange(row?.analysis?.metrics?.dii_net_change_4q), target: 'Increasing / Stable', status: row?.analysis?.metrics?.dii_net_change_4q === null ? 'Fail' : Number(row?.analysis?.metrics?.dii_net_change_4q) > 0.5 ? 'Full' : Math.abs(Number(row?.analysis?.metrics?.dii_net_change_4q)) <= 0.5 ? 'Partial' : 'Fail', color: row?.analysis?.metrics?.dii_net_change_4q === null ? 'error' : Number(row?.analysis?.metrics?.dii_net_change_4q) > 0.5 ? 'success' : Math.abs(Number(row?.analysis?.metrics?.dii_net_change_4q)) <= 0.5 ? 'warning' : 'error' },
      { label: 'Public Holding', value: formatChange(row?.analysis?.metrics?.public_net_change_4q), target: 'Stable or slight increase < 2%', status: row?.analysis?.metrics?.public_net_change_4q === null ? 'Fail' : Number(row?.analysis?.metrics?.public_net_change_4q) <= 0 ? 'Full' : Number(row?.analysis?.metrics?.public_net_change_4q) < 2 ? 'Partial' : 'Fail', color: row?.analysis?.metrics?.public_net_change_4q === null ? 'error' : Number(row?.analysis?.metrics?.public_net_change_4q) <= 0 ? 'success' : Number(row?.analysis?.metrics?.public_net_change_4q) < 2 ? 'warning' : 'error' },
    ]
  }

  const renderTierTable = (tableRows: GarpRow[], emptyLabel: string, tier: 'T1' | 'T2' | 'T3' | 'T4') => {
    const headers: Record<'T1' | 'T2' | 'T3' | 'T4', string[]> = {
      T1: ['Grade', 'Score', 'Symbol', 'Company', 'ROCE', 'ROE', 'D/E', 'OCF', 'Promoter %', 'Pass'],
      T2: ['Grade', 'Score', 'Symbol', 'Company', 'Revenue CAGR', 'Profit CAGR', 'OPM', 'EPS CAGR', 'Tier 2'],
      T3: ['Grade', 'Score', 'Symbol', 'Company', 'PEG', 'P/E', 'P/B', 'EV/EBITDA', 'Tier 3'],
      T4: ['Grade', 'Score', 'Symbol', 'Company', 'Promoter 4Q', 'Max Drop', 'FII 4Q', 'DII 4Q', 'Public 4Q'],
    }

    return (
      <TableContainer component={Paper} variant='outlined' sx={{ borderRadius: 2 }}>
        <Table size='small'>
          <TableHead>
            <TableRow>
              {headers[tier].map(label => (
                <TableCell key={label}>{label}</TableCell>
              ))}
              <TableCell align='right'>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tableRows.map(row => {
              const expanded = expandedSymbol === row.symbol
              const focusColor = getTierTint(tier)
              const rules = getTierRules(row, tier)
              
return (
                <Fragment key={String(row.symbol || row.master_id)}>
                  <TableRow hover sx={{ '& td': { borderBottomColor: 'divider' } }}>
                    <TableCell>
                      <Chip label={row?.analysis?.grade || 'D'} color={gradeColor(row?.analysis?.grade) as any} size='small' />
                    </TableCell>
                    <TableCell>{formatNumber(row?.analysis?.score, 0)}</TableCell>
                    <TableCell>{row?.symbol || '?'}</TableCell>
                    <TableCell>{row?.company_name || row?.name || '?'}</TableCell>
                    {tier === 'T1' ? (
                      <>
                        <TableCell>{formatPercent(row?.garp_metrics?.roce)}</TableCell>
                        <TableCell>{formatPercent(row?.garp_metrics?.roe)}</TableCell>
                        <TableCell>{formatRatio(row?.garp_metrics?.debt_to_equity)}</TableCell>
                        <TableCell>{row?.analysis?.flags?.ocf_positive_last_3_years ? 'Yes' : 'No'}</TableCell>
                        <TableCell>{formatPercent(row?.garp_metrics?.promoters)}</TableCell>
                        <TableCell>
                          <Chip label={row?.analysis?.flags?.tier1_passed ? 'Pass' : 'Fail'} size='small' color={row?.analysis?.flags?.tier1_passed ? 'success' : 'error'} />
                        </TableCell>
                      </>
                    ) : tier === 'T2' ? (
                      <>
                        <TableCell>{formatPercent(row?.garp_metrics?.revenue_cagr_3y)}</TableCell>
                        <TableCell>{formatPercent(row?.garp_metrics?.profit_cagr_3y)}</TableCell>
                        <TableCell>{formatPercent(row?.garp_metrics?.opm_percent)}</TableCell>
                        <TableCell>{formatPercent(row?.garp_metrics?.eps_cagr_3y)}</TableCell>
                        <TableCell>{Number(row?.analysis?.tier_scores?.tier2 || 0)}</TableCell>
                      </>
                    ) : tier === 'T3' ? (
                      <>
                        <TableCell>{formatNumber(row?.garp_metrics?.peg_ratio)}</TableCell>
                        <TableCell>{formatNumber(row?.garp_metrics?.pe_ratio)}</TableCell>
                        <TableCell>{formatNumber(row?.garp_metrics?.price_to_book)}</TableCell>
                        <TableCell>{formatNumber(row?.garp_metrics?.ev_ebitda)}</TableCell>
                        <TableCell>{Number(row?.analysis?.tier_scores?.tier3 || 0)}</TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell>{formatChange(row?.analysis?.metrics?.promoter_net_change_4q)}</TableCell>
                        <TableCell>{row?.analysis?.metrics?.promoter_max_quarter_drop_4q !== null ? `${Number(row?.analysis?.metrics?.promoter_max_quarter_drop_4q).toFixed(2)} pp` : '?'}</TableCell>
                        <TableCell>{formatChange(row?.analysis?.metrics?.fii_net_change_4q)}</TableCell>
                        <TableCell>{formatChange(row?.analysis?.metrics?.dii_net_change_4q)}</TableCell>
                        <TableCell>{formatChange(row?.analysis?.metrics?.public_net_change_4q)}</TableCell>
                      </>
                    )}
                    <TableCell align='right'>
                      <Stack direction='row' spacing={0.5} justifyContent='flex-end'>
                        <IconButton
                          size='small'
                          onClick={() => router.push(`/stock-fundamental/${encodeURIComponent(String(row.symbol || ''))}`)}
                        >
                          <OpenInNewIcon fontSize='small' />
                        </IconButton>
                        <IconButton size='small' onClick={() => setExpandedSymbol(expanded ? null : String(row.symbol || ''))}>
                          <ExpandMoreIcon fontSize='small' />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={headers[tier].length + 1} sx={{ py: 0, borderBottom: expanded ? 'none' : undefined }}>
                      <Collapse in={expanded} timeout='auto' unmountOnExit>
                        <Box sx={{ p: 2.25, bgcolor: focusColor, borderRadius: 2, my: 1.25 }}>
                          <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap sx={{ mb: 1.5 }}>
                            <Chip label={`Focused tier: ${tier}`} size='small' color={tier === 'T1' ? 'success' : tier === 'T2' ? 'primary' : tier === 'T3' ? 'warning' : 'info'} />
                            <Chip label={`Rules shown: ${rules.length}`} size='small' variant='outlined' />
                          </Stack>
                          <TableContainer component={Paper} variant='outlined' sx={{ borderRadius: 2 }}>
                            <Table size='small'>
                              <TableHead>
                                <TableRow>
                                  <TableCell>Parameter</TableCell>
                                  <TableCell>Stock Value</TableCell>
                                  <TableCell>Filter Target</TableCell>
                                  <TableCell>Status</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {rules.map(rule => (
                                  <TableRow key={rule.label} sx={{ '& td': { borderBottomColor: 'divider' } }}>
                                    <TableCell>{rule.label}</TableCell>
                                    <TableCell>{rule.value}</TableCell>
                                    <TableCell>{rule.target}</TableCell>
                                    <TableCell>
                                      <Chip label={rule.status} size='small' color={rule.color as any} />
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </Fragment>
              )
            })}
            {!tableRows.length && !loading ? (
              <TableRow>
                <TableCell colSpan={headers[tier].length + 1}>
                  <Typography variant='body2' color='text.secondary' sx={{ py: 3, textAlign: 'center' }}>
                    {emptyLabel}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </TableContainer>
    )
  }

  const renderGarpTable = (tableRows: GarpRow[], emptyLabel: string, focusTier?: 'T1' | 'T2' | 'T3' | 'T4') => (
    <TableContainer component={Paper} variant='outlined' sx={{ borderRadius: 2 }}>
      <Table size='small'>
        <TableHead>
          <TableRow>
            <TableCell>Grade</TableCell>
            <TableCell>Score</TableCell>
            <TableCell>Symbol</TableCell>
            <TableCell>Company</TableCell>
            <TableCell>Revenue CAGR</TableCell>
            <TableCell>Profit CAGR</TableCell>
            <TableCell>EPS CAGR</TableCell>
            <TableCell>ROE</TableCell>
            <TableCell>ROCE</TableCell>
            <TableCell>P/E</TableCell>
            <TableCell>PEG</TableCell>
            <TableCell>Debt/Equity</TableCell>
            <TableCell>Recommendation</TableCell>
            <TableCell align='right'>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tableRows.map(row => {
            const expanded = expandedSymbol === row.symbol
            
return (
              <Fragment key={String(row.symbol || row.master_id)}>
                <TableRow
                  hover
                  sx={
                    focusTier
                      ? {
                          '& td': { borderBottomColor: 'divider' },
                        }
                      : undefined
                  }
                >
                  <TableCell>
                    <Chip label={row?.analysis?.grade || 'D'} color={gradeColor(row?.analysis?.grade) as any} size='small' />
                  </TableCell>
                  <TableCell>{formatNumber(row?.analysis?.score, 0)}</TableCell>
                  <TableCell>{row?.symbol || '?'}</TableCell>
                  <TableCell>{row?.company_name || row?.name || '?'}</TableCell>
                  <TableCell>{formatPercent(row?.garp_metrics?.revenue_cagr_3y)}</TableCell>
                  <TableCell>{formatPercent(row?.garp_metrics?.profit_cagr_3y)}</TableCell>
                  <TableCell>{formatPercent(row?.garp_metrics?.eps_cagr_3y)}</TableCell>
                  <TableCell>{formatPercent(row?.garp_metrics?.roe)}</TableCell>
                  <TableCell>{formatPercent(row?.garp_metrics?.roce)}</TableCell>
                  <TableCell>{formatNumber(row?.garp_metrics?.pe_ratio)}</TableCell>
                  <TableCell>{formatNumber(row?.garp_metrics?.peg_ratio)}</TableCell>
                  <TableCell>{formatRatio(row?.garp_metrics?.debt_to_equity)}</TableCell>
                  <TableCell>
                    <Chip
                      label={row?.analysis?.recommendation || '?'}
                      color={recommendationColor(row?.analysis?.recommendation) as any}
                      size='small'
                    />
                  </TableCell>
                  <TableCell align='right'>
                    <Stack direction='row' spacing={0.5} justifyContent='flex-end'>
                      <IconButton
                        size='small'
                        onClick={() => router.push(`/stock-fundamental/${encodeURIComponent(String(row.symbol || ''))}`)}
                      >
                        <OpenInNewIcon fontSize='small' />
                      </IconButton>
                      <IconButton size='small' onClick={() => setExpandedSymbol(expanded ? null : String(row.symbol || ''))}>
                        <ExpandMoreIcon fontSize='small' />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={14} sx={{ py: 0, borderBottom: expanded ? 'none' : undefined }}>
                    <Collapse in={expanded} timeout='auto' unmountOnExit>
                      <Box sx={{ p: 2.5, bgcolor: 'action.hover', borderRadius: 2, my: 1.5 }}>
                        {focusTier ? (
                          <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap sx={{ mb: 1.5 }}>
                            <Chip
                              label={`Focused tier: ${focusTier}`}
                              size='small'
                              color={focusTier === 'T1' ? 'success' : focusTier === 'T2' ? 'primary' : focusTier === 'T3' ? 'warning' : 'info'}
                            />
                            <Chip label='Comparison rows remain visible' size='small' variant='outlined' />
                          </Stack>
                        ) : null}

                        <TableContainer component={Paper} variant='outlined' sx={{ borderRadius: 2 }}>
                          <Table size='small'>
                            <TableHead>
                              <TableRow>
                                <TableCell>Tier</TableCell>
                                <TableCell>Parameter</TableCell>
                                <TableCell>Stock Value</TableCell>
                                <TableCell>Filter Target</TableCell>
                                <TableCell>Status</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {[
                                  {
                                    tier: 'T1',
                                    label: 'ROCE',
                                    value: formatPercent(row?.garp_metrics?.roce),
                                    target: '> 15%',
                                    status: row?.analysis?.flags?.roce_gt_15 ? 'Pass' : 'Fail',
                                    color: row?.analysis?.flags?.roce_gt_15 ? 'success' : 'error',
                                  },
                                  {
                                    tier: 'T1',
                                    label: 'ROE',
                                    value: formatPercent(row?.garp_metrics?.roe),
                                    target: '> 15%',
                                    status: row?.analysis?.flags?.roe_gt_15 ? 'Pass' : 'Fail',
                                    color: row?.analysis?.flags?.roe_gt_15 ? 'success' : 'error',
                                  },
                                  {
                                    tier: 'T1',
                                    label: 'Debt / Equity',
                                    value: formatRatio(row?.garp_metrics?.debt_to_equity),
                                    target: '< 1',
                                    status: row?.analysis?.flags?.debt_to_equity_lt_1 ? 'Pass' : 'Fail',
                                    color: row?.analysis?.flags?.debt_to_equity_lt_1 ? 'success' : 'error',
                                  },
                                  {
                                    tier: 'T1',
                                    label: 'Operating Cash Flow',
                                    value: row?.analysis?.flags?.ocf_positive_last_3_years ? 'Positive 3/3 years' : 'Negative in 1+ year',
                                    target: 'Positive in last 3 years',
                                    status: row?.analysis?.flags?.ocf_positive_last_3_years ? 'Pass' : 'Fail',
                                    color: row?.analysis?.flags?.ocf_positive_last_3_years ? 'success' : 'error',
                                  },
                                  {
                                    tier: 'T1',
                                    label: 'Promoter Holding',
                                    value: formatPercent(row?.garp_metrics?.promoters),
                                    target: '> 40%',
                                    status: row?.analysis?.flags?.promoter_holding_gt_40 ? 'Pass' : 'Fail',
                                    color: row?.analysis?.flags?.promoter_holding_gt_40 ? 'success' : 'error',
                                  },
                                  {
                                    tier: 'T1',
                                    label: 'Promoter Single Quarter Drop',
                                    value:
                                      row?.analysis?.metrics?.promoter_max_quarter_drop_4q !== null &&
                                      row?.analysis?.metrics?.promoter_max_quarter_drop_4q !== undefined
                                        ? `${Number(row?.analysis?.metrics?.promoter_max_quarter_drop_4q).toFixed(2)} pp max drop`
                                        : '?',
                                    target: '< 3% drop in any quarter',
                                    status: row?.analysis?.flags?.promoter_single_quarter_drop_lt_3 ? 'Pass' : 'Fail',
                                    color: row?.analysis?.flags?.promoter_single_quarter_drop_lt_3 ? 'success' : 'error',
                                  },
                                  {
                                    tier: 'T1',
                                    label: 'Promoter Net 4Q Change',
                                    value:
                                      row?.analysis?.metrics?.promoter_net_change_4q !== null &&
                                      row?.analysis?.metrics?.promoter_net_change_4q !== undefined
                                        ? formatChange(row?.analysis?.metrics?.promoter_net_change_4q)
                                        : '?',
                                    target: '> -5% over 4Q',
                                    status: row?.analysis?.flags?.promoter_net_change_gt_minus_5 ? 'Pass' : 'Fail',
                                    color: row?.analysis?.flags?.promoter_net_change_gt_minus_5 ? 'success' : 'error',
                                  },
                                  {
                                    tier: 'T2',
                                    label: 'Revenue CAGR (3Y)',
                                    value: formatPercent(row?.garp_metrics?.revenue_cagr_3y),
                                    target: '> 15%',
                                    status:
                                      row?.garp_metrics?.revenue_cagr_3y === null
                                        ? 'Fail'
                                        : Number(row?.garp_metrics?.revenue_cagr_3y) > 15
                                          ? 'Full'
                                          : Number(row?.garp_metrics?.revenue_cagr_3y) >= 10
                                            ? 'Partial'
                                            : 'Fail',
                                    color:
                                      row?.garp_metrics?.revenue_cagr_3y === null
                                        ? 'error'
                                        : Number(row?.garp_metrics?.revenue_cagr_3y) > 15
                                          ? 'success'
                                          : Number(row?.garp_metrics?.revenue_cagr_3y) >= 10
                                            ? 'warning'
                                            : 'error',
                                  },
                                  {
                                    tier: 'T2',
                                    label: 'Profit CAGR (3Y)',
                                    value: formatPercent(row?.garp_metrics?.profit_cagr_3y),
                                    target: '> 20%',
                                    status:
                                      row?.garp_metrics?.profit_cagr_3y === null
                                        ? 'Fail'
                                        : Number(row?.garp_metrics?.profit_cagr_3y) > 20
                                          ? 'Full'
                                          : Number(row?.garp_metrics?.profit_cagr_3y) >= 15
                                            ? 'Partial'
                                            : 'Fail',
                                    color:
                                      row?.garp_metrics?.profit_cagr_3y === null
                                        ? 'error'
                                        : Number(row?.garp_metrics?.profit_cagr_3y) > 20
                                          ? 'success'
                                          : Number(row?.garp_metrics?.profit_cagr_3y) >= 15
                                            ? 'warning'
                                            : 'error',
                                  },
                                  {
                                    tier: 'T2',
                                    label: 'OPM',
                                    value: formatPercent(row?.garp_metrics?.opm_percent),
                                    target: '> 10% and expanding / stable',
                                    status:
                                      row?.garp_metrics?.opm_percent === null
                                        ? 'Fail'
                                        : Number(row?.garp_metrics?.opm_percent) > 10 &&
                                          Boolean(row?.analysis?.flags?.opm_full)
                                          ? 'Full'
                                          : Number(row?.garp_metrics?.opm_percent) > 10 &&
                                            Boolean(row?.analysis?.flags?.opm_partial)
                                            ? 'Partial'
                                            : 'Fail',
                                    color:
                                      row?.garp_metrics?.opm_percent === null
                                        ? 'error'
                                        : Number(row?.garp_metrics?.opm_percent) > 10 &&
                                          Boolean(row?.analysis?.flags?.opm_full)
                                          ? 'success'
                                          : Number(row?.garp_metrics?.opm_percent) > 10 &&
                                            Boolean(row?.analysis?.flags?.opm_partial)
                                            ? 'warning'
                                            : 'error',
                                  },
                                  {
                                    tier: 'T2',
                                    label: 'EPS CAGR (3Y)',
                                    value: formatPercent(row?.garp_metrics?.eps_cagr_3y),
                                    target: '> 15%',
                                    status:
                                      row?.garp_metrics?.eps_cagr_3y === null
                                        ? 'Fail'
                                        : Number(row?.garp_metrics?.eps_cagr_3y) > 15
                                          ? 'Full'
                                          : Number(row?.garp_metrics?.eps_cagr_3y) >= 10
                                            ? 'Partial'
                                            : 'Fail',
                                    color:
                                      row?.garp_metrics?.eps_cagr_3y === null
                                        ? 'error'
                                        : Number(row?.garp_metrics?.eps_cagr_3y) > 15
                                          ? 'success'
                                          : Number(row?.garp_metrics?.eps_cagr_3y) >= 10
                                            ? 'warning'
                                            : 'error',
                                  },
                                  {
                                    tier: 'T3',
                                    label: 'PEG',
                                    value: formatNumber(row?.garp_metrics?.peg_ratio),
                                    target: '< 1.5',
                                    status:
                                      row?.garp_metrics?.peg_ratio === null
                                        ? 'Fail'
                                        : Number(row?.garp_metrics?.peg_ratio) < 1.5
                                          ? 'Full'
                                          : Number(row?.garp_metrics?.peg_ratio) <= 2.0
                                            ? 'Partial'
                                            : 'Fail',
                                    color:
                                      row?.garp_metrics?.peg_ratio === null
                                        ? 'error'
                                        : Number(row?.garp_metrics?.peg_ratio) < 1.5
                                          ? 'success'
                                          : Number(row?.garp_metrics?.peg_ratio) <= 2.0
                                            ? 'warning'
                                            : 'error',
                                  },
                                  {
                                    tier: 'T3',
                                    label: 'P/E',
                                    value: formatNumber(row?.garp_metrics?.pe_ratio),
                                    target: '< 50',
                                    status:
                                      row?.garp_metrics?.pe_ratio === null
                                        ? 'Fail'
                                        : Number(row?.garp_metrics?.pe_ratio) < 50
                                          ? 'Full'
                                          : Number(row?.garp_metrics?.pe_ratio) <= 70
                                            ? 'Partial'
                                            : 'Fail',
                                    color:
                                      row?.garp_metrics?.pe_ratio === null
                                        ? 'error'
                                        : Number(row?.garp_metrics?.pe_ratio) < 50
                                          ? 'success'
                                          : Number(row?.garp_metrics?.pe_ratio) <= 70
                                            ? 'warning'
                                            : 'error',
                                  },
                                  {
                                    tier: 'T3',
                                    label: 'Price / Book',
                                    value: formatNumber(row?.garp_metrics?.price_to_book),
                                    target: '< 10',
                                    status:
                                      row?.garp_metrics?.price_to_book === null
                                        ? 'Fail'
                                        : Number(row?.garp_metrics?.price_to_book) < 10
                                          ? 'Full'
                                          : Number(row?.garp_metrics?.price_to_book) <= 15
                                            ? 'Partial'
                                            : 'Fail',
                                    color:
                                      row?.garp_metrics?.price_to_book === null
                                        ? 'error'
                                        : Number(row?.garp_metrics?.price_to_book) < 10
                                          ? 'success'
                                          : Number(row?.garp_metrics?.price_to_book) <= 15
                                            ? 'warning'
                                            : 'error',
                                  },
                                  {
                                    tier: 'T3',
                                    label: 'EV / EBITDA',
                                    value: formatNumber(row?.garp_metrics?.ev_ebitda),
                                    target: '< 30',
                                    status:
                                      row?.garp_metrics?.ev_ebitda === null
                                        ? 'Fail'
                                        : Number(row?.garp_metrics?.ev_ebitda) < 30
                                          ? 'Full'
                                          : Number(row?.garp_metrics?.ev_ebitda) <= 40
                                            ? 'Partial'
                                            : 'Fail',
                                    color:
                                      row?.garp_metrics?.ev_ebitda === null
                                        ? 'error'
                                        : Number(row?.garp_metrics?.ev_ebitda) < 30
                                          ? 'success'
                                          : Number(row?.garp_metrics?.ev_ebitda) <= 40
                                            ? 'warning'
                                            : 'error',
                                  },
                                  {
                                    tier: 'T4',
                                    label: 'Promoter Holding Trend',
                                    value: formatChange(row?.analysis?.metrics?.promoter_net_change_4q),
                                    target: 'Increasing / Stable',
                                    status: row?.analysis?.metrics?.promoter_net_change_4q === null
                                      ? 'Fail'
                                      : Number(row?.analysis?.metrics?.promoter_net_change_4q) > 0.5
                                        ? 'Full'
                                        : Math.abs(Number(row?.analysis?.metrics?.promoter_net_change_4q)) <= 0.5
                                          ? 'Partial'
                                          : 'Fail',
                                    color: row?.analysis?.metrics?.promoter_net_change_4q === null
                                      ? 'error'
                                      : Number(row?.analysis?.metrics?.promoter_net_change_4q) > 0.5
                                        ? 'success'
                                        : Math.abs(Number(row?.analysis?.metrics?.promoter_net_change_4q)) <= 0.5
                                          ? 'warning'
                                          : 'error',
                                  },
                                  {
                                    tier: 'T4',
                                    label: 'Promoter Max Quarter Drop',
                                    value:
                                      row?.analysis?.metrics?.promoter_max_quarter_drop_4q !== null &&
                                      row?.analysis?.metrics?.promoter_max_quarter_drop_4q !== undefined
                                        ? `${Number(row?.analysis?.metrics?.promoter_max_quarter_drop_4q).toFixed(2)} pp`
                                        : '?',
                                    target: 'No quarter > 1% drop',
                                    status:
                                      row?.analysis?.metrics?.promoter_max_quarter_drop_4q === null
                                        ? 'Fail'
                                        : Number(row?.analysis?.metrics?.promoter_max_quarter_drop_4q) <= 1
                                          ? 'Full'
                                          : Number(row?.analysis?.metrics?.promoter_max_quarter_drop_4q) <= 2
                                            ? 'Partial'
                                            : 'Fail',
                                    color:
                                      row?.analysis?.metrics?.promoter_max_quarter_drop_4q === null
                                        ? 'error'
                                        : Number(row?.analysis?.metrics?.promoter_max_quarter_drop_4q) <= 1
                                          ? 'success'
                                          : Number(row?.analysis?.metrics?.promoter_max_quarter_drop_4q) <= 2
                                            ? 'warning'
                                            : 'error',
                                  },
                                  {
                                    tier: 'T4',
                                    label: 'FII Trend',
                                    value: formatChange(row?.analysis?.metrics?.fii_net_change_4q),
                                    target: 'Increasing / Stable',
                                    status:
                                      row?.analysis?.metrics?.fii_net_change_4q === null
                                        ? 'Fail'
                                        : Number(row?.analysis?.metrics?.fii_net_change_4q) > 0.5
                                          ? 'Full'
                                          : Math.abs(Number(row?.analysis?.metrics?.fii_net_change_4q)) <= 0.5
                                            ? 'Partial'
                                            : 'Fail',
                                    color:
                                      row?.analysis?.metrics?.fii_net_change_4q === null
                                        ? 'error'
                                        : Number(row?.analysis?.metrics?.fii_net_change_4q) > 0.5
                                          ? 'success'
                                          : Math.abs(Number(row?.analysis?.metrics?.fii_net_change_4q)) <= 0.5
                                            ? 'warning'
                                            : 'error',
                                  },
                                  {
                                    tier: 'T4',
                                    label: 'DII Trend',
                                    value: formatChange(row?.analysis?.metrics?.dii_net_change_4q),
                                    target: 'Increasing / Stable',
                                    status:
                                      row?.analysis?.metrics?.dii_net_change_4q === null
                                        ? 'Fail'
                                        : Number(row?.analysis?.metrics?.dii_net_change_4q) > 0.5
                                          ? 'Full'
                                          : Math.abs(Number(row?.analysis?.metrics?.dii_net_change_4q)) <= 0.5
                                            ? 'Partial'
                                            : 'Fail',
                                    color:
                                      row?.analysis?.metrics?.dii_net_change_4q === null
                                        ? 'error'
                                        : Number(row?.analysis?.metrics?.dii_net_change_4q) > 0.5
                                          ? 'success'
                                          : Math.abs(Number(row?.analysis?.metrics?.dii_net_change_4q)) <= 0.5
                                            ? 'warning'
                                            : 'error',
                                  },
                                  {
                                    tier: 'T4',
                                    label: 'Public Holding',
                                    value: formatChange(row?.analysis?.metrics?.public_net_change_4q),
                                    target: 'Stable or slight increase < 2%',
                                    status:
                                      row?.analysis?.metrics?.public_net_change_4q === null
                                        ? 'Fail'
                                        : Number(row?.analysis?.metrics?.public_net_change_4q) <= 0
                                          ? 'Full'
                                          : Number(row?.analysis?.metrics?.public_net_change_4q) < 2
                                            ? 'Partial'
                                            : 'Fail',
                                    color:
                                      row?.analysis?.metrics?.public_net_change_4q === null
                                        ? 'error'
                                        : Number(row?.analysis?.metrics?.public_net_change_4q) <= 0
                                          ? 'success'
                                          : Number(row?.analysis?.metrics?.public_net_change_4q) < 2
                                            ? 'warning'
                                            : 'error',
                                  },
                                ].map(item => (
                                  <TableRow
                                    key={item.label}
                                    sx={{
                                      bgcolor:
                                        focusTier && item.tier === focusTier
                                          ? getTierTint(focusTier)
                                          : focusTier
                                            ? 'rgba(255,255,255,0.015)'
                                            : 'inherit',
                                      opacity: focusTier && item.tier !== focusTier ? 0.68 : 1,
                                      borderLeft: focusTier && item.tier === focusTier ? '4px solid' : '0',
                                      borderLeftColor: focusTier && item.tier === focusTier ? 'primary.main' : 'transparent',
                                    }}
                                  >
                                    <TableCell>{item.tier}</TableCell>
                                    <TableCell>{item.label}</TableCell>
                                    <TableCell>{item.value}</TableCell>
                                    <TableCell>{item.target}</TableCell>
                                    <TableCell>
                                      <Chip
                                        label={item.status}
                                        size='small'
                                        color={item.color as any}
                                      />
                                    </TableCell>
                                  </TableRow>
                                ))}
                            </TableBody>
                          </Table>
                        </TableContainer>

                        <Grid container spacing={2} sx={{ mb: 1.5 }}>
                          <Grid item xs={12} md={3}>
                            <Chip label={`Tier 1: ${row?.analysis?.tier_scores?.tier1 ?? 0}`} color='success' size='small' />
                          </Grid>
                          <Grid item xs={12} md={3}>
                            <Chip label={`Tier 2: ${row?.analysis?.tier_scores?.tier2 ?? 0}`} color='primary' size='small' />
                          </Grid>
                          <Grid item xs={12} md={3}>
                            <Chip label={`Tier 3: ${row?.analysis?.tier_scores?.tier3 ?? 0}`} color='warning' size='small' />
                          </Grid>
                          <Grid item xs={12} md={3}>
                            <Chip label={`Tier 4: ${row?.analysis?.tier_scores?.tier4 ?? 0}`} color='info' size='small' />
                          </Grid>
                        </Grid>

                        <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                          <Chip
                            label={`Tier 1 Passed: ${row?.analysis?.flags?.tier1_passed ? 'Yes' : 'No'}`}
                            size='small'
                            color={row?.analysis?.flags?.tier1_passed ? 'success' : 'error'}
                          />
                          <Chip label={`Tier 2 Score: ${row?.analysis?.tier_scores?.tier2 ?? 0}`} size='small' color='primary' />
                          <Chip label={`Tier 3 Score: ${row?.analysis?.tier_scores?.tier3 ?? 0}`} size='small' color='warning' />
                          <Chip label={`Tier 4 Score: ${row?.analysis?.tier_scores?.tier4 ?? 0}`} size='small' color='info' />
                          <Chip
                            label={`Promoter 4Q: ${formatChange(row?.analysis?.metrics?.promoter_net_change_4q)}`}
                            size='small'
                            color='success'
                          />
                          <Chip
                            label={`Promoter max drop: ${row?.analysis?.metrics?.promoter_max_quarter_drop_4q !== null ? `${Number(row?.analysis?.metrics?.promoter_max_quarter_drop_4q).toFixed(2)} pp` : 'n/a'}`}
                            size='small'
                            color='warning'
                          />
                          <Chip
                            label={`FII 4Q: ${formatChange(row?.analysis?.metrics?.fii_net_change_4q)}`}
                            size='small'
                            color='primary'
                          />
                          <Chip
                            label={`DII 4Q: ${formatChange(row?.analysis?.metrics?.dii_net_change_4q)}`}
                            size='small'
                            color='primary'
                          />
                          <Chip
                            label={`Public 4Q: ${formatChange(row?.analysis?.metrics?.public_net_change_4q)}`}
                            size='small'
                            color='info'
                          />
                        </Stack>
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              </Fragment>
            )
          })}
          {!tableRows.length && !loading ? (
            <TableRow>
              <TableCell colSpan={14}>
                <Typography variant='body2' color='text.secondary' sx={{ py: 3, textAlign: 'center' }}>
                  {emptyLabel}
                </Typography>
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </TableContainer>
  )

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Card
          sx={{
            borderRadius: 3,
            overflow: 'hidden',
            background:
              'radial-gradient(circle at 85% 15%, rgba(59, 130, 246, 0.24) 0%, transparent 30%), radial-gradient(circle at 15% 10%, rgba(34, 197, 94, 0.18) 0%, transparent 28%), linear-gradient(125deg, #08111f 0%, #0f172a 52%, #111827 100%)',
          }}
        >
          <CardContent sx={{ p: { xs: 5, md: 7 } }}>
            <Grid container spacing={4} alignItems='center'>
              <Grid item xs={12} md={8}>
                <Chip label='GARP Screener' color='success' size='small' sx={{ mb: 2 }} />
                <Typography variant='h3' sx={{ color: 'common.white', fontWeight: 700, mb: 1.5 }}>
                  Long Term Growth with Reasonable Price
                </Typography>
                <Typography variant='body1' sx={{ color: 'rgba(255,255,255,0.76)', maxWidth: 860 }}>
                  Backend scans the full VALID universe and ranks only the stocks that pass the Tier 1 quality gates.
                  The score then combines growth, valuation, and stability to surface practical GARP candidates.
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card sx={{ bgcolor: 'rgba(8, 14, 26, 0.75)', border: '1px solid rgba(255,255,255,0.13)' }}>
                  <CardContent>
                    <Typography variant='caption' sx={{ color: 'rgba(255,255,255,0.65)' }}>
                      Ranking focus
                    </Typography>
                    <Stack spacing={1.25} sx={{ mt: 1 }}>
                      <Chip label='Quality gates first' color='success' size='small' />
                      <Chip label='Growth second' color='primary' size='small' />
                      <Chip label='Valuation + stability' color='warning' size='small' />
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Grid container spacing={3}>
          {tierCards.map(card => (
            <Grid item xs={12} md={6} key={card.title}>
              <Card sx={{ borderRadius: 3, height: '100%' }}>
                <CardContent sx={{ p: 3 }}>
                  <Stack direction='row' spacing={1.2} alignItems='center' sx={{ mb: 1.5 }}>
                    <Chip icon={card.icon as any} label={card.title} color={card.color as any} />
                  </Stack>
                  <Stack spacing={1} sx={{ mb: 1.5 }}>
                    {card.bullets.map(item => (
                      <Typography key={item} variant='body2' color='text.secondary'>
                        - {item}
                      </Typography>
                    ))}
                  </Stack>
                  <Typography variant='caption' color='text.secondary'>
                    {card.note}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Grid>

      <Grid item xs={12}>
        <Accordion expanded={workspaceOpen} onChange={(_, expanded) => setWorkspaceOpen(expanded)}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap' }}>
              <TuneIcon fontSize='small' />
              <Typography variant='h6'>GARP Analysis Workspace</Typography>
              <Chip label={`Qualified: ${rows.length}`} size='small' />
              <Chip label={`Strong Buy: ${summary.strong}`} size='small' color='success' />
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={4}>
              <Card sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'flex-end' }}>
                    <TextField
                      label='Limit'
                      type='number'
                      value={limit}
                      onChange={event => setLimit(Number(event.target.value || DEFAULT_LIMIT))}
                      sx={{ width: 140 }}
                    />
                    <TextField
                      select
                      label='Grade'
                      value={gradeFilter}
                      onChange={event => setGradeFilter(String(event.target.value || 'ALL'))}
                      sx={{ width: 180 }}
                    >
                      <MenuItem value='ALL'>All Grades</MenuItem>
                      <MenuItem value='STRONG BUY'>Strong Buy</MenuItem>
                      <MenuItem value='BUY'>Buy</MenuItem>
                      <MenuItem value='WATCH'>Watch</MenuItem>
                      <MenuItem value='REJECT'>Reject</MenuItem>
                    </TextField>
                    <TextField
                      label='Min Score'
                      type='number'
                      value={minScoreFilter}
                      onChange={event => setMinScoreFilter(event.target.value)}
                      sx={{ width: 140 }}
                    />
                    <Stack direction='row' spacing={1} sx={{ ml: { md: 'auto' }, flexWrap: 'wrap' }}>
                      <Button variant='outlined' startIcon={<RefreshIcon />} onClick={loadAnalysis} disabled={loading}>
                        Reload
                      </Button>
                    </Stack>
                  </Stack>
                  <Divider sx={{ my: 3 }} />
                  <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                    <Chip label={`Strong Buy: ${summary.strong}`} color='success' />
                    <Chip label={`Buy: ${summary.buy}`} color='primary' />
                    <Chip label={`Watch: ${summary.watch}`} color='warning' />
                    <Chip label={`Reject: ${summary.reject}`} color='error' />
                    <Chip label={`Visible: ${summary.total}`} variant='outlined' />
                  </Stack>
                  {error ? (
                    <Alert severity='error' sx={{ mt: 2 }}>
                      {error}
                    </Alert>
                  ) : null}
                </CardContent>
              </Card>

              <Accordion expanded={candidatesOpen} onChange={(_, expanded) => setCandidatesOpen(expanded)}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap' }}>
                    <InsightsIcon fontSize='small' />
                    <Typography variant='h6'>Overall Ranking</Typography>
                    <Chip icon={<InsightsIcon />} label={loading ? 'Loading...' : `${rows.length} qualified`} color='primary' variant='outlined' />
                    <Chip label='Top 50 by default' size='small' variant='outlined' />
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Card sx={{ borderRadius: 3 }}>
                    <CardContent>{renderGarpTable(rows, 'No GARP candidates matched the current backend rules.')}</CardContent>
                  </Card>
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap' }}>
                    <VerifiedIcon fontSize='small' />
                    <Typography variant='h6'>Tier 1 Hard Pass</Typography>
                    <Chip label={`${tier1Rows.length} stocks`} size='small' color='success' />
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Card sx={{ borderRadius: 3 }}>
                    <CardContent>{renderTierTable(tier1Rows, 'No stocks passed Tier 1 hard gates.', 'T1')}</CardContent>
                  </Card>
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap' }}>
                    <ShowChartIcon fontSize='small' />
                    <Typography variant='h6'>Tier 2 Growth Score</Typography>
                    <Chip label={`${tier2Rows.length} stocks`} size='small' color='primary' />
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Card sx={{ borderRadius: 3 }}>
                    <CardContent>{renderTierTable(tier2Rows, 'No stocks showed positive growth scores.', 'T2')}</CardContent>
                  </Card>
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap' }}>
                    <BalanceIcon fontSize='small' />
                    <Typography variant='h6'>Tier 3 Valuation Score</Typography>
                    <Chip label={`${tier3Rows.length} stocks`} size='small' color='warning' />
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Card sx={{ borderRadius: 3 }}>
                    <CardContent>{renderTierTable(tier3Rows, 'No stocks showed valuation scores.', 'T3')}</CardContent>
                  </Card>
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap' }}>
                    <TrendingUpIcon fontSize='small' />
                    <Typography variant='h6'>Tier 4 Stability & Sentiment</Typography>
                    <Chip label={`${tier4Rows.length} stocks`} size='small' color='info' />
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Card sx={{ borderRadius: 3 }}>
                    <CardContent>{renderTierTable(tier4Rows, 'No stocks showed stability or sentiment scores.', 'T4')}</CardContent>
                  </Card>
                </AccordionDetails>
              </Accordion>
            </Stack>
          </AccordionDetails>
        </Accordion>
      </Grid>
    </Grid>
  )
}

export default GarpAnalysisPage
