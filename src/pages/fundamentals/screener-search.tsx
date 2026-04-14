import { Fragment, FormEvent, useEffect, useMemo, useState } from 'react'
import type { NextPage } from 'next'
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
import SearchIcon from '@mui/icons-material/Search'
import RefreshIcon from '@mui/icons-material/Refresh'
import LightbulbIcon from '@mui/icons-material/Lightbulb'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'

type SearchSuggestion = {
  key?: string
  label?: string
  aliases?: string[]
  example?: string
  type?: string
  unit?: string | null
}

type SearchMatch = {
  field?: string
  key?: string
  operator?: string
  threshold?: string
  actual?: number | string | null
  formattedActual?: string
  status?: string
  reason?: string
}

type SearchRow = {
  master_id?: number | string | null
  symbol?: string | null
  name?: string | null
  company_name?: string | null
  analysis?: {
    score?: number
    grade?: string
    recommendation?: string
  }
  search?: {
    query?: string
    clauses?: Array<Record<string, unknown>>
    matches?: SearchMatch[]
    matched?: boolean
    matched_count?: number
  }
  value_metrics?: {
    promoters?: number | null
    fiis?: number | null
    diis?: number | null
    roe?: number | null
    roce?: number | null
    debt_to_equity?: number | null
    revenue_cagr_3y?: number | null
    profit_cagr_3y?: number | null
    eps_cagr_3y?: number | null
    opm_percent?: number | null
    dividend_yield?: number | null
    pe_ratio?: number | null
    price_to_book?: number | null
    pe_vs_industry?: number | null
    ev_ebitda?: number | null
    interest_coverage?: number | null
    debtor_days?: number | null
    price_to_sales?: number | null
    company_age_years?: number | null
  }
}

type SearchResponse = {
  query?: string
  rows?: SearchRow[]
  total?: number
  parsed?: Array<Record<string, unknown>>
  suggestions?: SearchSuggestion[]
  filters?: {
    query?: string
    limit?: number
  }
}

const formatNumber = (value: unknown, digits = 2) => {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return '?'
  return numeric.toFixed(digits)
}

const formatPercent = (value: unknown) => {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return '?'
  return `${numeric.toFixed(2)}%`
}

const formatRatio = (value: unknown) => {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return '?'
  return numeric.toFixed(2)
}

const gradeColor = (grade?: string) => {
  const text = String(grade || '').toUpperCase()
  if (text.includes('DEEP')) return 'success'
  if (text.includes('VALUE')) return 'primary'
  if (text.includes('WATCH')) return 'warning'
  if (text.includes('REJECT')) return 'error'
  return 'default'
}

