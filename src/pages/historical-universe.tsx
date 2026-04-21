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
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Collapse from '@mui/material/Collapse'
import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'
import Alert from '@mui/material/Alert'
import LinearProgress from '@mui/material/LinearProgress'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TablePagination from '@mui/material/TablePagination'
import Paper from '@mui/material/Paper'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import IconButton from '@mui/material/IconButton'
import SearchIcon from '@mui/icons-material/Search'

interface RuleDefinition {
  id: string
  label: string
  description: string
  defaultEnabled: boolean
  parameters?: Record<string, number>
}

interface RuleState {
  enabled: boolean
  parameters: Record<string, number>
}

interface RuleResult {
  enabled?: boolean
  passed?: boolean
  reason?: string | null
  parameters?: Record<string, number>
  meta?: Record<string, unknown>
}

interface UniverseStockRow {
  master_id: number
  symbol: string
  name: string
  exchange?: string
  passed: boolean
  failed_rule_ids: string[]
  failed_rule_labels: string[]
  latest_trade_date?: string | null
  candle_count_considered?: number
  rule_results?: Record<string, RuleResult>
}

interface UniverseResponse {
  as_of_date: string
  total_candidates: number
  included_count: number
  excluded_count: number
  failure_counts: Record<string, number>
  applied_rules: Record<string, RuleState & { id: string; label: string; description: string }>
  included_stocks: UniverseStockRow[]
  excluded_stocks: UniverseStockRow[]
}

interface SearchSuggestion {
  key?: string
  label?: string
  aliases?: string[]
  example?: string
  unit?: string | null
}

interface SearchMatch {
  field?: string
  operator?: string
  threshold?: string
  formattedActual?: string
  status?: string
  reason?: string
}

interface HistoricalSearchRow {
  master_id?: number | string | null
  symbol?: string | null
  name?: string | null
  market_cap?: number | null
  current_price?: number | null
  analysis?: {
    score?: number
    grade?: string
  }
  search?: {
    matches?: SearchMatch[]
    matched_count?: number
  }
}

interface HistoricalSearchResponse {
  rows?: HistoricalSearchRow[]
  total?: number
  suggestions?: SearchSuggestion[]
  engine?: string
  timings?: {
    universe_duration_ms?: number
    query_duration_ms?: number
    total_duration_ms?: number
    included_stock_count?: number
    used_provided_master_ids?: boolean
  }
}

interface ActiveLineContext {
  lineStart: number
  lineEnd: number
  lineRaw: string
  prefix: string
  fieldText: string
  operator: string | null
  valueText: string
  hasTrailingAnd: boolean
}

interface CursorPosition {
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

const setStoredRuleState = (value: Record<string, RuleState>) => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(HISTORICAL_UNIVERSE_RULES_STORAGE_KEY, JSON.stringify(value))
  } catch {
    // ignore storage failures
  }
}

