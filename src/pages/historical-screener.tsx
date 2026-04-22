import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react'
import type { NextPage } from 'next'
import axiosInstance from 'src/api/axios/axiosBaseQuery'
import { ENDURL } from 'src/utils/constants/endurl.utils'
import { useAsOfDate } from 'src/contexts/AsOfDateContext'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
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
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import Alert from '@mui/material/Alert'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import SearchIcon from '@mui/icons-material/Search'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'

type SearchSuggestion = {
  key?: string
  label?: string
  aliases?: string[]
  example?: string
  unit?: string | null
}

type SearchMatch = {
  field?: string
  operator?: string
  threshold?: string
  formattedActual?: string
  status?: string
  reason?: string
}

type SearchRow = {
  master_id?: number | string | null
  symbol?: string | null
  name?: string | null
  market_cap?: number | null
  current_price?: number | null
  analysis?: {
    score?: number
    grade?: string
    recommendation?: string
  }
  search?: {
    matches?: SearchMatch[]
    matched_count?: number
  }
}

type RuleState = {
  enabled: boolean
  parameters: Record<string, number>
}

type UniverseSummary = {
  as_of_date?: string
  total_candidates?: number
  included_count?: number
  excluded_count?: number
  failure_counts?: Record<string, number>
}

type SearchResponse = {
  query?: string
  rows?: SearchRow[]
  total?: number
  suggestions?: SearchSuggestion[]
  universe?: UniverseSummary
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

const HISTORICAL_UNIVERSE_RULES_STORAGE_KEY = 'historical-universe-rules-v1'
const FIELD_PATTERN = /^(.+?)\s*(>=|<=|!=|==|=|>|<|contains|starts with|ends with)\s*(.*)$/i

const getStoredRuleState = () => {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(HISTORICAL_UNIVERSE_RULES_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
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

const HistoricalScreenerPage: NextPage = () => {
  const { asOfDate } = useAsOfDate()
  const [query, setQuery] = useState('')
  const [rows, setRows] = useState<SearchRow[]>([])
  const [universe, setUniverse] = useState<UniverseSummary | null>(null)
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [suggestionLoading, setSuggestionLoading] = useState(false)
  const [error, setError] = useState('')
  const [cursorIndex, setCursorIndex] = useState(0)
  const [cursorPosition, setCursorPosition] = useState<CursorPosition | null>(null)
  const [editorFocused, setEditorFocused] = useState(false)
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0)
  const [expandedSymbol, setExpandedSymbol] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  const activeLineContext = useMemo(() => getActiveLineContext(query, cursorIndex), [query, cursorIndex])
  const enabledRuleCount = useMemo(() => {
    const stored = getStoredRuleState() as Record<string, RuleState> | null
    return Object.values(stored || {}).filter(rule => Boolean(rule?.enabled)).length
  }, [])

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
      setUniverse(null)
      return
    }

    try {
      setLoading(true)
      setError('')
      const res = await axiosInstance.post(ENDURL.POST_HISTORICAL_UNIVERSE_SEARCH, {
        as_of_date: asOfDate,
        query: q,
        limit: 100,
        rules: getStoredRuleState() || {},
      })

      const payload = (res?.data?.data || {}) as SearchResponse
      setRows(Array.isArray(payload.rows) ? payload.rows : [])
      setUniverse(payload.universe || null)
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to search historical universe')
      setRows([])
      setUniverse(null)
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

  const onSubmit = (event: FormEvent) => {
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
    'Price from 52 week high < 20\nAND Promoter holding > 40\nAND Current price > 200 DMA\nAND 1 month return > 5',
    'Volume > 100000\nAND Current price < 100\nAND PEG Ratio < 1.5\nAND Return on equity > 15',
  ]

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Card>
          <CardHeader
            title='Historical Screener'
            subheader='Phase 2 runs the screener query only on the stocks that passed Phase 1 historical universe rules.'
          />
          <CardContent>
            <Stack spacing={3}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ xs: 'flex-start', md: 'center' }} flexWrap='wrap' useFlexGap>
                <Alert severity='info' sx={{ py: 0, alignItems: 'center' }}>
                  Using global As Of Date: <strong>{asOfDate}</strong>
                </Alert>
                <Chip size='small' label={`${enabledRuleCount} Phase 1 rule${enabledRuleCount === 1 ? '' : 's'} enabled`} variant='outlined' />
                <Chip size='small' label='Same parser as Screener Search + historical universe filter' variant='outlined' />
              </Stack>

              {error ? <Alert severity='error'>{error}</Alert> : null}

              <form onSubmit={onSubmit}>
                <Stack spacing={2}>
                  <Box sx={{ position: 'relative' }}>
                    <TextField
                      fullWidth
                      multiline
                      minRows={6}
                      label='Historical Screener Query'
                      placeholder='Sales growth > 12&#10;AND Profit growth > 15&#10;AND Return on capital employed > 15'
                      value={query}
                      onChange={event => {
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
                              onMouseDown={event => {
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
                                '&:hover': { bgcolor: 'action.hover' },
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
                      {loading ? 'Running...' : 'Run Historical Screener'}
                    </Button>
                    <Chip label={suggestionLoading ? 'Updating suggestions...' : 'Suggestions follow cursor'} size='small' variant='outlined' />
                    <Chip label='EOD + fundamentals supported' size='small' variant='outlined' />
                  </Stack>
                </Stack>
              </form>

              <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                {examplePresets.map(preset => (
                  <Chip
                    key={preset}
                    label={preset.split('\n')[0]}
                    onClick={() => setQuery(preset)}
                    variant='outlined'
                    clickable
                  />
                ))}
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      {universe ? (
        <Grid item xs={12}>
          <Card>
            <CardHeader title='Universe Summary' />
            <CardContent>
              <Stack direction='row' spacing={1.25} flexWrap='wrap' useFlexGap>
                <Chip label={`Candidates: ${universe.total_candidates || 0}`} variant='outlined' />
                <Chip label={`Eligible after Phase 1: ${universe.included_count || 0}`} color='success' variant='outlined' />
                <Chip label={`Excluded by Phase 1: ${universe.excluded_count || 0}`} color='error' variant='outlined' />
                <Chip label={`Matched query: ${rows.length}`} color='primary' variant='outlined' />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      ) : null}

      <Grid item xs={12}>
        <Card>
          <CardHeader title='Matched Stocks' subheader='These are the stocks that passed Phase 1 and also matched the screener query.' />
          <CardContent>
            <TableContainer component={Paper} variant='outlined'>
              <Table size='small'>
                <TableHead>
                  <TableRow>
                    <TableCell>S.No.</TableCell>
                    <TableCell>Symbol</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Price</TableCell>
                    <TableCell>Market Cap</TableCell>
                    <TableCell>Score</TableCell>
                    <TableCell>Matched Clauses</TableCell>
                    <TableCell align='right'>Open</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.length ? (
                    rows.map((row, index) => {
                      const symbol = String(row.symbol || '')
                      const expanded = expandedSymbol === symbol
                      return (
                        <>
                          <TableRow key={symbol || String(index)} hover>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>
                              <Stack spacing={0.5}>
                                <Typography variant='body2' sx={{ fontWeight: 700 }}>
                                  {row.symbol || '-'}
                                </Typography>
                                <Chip size='small' label={row.analysis?.grade || 'NA'} color={gradeColor(row.analysis?.grade) as any} variant='outlined' />
                              </Stack>
                            </TableCell>
                            <TableCell>{row.name || '-'}</TableCell>
                            <TableCell>{row.current_price ?? '-'}</TableCell>
                            <TableCell>{row.market_cap ?? '-'}</TableCell>
                            <TableCell>{row.analysis?.score ?? '-'}</TableCell>
                            <TableCell>
                              <Button size='small' variant='text' onClick={() => setExpandedSymbol(expanded ? null : symbol)}>
                                {row.search?.matched_count || 0} clauses
                              </Button>
                            </TableCell>
                            <TableCell align='right'>
                              <Button
                                size='small'
                                variant='outlined'
                                endIcon={<OpenInNewIcon />}
                                onClick={() => window.open(`/stock-fundamental/${row.symbol}/`, '_blank', 'noopener,noreferrer')}
                              >
                                Open
                              </Button>
                            </TableCell>
                          </TableRow>
                          <TableRow key={`${symbol || index}-details`}>
                            <TableCell colSpan={8} sx={{ p: 0, borderBottom: expanded ? undefined : 'none' }}>
                              <Accordion expanded={expanded} onChange={(_, isExpanded) => setExpandedSymbol(isExpanded ? symbol : null)} disableGutters elevation={0}>
                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                  <Typography variant='body2'>Match details</Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                  <Stack spacing={1}>
                                    {(row.search?.matches || []).map((match, matchIndex) => (
                                      <Typography key={`${symbol}-${match.field}-${matchIndex}`} variant='caption' color={match.status === 'match' ? 'success.main' : 'text.secondary'}>
                                        {match.field}: actual {match.formattedActual || '?'} {match.operator} {match.threshold} — {match.reason}
                                      </Typography>
                                    ))}
                                  </Stack>
                                </AccordionDetails>
                              </Accordion>
                            </TableCell>
                          </TableRow>
                        </>
                      )
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8}>
                        <Typography variant='body2' color='text.secondary'>
                          Run a historical screener query to see matching stocks here.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default HistoricalScreenerPage
