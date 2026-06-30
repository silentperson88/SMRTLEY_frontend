import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent } from 'react'
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
import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'
import Alert from '@mui/material/Alert'
import LinearProgress from '@mui/material/LinearProgress'
import Chip from '@mui/material/Chip'
import Paper from '@mui/material/Paper'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Collapse from '@mui/material/Collapse'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { useSimpleSWR, useMutationSWR } from 'src/hooks/swr/swrhooks'
import type { PortfolioType } from 'src/types/portfolio'
import { useSnackbar } from 'src/layouts/components/SnackbarContext'
import { mutate } from 'swr'

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
  universe_state_key?: string | null
  total_candidates: number
  included_count: number
  excluded_count: number
  failure_counts: Record<string, number>
  applied_rules: Record<string, RuleState & { id: string; label: string; description: string }>
  included_stocks: UniverseStockRow[]
  excluded_stocks: UniverseStockRow[]
}

interface UniverseSnapshot {
  stateKey: string
  result: UniverseResponse
}

interface SearchMatch {
  field?: string
  operator?: string
  threshold?: string
  formattedActual?: string
  status?: string
  reason?: string
}

interface SearchRow {
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

interface SearchUniverseSummary {
  as_of_date?: string
  total_candidates?: number
  included_count?: number
  excluded_count?: number
  failure_counts?: Record<string, number>
}

interface SearchResponse {
  query?: string
  rows?: SearchRow[]
  total?: number
  universe?: SearchUniverseSummary
  suggestions?: SearchSuggestion[]
}

interface SearchSuggestion {
  key?: string
  label?: string
  aliases?: string[]
  example?: string
  unit?: string | null
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

interface CreatePortfolioPayload {
  name: string
  portfolio_type_id: string
  initial_fund: number
  meta?: {
    mode?: 'BACKTEST'
    as_of_date?: string
    query?: string
    watchlist_master_ids?: number[]
  }
}

const RULES_STORAGE_KEY = 'historical-universe-rules-v4'
const SNAPSHOT_STORAGE_KEY = 'historical-universe-filter-snapshot-v4'
const APPLIED_FILTER_SETUP_KEY = 'historical-universe-applied-setup-v1'
const UNIVERSE_STATE_VERSION = 'v5'
const FIELD_PATTERN = /^(.+?)\s*(>=|<=|!=|==|=|>|<|contains|starts with|ends with)\s*(.*)$/i

const normalizeDateKey = (value: string) => String(value || '').slice(0, 10).replace(/-/g, '')

const stableRuleSignature = (rules: Record<string, RuleState>) =>
  Object.keys(rules)
    .sort()
    .map(ruleId => {
      const state = rules[ruleId] || { enabled: false, parameters: {} }
      const params = Object.keys(state.parameters || {})
        .sort()
        .map(paramKey => `${paramKey}=${state.parameters?.[paramKey]}`)
        .join(',')
      
return `${ruleId}:${state.enabled ? 1 : 0}:${params}`
    })
    .join('|')

const hashUniverseSignature = (input: string) => {
  let hash = 2166136261
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  
return (hash >>> 0).toString(16).padStart(8, '0').slice(0, 8)
}

const buildUniverseStateKey = (asOfDate: string, rules: Record<string, RuleState>) => {
  const dateKey = normalizeDateKey(asOfDate)
  const rulesHash = hashUniverseSignature(stableRuleSignature(rules))
  
return `${UNIVERSE_STATE_VERSION}-${dateKey}-${rulesHash}`
}

const formatLabel = (key: string) =>
  String(key || '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, letter => letter.toUpperCase())

const readJson = <T,>(key: string): T | null => {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return null
    
return JSON.parse(raw) as T
  } catch {
    return null
  }
}

const writeJson = (key: string, value: unknown) => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore storage failures
  }
}

const removeStoredSnapshot = () => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(SNAPSHOT_STORAGE_KEY)
  } catch {
    // ignore storage failures
  }
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

