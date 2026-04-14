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

type ValueRow = {
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
  value_metrics?: {
    company_age_years?: number | null
    industry_avg_pe?: number | null
    pe_vs_industry?: number | null
    price_to_sales?: number | null
    revenue_cagr_3y?: number | null
    profit_cagr_3y?: number | null
    eps_cagr_3y?: number | null
    opm_percent?: number | null
    roe?: number | null
    roce?: number | null
    debt_to_equity?: number | null
    pe_ratio?: number | null
    price_to_book?: number | null
    ev_ebitda?: number | null
    dividend_yield?: number | null
    interest_coverage?: number | null
    debtor_days?: number | null
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
    warnings?: Array<{
      code?: string
      severity?: string
      title?: string
      description?: string
    }>
  }
}

type ValueAnalysisResponse = {
  rows?: ValueRow[]
  total?: number
  buckets?: {
    tier1?: ValueRow[]
    tier2?: ValueRow[]
    tier3?: ValueRow[]
    tier4?: ValueRow[]
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
  if (value.includes('DEEP')) return 'success'
  if (value.includes('VALUE')) return 'primary'
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
  if (text.includes('Deep')) return 'success'
  if (text.includes('Value')) return 'primary'
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
      'ROCE > 12%',
      'ROE > 12%',
      'Debt to Equity < 1.5',
      'Operating Cash Flow > 0 for last 3 years',
      'Promoter Holding > 35%',
      'Promoter Single Quarter Drop < 3%',
      'Promoter Net 4Q Change > -5%',
      'Company age > 5 years',
      'Consistent profit in last 3 years',
    ],
    note: 'If any one fails, the stock is disqualified immediately.',
  },
  {
    title: 'Tier 2 - Value Filters',
    icon: <ShowChartIcon />,
    color: 'primary',
    bullets: [
      'P/E vs Industry Avg < 70%',
      'Price to Book < 1.5',
      'EV / EBITDA < 10',
      'Dividend Yield > 2%',
      'Price to Sales < 1.5',
    ],
    note: 'This is the core of value investing: price vs fundamentals.',
  },
  {
    title: 'Tier 3 - Business Quality',
    icon: <BalanceIcon />,
    color: 'warning',
    bullets: [
      'OPM > 15% and stable',
      'Revenue Growth (3Y) > 8%',
      'Interest Coverage > 5x',
      'Debtor Days < 45',
    ],
    note: 'This checks that the business is still healthy and not a value trap.',
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

const ValueAnalysisPage: NextPage = () => {
  const router = useRouter()
  const [workspaceOpen, setWorkspaceOpen] = useState(true)
  const [candidatesOpen, setCandidatesOpen] = useState(false)
  const [rows, setRows] = useState<ValueRow[]>([])
  const [tierBuckets, setTierBuckets] = useState({
    tier1: [] as ValueRow[],
    tier2: [] as ValueRow[],
    tier3: [] as ValueRow[],
    tier4: [] as ValueRow[],
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
      const res = await axiosInstance.get(ENDURL.GET_STOCK_VALUE_ANALYSIS, {
        params: {
          limit,
          grade: gradeFilter,
          minScore: minScoreFilter === '' ? undefined : Number(minScoreFilter),
        },
      })
      const payload = (res?.data?.data || {}) as ValueAnalysisResponse
      setRows(Array.isArray(payload.rows) ? payload.rows : [])
      setTierBuckets({
        tier1: Array.isArray(payload?.buckets?.tier1) ? payload.buckets.tier1 : [],
        tier2: Array.isArray(payload?.buckets?.tier2) ? payload.buckets.tier2 : [],
        tier3: Array.isArray(payload?.buckets?.tier3) ? payload.buckets.tier3 : [],
        tier4: Array.isArray(payload?.buckets?.tier4) ? payload.buckets.tier4 : [],
      })
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load Value Analysis')
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
        if (recommendation.includes('Deep')) acc.strong += 1
        else if (recommendation.includes('Value')) acc.buy += 1
        else if (recommendation.includes('Watch')) acc.watch += 1
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

  const getTierRules = (row: ValueRow, tier: 'T1' | 'T2' | 'T3' | 'T4') => {
    if (tier === 'T1') {
      return [
        { label: 'ROCE', value: formatPercent(row?.value_metrics?.roce), target: '> 15%', status: row?.analysis?.flags?.roce_gt_15 ? 'Pass' : 'Fail', color: row?.analysis?.flags?.roce_gt_15 ? 'success' : 'error' },
        { label: 'ROE', value: formatPercent(row?.value_metrics?.roe), target: '> 15%', status: row?.analysis?.flags?.roe_gt_15 ? 'Pass' : 'Fail', color: row?.analysis?.flags?.roe_gt_15 ? 'success' : 'error' },
        { label: 'Debt / Equity', value: formatRatio(row?.value_metrics?.debt_to_equity), target: '< 1.5', status: row?.analysis?.flags?.debt_to_equity_lt_15 ? 'Pass' : 'Fail', color: row?.analysis?.flags?.debt_to_equity_lt_15 ? 'success' : 'error' },
        { label: 'Operating Cash Flow', value: row?.analysis?.flags?.ocf_positive_last_3_years ? 'Positive 3/3 years' : 'Negative in 1+ year', target: 'Positive in last 3 years', status: row?.analysis?.flags?.ocf_positive_last_3_years ? 'Pass' : 'Fail', color: row?.analysis?.flags?.ocf_positive_last_3_years ? 'success' : 'error' },
        { label: 'Promoter Holding', value: formatPercent(row?.value_metrics?.promoters), target: '> 35%', status: row?.analysis?.flags?.promoter_holding_gt_35 ? 'Pass' : 'Fail', color: row?.analysis?.flags?.promoter_holding_gt_35 ? 'success' : 'error' },
        { label: 'Promoter Single Quarter Drop', value: row?.analysis?.metrics?.promoter_max_quarter_drop_4q !== null && row?.analysis?.metrics?.promoter_max_quarter_drop_4q !== undefined ? `${Number(row?.analysis?.metrics?.promoter_max_quarter_drop_4q).toFixed(2)} pp max drop` : '?', target: '< 3% drop in any quarter', status: row?.analysis?.flags?.promoter_single_quarter_drop_lt_3 ? 'Pass' : 'Fail', color: row?.analysis?.flags?.promoter_single_quarter_drop_lt_3 ? 'success' : 'error' },
        { label: 'Promoter Net 4Q Change', value: row?.analysis?.metrics?.promoter_net_change_4q !== null && row?.analysis?.metrics?.promoter_net_change_4q !== undefined ? formatChange(row?.analysis?.metrics?.promoter_net_change_4q) : '?', target: '> -5% over 4Q', status: row?.analysis?.flags?.promoter_net_change_gt_minus_5 ? 'Pass' : 'Fail', color: row?.analysis?.flags?.promoter_net_change_gt_minus_5 ? 'success' : 'error' },
        { label: 'Company Age', value: row?.value_metrics?.company_age_years !== null && row?.value_metrics?.company_age_years !== undefined ? `${Number(row?.value_metrics?.company_age_years).toFixed(1)} yrs` : '?', target: '> 5 years', status: row?.analysis?.flags?.company_age_gt_5 ? 'Pass' : 'Fail', color: row?.analysis?.flags?.company_age_gt_5 ? 'success' : 'error' },
        { label: 'Consistent Profit', value: row?.analysis?.flags?.consistent_profit_last_3_years ? 'Yes' : 'No', target: 'Profit positive last 3 years', status: row?.analysis?.flags?.consistent_profit_last_3_years ? 'Pass' : 'Fail', color: row?.analysis?.flags?.consistent_profit_last_3_years ? 'success' : 'error' },
      ]
    }

    if (tier === 'T2') {
      return [
        { label: 'P/E vs Industry', value: formatRatio(row?.value_metrics?.pe_vs_industry), target: '< 0.70x industry avg', status: row?.analysis?.flags?.pe_vs_industry_full ? 'Full' : row?.analysis?.flags?.pe_vs_industry_partial ? 'Partial' : 'Fail', color: row?.analysis?.flags?.pe_vs_industry_full ? 'success' : row?.analysis?.flags?.pe_vs_industry_partial ? 'warning' : 'error' },
        { label: 'Price to Book', value: formatNumber(row?.value_metrics?.price_to_book), target: '< 1.5', status: row?.analysis?.flags?.pb_full ? 'Full' : row?.analysis?.flags?.pb_partial ? 'Partial' : 'Fail', color: row?.analysis?.flags?.pb_full ? 'success' : row?.analysis?.flags?.pb_partial ? 'warning' : 'error' },
        { label: 'EV / EBITDA', value: formatNumber(row?.value_metrics?.ev_ebitda), target: '< 10', status: row?.analysis?.flags?.ev_ebitda_full ? 'Full' : row?.analysis?.flags?.ev_ebitda_partial ? 'Partial' : 'Fail', color: row?.analysis?.flags?.ev_ebitda_full ? 'success' : row?.analysis?.flags?.ev_ebitda_partial ? 'warning' : 'error' },
        { label: 'Dividend Yield', value: formatPercent(row?.value_metrics?.dividend_yield), target: '> 2%', status: row?.analysis?.flags?.dividend_full ? 'Full' : row?.analysis?.flags?.dividend_partial ? 'Partial' : 'Fail', color: row?.analysis?.flags?.dividend_full ? 'success' : row?.analysis?.flags?.dividend_partial ? 'warning' : 'error' },
        { label: 'Price to Sales', value: formatNumber(row?.value_metrics?.price_to_sales), target: '< 1.5', status: row?.analysis?.flags?.price_to_sales_full ? 'Full' : row?.analysis?.flags?.price_to_sales_partial ? 'Partial' : 'Fail', color: row?.analysis?.flags?.price_to_sales_full ? 'success' : row?.analysis?.flags?.price_to_sales_partial ? 'warning' : 'error' },
      ]
    }

    if (tier === 'T3') {
      return [
        { label: 'OPM', value: formatPercent(row?.value_metrics?.opm_percent), target: '> 15% and stable', status: row?.analysis?.flags?.opm_full ? 'Full' : row?.analysis?.flags?.opm_partial ? 'Partial' : 'Fail', color: row?.analysis?.flags?.opm_full ? 'success' : row?.analysis?.flags?.opm_partial ? 'warning' : 'error' },
        { label: 'Revenue Growth (3Y)', value: formatPercent(row?.value_metrics?.revenue_cagr_3y), target: '> 8%', status: row?.analysis?.flags?.revenue_growth_strong ? 'Full' : row?.analysis?.flags?.revenue_growth_partial ? 'Partial' : 'Fail', color: row?.analysis?.flags?.revenue_growth_strong ? 'success' : row?.analysis?.flags?.revenue_growth_partial ? 'warning' : 'error' },
        { label: 'Interest Coverage', value: formatNumber(row?.value_metrics?.interest_coverage), target: '> 5x', status: row?.analysis?.flags?.interest_coverage_full ? 'Full' : row?.analysis?.flags?.interest_coverage_partial ? 'Partial' : 'Fail', color: row?.analysis?.flags?.interest_coverage_full ? 'success' : row?.analysis?.flags?.interest_coverage_partial ? 'warning' : 'error' },
        { label: 'Debtor Days', value: formatNumber(row?.value_metrics?.debtor_days), target: '< 45 days', status: row?.analysis?.flags?.debtor_days_full ? 'Full' : row?.analysis?.flags?.debtor_days_partial ? 'Partial' : 'Fail', color: row?.analysis?.flags?.debtor_days_full ? 'success' : row?.analysis?.flags?.debtor_days_partial ? 'warning' : 'error' },
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

  const renderTierTable = (tableRows: ValueRow[], emptyLabel: string, tier: 'T1' | 'T2' | 'T3' | 'T4') => {
    const headers: Record<'T1' | 'T2' | 'T3' | 'T4', string[]> = {
      T1: ['Grade', 'Score', 'Symbol', 'Company', 'ROCE', 'ROE', 'D/E', 'OCF', 'Promoter %', 'Age', 'Profit', 'Pass'],
      T2: ['Grade', 'Score', 'Symbol', 'Company', 'P/E vs Ind.', 'P/B', 'EV/EBITDA', 'Dividend', 'P/S', 'Tier 2'],
      T3: ['Grade', 'Score', 'Symbol', 'Company', 'OPM', 'Revenue CAGR', 'Interest Cov.', 'Debtor Days', 'Tier 3'],
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
                        <TableCell>{formatPercent(row?.value_metrics?.roce)}</TableCell>
                        <TableCell>{formatPercent(row?.value_metrics?.roe)}</TableCell>
                        <TableCell>{formatRatio(row?.value_metrics?.debt_to_equity)}</TableCell>
                        <TableCell>{row?.analysis?.flags?.ocf_positive_last_3_years ? 'Yes' : 'No'}</TableCell>
                        <TableCell>{formatPercent(row?.value_metrics?.promoters)}</TableCell>
                        <TableCell>{row?.value_metrics?.company_age_years !== null ? `${Number(row?.value_metrics?.company_age_years).toFixed(1)} yrs` : '?'}</TableCell>
                        <TableCell>{row?.analysis?.flags?.consistent_profit_last_3_years ? 'Yes' : 'No'}</TableCell>
                        <TableCell>
                          <Chip label={row?.analysis?.flags?.tier1_passed ? 'Pass' : 'Fail'} size='small' color={row?.analysis?.flags?.tier1_passed ? 'success' : 'error'} />
                        </TableCell>
                      </>
                    ) : tier === 'T2' ? (
                      <>
                        <TableCell>{formatRatio(row?.value_metrics?.pe_vs_industry)}</TableCell>
                        <TableCell>{formatNumber(row?.value_metrics?.price_to_book)}</TableCell>
                        <TableCell>{formatNumber(row?.value_metrics?.ev_ebitda)}</TableCell>
                        <TableCell>{formatPercent(row?.value_metrics?.dividend_yield)}</TableCell>
                        <TableCell>{formatNumber(row?.value_metrics?.price_to_sales)}</TableCell>
                        <TableCell>{Number(row?.analysis?.tier_scores?.tier2 || 0)}</TableCell>
                      </>
                    ) : tier === 'T3' ? (
                      <>
                        <TableCell>{formatPercent(row?.value_metrics?.opm_percent)}</TableCell>
                        <TableCell>{formatPercent(row?.value_metrics?.revenue_cagr_3y)}</TableCell>
                        <TableCell>{formatNumber(row?.value_metrics?.interest_coverage)}</TableCell>
                        <TableCell>{formatNumber(row?.value_metrics?.debtor_days)}</TableCell>
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

  const renderVALUETable = (tableRows: ValueRow[], emptyLabel: string, focusTier?: 'T1' | 'T2' | 'T3' | 'T4') => (
    <TableContainer component={Paper} variant='outlined' sx={{ borderRadius: 2 }}>
      <Table size='small'>
        <TableHead>
          <TableRow>
            <TableCell>Grade</TableCell>
            <TableCell>Score</TableCell>
            <TableCell>Symbol</TableCell>
            <TableCell>Company</TableCell>
            <TableCell>P/E vs Industry</TableCell>
            <TableCell>Price / Book</TableCell>
            <TableCell>EV / EBITDA</TableCell>
            <TableCell>Dividend Yield</TableCell>
            <TableCell>Price / Sales</TableCell>
            <TableCell>ROE</TableCell>
            <TableCell>ROCE</TableCell>
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
                  <TableCell>{formatRatio(row?.value_metrics?.pe_vs_industry)}</TableCell>
                  <TableCell>{formatNumber(row?.value_metrics?.price_to_book)}</TableCell>
                  <TableCell>{formatNumber(row?.value_metrics?.ev_ebitda)}</TableCell>
                  <TableCell>{formatPercent(row?.value_metrics?.dividend_yield)}</TableCell>
                  <TableCell>{formatNumber(row?.value_metrics?.price_to_sales)}</TableCell>
                  <TableCell>{formatPercent(row?.value_metrics?.roe)}</TableCell>
                  <TableCell>{formatPercent(row?.value_metrics?.roce)}</TableCell>
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
                  <TableCell colSpan={13} sx={{ py: 0, borderBottom: expanded ? 'none' : undefined }}>
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
                                    value: formatPercent(row?.value_metrics?.roce),
                                    target: '> 15%',
                                    status: row?.analysis?.flags?.roce_gt_15 ? 'Pass' : 'Fail',
                                    color: row?.analysis?.flags?.roce_gt_15 ? 'success' : 'error',
                                  },
                                  {
                                    tier: 'T1',
                                    label: 'ROE',
                                    value: formatPercent(row?.value_metrics?.roe),
                                    target: '> 15%',
                                    status: row?.analysis?.flags?.roe_gt_15 ? 'Pass' : 'Fail',
                                    color: row?.analysis?.flags?.roe_gt_15 ? 'success' : 'error',
                                  },
                                  {
                                    tier: 'T1',
                                    label: 'Debt / Equity',
                                    value: formatRatio(row?.value_metrics?.debt_to_equity),
                                    target: '< 1.5',
                                    status: row?.analysis?.flags?.debt_to_equity_lt_15 ? 'Pass' : 'Fail',
                                    color: row?.analysis?.flags?.debt_to_equity_lt_15 ? 'success' : 'error',
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
                                    value: formatPercent(row?.value_metrics?.promoters),
                                    target: '> 35%',
                                    status: row?.analysis?.flags?.promoter_holding_gt_35 ? 'Pass' : 'Fail',
                                    color: row?.analysis?.flags?.promoter_holding_gt_35 ? 'success' : 'error',
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
                                    label: 'P/E vs Industry',
                                    value: formatRatio(row?.value_metrics?.pe_vs_industry),
                                    target: '< 0.70x industry avg',
                                    status: row?.analysis?.flags?.pe_vs_industry_full ? 'Full' : row?.analysis?.flags?.pe_vs_industry_partial ? 'Partial' : 'Fail',
                                    color: row?.analysis?.flags?.pe_vs_industry_full ? 'success' : row?.analysis?.flags?.pe_vs_industry_partial ? 'warning' : 'error',
                                  },
                                  {
                                    tier: 'T2',
                                    label: 'Price / Book',
                                    value: formatNumber(row?.value_metrics?.price_to_book),
                                    target: '< 1.5',
                                    status: row?.analysis?.flags?.pb_full ? 'Full' : row?.analysis?.flags?.pb_partial ? 'Partial' : 'Fail',
                                    color: row?.analysis?.flags?.pb_full ? 'success' : row?.analysis?.flags?.pb_partial ? 'warning' : 'error',
                                  },
                                  {
                                    tier: 'T2',
                                    label: 'EV / EBITDA',
                                    value: formatNumber(row?.value_metrics?.ev_ebitda),
                                    target: '< 10',
                                    status: row?.analysis?.flags?.ev_ebitda_full ? 'Full' : row?.analysis?.flags?.ev_ebitda_partial ? 'Partial' : 'Fail',
                                    color: row?.analysis?.flags?.ev_ebitda_full ? 'success' : row?.analysis?.flags?.ev_ebitda_partial ? 'warning' : 'error',
                                  },
                                  {
                                    tier: 'T2',
                                    label: 'Dividend Yield',
                                    value: formatPercent(row?.value_metrics?.dividend_yield),
                                    target: '> 2%',
                                    status: row?.analysis?.flags?.dividend_full ? 'Full' : row?.analysis?.flags?.dividend_partial ? 'Partial' : 'Fail',
                                    color: row?.analysis?.flags?.dividend_full ? 'success' : row?.analysis?.flags?.dividend_partial ? 'warning' : 'error',
                                  },
                                  {
                                    tier: 'T2',
                                    label: 'Price / Sales',
                                    value: formatNumber(row?.value_metrics?.price_to_sales),
                                    target: '< 1.5',
                                    status: row?.analysis?.flags?.price_to_sales_full ? 'Full' : row?.analysis?.flags?.price_to_sales_partial ? 'Partial' : 'Fail',
                                    color: row?.analysis?.flags?.price_to_sales_full ? 'success' : row?.analysis?.flags?.price_to_sales_partial ? 'warning' : 'error',
                                  },
                                  {
                                    tier: 'T3',
                                    label: 'OPM',
                                    value: formatPercent(row?.value_metrics?.opm_percent),
                                    target: '> 15% and stable',
                                    status:
                                      row?.analysis?.flags?.opm_full
                                        ? 'Full'
                                        : row?.analysis?.flags?.opm_partial
                                          ? 'Partial'
                                          : 'Fail',
                                    color:
                                      row?.analysis?.flags?.opm_full
                                        ? 'success'
                                        : row?.analysis?.flags?.opm_partial
                                          ? 'warning'
                                          : 'error',
                                  },
                                  {
                                    tier: 'T3',
                                    label: 'Revenue Growth (3Y)',
                                    value: formatPercent(row?.value_metrics?.revenue_cagr_3y),
                                    target: '> 8%',
                                    status:
                                      row?.analysis?.flags?.revenue_growth_strong
                                        ? 'Full'
                                        : row?.analysis?.flags?.revenue_growth_partial
                                          ? 'Partial'
                                          : 'Fail',
                                    color:
                                      row?.analysis?.flags?.revenue_growth_strong
                                        ? 'success'
                                        : row?.analysis?.flags?.revenue_growth_partial
                                          ? 'warning'
                                          : 'error',
                                  },
                                  {
                                    tier: 'T3',
                                    label: 'Interest Coverage',
                                    value: formatNumber(row?.value_metrics?.interest_coverage),
                                    target: '> 5x',
                                    status:
                                      row?.analysis?.flags?.interest_coverage_full
                                        ? 'Full'
                                        : row?.analysis?.flags?.interest_coverage_partial
                                          ? 'Partial'
                                          : 'Fail',
                                    color:
                                      row?.analysis?.flags?.interest_coverage_full
                                        ? 'success'
                                        : row?.analysis?.flags?.interest_coverage_partial
                                          ? 'warning'
                                          : 'error',
                                  },
                                  {
                                    tier: 'T3',
                                    label: 'Debtor Days',
                                    value: formatNumber(row?.value_metrics?.debtor_days),
                                    target: '< 45 days',
                                    status:
                                      row?.analysis?.flags?.debtor_days_full
                                        ? 'Full'
                                        : row?.analysis?.flags?.debtor_days_partial
                                          ? 'Partial'
                                          : 'Fail',
                                    color:
                                      row?.analysis?.flags?.debtor_days_full
                                        ? 'success'
                                        : row?.analysis?.flags?.debtor_days_partial
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

                        {Array.isArray(row?.analysis?.warnings) && row.analysis.warnings.length ? (
                          <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap sx={{ mt: 1.5, mb: 1.5 }}>
                            <Chip label='Warnings' size='small' color='warning' />
                            {row.analysis.warnings.map((warning) => (
                              <Chip
                                key={`${warning.code || warning.title}`}
                                label={`${warning.code || 'W'}: ${warning.title || 'Warning'}`}
                                size='small'
                                color={
                                  warning.severity === 'critical'
                                    ? 'error'
                                    : warning.severity === 'moderate'
                                      ? 'warning'
                                      : 'default'
                                }
                              />
                            ))}
                          </Stack>
                        ) : null}

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
              <TableCell colSpan={13}>
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
                <Chip label='VALUE Screener' color='success' size='small' sx={{ mb: 2 }} />
                <Typography variant='h3' sx={{ color: 'common.white', fontWeight: 700, mb: 1.5 }}>
                  Deep Value Investing
                </Typography>
                <Typography variant='body1' sx={{ color: 'rgba(255,255,255,0.76)', maxWidth: 860 }}>
                  Backend scans the full VALID universe and ranks only the stocks that pass the Tier 1 quality gates.
                  The score then combines valuation, business quality, and sentiment to surface practical value candidates.
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
                      <Chip label='Value filters second' color='primary' size='small' />
                      <Chip label='Quality + sentiment' color='warning' size='small' />
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
              <Typography variant='h6'>Value Analysis Workspace</Typography>
              <Chip label={`Qualified: ${rows.length}`} size='small' />
              <Chip label={`Deep Value Buy: ${summary.strong}`} size='small' color='success' />
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
                      <MenuItem value='DEEP VALUE BUY'>Deep Value Buy</MenuItem>
                      <MenuItem value='VALUE BUY'>Value Buy</MenuItem>
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
                    <Chip label={`Deep Value Buy: ${summary.strong}`} color='success' />
                    <Chip label={`Value Buy: ${summary.buy}`} color='primary' />
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
                    <CardContent>{renderVALUETable(rows, 'No Value candidates matched the current backend rules.')}</CardContent>
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

export default ValueAnalysisPage


