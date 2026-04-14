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
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import RefreshIcon from '@mui/icons-material/Refresh'
import TuneIcon from '@mui/icons-material/Tune'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import ShowChartIcon from '@mui/icons-material/ShowChart'
import InsightsIcon from '@mui/icons-material/Insights'

type GrowthRow = {
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
  latest_borrowings?: number | null
  latest_reserves?: number | null
  latest_equity_capital?: number | null
  latest_total_liabilities?: number | null
  growth_metrics?: {
    sales_cagr_5y?: number | null
    profit_cagr_5y?: number | null
    roe?: number | null
    roce?: number | null
    debt_to_equity?: number | null
  }
  analysis?: {
    score?: number
    grade?: string
    recommendation?: string
    reasons?: string[]
    metrics?: Record<string, number | null>
    flags?: Record<string, boolean>
  }
}

type GrowthAnalysisResponse = {
  rows?: GrowthRow[]
  total?: number
}

const DEFAULT_LIMIT = 120

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

const recommendationColor = (recommendation?: string) => {
  const text = String(recommendation || '')
  if (text.includes('Strong')) return 'success'
  if (text.includes('Watchlist')) return 'warning'
  if (text.includes('Weak')) return 'error'
  return 'default'
}

const GrowthAnalysisPage: NextPage = () => {
  const router = useRouter()
  const [workspaceOpen, setWorkspaceOpen] = useState(true)
  const [rows, setRows] = useState<GrowthRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [limit, setLimit] = useState(DEFAULT_LIMIT)
  const [expandedSymbol, setExpandedSymbol] = useState<string | null>(null)

  const loadAnalysis = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const res = await axiosInstance.get(ENDURL.GET_STOCK_GROWTH_ANALYSIS, {
        params: { limit },
      })
      const payload = (res?.data?.data || {}) as GrowthAnalysisResponse
      setRows(Array.isArray(payload.rows) ? payload.rows : [])
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load growth analysis')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [limit])

  useEffect(() => {
    loadAnalysis()
  }, [loadAnalysis])

  const summary = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        const recommendation = String(row?.analysis?.recommendation || '')
        acc.total += 1
        if (recommendation.includes('Strong')) acc.strong += 1
        else if (recommendation.includes('Watchlist')) acc.watchlist += 1
        else acc.weak += 1
        return acc
      },
      { total: 0, strong: 0, watchlist: 0, weak: 0 },
    )
  }, [rows])

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
                <Chip label='Growth Screener' color='success' size='small' sx={{ mb: 2 }} />
                <Typography variant='h3' sx={{ color: 'common.white', fontWeight: 700, mb: 1.5 }}>
                  Rank Stocks by Growth Quality and Trend Strength
                </Typography>
                <Typography variant='body1' sx={{ color: 'rgba(255,255,255,0.76)', maxWidth: 780 }}>
                  Backend ranks the full VALID universe using sales CAGR, profit CAGR, ROE, ROCE, cash flow, and debt
                  comfort. The page only renders the ranked result set.
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card sx={{ bgcolor: 'rgba(8, 14, 26, 0.75)', border: '1px solid rgba(255,255,255,0.13)' }}>
                  <CardContent>
                    <Typography variant='caption' sx={{ color: 'rgba(255,255,255,0.65)' }}>
                      Current logic
                    </Typography>
                    <Stack spacing={1.25} sx={{ mt: 1 }}>
                      <Chip label='Sales + Profit CAGR' color='primary' size='small' />
                      <Chip label='ROE + ROCE Trend' color='success' size='small' />
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
              <Typography variant='h6'>Growth Analysis Workspace</Typography>
              <Chip label={`Loaded: ${rows.length}`} size='small' />
              <Chip label={`Strong: ${summary.strong}`} size='small' color='success' />
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
                    <Stack direction='row' spacing={1} sx={{ ml: { md: 'auto' }, flexWrap: 'wrap' }}>
                      <Button variant='outlined' startIcon={<RefreshIcon />} onClick={loadAnalysis} disabled={loading}>
                        Reload
                      </Button>
                    </Stack>
                  </Stack>
                  <Divider sx={{ my: 3 }} />
                  <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                    <Chip label={`Strong: ${summary.strong}`} color='success' />
                    <Chip label={`Watchlist: ${summary.watchlist}`} color='warning' />
                    <Chip label={`Weak: ${summary.weak}`} color='error' />
                    <Chip label={`Visible: ${summary.total}`} variant='outlined' />
                  </Stack>
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
                      <Typography variant='h6'>Growth Candidates</Typography>
                      <Typography variant='body2' color='text.secondary'>
                        Ranked by backend score from strongest trend to weakest.
                      </Typography>
                    </Box>
                    <Chip
                      icon={<InsightsIcon />}
                      label={loading ? 'Loading...' : `${rows.length} stocks`}
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
                          <TableCell align='right'>Sales CAGR</TableCell>
                          <TableCell align='right'>Profit CAGR</TableCell>
                          <TableCell align='right'>ROE</TableCell>
                          <TableCell align='right'>ROCE</TableCell>
                          <TableCell align='right'>Debt / Equity</TableCell>
                          <TableCell>Action</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {rows.map(row => {
                          const score = Number(row?.analysis?.score || 0)
                          const grade = String(row?.analysis?.grade || 'D').toUpperCase()
                          const recommendation = String(row?.analysis?.recommendation || 'Growth Weak')
                          const salesCagr = row?.analysis?.metrics?.sales_cagr_5y ?? row?.growth_metrics?.sales_cagr_5y
                          const profitCagr = row?.analysis?.metrics?.profit_cagr_5y ?? row?.growth_metrics?.profit_cagr_5y
                          const roe = row?.analysis?.metrics?.roe ?? row?.growth_metrics?.roe
                          const roce = row?.analysis?.metrics?.roce ?? row?.growth_metrics?.roce
                          const debtToEquity = row?.analysis?.metrics?.debt_to_equity ?? row?.growth_metrics?.debt_to_equity
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
                                    color={recommendationColor(recommendation) as any}
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
                                <TableCell align='right'>{formatPercent(salesCagr)}</TableCell>
                                <TableCell align='right'>{formatPercent(profitCagr)}</TableCell>
                                <TableCell align='right'>{formatPercent(roe)}</TableCell>
                                <TableCell align='right'>{formatPercent(roce)}</TableCell>
                                <TableCell align='right'>{formatNumber(debtToEquity, 2)}</TableCell>
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
                                <TableCell colSpan={12} sx={{ py: 0, borderBottom: isExpanded ? 'none' : undefined }}>
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
                                                Sales CAGR: {formatPercent(salesCagr)}
                                              </Typography>
                                              <Typography variant='body2'>
                                                Profit CAGR: {formatPercent(profitCagr)}
                                              </Typography>
                                              <Typography variant='body2'>
                                                ROE / ROCE: {formatPercent(roe)} / {formatPercent(roce)}
                                              </Typography>
                                              <Typography variant='body2'>
                                                Debt / Equity: {formatNumber(debtToEquity, 2)}
                                              </Typography>
                                            </Stack>
                                          </Grid>
                                          <Grid item xs={12} md={4}>
                                            <Typography variant='caption' color='text.secondary'>
                                              Business support
                                            </Typography>
                                            <Stack spacing={0.75} sx={{ mt: 0.75 }}>
                                              <Typography variant='body2'>
                                                Profit periods: {row?.analysis?.metrics?.positive_profit_periods ?? 0}
                                              </Typography>
                                              <Typography variant='body2'>
                                                Cash periods: {row?.analysis?.metrics?.positive_cash_periods ?? 0}
                                              </Typography>
                                              <Typography variant='body2'>
                                                Total liabilities: {formatNumber(row?.latest_total_liabilities)}
                                              </Typography>
                                            </Stack>
                                          </Grid>
                                        </Grid>
                                      </Stack>
                                    </Box>
                                  </Collapse>
                                </TableCell>
                              </TableRow>
                            </Fragment>
                          )
                        })}
                        {!loading && rows.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={12} align='center'>
                              No growth candidates found.
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
                      1. Companies that can grow sales and profits together.
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      2. Businesses with healthy ROE / ROCE and reasonable debt.
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      3. Stocks where growth is supported by profit and cash flow, not just price movement.
                    </Typography>
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

export default GrowthAnalysisPage