const HistoricalUniversePage: NextPage = () => {
  const { asOfDate } = useAsOfDate()
  const [ruleDefinitions, setRuleDefinitions] = useState<RuleDefinition[]>([])
  const [ruleState, setRuleState] = useState<Record<string, RuleState>>({})
  const [loadingRules, setLoadingRules] = useState(false)
  const [filterLoading, setFilterLoading] = useState(false)
  const [queryLoading, setQueryLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<UniverseResponse | null>(null)
  const [query, setQuery] = useState('')
  const [queryRows, setQueryRows] = useState<SearchRow[]>([])
  const [queryUniverse, setQueryUniverse] = useState<SearchUniverseSummary | null>(null)
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [suggestionLoading, setSuggestionLoading] = useState(false)
  const [cursorIndex, setCursorIndex] = useState(0)
  const [cursorPosition, setCursorPosition] = useState<CursorPosition | null>(null)
  const [editorFocused, setEditorFocused] = useState(false)
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0)
  const [expandedSymbol, setExpandedSymbol] = useState<string | null>(null)
  const [rulesExpanded, setRulesExpanded] = useState(false)
  const [createBacktestOpen, setCreateBacktestOpen] = useState(false)
  const [backtestPortfolioName, setBacktestPortfolioName] = useState('')
  const [backtestInitialFund, setBacktestInitialFund] = useState<number | ''>('')
  const [backtestFormError, setBacktestFormError] = useState('')
  const [appliedStateKey, setAppliedStateKey] = useState<string | null>(() => {
    const appliedSetup = readJson<string>(APPLIED_FILTER_SETUP_KEY)
    if (appliedSetup) return appliedSetup
    const snapshot = readJson<UniverseSnapshot>(SNAPSHOT_STORAGE_KEY)
    
return snapshot?.stateKey || null
  })
  const [resultTab, setResultTab] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const { showSnackbar } = useSnackbar()
  const { data: portfolioTypesData } = useSimpleSWR<PortfolioType[]>(ENDURL.GET_PORTFOLIO_TYPES)
  const { trigger: createPortfolioTrigger, isMutating: creatingBacktestPortfolio } =
    useMutationSWR<any, CreatePortfolioPayload>(ENDURL.CREATE_PORTFOLIO)

  const currentStateKey = useMemo(() => buildUniverseStateKey(asOfDate, ruleState), [asOfDate, ruleState])
  const isFilterApplied = Boolean(appliedStateKey && appliedStateKey === currentStateKey)
  const hasQueryText = Boolean(query.trim())
  const canRunScreenerQuery = Boolean(isFilterApplied && hasQueryText && !queryLoading)
  const activeLineContext = useMemo(() => getActiveLineContext(query, cursorIndex), [query, cursorIndex])
  const backtestingType = useMemo(
    () => (portfolioTypesData || []).find(type => String(type.code || '').toUpperCase() === 'BACKTESTING') || null,
    [portfolioTypesData],
  )
  const matchedMasterIds = useMemo(
    () =>
      Array.from(
        new Set(
          (queryRows || [])
            .map(row => Number(row.master_id))
            .filter(value => Number.isFinite(value) && value > 0),
        ),
      ),
    [queryRows],
  )

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
  const canCreateBacktestingPortfolio = Boolean(
    isFilterApplied &&
      query.trim() &&
      matchedMasterIds.length > 0 &&
      backtestingType &&
      !creatingBacktestPortfolio,
  )

  const filterRulesPayload = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(ruleState).map(([ruleId, state]) => [
          ruleId,
          {
            enabled: Boolean(state.enabled),
            ...(state.parameters || {}),
          },
        ]),
      ),
    [ruleState],
  )

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

        const storedRuleState = readJson<Record<string, RuleState>>(RULES_STORAGE_KEY)
        setRuleState(
          rows.reduce((acc, rule) => {
            const stored = storedRuleState?.[rule.id]
            acc[rule.id] = {
              enabled: typeof stored?.enabled === 'boolean' ? stored.enabled : Boolean(rule.defaultEnabled),
              parameters: Object.entries(rule.parameters || {}).reduce((paramAcc, [paramKey, defaultValue]) => {
                const storedValue = Number(stored?.parameters?.[paramKey])
                paramAcc[paramKey] = Number.isFinite(storedValue) && storedValue > 0 ? Math.floor(storedValue) : defaultValue
                
return paramAcc
              }, {} as Record<string, number>),
            }
            
return acc
          }, {} as Record<string, RuleState>),
        )
      } catch (e: any) {
        if (!active) return
        setError(e?.response?.data?.message || 'Failed to load historical universe rules')
      } finally {
        if (active) setLoadingRules(false)
      }
    }

    void loadRules()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!Object.keys(ruleState).length) return
    writeJson(RULES_STORAGE_KEY, ruleState)
  }, [ruleState])

  useEffect(() => {
    const snapshot = readJson<UniverseSnapshot>(SNAPSHOT_STORAGE_KEY)
    if (snapshot?.stateKey === currentStateKey && snapshot?.result) {
      setResult(snapshot.result)
    } else {
      setResult(null)
    }
  }, [currentStateKey])

  useEffect(() => {
    setResultTab(0)
  }, [result?.as_of_date, result?.universe_state_key])

  useEffect(() => {
    setRulesExpanded(!isFilterApplied)
  }, [isFilterApplied])

  useEffect(() => {
    const searchTerm = activeLineContext.fieldText.trim()
    if (!editorFocused || !searchTerm || !isFilterApplied) {
      setSuggestions([])

      return
    }

    const handle = window.setTimeout(() => {
      void loadSuggestions(searchTerm)
    }, 160)

    return () => window.clearTimeout(handle)
  }, [activeLineContext.fieldText, editorFocused, isFilterApplied])

  useEffect(() => {
    setActiveSuggestionIndex(0)
  }, [suggestions])

  useEffect(() => {
    setQueryRows([])
    setQueryUniverse(null)
    setExpandedSymbol(null)
  }, [result?.universe_state_key, asOfDate])

  useEffect(() => {
    if (backtestingType?.fund !== undefined && backtestingType?.fund !== null && backtestInitialFund === '') {
      setBacktestInitialFund(backtestingType.fund)
    }
  }, [backtestingType, backtestInitialFund])

  const handleToggleRule = (ruleId: string, enabled: boolean) => {
    setRuleState(prev => ({
      ...prev,
      [ruleId]: {
        ...(prev[ruleId] || { enabled: false, parameters: {} }),
        enabled,
      },
    }))
    removeStoredSnapshot()
    writeJson(APPLIED_FILTER_SETUP_KEY, null)
    setAppliedStateKey(null)
  }

  const handleParamChange = (ruleId: string, paramKey: string, value: string) => {
    const parsed = Math.max(1, Math.floor(Number(value) || 0))
    setRuleState(prev => ({
      ...prev,
      [ruleId]: {
        ...(prev[ruleId] || { enabled: false, parameters: {} }),
        parameters: {
          ...((prev[ruleId] || {}).parameters || {}),
          [paramKey]: parsed,
        },
      },
    }))
    removeStoredSnapshot()
    writeJson(APPLIED_FILTER_SETUP_KEY, null)
    setAppliedStateKey(null)
  }

  const runUniverseFilter = async () => {
    if (!ruleDefinitions.length || !Object.keys(ruleState).length) return

    try {
      setFilterLoading(true)
      setError('')

      const res = await axiosInstance.post(
        ENDURL.POST_HISTORICAL_UNIVERSE_FILTER,
        {
          as_of_date: asOfDate,
          rules: filterRulesPayload,
        },
        {
          timeout: 120000,
        },
      )

      const payload = (res?.data?.data || {}) as Partial<UniverseResponse> & { cache_key?: string | null; result?: UniverseResponse | null }
      const universeResult = (payload.result || payload) as UniverseResponse
      const nextStateKey = universeResult?.universe_state_key || payload.cache_key || currentStateKey

      setResult(universeResult)
      setAppliedStateKey(nextStateKey)
      writeJson(APPLIED_FILTER_SETUP_KEY, nextStateKey)
      const snapshot: UniverseSnapshot = {
        stateKey: nextStateKey,
        result: universeResult,
      }
      writeJson(SNAPSHOT_STORAGE_KEY, snapshot)
      setResultTab(0)
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to build historical universe')
    } finally {
      setFilterLoading(false)
    }
  }

  const runScreenerQuery = async () => {
    const trimmedQuery = query.trim()
    if (!trimmedQuery) {
      setQueryRows([])
      setQueryUniverse(null)

      return
    }

    try {
      setQueryLoading(true)
      setError('')

      const res = await axiosInstance.post(
        ENDURL.POST_HISTORICAL_UNIVERSE_SEARCH_SPLIT,
        {
          as_of_date: asOfDate,
          query: trimmedQuery,
          limit: 100,
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
        },
        {
          timeout: 300000,
        },
      )

      const payload = (res?.data?.data || {}) as SearchResponse
      setQueryRows(Array.isArray(payload.rows) ? payload.rows : [])
      setQueryUniverse(payload.universe || null)
      setExpandedSymbol(null)
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to run historical screener query')
      setQueryRows([])
      setQueryUniverse(null)
    } finally {
      setQueryLoading(false)
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

  const onEditorKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
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

  const suggestionOpen = Boolean(isFilterApplied && editorFocused && suggestions.length && cursorPosition && activeLineContext.fieldText.trim())

  const openCreateBacktestingDialog = () => {
    if (!backtestingType) {
      showSnackbar('Backtesting portfolio type is not available yet.', 'error')

      return
    }

    setBacktestFormError('')
    setBacktestPortfolioName(
      backtestPortfolioName || `Backtest ${asOfDate} ${matchedMasterIds.length} Stocks`,
    )
    if (backtestInitialFund === '' && backtestingType.fund !== null && backtestingType.fund !== undefined) {
      setBacktestInitialFund(backtestingType.fund)
    }
    setCreateBacktestOpen(true)
  }

  const handleCreateBacktestingPortfolio = async () => {
    if (!backtestingType) {
      setBacktestFormError('Backtesting portfolio type was not found.')

      return
    }

    if (!backtestPortfolioName.trim()) {
      setBacktestFormError('Portfolio name is required.')

      return
    }

    const initialFund = Number(backtestInitialFund || 0)
    if (!Number.isFinite(initialFund) || initialFund < 0) {
      setBacktestFormError('Initial fund must be 0 or greater.')

      return
    }

    if (!matchedMasterIds.length) {
      setBacktestFormError('No matched stocks are available to add to watchlist.')

      return
    }

    try {
      setBacktestFormError('')
      await createPortfolioTrigger({
        name: backtestPortfolioName.trim(),
        portfolio_type_id: backtestingType.id,
        initial_fund: initialFund,
        meta: {
          mode: 'BACKTEST',
          as_of_date: asOfDate,
          query: query.trim(),
          watchlist_master_ids: matchedMasterIds,
        },
      })
      await mutate(ENDURL.GET_MY_PORTFOLIOS)
      showSnackbar('Backtesting portfolio created from current historical query.', 'success')
      setCreateBacktestOpen(false)
      setBacktestPortfolioName('')
      setBacktestInitialFund(backtestingType.fund ?? '')
    } catch (e: any) {
      const message = e?.response?.data?.message || 'Failed to create backtesting portfolio'
      setBacktestFormError(message)
      showSnackbar(message, 'error')
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

  const enabledRuleCount = useMemo(
    () => Object.values(ruleState).filter(rule => Boolean(rule.enabled)).length,
    [ruleState],
  )

  const activeRows =
    resultTab === 1
      ? result?.included_stocks || []
      : resultTab === 2
        ? result?.excluded_stocks || []
        : []

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Accordion
          expanded={rulesExpanded}
          onChange={(_, expanded) => setRulesExpanded(expanded)}
          disableGutters
          elevation={0}
          sx={{
            '&:before': { display: 'none' },
            borderRadius: 1,
            overflow: 'hidden',
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={1.5}
              alignItems={{ xs: 'flex-start', md: 'center' }}
              justifyContent='space-between'
              sx={{ width: '100%', pr: 1 }}
            >
              <Box>
                <Typography variant='h6'>Historical Universe Rules</Typography>
                <Typography variant='body2' color='text.secondary'>
                  Apply the active rules for the selected as-of date.
                </Typography>
              </Box>
              <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                <Chip size='small' label={`As Of Date: ${asOfDate}`} variant='outlined' />
                <Chip size='small' label={`${enabledRuleCount} rule${enabledRuleCount === 1 ? '' : 's'} enabled`} variant='outlined' />
                <Chip
                  size='small'
                  color={isFilterApplied ? 'success' : 'warning'}
                  label={isFilterApplied ? 'Filter applied' : 'Needs filter'}
                  variant='outlined'
                />
              </Stack>
            </Stack>
          </AccordionSummary>
          {(loadingRules || filterLoading) && <LinearProgress />}
          <AccordionDetails>
            <Stack spacing={3}>
              {error ? <Alert severity='error'>{error}</Alert> : null}

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

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', sm: 'center' }}>
                <Button
                  variant='contained'
                  disabled={loadingRules || filterLoading || !ruleDefinitions.length || isFilterApplied}
                  onClick={runUniverseFilter}
                >
                  {filterLoading ? 'Running Filter...' : isFilterApplied ? 'Filter Up to Date' : 'Run Filter'}
                </Button>
              </Stack>
            </Stack>
          </AccordionDetails>
        </Accordion>
      </Grid>

      {result ? (
        <>
          <Grid item xs={12}>
            <Card>
              <CardContent sx={{ pb: '16px !important' }}>
                <Tabs value={resultTab} onChange={(_, value) => setResultTab(value)} variant='scrollable' scrollButtons='auto'>
                  <Tab label='Summary' />
                  <Tab label={`Included (${result.included_count})`} />
                  <Tab label={`Excluded (${result.excluded_count})`} />
                </Tabs>
              </CardContent>
            </Card>
          </Grid>

          {resultTab === 0 ? (
            <Grid item xs={12}>
              <Card>
                <CardHeader title='Universe Summary' />
                <CardContent>
                  <Stack spacing={2}>
                    <Chip label={`As Of Date: ${result.as_of_date}`} color='primary' variant='outlined' />
                    <Chip label={`Candidates: ${result.total_candidates}`} variant='outlined' />
                    <Chip label={`Included: ${result.included_count}`} color='success' variant='outlined' />
                    <Chip label={`Excluded: ${result.excluded_count}`} color='error' variant='outlined' />
                    <Chip label={`State: ${result.universe_state_key || appliedStateKey || currentStateKey}`} variant='outlined' />
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ) : null}

          {resultTab === 1 || resultTab === 2 ? (
            <Grid item xs={12}>
              <Card>
                <CardHeader title={resultTab === 1 ? 'Included Stocks' : 'Excluded Stocks'} />
                <CardContent>
                  <TableContainer component={Paper} variant='outlined'>
                    <Table size='small'>
                      <TableHead>
                        <TableRow>
                          <TableCell>Symbol</TableCell>
                          <TableCell>Name</TableCell>
                          <TableCell>Exchange</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Latest Trade</TableCell>
                          <TableCell>Notes</TableCell>
                          <TableCell>Compare</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {activeRows.map(row => (
                          <TableRow key={row.master_id} hover>
                            <TableCell>{row.symbol}</TableCell>
                            <TableCell>{row.name}</TableCell>
                            <TableCell>{row.exchange || '-'}</TableCell>
                            <TableCell>{row.passed ? 'Passed' : 'Failed'}</TableCell>
                            <TableCell>{row.latest_trade_date || '-'}</TableCell>
                            <TableCell>
                              {row.passed ? 'Included in current universe' : row.failed_rule_labels?.length ? row.failed_rule_labels.join(', ') : '-'}
                            </TableCell>
                            <TableCell>
                              <Button
                                size='small'
                                variant='outlined'
                                onClick={() =>
                                  window.open(
                                    `/eod-graph/?master_id=${encodeURIComponent(String(row.master_id))}&symbol=${encodeURIComponent(row.symbol || '')}`,
                                    '_blank',
                                    'noopener,noreferrer',
                                  )
                                }
                              >
                                Compare
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {!activeRows.length ? (
                          <TableRow>
                            <TableCell colSpan={7} align='center'>
                              No rows to show
                            </TableCell>
                          </TableRow>
                        ) : null}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          ) : null}
        </>
      ) : null}

      <Grid item xs={12}>
        <Accordion expanded={isFilterApplied} disableGutters elevation={0} sx={{ '&:before': { display: 'none' } }}>
          <Card>
            <CardHeader
              title='Historical Screener Query'
              subheader='Phase 2 runs your screener query only on the stocks that currently pass the historical universe filter.'
              action={
                <Chip
                  size='small'
                  color={isFilterApplied ? 'success' : 'warning'}
                  label={isFilterApplied ? 'Filter applied' : 'Run filter first for new rules/date'}
                  variant='outlined'
                />
              }
            />
            {queryLoading ? <LinearProgress /> : null}
            <CardContent>
              {isFilterApplied ? (
                <Stack spacing={3}>
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} flexWrap='wrap' useFlexGap>
                    <Chip size='small' label={`As Of Date: ${asOfDate}`} variant='outlined' />
                    <Chip size='small' label={hasQueryText ? 'Query ready' : 'Paste a query'} color={hasQueryText ? 'primary' : 'default'} variant='outlined' />
                  </Stack>

                  <Box sx={{ position: 'relative' }}>
                    <TextField
                      fullWidth
                      multiline
                      minRows={6}
                      label='Screener Query'
                      placeholder='Price from 52 week high < 20&#10;AND Promoter holding > 40&#10;AND Current price < 100'
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
                      helperText='This uses EOD snapshot fields plus split fundamentals. Press Tab to insert the highlighted suggestion.'
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
                    <Button
                      variant='contained'
                      disabled={!canRunScreenerQuery}
                      onClick={runScreenerQuery}
                    >
                      {queryLoading ? 'Running Query...' : 'Run Screener Query'}
                    </Button>
                    <Chip
                      size='small'
                      label={suggestionLoading ? 'Updating suggestions...' : 'Suggestions follow cursor'}
                      variant='outlined'
                    />
                    {queryUniverse ? <Chip size='small' color='primary' label={`Matched: ${queryRows.length}`} variant='outlined' /> : null}
                  </Stack>
                </Stack>
              ) : (
                <Typography variant='body2' color='text.secondary'>
                  Run Filter for the current rules and as-of date before using the screener.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Accordion>
      </Grid>

      {queryUniverse ? (
        <>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Stack direction='row' spacing={1.25} flexWrap='wrap' useFlexGap>
                  <Chip label={`Candidates: ${queryUniverse.total_candidates || 0}`} variant='outlined' />
                  <Chip label={`Eligible after filter: ${queryUniverse.included_count || 0}`} color='success' variant='outlined' />
                  <Chip label={`Excluded by filter: ${queryUniverse.excluded_count || 0}`} color='error' variant='outlined' />
                  <Chip label={`Matched query: ${queryRows.length}`} color='primary' variant='outlined' />
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardHeader title='Matched Stocks' subheader='These stocks passed the current filter and also matched the screener query.' />
              <CardContent>
                <TableContainer component={Paper} variant='outlined'>
                  <Table size='small'>
                    <TableHead>
                      <TableRow>
                        <TableCell>S.No.</TableCell>
                        <TableCell>Stock</TableCell>
                        <TableCell>Price</TableCell>
                        <TableCell>Details</TableCell>
                        <TableCell>Compare</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {queryRows.length ? (
                        queryRows.map((row, index) => {
                          const symbol = String(row.symbol || '')
                          const expanded = expandedSymbol === symbol

                          return (
                            <Fragment key={symbol || String(index)}>
                              <TableRow key={symbol || String(index)} hover>
                                <TableCell>{index + 1}</TableCell>
                                <TableCell>
                                  <Stack spacing={0.5}>
                                    <Typography variant='body2' sx={{ fontWeight: 700 }}>
                                      {row.symbol || '-'}
                                    </Typography>
                                    <Typography variant='caption' color='text.secondary'>
                                      {row.name || '-'}
                                    </Typography>
                                    {row.analysis?.grade ? (
                                      <Chip size='small' label={row.analysis.grade} color={gradeColor(row.analysis.grade) as any} variant='outlined' />
                                    ) : null}
                                  </Stack>
                                </TableCell>
                                <TableCell>{row.current_price ?? '-'}</TableCell>
                                <TableCell>
                                  <Button size='small' variant='text' onClick={() => setExpandedSymbol(expanded ? null : symbol)}>
                                    {expanded ? 'Hide details' : 'View details'}
                                  </Button>
                                </TableCell>
                                <TableCell>
                                  <Button
                                    size='small'
                                    variant='outlined'
                                    onClick={() =>
                                      window.open(
                                        `/eod-graph/?master_id=${encodeURIComponent(String(row.master_id || ''))}&symbol=${encodeURIComponent(row.symbol || '')}`,
                                        '_blank',
                                        'noopener,noreferrer',
                                      )
                                    }
                                  >
                                    Compare
                                  </Button>
                                </TableCell>
                              </TableRow>
                              <TableRow key={`${symbol || index}-details`}>
                                <TableCell colSpan={5} sx={{ p: 0, borderBottom: expanded ? undefined : 'none' }}>
                                  <Collapse in={expanded} timeout='auto' unmountOnExit>
                                    <Box sx={{ px: 4, py: 3 }}>
                                      <Stack spacing={1}>
                                        {(row.search?.matches || []).map((match, matchIndex) => (
                                          <Typography key={`${symbol}-${match.field}-${matchIndex}`} variant='caption' color={match.status === 'match' ? 'success.main' : 'text.secondary'}>
                                            {match.field}: actual {match.formattedActual || '?'} {match.operator} {match.threshold} - {match.reason}
                                          </Typography>
                                        ))}
                                      </Stack>
                                    </Box>
                                  </Collapse>
                                </TableCell>
                              </TableRow>
                            </Fragment>
                          )
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} align='center'>
                            No stocks matched the current screener query.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1.5}
                  alignItems={{ xs: 'stretch', sm: 'center' }}
                  justifyContent='space-between'
                  sx={{ mt: 3 }}
                >
                  <Typography variant='body2' color='text.secondary'>
                    Create a backtesting portfolio from this exact as-of date, query, and matched watchlist.
                  </Typography>
                  <Button
                    variant='contained'
                    disabled={!canCreateBacktestingPortfolio}
                    onClick={openCreateBacktestingDialog}
                  >
                    Create Backtesting Portfolio
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </>
      ) : null}

      <Dialog open={createBacktestOpen} onClose={() => setCreateBacktestOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>Create Backtesting Portfolio</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <Alert severity='info'>
              This will create a <strong>Backtesting Portfolio</strong> using the current historical universe query and
              save all matched stocks into the portfolio watchlist.
            </Alert>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} flexWrap='wrap' useFlexGap>
              <Chip size='small' label={`As Of Date: ${asOfDate}`} variant='outlined' />
              <Chip size='small' label={`Matched Stocks: ${matchedMasterIds.length}`} color='primary' variant='outlined' />
            </Stack>
            <TextField
              fullWidth
              label='Portfolio Name'
              value={backtestPortfolioName}
              onChange={event => setBacktestPortfolioName(event.target.value)}
            />
            <TextField
              fullWidth
              type='number'
              label='Initial Fund'
              value={backtestInitialFund}
              onChange={event => setBacktestInitialFund(event.target.value === '' ? '' : Number(event.target.value))}
              inputProps={{ min: 0 }}
            />
            <TextField fullWidth multiline minRows={4} label='Saved Query' value={query.trim()} InputProps={{ readOnly: true }} />
            {backtestFormError ? <Alert severity='error'>{backtestFormError}</Alert> : null}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateBacktestOpen(false)} color='secondary'>
            Cancel
          </Button>
          <Button
            variant='contained'
            disabled={!canCreateBacktestingPortfolio || !backtestPortfolioName.trim()}
            onClick={handleCreateBacktestingPortfolio}
          >
            {creatingBacktestPortfolio ? 'Creating...' : 'Create Portfolio'}
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  )
}

export default HistoricalUniversePage
