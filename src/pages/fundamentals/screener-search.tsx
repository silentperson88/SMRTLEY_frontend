import { Fragment, FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react'
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
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import IconButton from '@mui/material/IconButton'
import Alert from '@mui/material/Alert'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import SearchIcon from '@mui/icons-material/Search'
import LightbulbIcon from '@mui/icons-material/Lightbulb'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'

type SearchSuggestion = {
  key?: string
  label?: string
  aliases?: string[]
  example?: string
  type?: string
  unit?: string | null
  operators?: string[]
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
  market_cap?: number | null
  current_price?: number | null
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
    public?: number | null
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

type ActiveLineContext = {
  lineStart: number
  lineEnd: number
  lineRaw: string
  prefix: string
  fieldText: string
  operator: string | null
  valueText: string
  hasTrailingAnd: boolean
}

type CursorPosition = {
  top: number
  left: number
  lineHeight: number
}

const FIELD_PATTERN = /^(.+?)\s*(>=|<=|!=|==|=|>|<|contains|starts with|ends with)\s*(.*)$/i

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

const gradeColor = (grade?: string) => {
  const text = String(grade || '').toUpperCase()
  if (text.includes('DEEP')) return 'success'
  if (text.includes('VALUE')) return 'primary'
  if (text.includes('WATCH')) return 'warning'
  if (text.includes('REJECT')) return 'error'
  return 'default'
}

const getActiveLineContext = (query: string, cursorIndex: number): ActiveLineContext => {
  const position = Math.max(0, Math.min(cursorIndex, query.length))
  const lineStart = query.lastIndexOf('\n', Math.max(0, position - 1)) + 1
  const nextLineBreak = query.indexOf('\n', position)
  const lineEnd = nextLineBreak === -1 ? query.length : nextLineBreak
  const lineRaw = query.slice(lineStart, lineEnd)
  const prefix = (lineRaw.match(/^\s*(?:AND\s+)?/i) || [''])[0]
  const body = lineRaw.slice(prefix.length)
  const hasTrailingAnd = /\s+(?:AND|&&)\s*$/i.test(body)
  const bodyWithoutTrailingAnd = body.replace(/\s+(?:AND|&&)\s*$/i, '').trim()
  const parsed = bodyWithoutTrailingAnd.match(FIELD_PATTERN)

  return {
    lineStart,
    lineEnd,
    lineRaw,
    prefix,
    fieldText: parsed ? parsed[1].trim() : bodyWithoutTrailingAnd,
    operator: parsed ? parsed[2].trim() : null,
    valueText: parsed ? parsed[3].trim() : '',
    hasTrailingAnd,
  }
}

const replaceLineField = (query: string, context: ActiveLineContext, suggestion: SearchSuggestion) => {
  const label = suggestion.label || suggestion.example || ''
  const comparisonPart = context.operator ? ` ${context.operator} ${context.valueText}`.trimEnd() : ''
  const trailingAnd = context.hasTrailingAnd ? ' AND' : ''
  const rebuiltLine = `${context.prefix}${label}${comparisonPart ? ` ${comparisonPart}` : ''}${trailingAnd}`

  return {
    nextQuery: `${query.slice(0, context.lineStart)}${rebuiltLine}${query.slice(context.lineEnd)}`,
    nextCursor: context.lineStart + rebuiltLine.length,
  }
}

const getCaretCoordinates = (textarea: HTMLTextAreaElement, caretPosition: number): CursorPosition => {
  const styles = window.getComputedStyle(textarea)
  const div = document.createElement('div')
  const span = document.createElement('span')
  const properties = [
    'boxSizing',
    'width',
    'height',
    'overflowX',
    'overflowY',
    'borderTopWidth',
    'borderRightWidth',
    'borderBottomWidth',
    'borderLeftWidth',
    'paddingTop',
    'paddingRight',
    'paddingBottom',
    'paddingLeft',
    'fontStyle',
    'fontVariant',
    'fontWeight',
    'fontStretch',
    'fontSize',
    'fontSizeAdjust',
    'lineHeight',
    'fontFamily',
    'textAlign',
    'textTransform',
    'textIndent',
    'textDecoration',
    'letterSpacing',
    'wordSpacing',
    'tabSize',
    'MozTabSize',
  ] as const

  div.style.position = 'absolute'
  div.style.visibility = 'hidden'
  div.style.whiteSpace = 'pre-wrap'
  div.style.wordWrap = 'break-word'
  div.style.top = '0'
  div.style.left = '-9999px'

  properties.forEach((property) => {
    div.style.setProperty(property, styles.getPropertyValue(property))
  })

  div.textContent = textarea.value.slice(0, caretPosition)
  if (div.textContent.endsWith('\n')) div.textContent += ' '

  span.textContent = textarea.value.slice(caretPosition) || ' '
  div.appendChild(span)
  document.body.appendChild(div)

  const top = span.offsetTop - textarea.scrollTop
  const left = span.offsetLeft - textarea.scrollLeft
  document.body.removeChild(div)

  return {
    top,
    left,
    lineHeight: Number.parseFloat(styles.lineHeight || '24') || 24,
  }
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
  const [editorFocused, setEditorFocused] = useState(false)
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0)
  const [cursorIndex, setCursorIndex] = useState(0)
  const [cursorPosition, setCursorPosition] = useState<CursorPosition | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  const activeLineContext = useMemo(() => getActiveLineContext(query, cursorIndex), [query, cursorIndex])

  const updateCaretState = () => {
    const textarea = textareaRef.current
    if (!textarea) return
    const nextCursor = textarea.selectionStart || 0
    setCursorIndex(nextCursor)
    setCursorPosition(getCaretCoordinates(textarea, nextCursor))
  }

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
    const searchTerm = activeLineContext.fieldText.trim()
    if (!editorFocused || !searchTerm) {
      setSuggestions([])
      return
    }

    const handle = setTimeout(() => {
      void loadSuggestions(searchTerm)
    }, 160)

    return () => clearTimeout(handle)
  }, [activeLineContext.fieldText, editorFocused])

  useEffect(() => {
    setActiveSuggestionIndex(0)
  }, [suggestions])

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
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to search stocks')
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  const applySuggestion = (suggestion: SearchSuggestion) => {
    const { nextQuery, nextCursor } = replaceLineField(query, activeLineContext, suggestion)
    setQuery(nextQuery)
    setEditorFocused(true)
    requestAnimationFrame(() => {
      if (!textareaRef.current) return
      textareaRef.current.focus()
      textareaRef.current.setSelectionRange(nextCursor, nextCursor)
      updateCaretState()
    })
  }

  const onQuerySubmit = (event: FormEvent) => {
    event.preventDefault()
    void runSearch(query)
  }

  const onEditorKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!suggestions.length) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveSuggestionIndex((current) => (current + 1) % suggestions.length)
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveSuggestionIndex((current) => (current - 1 + suggestions.length) % suggestions.length)
      return
    }

    if (event.key === 'Tab') {
      event.preventDefault()
      applySuggestion(suggestions[activeSuggestionIndex])
    }
  }

  const suggestionOpen = Boolean(editorFocused && suggestions.length && cursorPosition && activeLineContext.fieldText.trim())
  const examplePresets = [
    'Sales growth > 12\nAND Profit growth > 15\nAND Return on capital employed > 15\nAND Debt to equity < 0.5',
    'Price to earning < 30\nAND PEG Ratio < 1.5\nAND Market Capitalization > 500\nAND Current price < 50',
    'Promoter holding > 50\nAND Return on equity > 15\nAND Dividend yield > 2',
  ]

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Card
          sx={{
            borderRadius: 3,
            overflow: 'hidden',
            background:
              'radial-gradient(circle at 80% 10%, rgba(16, 185, 129, 0.22) 0%, transparent 28%), radial-gradient(circle at 18% 15%, rgba(59, 130, 246, 0.22) 0%, transparent 26%), linear-gradient(130deg, #08111f 0%, #0f172a 52%, #111827 100%)',
          }}
        >
          <CardContent sx={{ p: { xs: 5, md: 7 } }}>
            <Grid container spacing={4} alignItems='center'>
              <Grid item xs={12} md={8}>
                <Chip label='Screener Search' color='primary' size='small' sx={{ mb: 2 }} />
                <Typography variant='h3' sx={{ color: 'common.white', fontWeight: 700, mb: 1.5 }}>
                  Query Stocks Like Screener
                </Typography>
                <Typography variant='body1' sx={{ color: 'rgba(255,255,255,0.76)', maxWidth: 900 }}>
                  Write one clause per line, use <b>AND</b> between rules, and the backend will evaluate it on the active
                  VALID universe. Suggestions now follow the active line while you type.
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card sx={{ bgcolor: 'rgba(8, 14, 26, 0.75)', border: '1px solid rgba(255,255,255,0.13)' }}>
                  <CardContent>
                    <Typography variant='caption' sx={{ color: 'rgba(255,255,255,0.65)' }}>
                      Example block
                    </Typography>
                    <Typography component='pre' variant='body2' sx={{ mt: 1.5, color: 'rgba(255,255,255,0.84)', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                      {`Sales growth > 12\nAND Profit growth > 15\nAND Return on capital employed > 15\nAND Debt to equity < 0.5`}
                    </Typography>
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
                <Box sx={{ position: 'relative' }}>
                  <TextField
                    fullWidth
                    multiline
                    minRows={6}
                    label='Search Query'
                    placeholder='Sales growth > 12&#10;AND Profit growth > 15&#10;AND Return on capital employed > 15'
                    value={query}
                    onChange={(event) => {
                      setQuery(event.target.value)
                      requestAnimationFrame(updateCaretState)
                    }}
                    onKeyDown={onEditorKeyDown}
                    onFocus={() => {
                      setEditorFocused(true)
                      requestAnimationFrame(updateCaretState)
                    }}
                    onBlur={() => {
                      window.setTimeout(() => setEditorFocused(false), 120)
                    }}
                    onClick={() => requestAnimationFrame(updateCaretState)}
                    onKeyUp={() => requestAnimationFrame(updateCaretState)}
                    inputRef={textareaRef}
                    helperText='Use one rule per line. Press Tab to insert the highlighted suggestion.'
                  />

                  {suggestionOpen ? (
                    <Paper
                      elevation={8}
                      sx={{
                        position: 'absolute',
                        top: (cursorPosition?.top || 0) + (cursorPosition?.lineHeight || 24) + 36,
                        left: Math.min((cursorPosition?.left || 0) + 16, 520),
                        width: { xs: 'calc(100% - 24px)', sm: 420 },
                        maxWidth: 'calc(100% - 24px)',
                        borderRadius: 2,
                        overflow: 'hidden',
                        zIndex: 20,
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <Box sx={{ px: 2, py: 1.25, bgcolor: 'action.hover', borderBottom: '1px solid', borderColor: 'divider' }}>
                        <Typography variant='caption' color='text.secondary'>
                          Suggestions for {activeLineContext.fieldText || 'current line'}
                        </Typography>
                      </Box>
                      <Stack spacing={0}>
                        {suggestions.slice(0, 8).map((item, index) => (
                          <Box
                            key={item.key || item.label || index}
                            onMouseDown={(event) => {
                              event.preventDefault()
                              applySuggestion(item)
                            }}
                            sx={{
                              px: 2,
                              py: 1.5,
                              cursor: 'pointer',
                              bgcolor: index === activeSuggestionIndex ? 'action.selected' : 'background.paper',
                              borderBottom: index === Math.min(suggestions.length, 8) - 1 ? 'none' : '1px solid',
                              borderColor: 'divider',
                              '&:hover': {
                                bgcolor: 'action.hover',
                              },
                            }}
                          >
                            <Stack direction='row' justifyContent='space-between' spacing={2}>
                              <Box>
                                <Typography variant='subtitle2'>{item.label}</Typography>
                                <Typography variant='caption' color='text.secondary'>
                                  {item.example || item.aliases?.slice(0, 3).join(', ') || 'No example'}
                                </Typography>
                              </Box>
                              {item.unit ? <Chip size='small' label={item.unit} variant='outlined' /> : null}
                            </Stack>
                          </Box>
                        ))}
                      </Stack>
                    </Paper>
                  ) : null}
                </Box>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', sm: 'center' }}>
                  <Button type='submit' variant='contained' startIcon={<SearchIcon />} disabled={loading}>
                    {loading ? 'Searching...' : 'Search'}
                  </Button>
                  <Chip label='Active + VALID stocks only' size='small' variant='outlined' />
                  <Chip label={suggestionLoading ? 'Updating suggestions...' : 'Suggestions follow cursor'} size='small' variant='outlined' />
                  <Chip label='Parsed on backend' size='small' variant='outlined' />
                </Stack>
              </Stack>
            </form>

            <Box sx={{ mt: 2.5 }}>
              <Typography variant='caption' color='text.secondary'>
                Quick examples
              </Typography>
              <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap sx={{ mt: 1 }}>
                {examplePresets.map((preset) => (
                  <Chip
                    key={preset}
                    label={preset.split('\n')[0]}
                    onClick={() => {
                      setQuery(preset)
                      requestAnimationFrame(updateCaretState)
                    }}
                    color='primary'
                    variant='outlined'
                  />
                ))}
              </Stack>
            </Box>

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
              <Typography variant='h6'>How to Write Queries</Typography>
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Card variant='outlined' sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant='subtitle2' sx={{ mb: 1 }}>
                      Supported operators
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      Use <b>&gt;</b>, <b>&gt;=</b>, <b>&lt;</b>, <b>&lt;=</b>, <b>=</b>, <b>!=</b>. Text fields also support
                      <b> contains</b>, <b> starts with</b>, and <b> ends with</b>.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card variant='outlined' sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant='subtitle2' sx={{ mb: 1 }}>
                      Available screener-style fields
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      Sales growth, Profit growth, Return on capital employed, Debt to equity, Price to earning, PEG Ratio,
                      Market Capitalization, Current price, Dividend yield, Promoter holding, and more.
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
              <Chip label={`Query: ${submittedQuery || '-'}`} color='primary' variant='outlined' />
              <Chip label={`Results: ${rows.length}`} color='success' />
              <Chip label='Top 50 matches' variant='outlined' />
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
                    <TableCell>Current Price</TableCell>
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
                          <TableCell>{row?.current_price !== null && row?.current_price !== undefined ? `Rs. ${formatNumber(row.current_price)}` : '?'}</TableCell>
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
                                              color={match.status === 'pass' ? 'success' : match.status === 'unmatched' ? 'warning' : 'error'}
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
                          Build a query and hit Search to see matching stocks.
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
