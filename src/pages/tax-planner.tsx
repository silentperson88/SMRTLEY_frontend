import { useEffect, useMemo, useState } from 'react'
import type { NextPage } from 'next'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Alert from '@mui/material/Alert'
import Divider from '@mui/material/Divider'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Chip from '@mui/material/Chip'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import { useSnackbar } from 'src/layouts/components/SnackbarContext'
import axiosInstance from 'src/api/axios/axiosBaseQuery'
import { ENDURL } from 'src/utils/constants/endurl.utils'
import {
  BuyLot,
  SellTrade,
  TaxPlannerSettings,
  formatCurrencyNumber,
  getCurrentFinancialYearLabel,
  getCurrentFinancialYearStart,
  matchLotsAndSummarize,
  toDateInput
} from 'src/utils/taxPlanner'

type PlannerState = {
  buyLots: BuyLot[]
  sellTrades: SellTrade[]
  settings: TaxPlannerSettings
}

type SavedPlanner = {
  id: number
  name: string
  buy_lots: BuyLot[]
  sell_trades: SellTrade[]
  settings: TaxPlannerSettings
  updatedAt?: string
}

const STORAGE_KEY = 'run4dream-tax-planner-v1'

const createId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

const todayInput = () => toDateInput(new Date())

const createBuyRow = (): BuyLot => ({
  id: createId(),
  symbol: '',
  buyDate: todayInput(),
  qty: 0,
  buyPrice: 0,
  currentPrice: 0,
  notes: ''
})

const createSellRow = (): SellTrade => ({
  id: createId(),
  symbol: '',
  sellDate: todayInput(),
  qty: 0,
  sellPrice: 0,
  notes: ''
})

const defaultSettings: TaxPlannerSettings = {
  ltcgDays: 365,
  stcgRate: 20,
  ltcgRate: 12.5,
  ltcgExemption: 125000,
  exitCostPercent: 0.25,
  showLossHarvesting: false
}

const defaultState: PlannerState = {
  buyLots: [createBuyRow()],
  sellTrades: [],
  settings: defaultSettings
}

const loadState = (): PlannerState => {
  if (typeof window === 'undefined') return defaultState

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultState
    const parsed = JSON.parse(raw) as Partial<PlannerState>

    return {
      buyLots: Array.isArray(parsed.buyLots) && parsed.buyLots.length > 0 ? (parsed.buyLots as BuyLot[]) : [createBuyRow()],
      sellTrades: Array.isArray(parsed.sellTrades) ? (parsed.sellTrades as SellTrade[]) : [],
      settings: {
        ...defaultSettings,
        ...(parsed.settings || {})
      }
    }
  } catch {
    return defaultState
  }
}

