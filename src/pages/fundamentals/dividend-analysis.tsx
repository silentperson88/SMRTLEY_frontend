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
import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import RefreshIcon from '@mui/icons-material/Refresh'
import TuneIcon from '@mui/icons-material/Tune'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import SavingsIcon from '@mui/icons-material/Savings'
import AccountTreeIcon from '@mui/icons-material/AccountTree'
import ShowChartIcon from '@mui/icons-material/ShowChart'

type DividendRow = {
  master_id?: string | number | null
  symbol?: string | null
  name?: string | null
  exchange?: string | null
  screener_status?: string | null
  company_name?: string | null
  dividend_yield?: number | null
  roe?: number | null
  roce?: number | null
  roe_percent?: number | null
  roce_percent?: number | null
  latest_profit_period?: string | null
  latest_cash_period?: string | null
  latest_balance_period?: string | null
  dividend_payout_percent?: string | number | null
  positive_profit_periods?: number | null
  total_profit_periods?: number | null
  positive_cash_periods?: number | null
  total_cash_periods?: number | null
  latest_borrowings?: number | null
  latest_reserves?: number | null
  latest_total_liabilities?: number | null
  latest_total_assets?: number | null
  analysis?: {
    score?: number
    grade?: string
    recommendation?: string
    reasons?: string[]
    metrics?: Record<string, number | null>
    flags?: Record<string, boolean>
    core_filters?: Record<string, boolean>
    passes_core_filters?: boolean
  }
}

type DividendAnalysisResponse = {
  rows?: DividendRow[]
  total?: number
}

const DEFAULT_LIMIT = 120
const DEFAULT_MIN_SCORE = 0
const DEFAULT_MIN_YIELD = 0
const DEFAULT_MIN_ROE = 0
const DEFAULT_MIN_ROCE = 0

const getNumeric = (value: unknown) => {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  
return Number.isFinite(parsed) ? parsed : null
}

const formatNumber = (value: unknown, digits = 2) => {
  const numeric = getNumeric(value)
  if (numeric === null) return '—'
  
return numeric.toFixed(digits)
}

const formatPercent = (value: unknown) => {
  const numeric = getNumeric(value)
  if (numeric === null) return '—'
  
return `${numeric.toFixed(2)}%`
}