const formatLabel = (key: string) => {
  return String(key || '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, letter => letter.toUpperCase())
}

const formatMetaValue = (value: unknown): string => {
  if (Array.isArray(value)) return value.length ? value.join(', ') : '-'
  if (value && typeof value === 'object') return JSON.stringify(value)
  if (value === null || value === undefined || value === '') return '-'
  return String(value)
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

  properties.forEach(property => {
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

const HistoricalUniversePage: NextPage = () => {
  const { asOfDate } = useAsOfDate()
  const [ruleDefinitions, setRuleDefinitions] = useState<RuleDefinition[]>([])
  const [ruleState, setRuleState] = useState<Record<string, RuleState>>({})
  const [result, setResult] = useState<UniverseResponse | null>(null)
  const [loadingRules, setLoadingRules] = useState(false)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState(0)
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(25)
  const [resultSectionTab, setResultSectionTab] = useState(0)
  const [query, setQuery] = useState('')
  const [queryRows, setQueryRows] = useState<HistoricalSearchRow[]>([])
  const [queryLoading, setQueryLoading] = useState(false)
  const [suggestionLoading, setSuggestionLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [queryTimings, setQueryTimings] = useState<HistoricalSearchResponse['timings'] | null>(null)
  const [queryEngineLabel, setQueryEngineLabel] = useState('')
  const [editorFocused, setEditorFocused] = useState(false)
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0)
  const [cursorIndex, setCursorIndex] = useState(0)
  const [cursorPosition, setCursorPosition] = useState<CursorPosition | null>(null)
  const [expandedQuerySymbol, setExpandedQuerySymbol] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  const runHistoricalQuery = async (endpoint: string, engineLabel: string) => {
    try {
      setQueryLoading(true)
      setError('')
      const includedMasterIds = (result?.included_stocks || []).map(item => item.master_id)
      if (!includedMasterIds.length) {
        setError('Run the historical universe filter first so the screener query can use the included stocks.')
        setQueryRows([])
        setQueryTimings(null)
        setQueryEngineLabel('')
        return
      }
      const res = await axiosInstance.post(
        endpoint,
        {
          as_of_date: asOfDate,
          query: query.trim(),
          limit: 100,
          master_ids: includedMasterIds,
          universe: result
            ? {
                as_of_date: result.as_of_date,
                total_candidates: result.total_candidates,
                included_count: result.included_count,
                excluded_count: result.excluded_count,
                failure_counts: result.failure_counts,
                applied_rules: result.applied_rules,
              }
            : null,
          rules: Object.fromEntries(
            Object.entries(ruleState).map(([ruleId, state]) => [
              ruleId,
              {
                enabled: Boolean(state.enabled),
                ...(state.parameters || {}),
              },
            ])
          ),
        },
        {
          timeout: 120000,
        }
      )
      const payload = (res?.data?.data || {}) as HistoricalSearchResponse
      setQueryRows(Array.isArray(payload.rows) ? payload.rows : [])
      setQueryTimings(payload.timings || null)
      setQueryEngineLabel(engineLabel)
      setExpandedQuerySymbol(null)
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to run historical screener query')
      setQueryRows([])
      setQueryTimings(null)
      setQueryEngineLabel('')
    } finally {
      setQueryLoading(false)
    }
  }

  useEffect(() => {
    let active = true

    const loadRules = async () => {
      try {
        setLoadingRules(true)
        setError('')
        const res = await axiosInstance.get(ENDURL.GET_HISTORICAL_UNIVERSE_RULES)
        if (!active) return
        const rows: RuleDefinition[] = Array.isArray(res?.data?.data) ? res.data.data : []
        setRuleDefinitions(rows)
        const storedRuleState = getStoredRuleState()
        setRuleState(
          rows.reduce((acc, rule) => {
            const stored = storedRuleState?.[rule.id]
            acc[rule.id] = {
              enabled: typeof stored?.enabled === 'boolean' ? stored.enabled : Boolean(rule.defaultEnabled),
              parameters: Object.entries(rule.parameters || {}).reduce((paramAcc, [paramKey, defaultValue]) => {
                const storedValue = Number(stored?.parameters?.[paramKey])
                paramAcc[paramKey] = Number.isFinite(storedValue) && storedValue > 0 ? Math.floor(storedValue) : defaultValue
                return paramAcc
              }, {} as Record<string, number>)
            }
            return acc
          }, {} as Record<string, RuleState>)
        )
      } catch (e: any) {
        if (!active) return
        setError(e?.response?.data?.message || 'Failed to load historical universe rules')
      } finally {
        if (active) setLoadingRules(false)
      }
    }

    loadRules()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!Object.keys(ruleState).length) return
    setStoredRuleState(ruleState)
  }, [ruleState])

  const handleToggleRule = (ruleId: string, enabled: boolean) => {
    setRuleState(prev => ({
      ...prev,
      [ruleId]: {
        ...(prev[ruleId] || { enabled: false, parameters: {} }),
        enabled
      }
    }))
  }

  const handleParamChange = (ruleId: string, paramKey: string, value: string) => {
    const parsed = Math.max(1, Math.floor(Number(value) || 0))
    setRuleState(prev => ({
      ...prev,
      [ruleId]: {
        ...(prev[ruleId] || { enabled: false, parameters: {} }),
        parameters: {
          ...((prev[ruleId] || {}).parameters || {}),
          [paramKey]: parsed
        }
      }
    }))
  }

  const runFilter = async () => {
    try {
      setRunning(true)
      setError('')
      const payload = {
        as_of_date: asOfDate,
        rules: Object.fromEntries(
          Object.entries(ruleState).map(([ruleId, state]) => [
            ruleId,
            {
              enabled: Boolean(state.enabled),
              ...(state.parameters || {})
            }
          ])
        )
      }

      const res = await axiosInstance.post(ENDURL.POST_HISTORICAL_UNIVERSE_FILTER, payload)
      setResult(res?.data?.data || null)
      setActiveTab(0)
      setPage(0)
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to build historical universe')
    } finally {
      setRunning(false)
    }
  }

  const failureRows = useMemo(() => {
    if (!result) return []
    return Object.entries(result.failure_counts || {}).map(([ruleId, count]) => ({
      ruleId,
      count,
      label: result.applied_rules?.[ruleId]?.label || ruleId
    }))
  }, [result])

  const enabledRuleCount = useMemo(
    () => Object.values(ruleState).filter(rule => Boolean(rule.enabled)).length,
    [ruleState]
  )

  const activeRows = activeTab === 0 ? result?.included_stocks || [] : result?.excluded_stocks || []
  const paginatedRows = useMemo(
    () => activeRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [activeRows, page, rowsPerPage]
  )
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
      const payload = (res?.data?.data || {}) as HistoricalSearchResponse
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

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Card>
          <CardHeader
            title='Historical Universe'
            subheader='Phase 1 filters out unusable historical stocks before we run any screener or backtest logic.'
            action={
              <Stack direction='row' spacing={1} alignItems='center'>
                <Button variant='contained' onClick={runFilter} disabled={loadingRules || running || !ruleDefinitions.length}>
                  Run Query
                </Button>
                <IconButton onClick={() => setFiltersExpanded(prev => !prev)} aria-label={filtersExpanded ? 'Collapse filters' : 'Expand filters'}>
                  <ExpandMoreIcon
                    sx={{
                      transform: filtersExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: theme => theme.transitions.create('transform', { duration: theme.transitions.duration.shortest })
                    }}
                  />
                </IconButton>
              </Stack>
            }
          />
          {(loadingRules || running) && <LinearProgress />}
          <CardContent>
            <Stack spacing={3}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ xs: 'flex-start', md: 'center' }} flexWrap='wrap' useFlexGap>
                <Alert severity='info' sx={{ py: 0, alignItems: 'center' }}>
                  Using global As Of Date: <strong>{asOfDate}</strong>
                </Alert>
                <Chip size='small' label={`${enabledRuleCount} rule${enabledRuleCount === 1 ? '' : 's'} enabled`} variant='outlined' />
                <Chip size='small' label={filtersExpanded ? 'Filters expanded' : 'Filters collapsed'} variant='outlined' />
              </Stack>

              {error ? <Alert severity='error'>{error}</Alert> : null}

              <Collapse in={filtersExpanded} timeout='auto' unmountOnExit>
                <Stack spacing={4}>
                  <Grid container spacing={4}>
                    {ruleDefinitions.map(rule => {
                      const current = ruleState[rule.id] || { enabled: rule.defaultEnabled, parameters: rule.parameters || {} }

                      return (
                        <Grid item xs={12} md={6} key={rule.id}>
                          <Paper variant='outlined' sx={{ p: 4, height: '100%' }}>
                            <Stack spacing={2.5}>
                              <Box>
                                <Stack direction='row' spacing={2} alignItems='center' justifyContent='space-between'>
                                  <Typography variant='h6'>{rule.label}</Typography>
                                  <FormControlLabel
                                    control={<Switch checked={Boolean(current.enabled)} onChange={(_, checked) => handleToggleRule(rule.id, checked)} />}
                                    label={current.enabled ? 'On' : 'Off'}
                                    sx={{ mr: 0 }}
                                  />
                                </Stack>
                                <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
                                  {rule.description}
                                </Typography>
                              </Box>

                              <Stack direction='row' spacing={2} flexWrap='wrap' useFlexGap>
                                {Object.entries(rule.parameters || {}).map(([paramKey]) => (
                                  <TextField
                                    key={paramKey}
                                    size='small'
                                    type='number'
                                    label={formatLabel(paramKey)}
                                    value={current.parameters?.[paramKey] ?? ''}
                                    onChange={event => handleParamChange(rule.id, paramKey, event.target.value)}
                                    inputProps={{ min: 1 }}
                                    sx={{ minWidth: 180 }}
                                  />
                                ))}
                              </Stack>
                            </Stack>
                          </Paper>
                        </Grid>
                      )
                    })}
                  </Grid>

                  <Typography variant='body2' color='text.secondary'>
                    Only enabled rules are applied. Disabled rules stay available for later phases and presets.
                  </Typography>
                </Stack>
              </Collapse>

              <Divider />

              <Stack spacing={2}>
                {!result ? (
                  <Alert severity='warning'>
                    Run the historical universe filter first. The screener query below works on the <strong>included stocks</strong> from that run.
                  </Alert>
                ) : null}

                <Box sx={{ position: 'relative' }}>
                  <TextField
                    fullWidth
                    multiline
                    minRows={5}
                    label='Historical Screener Query'
                    placeholder='Sales growth > 12&#10;AND Profit growth > 15&#10;AND Return on capital employed > 15'
                    value={query}
                    onChange={event => {
                      setQuery(event.target.value)
                      requestAnimationFrame(updateCaretState)
                    }}
                    onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
                      if (!suggestions.length) return
                      if (event.key === 'ArrowDown') {
                        event.preventDefault()
                        setActiveSuggestionIndex(current => (current + 1) % suggestions.length)
                        return
                      }
                      if (event.key === 'ArrowUp') {
                        event.preventDefault()
                        setActiveSuggestionIndex(current => (current - 1 + suggestions.length) % suggestions.length)
                        return
                      }
                      if (event.key === 'Tab') {
                        event.preventDefault()
                        const suggestion = suggestions[activeSuggestionIndex]
                        if (!suggestion) return
                        const { nextQuery, nextCursor } = replaceLineField(query, activeLineContext, suggestion)
                        setQuery(nextQuery)
                        requestAnimationFrame(() => {
                          if (!textareaRef.current) return
                          textareaRef.current.focus()
                          textareaRef.current.setSelectionRange(nextCursor, nextCursor)
                          updateCaretState()
                        })
                      }
                    }}
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
                    helperText='Write screener-style query here. It will run only on the stocks that pass the enabled rules above.'
                  />

                  {Boolean(editorFocused && suggestions.length && cursorPosition && activeLineContext.fieldText.trim()) ? (
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
                              const { nextQuery, nextCursor } = replaceLineField(query, activeLineContext, item)
                              setQuery(nextQuery)
                              requestAnimationFrame(() => {
                                if (!textareaRef.current) return
                                textareaRef.current.focus()
                                textareaRef.current.setSelectionRange(nextCursor, nextCursor)
                                updateCaretState()
                              })
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
                  <Button
                    variant='contained'
                    startIcon={<SearchIcon />}
                    disabled={loadingRules || running || queryLoading || !query.trim() || !result || !result.included_stocks?.length}
                    onClick={() => runHistoricalQuery(ENDURL.POST_HISTORICAL_UNIVERSE_SEARCH, 'Main fundamentals engine')}
                  >
                    {queryLoading ? 'Running Query...' : 'Run Screener Query'}
                  </Button>
                  <Button
                    variant='outlined'
                    startIcon={<SearchIcon />}
                    disabled={loadingRules || running || queryLoading || !query.trim() || !result || !result.included_stocks?.length}
                    onClick={() =>
                      runHistoricalQuery(
                        ENDURL.POST_HISTORICAL_UNIVERSE_SEARCH_SPLIT,
                        'Split fundamentals + EOD engine'
                      )
                    }
                  >
                    {queryLoading ? 'Running Query...' : 'Run Split Query'}
                  </Button>
                  <Chip size='small' label={suggestionLoading ? 'Updating suggestions...' : 'Suggestions follow cursor'} variant='outlined' />
                  {result ? <Chip size='small' label={`Query universe: ${result.included_count} included stocks`} variant='outlined' /> : null}
                  {queryEngineLabel ? <Chip size='small' color='primary' label={queryEngineLabel} variant='outlined' /> : null}
                </Stack>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      {result ? (
        <>
          <Grid item xs={12}>
            <Card>
              <CardContent sx={{ pb: '16px !important' }}>
                <Tabs
                  value={resultSectionTab}
                  onChange={(_, value) => setResultSectionTab(value)}
                  variant='scrollable'
                  scrollButtons='auto'
                >
                  <Tab label='Summary' />
                  <Tab label={`Universe Results (${activeRows.length})`} />
                  <Tab label={`Screener Results (${queryRows.length})`} />
                </Tabs>
              </CardContent>
            </Card>
          </Grid>

          {resultSectionTab === 0 ? <Grid item xs={12} md={4}>
            <Card>
              <CardHeader title='Universe Summary' />
              <CardContent>
                <Stack spacing={2}>
                  <Chip label={`Candidates: ${result.total_candidates}`} color='primary' variant='outlined' />
                  <Chip label={`Included: ${result.included_count}`} color='success' variant='outlined' />
                  <Chip label={`Excluded: ${result.excluded_count}`} color='error' variant='outlined' />
                  <Typography variant='body2' color='text.secondary'>
                    This output is our clean historical universe snapshot for the chosen date.
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid> : null}

          {resultSectionTab === 0 ? <Grid item xs={12} md={8}>
            <Card>
              <CardHeader title='Failure Counts By Rule' />
              <CardContent>
                <Stack direction='row' spacing={1.5} flexWrap='wrap' useFlexGap>
                  {failureRows.length ? (
                    failureRows.map(item => <Chip key={item.ruleId} label={`${item.label}: ${item.count}`} variant='outlined' />)
                  ) : (
                    <Typography variant='body2' color='text.secondary'>
                      No enabled rule excluded any stock in this run.
                    </Typography>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid> : null}

          {resultSectionTab === 1 ? <Grid item xs={12}>
            <Card>
              <CardHeader title='Universe Results' subheader='We can use this result set directly in Phase 2 screener selection.' />
              <CardContent>
                <Tabs
                  value={activeTab}
                  onChange={(_, value) => {
                    setActiveTab(value)
                    setPage(0)
                  }}
                  sx={{ mb: 3 }}
                >
                  <Tab label={`Included (${result.included_count})`} />
                  <Tab label={`Excluded (${result.excluded_count})`} />
                </Tabs>

                <TablePagination
                  component='div'
                  count={activeRows.length}
                  page={page}
                  onPageChange={(_, newPage) => setPage(newPage)}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={event => {
                    setRowsPerPage(parseInt(event.target.value, 10))
                    setPage(0)
                  }}
                  rowsPerPageOptions={[25, 50, 100, 250]}
                  sx={{ px: 0, mb: 2 }}
                />

                <TableContainer component={Paper} variant='outlined' sx={{ maxHeight: 560 }}>
                  <Table size='small' stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>S.No.</TableCell>
                        <TableCell>Symbol</TableCell>
                        <TableCell>Name</TableCell>
                        <TableCell>Latest Trade Date</TableCell>
                        <TableCell>Candles Considered</TableCell>
                        <TableCell>Rule Notes</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {activeRows.length ? (
                        paginatedRows.map((row, index) => (
                          <TableRow
                            key={`${activeTab}-${row.master_id}`}
                            hover
                            sx={{ cursor: 'pointer' }}
                            onClick={() => window.open(`/eod-graph?master_id=${row.master_id}&symbol=${encodeURIComponent(row.symbol)}`, '_blank', 'noopener,noreferrer')}
                          >
                            <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                            <TableCell>
                              <Stack spacing={0.5}>
                                <Typography variant='body2' sx={{ fontWeight: 700 }}>
                                  {row.symbol}
                                </Typography>
                                <Typography variant='caption' color='text.secondary'>
                                  {row.exchange || '-'}
                                </Typography>
                              </Stack>
                            </TableCell>
                            <TableCell>{row.name}</TableCell>
                            <TableCell>{row.latest_trade_date || '-'}</TableCell>
                            <TableCell>{row.candle_count_considered || 0}</TableCell>
                            <TableCell>
                              {row.passed ? (
                                <Chip size='small' color='success' label='Passed all enabled rules' />
                              ) : (
                                <Stack spacing={1.25}>
                                  <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                                    {row.failed_rule_labels.map(label => (
                                      <Chip key={label} size='small' color='error' variant='outlined' label={label} />
                                    ))}
                                  </Stack>
                                  {Object.entries(row.rule_results || {})
                                    .filter(([, rule]) => rule?.enabled && rule?.passed === false)
                                    .map(([ruleId, rule]) => (
                                      <Accordion key={ruleId} disableGutters elevation={0} sx={{ backgroundColor: 'transparent', '&:before': { display: 'none' } }}>
                                        <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 0, minHeight: 'unset' }}>
                                          <Stack spacing={0.5}>
                                            <Typography variant='caption' sx={{ fontWeight: 700 }}>
                                              {formatLabel(ruleId)}
                                            </Typography>
                                            <Typography variant='caption' color='text.secondary'>
                                              {rule.reason}
                                            </Typography>
                                          </Stack>
                                        </AccordionSummary>
                                        <AccordionDetails sx={{ px: 0, pt: 0.5 }}>
                                          <Stack spacing={0.75}>
                                            {Object.entries(rule.parameters || {}).length ? (
                                              <Typography variant='caption' color='text.secondary'>
                                                Parameters: {Object.entries(rule.parameters || {})
                                                  .map(([key, value]) => `${formatLabel(key)}=${value}`)
                                                  .join(', ')}
                                              </Typography>
                                            ) : null}
                                            {Object.entries(rule.meta || {}).map(([metaKey, metaValue]) => (
                                              <Typography key={metaKey} variant='caption' color='text.secondary'>
                                                {formatLabel(metaKey)}: {formatMetaValue(metaValue)}
                                              </Typography>
                                            ))}
                                          </Stack>
                                        </AccordionDetails>
                                      </Accordion>
                                    ))}
                                </Stack>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6}>
                            <Typography variant='body2' color='text.secondary'>
                              No stocks in this section for the current run.
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>

                <TablePagination
                  component='div'
                  count={activeRows.length}
                  page={page}
                  onPageChange={(_, newPage) => setPage(newPage)}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={event => {
                    setRowsPerPage(parseInt(event.target.value, 10))
                    setPage(0)
                  }}
                  rowsPerPageOptions={[25, 50, 100, 250]}
                  sx={{ px: 0, mt: 2 }}
                />

                <Divider sx={{ my: 3 }} />
                <Typography variant='caption' color='text.secondary'>
                  Click any stock row to open its EOD graph in a new tab. This table now paginates the full result set from the current run.
                </Typography>
              </CardContent>
            </Card>
          </Grid> : null}
        </>
      ) : null}

      {query.trim() && resultSectionTab === 2 ? (
        <Grid item xs={12}>
          <Card>
            <CardHeader title='Screener Query Results' subheader='These stocks passed the rules above and also matched your screener query.' />
            <CardContent>
              {queryTimings ? (
                <Stack direction='row' spacing={1.25} flexWrap='wrap' useFlexGap sx={{ mb: 2 }}>
                  <Chip size='small' variant='outlined' label={`Universe time: ${queryTimings.universe_duration_ms ?? 0} ms`} />
                  <Chip size='small' variant='outlined' label={`Query time: ${queryTimings.query_duration_ms ?? 0} ms`} />
                  <Chip size='small' color='primary' variant='outlined' label={`Total time: ${queryTimings.total_duration_ms ?? 0} ms`} />
                  <Chip size='small' variant='outlined' label={`Included stocks used: ${queryTimings.included_stock_count ?? 0}`} />
                  <Chip
                    size='small'
                    variant='outlined'
                    label={queryTimings.used_provided_master_ids ? 'Used Phase 1 included stocks directly' : 'Universe rebuilt on backend'}
                  />
                </Stack>
              ) : null}

              <TableContainer component={Paper} variant='outlined' sx={{ maxHeight: 560 }}>
                <Table size='small' stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>S.No.</TableCell>
                      <TableCell>Symbol</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell>Price</TableCell>
                      <TableCell>Market Cap</TableCell>
                      <TableCell>Score</TableCell>
                      <TableCell>Rule Notes</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {queryRows.length ? (
                      queryRows.map((row, index) => {
                        const symbol = String(row.symbol || '')
                        const expanded = expandedQuerySymbol === symbol
                        return [
                          <TableRow
                            key={`query-${symbol || index}`}
                            hover
                            sx={{ cursor: 'pointer' }}
                            onClick={() => window.open(`/eod-graph?master_id=${row.master_id}&symbol=${encodeURIComponent(String(row.symbol || ''))}`, '_blank', 'noopener,noreferrer')}
                          >
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>{row.symbol || '-'}</TableCell>
                            <TableCell>{row.name || '-'}</TableCell>
                            <TableCell>{row.current_price ?? '-'}</TableCell>
                            <TableCell>{row.market_cap ?? '-'}</TableCell>
                            <TableCell>{row.analysis?.score ?? '-'}</TableCell>
                            <TableCell>
                              <Button
                                size='small'
                                variant='text'
                                onClick={event => {
                                  event.stopPropagation()
                                  setExpandedQuerySymbol(expanded ? null : symbol)
                                }}
                              >
                                {(row.search?.matched_count || 0) > 0 ? `${row.search?.matched_count} clauses` : 'Details'}
                              </Button>
                            </TableCell>
                          </TableRow>,
                          <TableRow key={`query-${symbol || index}-details`}>
                            <TableCell colSpan={7} sx={{ p: 0, borderBottom: expanded ? undefined : 'none' }}>
                              <Accordion expanded={expanded} onChange={(_, isExpanded) => setExpandedQuerySymbol(isExpanded ? symbol : null)} disableGutters elevation={0}>
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
                          </TableRow>,
                        ]
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7}>
                          <Typography variant='body2' color='text.secondary'>
                            Run the screener query above to see matching stocks here.
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
      ) : null}
    </Grid>
  )
}

export default HistoricalUniversePage
