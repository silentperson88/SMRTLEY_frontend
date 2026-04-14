import type { NextPage } from 'next'
import { useMemo, useState } from 'react'
import useSWR, { useSWRConfig } from 'swr'
import { simpleGet } from 'src/api/common/fetchers'
import { ENDURL } from 'src/utils/constants/endurl.utils'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Divider from '@mui/material/Divider'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import Collapse from '@mui/material/Collapse'
import Alert from '@mui/material/Alert'
import LinearProgress from '@mui/material/LinearProgress'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import BoltIcon from '@mui/icons-material/Bolt'
import FilterAltIcon from '@mui/icons-material/FilterAlt'

type PivotRow = any

type PivotResponse = {
  total: number
  rows: PivotRow[]
  buckets: {
    small: PivotRow[]
    mid: PivotRow[]
    large: PivotRow[]
  }
  summary?: {
    small?: number
    mid?: number
    large?: number
    ready?: number
    watch?: number
    weak?: number
    reject?: number
  }
  filters?: Record<string, any>
}

const tierMeta: Record<'small' | 'mid' | 'large', { title: string; priceRange: string; color: 'success' | 'primary' | 'warning'; subtitle: string }> = {
  small: {
    title: 'Pivot Small',
    priceRange: 'Rs. 2 - Rs. 30',
    color: 'success',
    subtitle: 'Fast movers with the sharpest upside but the highest failure risk.',
  },
  mid: {
    title: 'Pivot Medium',
    priceRange: 'Rs. 30 - Rs. 500',
    color: 'primary',
    subtitle: 'Balanced pivot setups with moderate risk and better confirmation.',
  },
  large: {
    title: 'Pivot Large',
    priceRange: 'Rs. 500 - Rs. 2000',
    color: 'warning',
    subtitle: 'Bigger businesses, slower reaction, usually cleaner quality with lower upside multiple.',
  },
}

const gradeColor = (grade: string) => {
  if (grade === 'PIVOT Ready') return 'success' as const
  if (grade === 'PIVOT Watch') return 'warning' as const
  if (grade === 'PIVOT Weak') return 'info' as const
  return 'default' as const
}

const itemColor = (item: any) => {
  if (item?.type === 'reject') return 'error' as const
  if (item?.type === 'flag') return 'warning' as const
  return item?.passed ? 'success' as const : 'default' as const
}

const formatNumber = (value: any, digits = 2) => {
  const n = Number(value)
  if (!Number.isFinite(n)) return 'n/a'
  return n.toFixed(digits)
}

const formatPercent = (value: any, digits = 2) => {
  const n = Number(value)
  if (!Number.isFinite(n)) return 'n/a'
  return `${n.toFixed(digits)}%`
}

const formatCurrency = (value: any, digits = 2) => {
  const n = Number(value)
  if (!Number.isFinite(n)) return 'n/a'
  return `Rs. ${n.toFixed(digits)}`
}

const valueText = (value: any) => {
  if (value === null || value === undefined) return 'n/a'
  if (Array.isArray(value)) return value.map((item) => valueText(item)).join(', ')
  if (typeof value === 'number') return formatNumber(value)
  return String(value)
}

const focusValue = (tier: 'small' | 'mid' | 'large', row: PivotRow) => {
  const m = row?.pivot_metrics || {}
  if (tier === 'small') return `${m.revenue_2q_avg ? formatCurrency(m.revenue_2q_avg) : 'n/a'} avg revenue`
  if (tier === 'mid') return `${m.revenue_cagr_3y ? formatPercent(m.revenue_cagr_3y) : 'n/a'} revenue CAGR`
  return `${m.profit_cagr_3y ? formatPercent(m.profit_cagr_3y) : 'n/a'} profit CAGR`
}