const gradeColor = (grade?: string) => {
  switch ((grade || '').toUpperCase()) {
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

const DividendAnalysisPage: NextPage = () => {
  const router = useRouter()
  const [workspaceOpen, setWorkspaceOpen] = useState(true)
  const [rows, setRows] = useState<DividendRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [limit, setLimit] = useState(DEFAULT_LIMIT)
  const [minScore, setMinScore] = useState(DEFAULT_MIN_SCORE)
  const [minYield, setMinYield] = useState(DEFAULT_MIN_YIELD)
  const [minRoe, setMinRoe] = useState(DEFAULT_MIN_ROE)
  const [minRoce, setMinRoce] = useState(DEFAULT_MIN_ROCE)
  const [expandedSymbol, setExpandedSymbol] = useState<string | null>(null)
  const [showOnlyPassing, setShowOnlyPassing] = useState(false)

  const loadAnalysis = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const res = await axiosInstance.get(ENDURL.GET_STOCK_DIVIDEND_ANALYSIS, {
        params: { limit },
      })
      const payload = (res?.data?.data || {}) as DividendAnalysisResponse
      setRows(Array.isArray(payload.rows) ? payload.rows : [])
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load dividend analysis')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [limit])

  useEffect(() => {
    loadAnalysis()
  }, [loadAnalysis])

  const filteredRows = useMemo(() => {
    const minScoreValue = Number(minScore || 0)
    const minYieldValue = Number(minYield || 0)
    const minRoeValue = Number(minRoe || 0)
    const minRoceValue = Number(minRoce || 0)

    return [...rows]
      .filter(row => {
        const score = Number(row?.analysis?.score || 0)
        const dividendYield = Number(row?.analysis?.metrics?.dividend_yield ?? row?.dividend_yield ?? 0)
        const roe = Number(row?.analysis?.metrics?.roe ?? row?.roe_percent ?? row?.roe ?? 0)
        const roce = Number(row?.analysis?.metrics?.roce ?? row?.roce_percent ?? row?.roce ?? 0)

        return (
          score >= minScoreValue &&
          dividendYield >= minYieldValue &&
          roe >= minRoeValue &&
          roce >= minRoceValue &&
          (!showOnlyPassing || Boolean(row?.analysis?.passes_core_filters))
        )
      })
      .sort((a, b) => {
        const scoreDiff = Number(b?.analysis?.score || 0) - Number(a?.analysis?.score || 0)
        if (scoreDiff !== 0) return scoreDiff
        const yieldDiff = Number(b?.analysis?.metrics?.dividend_yield ?? b?.dividend_yield ?? 0) - Number(a?.analysis?.metrics?.dividend_yield ?? a?.dividend_yield ?? 0)
        if (yieldDiff !== 0) return yieldDiff
        
return String(a?.symbol || '').localeCompare(String(b?.symbol || ''))
      })
  }, [rows, minScore, minYield, minRoe, minRoce, showOnlyPassing])

  const summary = useMemo(() => {
    return filteredRows.reduce(
      (acc, row) => {
        const grade = String(row?.analysis?.grade || 'D').toUpperCase()
        acc.total += 1
        acc.byGrade[grade] = (acc.byGrade[grade] || 0) + 1
        
return acc
      },
      { total: 0, byGrade: {} as Record<string, number> },
    )
  }, [filteredRows])

  const resetFilters = () => {
    setLimit(DEFAULT_LIMIT)
    setMinScore(DEFAULT_MIN_SCORE)
    setMinYield(DEFAULT_MIN_YIELD)
    setMinRoe(DEFAULT_MIN_ROE)
    setMinRoce(DEFAULT_MIN_ROCE)
    setShowOnlyPassing(false)
  }

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
                <Chip label='Dividend Dashboard' color='success' size='small' sx={{ mb: 2 }} />
                <Typography variant='h3' sx={{ color: 'common.white', fontWeight: 700, mb: 1.5 }}>
                  Rank Dividend Candidates by Quality and Safety
                </Typography>
                <Typography variant='body1' sx={{ color: 'rgba(255,255,255,0.76)', maxWidth: 780 }}>
                  We score dividend candidates using yield, payout behavior, profit trend, cash flow, ROE, ROCE, and
                  balance-sheet comfort. This scans the full VALID stock universe and ranks it, instead of using a
                  small sample.
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card sx={{ bgcolor: 'rgba(8, 14, 26, 0.75)', border: '1px solid rgba(255,255,255,0.13)' }}>
                  <CardContent>
                    <Typography variant='caption' sx={{ color: 'rgba(255,255,255,0.65)' }}>
                      Current logic
                    </Typography>
                    <Stack spacing={1.25} sx={{ mt: 1 }}>
                      <Chip label='Yield + Quality' color='primary' size='small' />
                      <Chip label='Profit + Cash Flow' color='success' size='small' />
                      <Chip label='Debt Comfort' color='warning' size='small' />
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Accordion expanded={workspaceOpen} onChange={(_, expanded) => setWorkspaceOpen(expanded)}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap' }}>
              <TuneIcon fontSize='small' />
              <Typography variant='h6'>Dividend Analysis Workspace</Typography>
              <Chip label={`Loaded: ${rows.length}`} size='small' />
              <Chip label={`Passing: ${summary.total}`} size='small' color='primary' />
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={4}>
              <Card sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Stack
                    direction={{ xs: 'column', md: 'row' }}
                    spacing={2}
                    alignItems={{ xs: 'stretch', md: 'flex-end' }}
                    sx={{ flexWrap: 'wrap' }}
                  >
                    <TextField
                      label='Limit'
                      type='number'
                      value={limit}
                      onChange={event => setLimit(Number(event.target.value || DEFAULT_LIMIT))}
                      sx={{ width: 140 }}
                    />
                    <TextField
                      label='Min Score'
                      type='number'
                      value={minScore}
                      onChange={event => setMinScore(Number(event.target.value || 0))}
                      sx={{ width: 140 }}
                    />
                    <TextField
                      label='Min Yield %'
                      type='number'
                      value={minYield}
                      onChange={event => setMinYield(Number(event.target.value || 0))}
                      sx={{ width: 140 }}
                    />
                    <TextField
                      label='Min ROE %'
                      type='number'
                      value={minRoe}
                      onChange={event => setMinRoe(Number(event.target.value || 0))}
                      sx={{ width: 140 }}
                    />
                    <TextField
                      label='Min ROCE %'
                      type='number'
                      value={minRoce}
                      onChange={event => setMinRoce(Number(event.target.value || 0))}
                      sx={{ width: 140 }}
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={showOnlyPassing}
                          onChange={event => setShowOnlyPassing(event.target.checked)}
                        />
                      }
                      label='Show only passing'
                    />
                    <Stack direction='row' spacing={1} sx={{ ml: { md: 'auto' }, flexWrap: 'wrap' }}>
                      <Button variant='outlined' startIcon={<RefreshIcon />} onClick={loadAnalysis} disabled={loading}>
                        Reload
                      </Button>
                      <Button variant='text' onClick={resetFilters}>
                        Reset Filters
                      </Button>
                    </Stack>
                  </Stack>
                  <Divider sx={{ my: 3 }} />
                  <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                    <Chip label={`A: ${summary.byGrade.A || 0}`} color='success' />
                    <Chip label={`B: ${summary.byGrade.B || 0}`} color='primary' />
                    <Chip label={`C: ${summary.byGrade.C || 0}`} color='warning' />
                    <Chip label={`D: ${summary.byGrade.D || 0}`} color='error' />
                    <Chip label={`Visible: ${summary.total}`} variant='outlined' />
                  </Stack>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant='caption' color='text.secondary'>
                      Core pass rules
                    </Typography>
                    <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap sx={{ mt: 1 }}>
                      <Chip label='Yield >= 2.5%' variant='outlined' />
                      <Chip label='Payout ratio 20% - 60%' variant='outlined' />
                      <Chip label='Debt / Equity < 1' variant='outlined' />
                      <Chip label='5y profit CAGR > 8%' variant='outlined' />
                    </Stack>
                  </Box>
                  {error ? (
                    <Alert severity='error' sx={{ mt: 2 }}>
                      {error}
                    </Alert>
                  ) : null}
                </CardContent>
              </Card>

              <Card sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Stack direction='row' alignItems='center' justifyContent='space-between' sx={{ mb: 2 }}>
                    <Box>
                      <Typography variant='h6'>Dividend Candidates</Typography>
                      <Typography variant='body2' color='text.secondary'>
                        Ranked from strongest dividend profile to weakest after your filters.
                      </Typography>
                    </Box>
                    <Chip
                      icon={<SavingsIcon />}
                      label={loading ? 'Loading...' : `${filteredRows.length} stocks`}
                      color='primary'
                      variant='outlined'
                    />
                  </Stack>

                  <TableContainer component={Paper} variant='outlined' sx={{ borderRadius: 2 }}>
                    <Table size='small'>
                      <TableHead>
                        <TableRow>
                          <TableCell width={56} />
                          <TableCell>Grade</TableCell>
                          <TableCell>Recommendation</TableCell>
                          <TableCell>Score</TableCell>
                          <TableCell>Symbol</TableCell>
                          <TableCell>Company</TableCell>
                          <TableCell align='right'>Yield</TableCell>
                          <TableCell align='right'>ROE</TableCell>
                          <TableCell align='right'>ROCE</TableCell>
                          <TableCell align='right'>Payout</TableCell>
                          <TableCell>Core Pass</TableCell>
                          <TableCell>Consistency</TableCell>
                          <TableCell>Action</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredRows.map(row => {
                          const score = Number(row?.analysis?.score || 0)
                          const grade = String(row?.analysis?.grade || 'D').toUpperCase()
                          const recommendation = String(row?.analysis?.recommendation || 'Dividend Weak')
                          const yieldPct = row?.analysis?.metrics?.dividend_yield ?? row?.dividend_yield
                          const roe = row?.analysis?.metrics?.roe ?? row?.roe_percent ?? row?.roe
                          const roce = row?.analysis?.metrics?.roce ?? row?.roce_percent ?? row?.roce
                          const payout = row?.analysis?.metrics?.payout_ratio ?? getNumeric(row?.dividend_payout_percent)
                          const passesCore = Boolean(row?.analysis?.passes_core_filters)
                          const profitConsistent = Number(row?.analysis?.metrics?.positive_profit_periods || 0)
                          const totalProfit = Number(row?.analysis?.metrics?.total_profit_periods || 0)
                          const cashConsistent = Number(row?.analysis?.metrics?.positive_cash_periods || 0)
                          const totalCash = Number(row?.analysis?.metrics?.total_cash_periods || 0)
                          const rowKey = String(row?.symbol || row?.master_id || '')
                          const isExpanded = expandedSymbol === rowKey

                          return (
                            <Fragment key={rowKey}>
                              <TableRow hover sx={{ cursor: 'pointer' }}>
                                <TableCell>
                                  <IconButton size='small' onClick={() => setExpandedSymbol(isExpanded ? null : rowKey)}>
                                    <ExpandMoreIcon
                                      style={{
                                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                        transition: 'transform 0.2s ease',
                                      }}
                                    />
                                  </IconButton>
                                </TableCell>
                                <TableCell>
                                  <Chip label={grade} color={gradeColor(grade) as any} size='small' />
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={recommendation}
                                    size='small'
                                    color={
                                      recommendation.includes('Strong')
                                        ? 'success'
                                        : recommendation.includes('Watchlist')
                                          ? 'warning'
                                          : recommendation.includes('Risk')
                                            ? 'error'
                                            : 'default'
                                    }
                                    variant='outlined'
                                  />
                                </TableCell>
                                <TableCell>{score}</TableCell>
                                <TableCell>
                                  <Stack>
                                    <Typography variant='subtitle2'>{row?.symbol || '—'}</Typography>
                                    <Typography variant='caption' color='text.secondary'>
                                      {row?.exchange || ''}
                                    </Typography>
                                  </Stack>
                                </TableCell>
                                <TableCell>{row?.company_name || row?.name || '—'}</TableCell>
                                <TableCell align='right'>{formatPercent(yieldPct)}</TableCell>
                                <TableCell align='right'>{formatPercent(roe)}</TableCell>
                                <TableCell align='right'>{formatPercent(roce)}</TableCell>
                                <TableCell align='right'>{formatPercent(payout)}</TableCell>
                                <TableCell>
                                  <Chip
                                    label={passesCore ? 'PASS' : 'FAIL'}
                                    size='small'
                                    color={passesCore ? 'success' : 'error'}
                                    variant={passesCore ? 'filled' : 'outlined'}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Stack direction='row' spacing={0.5} flexWrap='wrap' useFlexGap>
                                    <Chip label={`${profitConsistent}/${totalProfit}`} size='small' variant='outlined' />
                                    <Chip label={`${cashConsistent}/${totalCash}`} size='small' variant='outlined' />
                                  </Stack>
                                </TableCell>
                                <TableCell>
                                  <Stack direction='row' spacing={1}>
                                    <Button
                                      size='small'
                                      variant='outlined'
                                      startIcon={<OpenInNewIcon />}
                                      onClick={() => router.push(`/stock-fundamental-structured/${encodeURIComponent(String(row?.symbol || ''))}`)}
                                    >
                                      Open
                                    </Button>
                                  </Stack>
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell colSpan={13} sx={{ py: 0, borderBottom: isExpanded ? 'none' : undefined }}>
                                  <Collapse in={isExpanded} timeout='auto' unmountOnExit>
                                    <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2, my: 1.5 }}>
                                      <Stack spacing={1.5}>
                                        <Box>
                                          <Typography variant='subtitle2' sx={{ mb: 0.75 }}>
                                            Why this stock scored this way
                                          </Typography>
                                          <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                                            {(row?.analysis?.reasons || []).map(reason => (
                                              <Chip key={reason} label={reason} size='small' variant='outlined' />
                                            ))}
                                          </Stack>
                                        </Box>
                                        <Divider />
                                        <Grid container spacing={2}>
                                          <Grid item xs={12} md={4}>
                                            <Typography variant='caption' color='text.secondary'>
                                              Latest periods
                                            </Typography>
                                            <Stack spacing={0.75} sx={{ mt: 0.75 }}>
                                              <Typography variant='body2'>
                                                Profit: {row?.latest_profit_period || '—'}
                                              </Typography>
                                              <Typography variant='body2'>
                                                Cash Flow: {row?.latest_cash_period || '—'}
                                              </Typography>
                                              <Typography variant='body2'>
                                                Balance Sheet: {row?.latest_balance_period || '—'}
                                              </Typography>
                                            </Stack>
                                          </Grid>
                                          <Grid item xs={12} md={4}>
                                            <Typography variant='caption' color='text.secondary'>
                                              Core metrics
                                            </Typography>
                                            <Stack spacing={0.75} sx={{ mt: 0.75 }}>
                                              <Typography variant='body2'>
                                                Dividend Yield: {formatPercent(yieldPct)}
                                              </Typography>
                                              <Typography variant='body2'>
                                                ROE / ROCE: {formatPercent(roe)} / {formatPercent(roce)}
                                              </Typography>
                                              <Typography variant='body2'>
                                                Payout Ratio: {formatPercent(payout)}
                                              </Typography>
                                              <Typography variant='body2'>
                                                5y Profit CAGR: {formatPercent(row?.analysis?.metrics?.profit_cagr_5y)}
                                              </Typography>
                                            </Stack>
                                          </Grid>
                                          <Grid item xs={12} md={4}>
                                            <Typography variant='caption' color='text.secondary'>
                                              Balance sheet comfort
                                            </Typography>
                                            <Stack spacing={0.75} sx={{ mt: 0.75 }}>
                                              <Typography variant='body2'>
                                                Borrowings: {formatNumber(row?.latest_borrowings)}
                                              </Typography>
                                              <Typography variant='body2'>
                                                Reserves: {formatNumber(row?.latest_reserves)}
                                              </Typography>
                                              <Typography variant='body2'>
                                                Total Liabilities: {formatNumber(row?.latest_total_liabilities)}
                                              </Typography>
                                            </Stack>
                                          </Grid>
                                        </Grid>
                                        <Divider />
                                        <Box>
                                          <Typography variant='caption' color='text.secondary'>
                                            Core filter results
                                          </Typography>
                                          <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap sx={{ mt: 1 }}>
                                            {Object.entries(row?.analysis?.core_filters || {}).map(([key, value]) => (
                                              <Chip
                                                key={key}
                                                label={`${key}: ${value ? 'PASS' : 'FAIL'}`}
                                                size='small'
                                                color={value ? 'success' : 'error'}
                                                variant={value ? 'filled' : 'outlined'}
                                              />
                                            ))}
                                          </Stack>
                                        </Box>
                                      </Stack>
                                    </Box>
                                  </Collapse>
                                </TableCell>
                              </TableRow>
                            </Fragment>
                          )
                        })}
                        {!loading && filteredRows.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={13} align='center'>
                              No stocks matched the current filters.
                            </TableCell>
                  </TableRow>
                ) : null}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>

              <Card sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Stack direction='row' spacing={1} alignItems='center' sx={{ mb: 1.5 }}>
                    <ShowChartIcon fontSize='small' color='primary' />
                    <Typography variant='h6'>What We’re Ranking For</Typography>
                  </Stack>
                  <Stack spacing={1}>
                    <Typography variant='body2' color='text.secondary'>
                      1. Dividend yield that is meaningful, not just a one-off spike.
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      2. Profit and cash flow consistency so the dividend is actually supported by the business.
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      3. ROE / ROCE and debt comfort so the company can keep rewarding shareholders without stress.
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>

              <Card sx={{ borderRadius: 3, border: '1px dashed', borderColor: 'divider' }}>
                <CardContent>
                  <Stack direction='row' spacing={1} alignItems='center' sx={{ mb: 1.5 }}>
                    <AccountTreeIcon fontSize='small' color='primary' />
                    <Typography variant='h6'>Future Logic Blocks</Typography>
                  </Stack>
                  <Typography variant='body2' color='text.secondary' sx={{ mb: 1.5 }}>
                    This same collapsible workspace can later host more analysis modules without changing the page
                    structure.
                  </Typography>
                  <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                    <Chip label='Dividend Consistency' variant='outlined' />
                    <Chip label='Payout Safety' variant='outlined' />
                    <Chip label='Debt Safety' variant='outlined' />
                    <Chip label='Cash Flow Strength' variant='outlined' />
                    <Chip label='Growth Quality' variant='outlined' />
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          </AccordionDetails>
        </Accordion>
      </Grid>
    </Grid>
  )
}

export default DividendAnalysisPage