const TaxPlannerPage: NextPage = () => {
  const { showSnackbar } = useSnackbar()
  const [activeTab, setActiveTab] = useState<'transactions' | 'analysis'>('transactions')
  const [buyLots, setBuyLots] = useState<BuyLot[]>(defaultState.buyLots)
  const [sellTrades, setSellTrades] = useState<SellTrade[]>(defaultState.sellTrades)
  const [settings, setSettings] = useState<TaxPlannerSettings>(defaultState.settings)
  const [hydrated, setHydrated] = useState(false)
  const [savedPlans, setSavedPlans] = useState<SavedPlanner[]>([])
  const [selectedPlanId, setSelectedPlanId] = useState<string>('')
  const [planName, setPlanName] = useState<string>('Default')
  const [dbLoading, setDbLoading] = useState(false)

  useEffect(() => {
    const persisted = loadState()
    setBuyLots(persisted.buyLots)
    setSellTrades(persisted.sellTrades)
    setSettings(persisted.settings)
    setHydrated(true)
  }, [])

  const syncSavedPlanList = async (preferredPlanId?: string) => {
    try {
      const res = await axiosInstance.get(ENDURL.USER_TAX_PLANNER_LIST)
      const plans = Array.isArray(res?.data?.data) ? (res.data.data as SavedPlanner[]) : []
      setSavedPlans(plans)

      const nextSelectedId =
        preferredPlanId || selectedPlanId || String(plans?.[0]?.id || '')
      if (nextSelectedId) {
        setSelectedPlanId(nextSelectedId)
      }

      return plans
    } catch (err: any) {
      showSnackbar(err?.response?.data?.message || err?.message || 'Failed to load saved plans', 'error')
      
return []
    }
  }

  const loadPlannerFromDb = async (planId?: string, opts: { silent?: boolean } = {}) => {
    try {
      setDbLoading(true)
      const url = planId
        ? ENDURL.USER_TAX_PLANNER_ITEM.replace(':planId', String(planId))
        : ENDURL.USER_TAX_PLANNER_ACTIVE
      const res = await axiosInstance.get(url)
      const plan = res?.data?.data as SavedPlanner | null

      if (!plan) {
        return
      }

      setBuyLots(Array.isArray(plan.buy_lots) && plan.buy_lots.length > 0 ? plan.buy_lots : [createBuyRow()])
      setSellTrades(Array.isArray(plan.sell_trades) ? plan.sell_trades : [])
      setSettings({
        ...defaultSettings,
        ...(plan.settings || {})
      })
      setPlanName(String(plan.name || 'Default'))
      setSelectedPlanId(String(plan.id || ''))
      if (!opts.silent) {
        showSnackbar('Planner loaded from database', 'success')
      }
    } catch (err: any) {
      if (err?.response?.status === 404) {
        if (planId && !opts.silent) {
          showSnackbar('Selected planner was not found', 'warning')
        }
        
return
      }
      if (!opts.silent) {
        showSnackbar(err?.response?.data?.message || err?.message || 'Failed to load saved planner', 'error')
      }
    } finally {
      setDbLoading(false)
    }
  }

  const savePlannerToDb = async () => {
    try {
      setDbLoading(true)
      const payload = {
        name: planName || 'Default',
        buyLots,
        sellTrades,
        settings
      }

      const url = selectedPlanId
        ? ENDURL.USER_TAX_PLANNER_ITEM.replace(':planId', String(selectedPlanId))
        : ENDURL.USER_TAX_PLANNER_LIST

      const res = selectedPlanId
        ? await axiosInstance.patch(url, payload)
        : await axiosInstance.post(url, payload)

      const saved = res?.data?.data as SavedPlanner | null
      if (saved?.id) {
        setSelectedPlanId(String(saved.id))
        setPlanName(String(saved.name || planName || 'Default'))
      }

      await syncSavedPlanList(String(saved?.id || selectedPlanId || ''))
      showSnackbar('Planner saved to database', 'success')
    } catch (err: any) {
      showSnackbar(err?.response?.data?.message || err?.message || 'Failed to save planner', 'error')
    } finally {
      setDbLoading(false)
    }
  }

  useEffect(() => {
    if (!hydrated) return
    syncSavedPlanList().catch(() => {})
    loadPlannerFromDb(undefined, { silent: true }).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated])

  useEffect(() => {
    if (!hydrated) return
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ buyLots, sellTrades, settings }))
    } catch {
      // ignore persistence issues
    }
  }, [buyLots, sellTrades, settings, hydrated])

  const planner = useMemo(() => matchLotsAndSummarize(buyLots, sellTrades, settings), [buyLots, sellTrades, settings])

  const taxFreeLtcgTrades = useMemo(
    () => planner.tradePlan.filter(row => row.category === 'TAX_FREE_LTCG'),
    [planner.tradePlan]
  )

  const offsetPairs = useMemo(
    () =>
      planner.recommendations
        .filter(
          item =>
            item.type === 'profit-booking' &&
            item.offsetAmount > 0 &&
            item.estimatedTaxIfSoldNow > 0
        )
        .map(item => ({
          id: item.id,
          profitSymbol: item.symbol,
          profitQty: item.suggestedSellQty,
          profitBucket: item.bucket,
          adjustedAgainst: item.adjustedAgainst,
          offsetAmount: item.offsetAmount,
          offsetDetails: item.offsetDetails,
          taxBefore: item.estimatedTaxIfSoldNow,
        taxAfter: item.estimatedTaxAfterAdjustment
        })),
    [planner.recommendations]
  )

  const possibleTradeRows = useMemo(() => {
    type AggregatedTradeRow = {
      key: string
      symbol: string
      actionLabel: string
      category: string
      totalQty: number
      totalValue: number
      bucket: string
      linkedTo: string
      reason: string
      entryCount: number
    }

    const map = new Map<string, AggregatedTradeRow>()

    for (const row of planner.tradePlan) {
      const key = `${row.actionType}-${row.category}-${row.symbol}`
      const existing = map.get(key)
      const linkedItems = String(row.linkedTo || '')
        .split(',')
        .map(item => item.trim())
        .filter(Boolean)

      const inferredLinkedTo =
        row.category === 'TAX_FREE_LTCG'
          ? 'LTCG exemption room'
          : linkedItems.length
            ? linkedItems.join(', ')
            : row.actionType === 'LOSS_SELL'
              ? 'Offset beneficiary'
              : 'No offset required'

      if (!existing) {
        map.set(key, {
          key,
          symbol: row.symbol,
          actionLabel:
            row.actionType === 'PROFIT_SELL'
              ? row.category === 'TAX_FREE_LTCG'
                ? 'Sell LTCG lot (tax-free)'
                : row.category === 'TAXABLE_LTCG'
                  ? 'Sell LTCG lot (taxable)'
                  : 'Sell profit lot'
              : 'Sell loss lot',
          category: row.category,
          totalQty: Number(row.qty || 0),
          totalValue: Number(row.value || 0),
          bucket: row.bucket,
          linkedTo: inferredLinkedTo,
          reason: row.reason,
          entryCount: 1
        })
      } else {
        existing.totalQty += Number(row.qty || 0)
        existing.totalValue += Number(row.value || 0)
        existing.entryCount += 1
        const mergedLinked = new Set(
          `${existing.linkedTo}, ${inferredLinkedTo}`
            .split(',')
            .map(item => item.trim())
            .filter(Boolean)
        )
        existing.linkedTo = Array.from(mergedLinked).join(', ')
      }
    }

    return Array.from(map.values()).sort((a, b) => {
      const priority = (category: string) => {
        if (category === 'TAX_FREE_LTCG') return 0
        if (category === 'STCG_PROFIT') return 1
        if (category === 'TAXABLE_LTCG') return 2
        
return 3
      }
      const categoryDiff = priority(a.category) - priority(b.category)
      if (categoryDiff !== 0) return categoryDiff
      
return a.symbol.localeCompare(b.symbol)
    })
  }, [planner.tradePlan])

  const symbolGroups = useMemo(() => {
    const groups = new Map<
      string,
      {
        buyLots: BuyLot[]
        sellTrades: SellTrade[]
        realizedGain: number
        unrealizedGain: number
        totalPnl: number
      }
    >()

    for (const row of buyLots) {
      const symbol = String(row.symbol || '').trim().toUpperCase()
      if (!symbol) continue
      if (!groups.has(symbol)) groups.set(symbol, { buyLots: [], sellTrades: [], realizedGain: 0, unrealizedGain: 0, totalPnl: 0 })
      groups.get(symbol)!.buyLots.push(row)
    }

    for (const row of sellTrades) {
      const symbol = String(row.symbol || '').trim().toUpperCase()
      if (!symbol) continue
      if (!groups.has(symbol)) groups.set(symbol, { buyLots: [], sellTrades: [], realizedGain: 0, unrealizedGain: 0, totalPnl: 0 })
      groups.get(symbol)!.sellTrades.push(row)
    }

    for (const row of planner.rows) {
      const symbol = String(row.symbol || '').trim().toUpperCase()
      if (!symbol) continue
      if (!groups.has(symbol)) {
        groups.set(symbol, { buyLots: [], sellTrades: [], realizedGain: 0, unrealizedGain: 0, totalPnl: 0 })
      }
      const group = groups.get(symbol)!
      group.realizedGain += Number(row.realizedGain || 0)
      group.unrealizedGain += Number(row.unrealizedGain || 0)
      group.totalPnl += Number(row.realizedGain || 0) + Number(row.unrealizedGain || 0)
    }

    return Array.from(groups.entries()).map(([symbol, group]) => {
      const currentPrice =
        [...group.buyLots]
          .reverse()
          .find(item => Number(item.currentPrice || 0) > 0)?.currentPrice || 0

      const boughtQty = group.buyLots.reduce((sum, item) => sum + Number(item.qty || 0), 0)
      const soldQty = group.sellTrades.reduce((sum, item) => sum + Number(item.qty || 0), 0)
      
return {
        symbol,
        currentPrice,
        boughtQty,
        soldQty,
        realizedGain: group.realizedGain,
        unrealizedGain: group.unrealizedGain,
        totalPnl: group.totalPnl,
        buyLots: group.buyLots,
        sellTrades: group.sellTrades
      }
    })
  }, [buyLots, sellTrades, planner.rows])

  const handleBuyChange = (id: string, field: keyof BuyLot, value: string) => {
    setBuyLots(prev =>
      prev.map(row =>
        row.id === id
          ? {
              ...row,
              [field]:
                field === 'symbol' || field === 'buyDate' || field === 'notes'
                  ? value
                  : Number(value || 0)
            }
          : row
      )
    )
  }

  const handleSellChange = (id: string, field: keyof SellTrade, value: string) => {
    setSellTrades(prev =>
      prev.map(row =>
        row.id === id
          ? {
              ...row,
              [field]:
                field === 'symbol' || field === 'sellDate' || field === 'notes'
                  ? value
                  : Number(value || 0)
            }
          : row
      )
    )
  }

  const removeBuyRow = (id: string) => setBuyLots(prev => prev.filter(row => row.id !== id))
  const removeSellRow = (id: string) => setSellTrades(prev => prev.filter(row => row.id !== id))

  const applyCurrentPriceToSymbol = (symbol: string) => {
    const target = String(symbol || '').trim().toUpperCase()
    if (!target) return
    const latest = [...buyLots].reverse().find(item => String(item.symbol || '').trim().toUpperCase() === target)
    const currentPrice = Number(latest?.currentPrice || 0)
    if (!currentPrice) return
    setBuyLots(prev =>
      prev.map(row => (String(row.symbol || '').trim().toUpperCase() === target ? { ...row, currentPrice } : row))
    )
  }

  const resetAll = () => {
    setBuyLots([createBuyRow()])
    setSellTrades([])
    setSettings(defaultSettings)
    showSnackbar('Planner reset', 'success')
  }

  const addExampleRow = () => {
    const fyStart = getCurrentFinancialYearStart()
    setBuyLots(prev => [
      ...prev,
      {
        ...createBuyRow(),
        symbol: 'INFY',
        buyDate: fyStart,
        qty: 100,
        buyPrice: 1500,
        currentPrice: 1750
      }
    ])
    setSellTrades(prev => [
      ...prev,
      {
        ...createSellRow(),
        symbol: 'INFY',
        sellDate: todayInput(),
        qty: 0,
        sellPrice: 0
      }
    ])
  }

  const bookedThisFY = planner.summary.totalRealizedGain
  const taxableLtcgAfterExemption = Math.max(0, planner.summary.bookedLtcgThisFY - settings.ltcgExemption)
  const estimatedLtcgTaxOnBooked = taxableLtcgAfterExemption * (settings.ltcgRate / 100)
  const estimatedStcgTaxOnBooked = Math.max(0, planner.summary.bookedStcgThisFY) * (settings.stcgRate / 100)

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Stack spacing={1}>
              <Typography variant='h4'>Tax Planner</Typography>
              <Typography variant='body2' color='text.secondary'>
                Plan profit booking with buy chunks, sell history, and FIFO lot matching. Defaults are set for India listed equity rules.
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Alert severity='info'>
          Profit-first by default: deep-loss stocks are not suggested unless you explicitly enable loss harvesting and the tax benefit is real.
        </Alert>
      </Grid>

      <Grid item xs={12}>
        <Alert severity='success'>
          Matching rule: STCG profit uses STCG loss only. LTCG profit can use STCG loss or LTCG loss. Tax-free LTCG entries stay separate.
        </Alert>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Grid container spacing={4} alignItems='center'>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label='Plan Name'
                  value={planName}
                  onChange={e => setPlanName(e.target.value)}
                  helperText='Default plan is used when you do not enter a name.'
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel id='saved-plan-label'>Saved Plans</InputLabel>
                  <Select
                    labelId='saved-plan-label'
                    label='Saved Plans'
                    value={selectedPlanId}
                    onChange={e => setSelectedPlanId(String(e.target.value))}
                  >
                    <MenuItem value=''>
                      <em>Current Draft</em>
                    </MenuItem>
                    {savedPlans.map(plan => (
                      <MenuItem key={plan.id} value={String(plan.id)}>
                        {plan.name} {plan.updatedAt ? `• ${String(plan.updatedAt).slice(0, 10)}` : ''}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <Stack direction='row' spacing={2} justifyContent='flex-end' flexWrap='wrap'>
                  <Button variant='outlined' onClick={() => loadPlannerFromDb(selectedPlanId || undefined)} disabled={dbLoading}>
                    Load from DB
                  </Button>
                  <Button variant='contained' onClick={savePlannerToDb} disabled={dbLoading}>
                    Save to DB
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Grid container spacing={4}>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label='STCG Rate %'
                  type='number'
                  value={settings.stcgRate}
                  onChange={e => setSettings(prev => ({ ...prev, stcgRate: Number(e.target.value || 0) }))}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label='LTCG Rate %'
                  type='number'
                  value={settings.ltcgRate}
                  onChange={e => setSettings(prev => ({ ...prev, ltcgRate: Number(e.target.value || 0) }))}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label='LTCG Exemption'
                  type='number'
                  value={settings.ltcgExemption}
                  onChange={e => setSettings(prev => ({ ...prev, ltcgExemption: Number(e.target.value || 0) }))}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label='Exit Cost %'
                  type='number'
                  value={settings.exitCostPercent}
                  onChange={e => setSettings(prev => ({ ...prev, exitCostPercent: Number(e.target.value || 0) }))}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label='LTCG Days'
                  type='number'
                  value={settings.ltcgDays}
                  onChange={e => setSettings(prev => ({ ...prev, ltcgDays: Number(e.target.value || 0) }))}
                />
              </Grid>
              <Grid item xs={12} md={3} sx={{ display: 'flex', alignItems: 'center' }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={settings.showLossHarvesting}
                      onChange={e => setSettings(prev => ({ ...prev, showLossHarvesting: e.target.checked }))}
                    />
                  }
                  label='Show loss harvesting'
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Stack direction='row' spacing={2} justifyContent='flex-end' flexWrap='wrap'>
                  <Button variant='outlined' onClick={addExampleRow}>
                    Add Example
                  </Button>
                  <Button variant='outlined' color='inherit' onClick={resetAll}>
                    Reset All
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <Tabs value={activeTab} onChange={(_, value) => setActiveTab(value)} sx={{ px: 2, pt: 1 }}>
            <Tab value='transactions' label='Transactions' />
            <Tab value='analysis' label='Analysis' />
          </Tabs>
          <Divider />
          <CardContent>
            {activeTab === 'transactions' ? (
              <Grid container spacing={6}>
                <Grid item xs={12}>
                  <Stack direction='row' spacing={2} alignItems='center' justifyContent='space-between' flexWrap='wrap'>
                    <Typography variant='h6'>Buy Lots</Typography>
                    <Button variant='contained' onClick={() => setBuyLots(prev => [...prev, createBuyRow()])}>
                      Add Buy Lot
                    </Button>
                  </Stack>
                  <Table sx={{ mt: 2 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell>Symbol</TableCell>
                        <TableCell>Buy Date</TableCell>
                        <TableCell>Qty</TableCell>
                        <TableCell>Buy Price</TableCell>
                        <TableCell>Current Price</TableCell>
                        <TableCell>Notes</TableCell>
                        <TableCell>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {buyLots.map(row => (
                        <TableRow key={row.id}>
                          <TableCell sx={{ minWidth: 140 }}>
                            <TextField fullWidth size='small' value={row.symbol} onChange={e => handleBuyChange(row.id, 'symbol', e.target.value)} />
                          </TableCell>
                          <TableCell sx={{ minWidth: 150 }}>
                            <TextField
                              fullWidth
                              size='small'
                              type='date'
                              value={row.buyDate}
                              onChange={e => handleBuyChange(row.id, 'buyDate', e.target.value)}
                            />
                          </TableCell>
                          <TableCell sx={{ minWidth: 110 }}>
                            <TextField fullWidth size='small' type='number' value={row.qty} onChange={e => handleBuyChange(row.id, 'qty', e.target.value)} />
                          </TableCell>
                          <TableCell sx={{ minWidth: 130 }}>
                            <TextField
                              fullWidth
                              size='small'
                              type='number'
                              value={row.buyPrice}
                              onChange={e => handleBuyChange(row.id, 'buyPrice', e.target.value)}
                            />
                          </TableCell>
                          <TableCell sx={{ minWidth: 130 }}>
                            <TextField
                              fullWidth
                              size='small'
                              type='number'
                              value={row.currentPrice}
                              onChange={e => handleBuyChange(row.id, 'currentPrice', e.target.value)}
                            />
                          </TableCell>
                          <TableCell sx={{ minWidth: 220 }}>
                            <TextField fullWidth size='small' value={row.notes || ''} onChange={e => handleBuyChange(row.id, 'notes', e.target.value)} />
                          </TableCell>
                          <TableCell sx={{ minWidth: 180 }}>
                            <Stack direction='row' spacing={1}>
                              <Button size='small' variant='outlined' onClick={() => applyCurrentPriceToSymbol(row.symbol)}>
                                Apply to Symbol
                              </Button>
                              <Button size='small' color='error' variant='outlined' onClick={() => removeBuyRow(row.id)}>
                                Delete
                              </Button>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Grid>

                <Grid item xs={12}>
                  <Stack direction='row' spacing={2} alignItems='center' justifyContent='space-between' flexWrap='wrap'>
                    <Typography variant='h6'>Sell Trades</Typography>
                    <Button variant='contained' onClick={() => setSellTrades(prev => [...prev, createSellRow()])}>
                      Add Sell Trade
                    </Button>
                  </Stack>
                  <Table sx={{ mt: 2 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell>Symbol</TableCell>
                        <TableCell>Sell Date</TableCell>
                        <TableCell>Qty</TableCell>
                        <TableCell>Sell Price</TableCell>
                        <TableCell>Notes</TableCell>
                        <TableCell>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {sellTrades.length ? (
                        sellTrades.map(row => (
                          <TableRow key={row.id}>
                            <TableCell sx={{ minWidth: 140 }}>
                              <TextField fullWidth size='small' value={row.symbol} onChange={e => handleSellChange(row.id, 'symbol', e.target.value)} />
                            </TableCell>
                            <TableCell sx={{ minWidth: 150 }}>
                              <TextField
                                fullWidth
                                size='small'
                                type='date'
                                value={row.sellDate}
                                onChange={e => handleSellChange(row.id, 'sellDate', e.target.value)}
                              />
                            </TableCell>
                            <TableCell sx={{ minWidth: 110 }}>
                              <TextField fullWidth size='small' type='number' value={row.qty} onChange={e => handleSellChange(row.id, 'qty', e.target.value)} />
                            </TableCell>
                            <TableCell sx={{ minWidth: 130 }}>
                              <TextField
                                fullWidth
                                size='small'
                                type='number'
                                value={row.sellPrice}
                                onChange={e => handleSellChange(row.id, 'sellPrice', e.target.value)}
                              />
                            </TableCell>
                            <TableCell sx={{ minWidth: 220 }}>
                              <TextField fullWidth size='small' value={row.notes || ''} onChange={e => handleSellChange(row.id, 'notes', e.target.value)} />
                            </TableCell>
                            <TableCell sx={{ minWidth: 120 }}>
                              <Button size='small' color='error' variant='outlined' onClick={() => removeSellRow(row.id)}>
                                Delete
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} align='center'>
                            Add sells only if you already booked profit or loss this FY.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </Grid>
              </Grid>
            ) : (
              <Grid container spacing={6}>
                <Grid item xs={12} md={3}>
                  <Card variant='outlined'>
                    <CardContent>
                      <Typography variant='body2' color='text.secondary'>
                        Current FY
                      </Typography>
                      <Typography variant='h6'>{getCurrentFinancialYearLabel()}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card variant='outlined'>
                    <CardContent>
                      <Typography variant='body2' color='text.secondary'>
                        Realized P&L
                      </Typography>
                      <Typography variant='h6'>{formatCurrencyNumber(bookedThisFY)}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card variant='outlined'>
                    <CardContent>
                      <Typography variant='body2' color='text.secondary'>
                        Remaining LTCG Exemption
                      </Typography>
                      <Typography variant='h6'>{formatCurrencyNumber(planner.summary.remainingLtcgExemption)}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card variant='outlined'>
                    <CardContent>
                      <Typography variant='body2' color='text.secondary'>
                        Open Quantity
                      </Typography>
                      <Typography variant='h6'>{formatCurrencyNumber(planner.summary.openQuantity)}</Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12}>
                  <Card variant='outlined'>
                    <CardContent>
                      <Typography variant='h6'>Portfolio Summary</Typography>
                      <Divider sx={{ my: 2 }} />
                      <Grid container spacing={3}>
                        <Grid item xs={12} md={4}>
                          <Typography variant='body2' color='text.secondary'>
                            Total Buy Value
                          </Typography>
                          <Typography variant='h6'>{formatCurrencyNumber(planner.summary.totalBuyValue)}</Typography>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Typography variant='body2' color='text.secondary'>
                            Current Value
                          </Typography>
                          <Typography variant='h6'>{formatCurrencyNumber(planner.summary.totalCurrentValue)}</Typography>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Typography variant='body2' color='text.secondary'>
                            Unrealized P&L
                          </Typography>
                          <Typography variant='h6'>{formatCurrencyNumber(planner.summary.totalUnrealizedGain)}</Typography>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Typography variant='body2' color='text.secondary'>
                            Realized STCG
                          </Typography>
                          <Typography variant='h6'>{formatCurrencyNumber(planner.summary.totalRealizedStcgGain)}</Typography>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Typography variant='body2' color='text.secondary'>
                            Realized LTCG
                          </Typography>
                          <Typography variant='h6'>{formatCurrencyNumber(planner.summary.totalRealizedLtcgGain)}</Typography>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Typography variant='body2' color='text.secondary'>
                            Indicative tax on booked gains
                          </Typography>
                          <Typography variant='h6'>
                            {formatCurrencyNumber(estimatedStcgTaxOnBooked + estimatedLtcgTaxOnBooked)}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12}>
                  <Card variant='outlined'>
                    <CardContent>
                      <Typography variant='h6'>Current ST / LT Gain &amp; Loss</Typography>
                      <Divider sx={{ my: 2 }} />
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Bucket</TableCell>
                            <TableCell>Realized Gain</TableCell>
                            <TableCell>Realized Loss</TableCell>
                            <TableCell>Unrealized Gain</TableCell>
                            <TableCell>Unrealized Loss</TableCell>
                            <TableCell>Net P&amp;L</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          <TableRow>
                            <TableCell>STCG</TableCell>
                            <TableCell>{formatCurrencyNumber(planner.bucketSummary.realizedStcgGain)}</TableCell>
                            <TableCell>{formatCurrencyNumber(planner.bucketSummary.realizedStcgLoss)}</TableCell>
                            <TableCell>{formatCurrencyNumber(planner.bucketSummary.unrealizedStcgGain)}</TableCell>
                            <TableCell>{formatCurrencyNumber(planner.bucketSummary.unrealizedStcgLoss)}</TableCell>
                            <TableCell>{formatCurrencyNumber(planner.bucketSummary.currentStcgPnl)}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>LTCG</TableCell>
                            <TableCell>{formatCurrencyNumber(planner.bucketSummary.realizedLtcgGain)}</TableCell>
                            <TableCell>{formatCurrencyNumber(planner.bucketSummary.realizedLtcgLoss)}</TableCell>
                            <TableCell>{formatCurrencyNumber(planner.bucketSummary.unrealizedLtcgGain)}</TableCell>
                            <TableCell>{formatCurrencyNumber(planner.bucketSummary.unrealizedLtcgLoss)}</TableCell>
                            <TableCell>{formatCurrencyNumber(planner.bucketSummary.currentLtcgPnl)}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12}>
                  <Card variant='outlined'>
                    <CardContent>
                      <Typography variant='h6'>Current ST / LT P&amp;L</Typography>
                      <Divider sx={{ my: 2 }} />
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Bucket</TableCell>
                            <TableCell>Realized P&amp;L</TableCell>
                            <TableCell>Unrealized P&amp;L</TableCell>
                            <TableCell>Current P&amp;L</TableCell>
                            <TableCell>Indicative Tax</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          <TableRow>
                            <TableCell>STCG</TableCell>
                            <TableCell>{formatCurrencyNumber(planner.bucketSummary.realizedStcgGain)}</TableCell>
                            <TableCell>{formatCurrencyNumber(planner.bucketSummary.unrealizedStcgGain)}</TableCell>
                            <TableCell>{formatCurrencyNumber(planner.bucketSummary.currentStcgPnl)}</TableCell>
                            <TableCell>{formatCurrencyNumber(planner.bucketSummary.currentStcgTax)}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>LTCG</TableCell>
                            <TableCell>{formatCurrencyNumber(planner.bucketSummary.realizedLtcgGain)}</TableCell>
                            <TableCell>{formatCurrencyNumber(planner.bucketSummary.unrealizedLtcgGain)}</TableCell>
                            <TableCell>{formatCurrencyNumber(planner.bucketSummary.currentLtcgPnl)}</TableCell>
                            <TableCell>{formatCurrencyNumber(planner.bucketSummary.currentLtcgTax)}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Total</TableCell>
                            <TableCell>{formatCurrencyNumber(planner.bucketSummary.realizedStcgGain + planner.bucketSummary.realizedLtcgGain)}</TableCell>
                            <TableCell>{formatCurrencyNumber(planner.bucketSummary.unrealizedStcgGain + planner.bucketSummary.unrealizedLtcgGain)}</TableCell>
                            <TableCell>{formatCurrencyNumber(planner.bucketSummary.currentStcgPnl + planner.bucketSummary.currentLtcgPnl)}</TableCell>
                            <TableCell>{formatCurrencyNumber(planner.bucketSummary.totalCurrentTax)}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12}>
                  <Card variant='outlined'>
                    <CardContent>
                      <Typography variant='h6'>Stock-wise View</Typography>
                      <Divider sx={{ my: 2 }} />
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Symbol</TableCell>
                            <TableCell>Bought</TableCell>
                            <TableCell>Sold</TableCell>
                            <TableCell>Open</TableCell>
                            <TableCell>Realized P&L</TableCell>
                            <TableCell>Unrealized P&L</TableCell>
                            <TableCell>Total P&L</TableCell>
                            <TableCell>Current Price</TableCell>
                            <TableCell>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {symbolGroups.length ? (
                            symbolGroups.map(row => (
                              <TableRow key={row.symbol}>
                                <TableCell>{row.symbol}</TableCell>
                                <TableCell>{formatCurrencyNumber(row.boughtQty)}</TableCell>
                                <TableCell>{formatCurrencyNumber(row.soldQty)}</TableCell>
                                <TableCell>{formatCurrencyNumber(Math.max(0, row.boughtQty - row.soldQty))}</TableCell>
                                <TableCell>{formatCurrencyNumber(row.realizedGain)}</TableCell>
                                <TableCell>{formatCurrencyNumber(row.unrealizedGain)}</TableCell>
                                <TableCell>{formatCurrencyNumber(row.totalPnl)}</TableCell>
                                <TableCell>{row.currentPrice ? formatCurrencyNumber(row.currentPrice) : '-'}</TableCell>
                                <TableCell>
                                  <Chip
                                    label={
                                      row.currentPrice > 0
                                        ? 'Ready for review'
                                        : 'Add current price'
                                    }
                                    size='small'
                                    color={row.currentPrice > 0 ? 'success' : 'default'}
                                    variant='outlined'
                                  />
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={9} align='center'>
                                Add buy lots to generate your tax plan.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12}>
                  <Card variant='outlined'>
                    <CardContent>
                      <Typography variant='h6'>Profit Booking Suggestions</Typography>
                      <Divider sx={{ my: 2 }} />
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Symbol</TableCell>
                            <TableCell>Sell Qty</TableCell>
                            <TableCell>Qty</TableCell>
                            <TableCell>Gain</TableCell>
                            <TableCell>Bucket</TableCell>
                            <TableCell>Adjusted Against</TableCell>
                            <TableCell>Offset</TableCell>
                            <TableCell>Tax / Saving</TableCell>
                            <TableCell>Reason</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {planner.recommendations.filter(item => item.type === 'profit-booking').length ? (
                            planner.recommendations
                              .filter(item => item.type === 'profit-booking')
                              .map(item => (
                                <TableRow key={item.id}>
                                  <TableCell>{item.symbol}</TableCell>
                                  <TableCell>{item.suggestedSellQty > 0 ? formatCurrencyNumber(item.suggestedSellQty) : 'Hold'}</TableCell>
                                  <TableCell>{formatCurrencyNumber(item.qty)}</TableCell>
                                  <TableCell>{formatCurrencyNumber(item.gain)}</TableCell>
                                  <TableCell>{item.bucket}</TableCell>
                                  <TableCell>{item.adjustedAgainst || '-'}</TableCell>
                                  <TableCell>{formatCurrencyNumber(item.offsetAmount || 0)}</TableCell>
                                  <TableCell>
                                    {formatCurrencyNumber(item.estimatedTaxIfSoldNow)} / {formatCurrencyNumber(item.estimatedTaxAfterAdjustment)}
                                  </TableCell>
                                  <TableCell>{item.reason}</TableCell>
                                </TableRow>
                              ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={9} align='center'>
                                No profit-booking candidate found yet.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12}>
                  <Card variant='outlined'>
                    <CardContent>
                      <Typography variant='h6'>Offset Pairs</Typography>
                      <Divider sx={{ my: 2 }} />
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Profit Stock</TableCell>
                            <TableCell>Profit Qty</TableCell>
                            <TableCell>Bucket</TableCell>
                            <TableCell>Offset Stock</TableCell>
                            <TableCell>Offset Qty</TableCell>
                            <TableCell>Offset Value</TableCell>
                            <TableCell>Tax Before</TableCell>
                            <TableCell>Tax After</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {offsetPairs.length ? (
                            offsetPairs.map(pair => (
                              pair.offsetDetails.length ? (
                                pair.offsetDetails.map((offset, index) => (
                                  <TableRow key={`${pair.id}-${offset.buyLotId}-${index}`}>
                                    <TableCell>{pair.profitSymbol}</TableCell>
                                    <TableCell>{formatCurrencyNumber(pair.profitQty)}</TableCell>
                                    <TableCell>{pair.profitBucket}</TableCell>
                                    <TableCell>{offset.symbol}</TableCell>
                                    <TableCell>{formatCurrencyNumber(offset.qty)}</TableCell>
                                    <TableCell>{formatCurrencyNumber(offset.amount)}</TableCell>
                                    <TableCell>{formatCurrencyNumber(pair.taxBefore)}</TableCell>
                                    <TableCell>{formatCurrencyNumber(pair.taxAfter)}</TableCell>
                                  </TableRow>
                                ))
                              ) : (
                                <TableRow key={pair.id}>
                                  <TableCell>{pair.profitSymbol}</TableCell>
                                  <TableCell>{formatCurrencyNumber(pair.profitQty)}</TableCell>
                                  <TableCell>{pair.profitBucket}</TableCell>
                                  <TableCell>{pair.adjustedAgainst}</TableCell>
                                  <TableCell>-</TableCell>
                                  <TableCell>{formatCurrencyNumber(pair.offsetAmount)}</TableCell>
                                  <TableCell>{formatCurrencyNumber(pair.taxBefore)}</TableCell>
                                  <TableCell>{formatCurrencyNumber(pair.taxAfter)}</TableCell>
                                </TableRow>
                              )
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={8} align='center'>
                                No offset pair found yet.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12}>
                  <Card variant='outlined'>
                    <CardContent>
                      <Typography variant='h6'>Tax-Free LTCG Trades</Typography>
                      <Divider sx={{ my: 2 }} />
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Seq</TableCell>
                            <TableCell>Symbol</TableCell>
                            <TableCell>Qty</TableCell>
                            <TableCell>Value</TableCell>
                            <TableCell>Bucket</TableCell>
                            <TableCell>Status</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {taxFreeLtcgTrades.length ? (
                            taxFreeLtcgTrades.map(row => (
                              <TableRow key={`taxfree-${row.sequence}-${row.buyLotId}`}>
                                <TableCell>{row.sequence}</TableCell>
                                <TableCell>{row.symbol}</TableCell>
                                <TableCell>{formatCurrencyNumber(row.qty)}</TableCell>
                                <TableCell>{formatCurrencyNumber(row.value)}</TableCell>
                                <TableCell>{row.bucket}</TableCell>
                                <TableCell>Within LTCG exemption</TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={6} align='center'>
                                No tax-free LTCG trades found yet.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12}>
                  <Card variant='outlined'>
                    <CardContent>
                      <Typography variant='h6'>Possible Trades</Typography>
                      <Divider sx={{ my: 2 }} />
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Symbol</TableCell>
                            <TableCell>Total Qty</TableCell>
                            <TableCell>Category</TableCell>
                            <TableCell>Action</TableCell>
                            <TableCell>Value</TableCell>
                            <TableCell>Linked To / Benefit</TableCell>
                            <TableCell>Reason</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {possibleTradeRows.length ? (
                            possibleTradeRows.map(row => (
                              <TableRow key={row.key}>
                                <TableCell>{row.symbol}</TableCell>
                                <TableCell>{formatCurrencyNumber(row.totalQty)}</TableCell>
                                <TableCell>{row.category}</TableCell>
                                <TableCell>{row.actionLabel}</TableCell>
                                <TableCell>{formatCurrencyNumber(row.totalValue)}</TableCell>
                                <TableCell>{row.linkedTo}</TableCell>
                                <TableCell>{row.reason}</TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={7} align='center'>
                                No trade plan available yet.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </Grid>

                {settings.showLossHarvesting && (
                  <Grid item xs={12}>
                    <Card variant='outlined'>
                      <CardContent>
                        <Typography variant='h6'>Loss Harvesting Candidates</Typography>
                        <Divider sx={{ my: 2 }} />
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell>Symbol</TableCell>
                              <TableCell>Qty</TableCell>
                              <TableCell>Loss</TableCell>
                              <TableCell>Tax Saving</TableCell>
                              <TableCell>Reason</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {planner.recommendations.filter(item => item.type === 'loss-harvesting').length ? (
                              planner.recommendations
                                .filter(item => item.type === 'loss-harvesting')
                                .map(item => (
                                  <TableRow key={item.id}>
                                    <TableCell>{item.symbol}</TableCell>
                                    <TableCell>{formatCurrencyNumber(item.qty)}</TableCell>
                                    <TableCell>{formatCurrencyNumber(item.gain)}</TableCell>
                                    <TableCell>{formatCurrencyNumber(item.taxSavingIfLossHarvested)}</TableCell>
                                    <TableCell>{item.reason}</TableCell>
                                  </TableRow>
                                ))
                            ) : (
                              <TableRow>
                                <TableCell colSpan={5} align='center'>
                                  No worthwhile loss-harvesting recommendation right now.
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
              </Grid>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default TaxPlannerPage