const ScreenerSearchPage: NextPage = () => {
  const [query, setQuery] = useState('')
  const [submittedQuery, setSubmittedQuery] = useState('')
  const [rows, setRows] = useState<SearchRow[]>([])
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [suggestionLoading, setSuggestionLoading] = useState(false)
  const [error, setError] = useState('')
  const [expandedSymbol, setExpandedSymbol] = useState<string | null>(null)

  const loadSuggestions = async (value: string) => {
    if (!value.trim()) {
      setSuggestions([])
      return
    }
    try {
      setSuggestionLoading(true)
      const res = await axiosInstance.get(ENDURL.GET_STOCK_SEARCH_SUGGESTIONS, {
        params: { q: value.trim() },
      })
      const payload = (res?.data?.data || {}) as SearchResponse
      setSuggestions(Array.isArray(payload.suggestions) ? payload.suggestions : [])
    } catch {
      setSuggestions([])
    } finally {
      setSuggestionLoading(false)
    }
  }

  useEffect(() => {
    const handle = setTimeout(() => {
      void loadSuggestions(query)
    }, 250)
    return () => clearTimeout(handle)
  }, [query])

  const runSearch = async (value = query) => {
    const q = value.trim()
    if (!q) {
      setRows([])
      setSubmittedQuery('')
      return
    }

    try {
      setLoading(true)
      setError('')
      const res = await axiosInstance.get(ENDURL.GET_STOCK_SEARCH_ANALYSIS, {
        params: {
          q,
          limit: 50,
        },
      })
      const payload = (res?.data?.data || {}) as SearchResponse
      setRows(Array.isArray(payload.rows) ? payload.rows : [])
      setSubmittedQuery(payload.query || q)
      setSuggestions(Array.isArray(payload.suggestions) ? payload.suggestions : [])
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to search stocks')
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  const suggestionChips = useMemo(() => suggestions.slice(0, 8), [suggestions])

  const onQuerySubmit = (event: FormEvent) => {
    event.preventDefault()
    void runSearch(query)
  }

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Card
          sx={{
            borderRadius: 3,
            overflow: 'hidden',
            background:
              'radial-gradient(circle at 85% 15%, rgba(59, 130, 246, 0.24) 0%, transparent 30%), radial-gradient(circle at 15% 10%, rgba(245, 158, 11, 0.18) 0%, transparent 28%), linear-gradient(125deg, #08111f 0%, #0f172a 52%, #111827 100%)',
          }}
        >
          <CardContent sx={{ p: { xs: 5, md: 7 } }}>
            <Grid container spacing={4} alignItems='center'>
              <Grid item xs={12} md={8}>
                <Chip label='Screener Search' color='primary' size='small' sx={{ mb: 2 }} />
                <Typography variant='h3' sx={{ color: 'common.white', fontWeight: 700, mb: 1.5 }}>
                  Search Stocks Like a Screener
                </Typography>
                <Typography variant='body1' sx={{ color: 'rgba(255,255,255,0.76)', maxWidth: 860 }}>
                  Type natural screener queries like <b>promoter &gt; 70</b>, <b>roe &gt; 15</b>, or <b>debt &lt; 1</b>.
                  The backend will search the active VALID universe and return matching companies.
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card sx={{ bgcolor: 'rgba(8, 14, 26, 0.75)', border: '1px solid rgba(255,255,255,0.13)' }}>
                  <CardContent>
                    <Typography variant='caption' sx={{ color: 'rgba(255,255,255,0.65)' }}>
                      Try examples
                    </Typography>
                    <Stack spacing={1.25} sx={{ mt: 1 }}>
                      <Chip label='promoter > 70' color='success' size='small' />
                      <Chip label='roe > 15 and roce > 15' color='primary' size='small' />
                      <Chip label='debt to equity < 1' color='warning' size='small' />
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <form onSubmit={onQuerySubmit}>
              <Stack spacing={2}>
                <TextField
                  fullWidth
                  label='Search Query'
                  placeholder='Type something like promoter > 70 or roe > 15 and debt < 1'
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  InputProps={{
                    endAdornment: (
                      <Button type='submit' variant='contained' startIcon={<SearchIcon />} disabled={loading}>
                        Search
                      </Button>
                    ),
                  }}
                  helperText='Use field names, operators, and values. Suggestions appear as you type.'
                />
                <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                  <Chip label='Active + VALID stocks only' size='small' variant='outlined' />
                  <Chip label={suggestionLoading ? 'Loading suggestions...' : 'Suggestions update live'} size='small' variant='outlined' />
                  <Chip label='Backend parsed' size='small' variant='outlined' />
                </Stack>
              </Stack>
            </form>

            {suggestionChips.length ? (
              <Box sx={{ mt: 2 }}>
                <Typography variant='caption' color='text.secondary'>
                  Field suggestions
                </Typography>
                <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap sx={{ mt: 1 }}>
                  {suggestionChips.map((item) => (
                    <Chip
                      key={item.key}
                      label={`${item.label}${item.unit ? ` (${item.unit})` : ''}`}
                      onClick={() => setQuery(item.example || item.label || '')}
                      color='primary'
                      variant='outlined'
                    />
                  ))}
                </Stack>
              </Box>
            ) : null}

            {error ? (
              <Alert severity='error' sx={{ mt: 2 }}>
                {error}
              </Alert>
            ) : null}
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap alignItems='center'>
              <LightbulbIcon fontSize='small' />
              <Typography variant='h6'>How to Search</Typography>
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Card variant='outlined' sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant='subtitle2' sx={{ mb: 1 }}>
                      Numeric queries
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      Use comparisons like <b>&gt;</b>, <b>&gt;=</b>, <b>&lt;</b>, <b>&lt;=</b>, or <b>=</b>.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card variant='outlined' sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant='subtitle2' sx={{ mb: 1 }}>
                      Available examples
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      promoter, roe, roce, debt to equity, dividend yield, pe vs industry, price to book, ev / ebitda, debtor days.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      </Grid>

      <Grid item xs={12}>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap sx={{ mb: 2 }}>
              <Chip label={`Query: ${submittedQuery || '—'}`} color='primary' variant='outlined' />
              <Chip label={`Results: ${rows.length}`} color='success' />
              <Chip label='Top 50' variant='outlined' />
            </Stack>

            <TableContainer component={Paper} variant='outlined' sx={{ borderRadius: 2 }}>
              <Table size='small'>
                <TableHead>
                  <TableRow>
                    <TableCell>Grade</TableCell>
                    <TableCell>Score</TableCell>
                    <TableCell>Symbol</TableCell>
                    <TableCell>Company</TableCell>
                    <TableCell>Matched</TableCell>
                    <TableCell>ROE</TableCell>
                    <TableCell>ROCE</TableCell>
                    <TableCell>Promoter %</TableCell>
                    <TableCell align='right'>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => {
                    const expanded = expandedSymbol === row.symbol
                    return (
                      <Fragment key={String(row.symbol || row.master_id)}>
                        <TableRow hover sx={{ '& td': { borderBottomColor: 'divider' } }}>
                          <TableCell>
                            <Chip label={row?.analysis?.grade || 'D'} color={gradeColor(row?.analysis?.grade) as any} size='small' />
                          </TableCell>
                          <TableCell>{formatNumber(row?.analysis?.score, 0)}</TableCell>
                          <TableCell>{row?.symbol || '?'}</TableCell>
                          <TableCell>{row?.company_name || row?.name || '?'}</TableCell>
                          <TableCell>
                            <Chip label={`${row?.search?.matched_count || 0} clauses`} size='small' color='primary' />
                          </TableCell>
                          <TableCell>{formatPercent(row?.value_metrics?.roe)}</TableCell>
                          <TableCell>{formatPercent(row?.value_metrics?.roce)}</TableCell>
                          <TableCell>{formatPercent(row?.value_metrics?.promoters)}</TableCell>
                          <TableCell align='right'>
                            <Stack direction='row' spacing={0.5} justifyContent='flex-end'>
                              <IconButton size='small' onClick={() => window.open(`/stock-fundamental/${encodeURIComponent(String(row.symbol || ''))}`, '_blank')}>
                                <OpenInNewIcon fontSize='small' />
                              </IconButton>
                              <IconButton size='small' onClick={() => setExpandedSymbol(expanded ? null : String(row.symbol || ''))}>
                                <ExpandMoreIcon fontSize='small' />
                              </IconButton>
                            </Stack>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell colSpan={9} sx={{ py: 0, borderBottom: expanded ? 'none' : undefined }}>
                            <Collapse in={expanded} timeout='auto' unmountOnExit>
                              <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2, my: 1 }}>
                                <TableContainer component={Paper} variant='outlined' sx={{ borderRadius: 2 }}>
                                  <Table size='small'>
                                    <TableHead>
                                      <TableRow>
                                        <TableCell>Field</TableCell>
                                        <TableCell>Operator</TableCell>
                                        <TableCell>Threshold</TableCell>
                                        <TableCell>Actual</TableCell>
                                        <TableCell>Status</TableCell>
                                      </TableRow>
                                    </TableHead>
                                    <TableBody>
                                      {(row?.search?.matches || []).map((match) => (
                                        <TableRow key={`${match.key || match.field}-${match.operator}-${match.threshold}`}>
                                          <TableCell>{match.field || match.key || '?'}</TableCell>
                                          <TableCell>{match.operator || '?'}</TableCell>
                                          <TableCell>{match.threshold || '?'}</TableCell>
                                          <TableCell>{match.formattedActual || '?'}</TableCell>
                                          <TableCell>
                                            <Chip
                                              label={match.status || '?'}
                                              size='small'
                                              color={match.status === 'pass' ? 'success' : 'error'}
                                            />
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
                  {!rows.length && !loading ? (
                    <TableRow>
                      <TableCell colSpan={9}>
                        <Typography variant='body2' color='text.secondary' sx={{ py: 3, textAlign: 'center' }}>
                          Type a query and hit Search to see matching stocks.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default ScreenerSearchPage