const TierTable = ({ tier, rows }: { tier: 'small' | 'mid' | 'large'; rows: PivotRow[] }) => {
  const [expanded, setExpanded] = useState<string | null>(null)

  if (!rows.length) {
    return (
      <Alert severity='info' variant='outlined'>
        No {tierMeta[tier].title} candidates matched the current filters.
      </Alert>
    )
  }

  return (
    <TableContainer component={Paper} variant='outlined' sx={{ borderRadius: 2 }}>
      <Table size='small'>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 700 }}>Symbol</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Price</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Score</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Grade</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>{tier === 'small' ? 'Turning' : tier === 'mid' ? 'Growth' : 'Acceleration'}</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Warnings</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => {
            const isOpen = expanded === String(row.symbol)
            const m = row?.pivot_metrics || {}
            return (
              <FragmentRow
                key={row.symbol}
                row={row}
                tier={tier}
                isOpen={isOpen}
                onToggle={() => setExpanded(isOpen ? null : String(row.symbol))}
                focusValue={focusValue(tier, row)}
              />
            )
          })}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

const FragmentRow = ({
  row,
  tier,
  isOpen,
  onToggle,
  focusValue,
}: {
  row: PivotRow
  tier: 'small' | 'mid' | 'large'
  isOpen: boolean
  onToggle: () => void
  focusValue: string
}) => {
  const m = row?.pivot_metrics || {}
  const analysis = row?.analysis || {}
  const signalCount = (analysis.layer1 || []).filter((item: any) => item.passed).length
  return (
    <>
      <TableRow hover onClick={onToggle} sx={{ cursor: 'pointer' }}>
        <TableCell>
          <Stack spacing={0.3}>
            <Typography variant='body2' sx={{ fontWeight: 800 }}>
              {row.symbol}
            </Typography>
            <Typography variant='caption' color='text.secondary'>
              {row.name || row.company_name || row.symbol}
            </Typography>
          </Stack>
        </TableCell>
        <TableCell>{formatCurrency(m.current_price)}</TableCell>
        <TableCell sx={{ fontWeight: 800 }}>{analysis.score ?? 0}</TableCell>
        <TableCell>
          <Chip size='small' label={analysis.grade || 'n/a'} color={gradeColor(analysis.grade)} />
        </TableCell>
        <TableCell>
          <Typography variant='body2' sx={{ fontWeight: 700 }}>
            {focusValue}
          </Typography>
          <Typography variant='caption' color='text.secondary'>
            L1 hits: {signalCount} | L2: {analysis.layer_scores?.layer2 ?? 0} | L3: {analysis.layer_scores?.layer3 ?? 0}
          </Typography>
        </TableCell>
        <TableCell>
          <Chip size='small' label={`${analysis.warnings?.length || 0}`} variant='outlined' />
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={6} sx={{ py: 0, borderBottom: isOpen ? 'none' : undefined }}>
          <Collapse in={isOpen} timeout='auto' unmountOnExit>
            <Box sx={{ p: 2, background: 'rgba(15,23,42,0.03)', borderRadius: 2, my: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Card variant='outlined' sx={{ height: '100%' }}>
                    <CardContent>
                      <Typography variant='subtitle2' sx={{ fontWeight: 800, mb: 1 }}>
                        Layer 1 Signals
                      </Typography>
                      <Stack spacing={1}>
                        {(analysis.layer1 || []).map((item: any) => (
                          <SignalChip key={item.code} item={item} />
                        ))}
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card variant='outlined' sx={{ height: '100%' }}>
                    <CardContent>
                      <Typography variant='subtitle2' sx={{ fontWeight: 800, mb: 1 }}>
                        Layer 2 Safety
                      </Typography>
                      <Stack spacing={1}>
                        {(analysis.layer2 || []).map((item: any) => (
                          <SignalChip key={item.code} item={item} />
                        ))}
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card variant='outlined' sx={{ height: '100%' }}>
                    <CardContent>
                      <Typography variant='subtitle2' sx={{ fontWeight: 800, mb: 1 }}>
                        Layer 3 Price
                      </Typography>
                      <Stack spacing={1}>
                        {(analysis.layer3 || []).map((item: any) => (
                          <SignalChip key={item.code} item={item} />
                        ))}
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Grid container spacing={2} sx={{ mt: 0.5 }}>
                <Grid item xs={12} md={6}>
                  <Card variant='outlined' sx={{ height: '100%' }}>
                    <CardContent>
                      <Typography variant='subtitle2' sx={{ fontWeight: 800, mb: 1 }}>
                        Entry Trigger
                      </Typography>
                      <Stack spacing={0.8}>
                        <DetailLine label='Resistance' value={formatCurrency(analysis.entry_trigger?.resistance)} />
                        <DetailLine label='Stop Loss' value={formatCurrency(analysis.entry_trigger?.stop_loss)} />
                        <DetailLine label='Note' value={analysis.entry_trigger?.note || 'n/a'} />
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card variant='outlined' sx={{ height: '100%' }}>
                    <CardContent>
                      <Typography variant='subtitle2' sx={{ fontWeight: 800, mb: 1 }}>
                        Warnings / Missing Data
                      </Typography>
                      <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap sx={{ mb: 1 }}>
                        {(analysis.warnings || []).map((w: any) => (
                          <Chip key={w.code} size='small' label={`${w.code}: ${w.title}`} color={w.severity === 'critical' ? 'error' : w.severity === 'moderate' ? 'warning' : 'info'} />
                        ))}
                        {(analysis.missing_data || []).map((mItem: any) => (
                          <Chip key={mItem} size='small' label={mItem} variant='outlined' />
                        ))}
                        {!analysis.warnings?.length && !analysis.missing_data?.length && <Chip size='small' label='No warnings' color='success' />}
                      </Stack>
                      <Typography variant='caption' color='text.secondary'>
                        Pivot keeps the useful signal visible and avoids dumping the full raw sheet into the row.
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  )
}

const SignalChip = ({ item }: { item: any }) => {
  return (
    <Stack direction='row' spacing={1} alignItems='center'>
      <Chip size='small' label={item.code} color={itemColor(item)} />
      <Box sx={{ flex: 1 }}>
        <Typography variant='body2' sx={{ fontWeight: 700 }}>
          {item.label}
        </Typography>
        <Typography variant='caption' color='text.secondary'>
          {valueText(item.value)} vs {item.threshold}
        </Typography>
      </Box>
    </Stack>
  )
}

const DetailLine = ({ label, value }: { label: string; value: any }) => (
  <Stack direction='row' spacing={1.2} alignItems='baseline'>
    <Typography variant='body2' color='text.secondary' sx={{ minWidth: 100 }}>
      {label}
    </Typography>
    <Typography variant='body2' sx={{ fontWeight: 700 }}>
      {valueText(value)}
    </Typography>
  </Stack>
)

const PivotStrategiesPage: NextPage = () => {
  const [limit, setLimit] = useState(50)
  const [grade, setGrade] = useState('ALL')
  const [minScore, setMinScore] = useState<number | ''>(50)
  const [showRejected, setShowRejected] = useState(false)
  const { mutate } = useSWRConfig()

  const pivotUrl = useMemo(() => {
    const params = new URLSearchParams()
    params.set('limit', String(limit))
    params.set('grade', grade)
    if (minScore !== '' && minScore !== null) params.set('minScore', String(minScore))
    params.set('includeRejected', String(showRejected))
    return `${ENDURL.GET_STOCK_PIVOT_ANALYSIS}?${params.toString()}`
  }, [limit, grade, minScore, showRejected])

  const { data, isLoading, error } = useSWR<PivotResponse>(pivotUrl, simpleGet, {
    revalidateOnFocus: false,
  })

  const smallRows = data?.buckets?.small || []
  const midRows = data?.buckets?.mid || []
  const largeRows = data?.buckets?.large || []
  const summary = data?.summary || {}

  return (
    <Grid container spacing={4}>
      <Grid item xs={12}>
        <Card
          sx={{
            borderRadius: 3,
            overflow: 'hidden',
            background:
              'radial-gradient(circle at 82% 15%, rgba(99, 102, 241, 0.2) 0%, transparent 28%), radial-gradient(circle at 18% 18%, rgba(34, 197, 94, 0.16) 0%, transparent 28%), linear-gradient(125deg, #08111f 0%, #0f172a 52%, #111827 100%)',
          }}
        >
          <CardContent sx={{ p: { xs: 4, md: 6 } }}>
            <Stack spacing={2.2}>
              <Chip label='Strategy Hub' color='primary' sx={{ alignSelf: 'flex-start' }} />
              <Typography variant='h3' sx={{ color: 'common.white', fontWeight: 800 }}>
                Pivot
              </Typography>
              <Typography variant='body1' sx={{ color: 'rgba(255,255,255,0.76)', maxWidth: 940 }}>
                Three related pivot buckets live under one family: Small, Mid, and Large. Each one runs backend scoring on the active VALID universe and uses the current market price to classify the stock into the right bucket.
              </Typography>
              <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                <Chip label='Pivot Small: Rs. 2 - Rs. 30' color='success' />
                <Chip label='Pivot Medium: Rs. 30 - Rs. 500' color='primary' />
                <Chip label='Pivot Large: Rs. 500 - Rs. 2000' color='warning' />
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card sx={{ borderRadius: 3, border: '1px solid rgba(148, 163, 184, 0.22)' }}>
          <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
            <Stack spacing={2.5}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ xs: 'flex-start', md: 'center' }}>
                <Chip label='Pivot' color='success' />
                <Typography variant='h5' sx={{ fontWeight: 800 }}>
                  Pivot Universe
                </Typography>
                <Chip label='Backend-ranked' variant='outlined' />
              </Stack>

              <Typography variant='body2' color='text.secondary' sx={{ maxWidth: 1100 }}>
                We keep the UI focused: the backend decides the score and the bucket, then the page only renders the tier buckets with the exact rule values that mattered.
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <Card variant='outlined'>
                    <CardContent>
                      <Typography variant='caption' color='text.secondary'>
                        Scanned
                      </Typography>
                      <Typography variant='h5' sx={{ fontWeight: 800 }}>
                        {isLoading ? '...' : data?.total ?? 0}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card variant='outlined'>
                    <CardContent>
                      <Typography variant='caption' color='text.secondary'>
                        Ready / Watch
                      </Typography>
                      <Typography variant='h5' sx={{ fontWeight: 800 }}>
                        {(summary.ready || 0) + (summary.watch || 0)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card variant='outlined'>
                    <CardContent>
                      <Typography variant='caption' color='text.secondary'>
                        Weak
                      </Typography>
                      <Typography variant='h5' sx={{ fontWeight: 800 }}>
                        {summary.weak || 0}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card variant='outlined'>
                    <CardContent>
                      <Typography variant='caption' color='text.secondary'>
                        Rejected
                      </Typography>
                      <Typography variant='h5' sx={{ fontWeight: 800 }}>
                        {summary.reject || 0}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Divider />

              <Grid container spacing={2} alignItems='center'>
                <Grid item xs={12} md={2}>
                  <TextField
                    fullWidth
                    size='small'
                    type='number'
                    label='Limit'
                    value={limit}
                    onChange={(e) => setLimit(Math.max(1, Number(e.target.value || 50)))}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth size='small'>
                    <InputLabel>Grade</InputLabel>
                    <Select label='Grade' value={grade} onChange={(e) => setGrade(String(e.target.value))}>
                      <MenuItem value='ALL'>All</MenuItem>
                      <MenuItem value='PIVOT Ready'>PIVOT Ready</MenuItem>
                      <MenuItem value='PIVOT Watch'>PIVOT Watch</MenuItem>
                      <MenuItem value='PIVOT Weak'>PIVOT Weak</MenuItem>
                      <MenuItem value='Not a PIVOT'>Not a PIVOT</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <TextField
                    fullWidth
                    size='small'
                    type='number'
                    label='Min Score'
                    value={minScore}
                    onChange={(e) => setMinScore(e.target.value === '' ? '' : Number(e.target.value))}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControlLabel
                    control={<Switch checked={showRejected} onChange={(e) => setShowRejected(e.target.checked)} />}
                    label='Show rejected'
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <Button fullWidth variant='outlined' startIcon={<FilterAltIcon />} onClick={() => mutate(pivotUrl)}>
                    Filters
                  </Button>
                </Grid>
              </Grid>

              {isLoading && <LinearProgress />}
              {error && (
                <Alert severity='error' variant='outlined'>
                  Failed to load Pivot analysis.
                </Alert>
              )}

              <Accordion defaultExpanded={false}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Stack spacing={0.4} sx={{ width: '100%' }}>
                    <Stack direction='row' spacing={1} alignItems='center'>
                      <Chip label='Pivot Small' color='success' />
                      <Typography variant='h6' sx={{ fontWeight: 800 }}>
                        Small Bucket
                      </Typography>
                      <Chip label={`${smallRows.length} rows`} variant='outlined' />
                    </Stack>
                    <Typography variant='body2' color='text.secondary'>
                      Price range {tierMeta.small.priceRange}. Focus: early turnarounds, margin expansion, debt cleanup and price not yet reacting.
                    </Typography>
                  </Stack>
                </AccordionSummary>
                <AccordionDetails>
                  <TierTable tier='small' rows={smallRows} />
                </AccordionDetails>
              </Accordion>

              <Accordion defaultExpanded={false}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Stack spacing={0.4} sx={{ width: '100%' }}>
                    <Stack direction='row' spacing={1} alignItems='center'>
                      <Chip label='Pivot Medium' color='primary' />
                      <Typography variant='h6' sx={{ fontWeight: 800 }}>
                        Medium Bucket
                      </Typography>
                      <Chip label={`${midRows.length} rows`} variant='outlined' />
                    </Stack>
                    <Typography variant='body2' color='text.secondary'>
                      Price range {tierMeta.mid.priceRange}. Focus: growth with decent quality, not too expensive and not too late.
                    </Typography>
                  </Stack>
                </AccordionSummary>
                <AccordionDetails>
                  <TierTable tier='mid' rows={midRows} />
                </AccordionDetails>
              </Accordion>

              <Accordion defaultExpanded={false}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Stack spacing={0.4} sx={{ width: '100%' }}>
                    <Stack direction='row' spacing={1} alignItems='center'>
                      <Chip label='Pivot Large' color='warning' />
                      <Typography variant='h6' sx={{ fontWeight: 800 }}>
                        Large Bucket
                      </Typography>
                      <Chip label={`${largeRows.length} rows`} variant='outlined' />
                    </Stack>
                    <Typography variant='body2' color='text.secondary'>
                      Price range {tierMeta.large.priceRange}. Focus: re-acceleration, clean balance sheet and growth not yet fully priced in.
                    </Typography>
                  </Stack>
                </AccordionSummary>
                <AccordionDetails>
                  <TierTable tier='large' rows={largeRows} />
                </AccordionDetails>
              </Accordion>

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} flexWrap='wrap' useFlexGap>
                <Chip icon={<BoltIcon />} label='Layer 1 = turning signal' variant='outlined' />
                <Chip icon={<TrendingUpIcon />} label='Layer 2 = business not broken' variant='outlined' />
                <Chip icon={<FilterAltIcon />} label='Layer 3 = price not reacted yet' variant='outlined' />
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default PivotStrategiesPage
