import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'

type QueryFieldRow = {
  field: string
  useCase: string
}

type QueryFieldGroup = {
  title: string
  description: string
  rows: QueryFieldRow[]
}

const FIELD_GROUPS: QueryFieldGroup[] = [
  {
    title: 'Identity',
    description: 'Use these when you want to narrow by name or symbol directly.',
    rows: [
      { field: 'symbol', useCase: 'Search or filter a specific stock symbol.' },
      { field: 'company_name', useCase: 'Filter by company name text.' },
    ],
  },
  {
    title: 'Growth',
    description: 'Use these when you want improving business growth, not just price momentum.',
    rows: [
      { field: 'sales_growth_1y', useCase: 'Find stocks with strong recent revenue growth.' },
      { field: 'sales_growth_3y', useCase: 'Find businesses with consistent medium-term sales compounding.' },
      { field: 'profit_growth_1y', useCase: 'Filter for companies with improving recent earnings.' },
      { field: 'profit_growth_3y', useCase: 'Look for steady multi-year profit growth.' },
      { field: 'eps_growth_1y', useCase: 'Check whether per-share earnings are rising.' },
    ],
  },
  {
    title: 'Returns',
    description: 'Use these to screen for medium-term winners or laggards using stored EOD returns.',
    rows: [
      { field: 'return_1w', useCase: 'Find stocks with strong or weak one-week momentum.' },
      { field: 'return_1m', useCase: 'Find stocks with strong or weak recent one-month momentum.' },
      { field: 'return_3m', useCase: 'Screen for quarterly momentum trends.' },
      { field: 'return_6m', useCase: 'Check half-year trend strength.' },
      { field: 'return_1y', useCase: 'Find long-term winners or avoid weak yearly performers.' },
    ],
  },
  {
    title: 'Valuation',
    description: 'Use these to compare price against earnings, book value, or enterprise value.',
    rows: [
      { field: 'price_to_earning', useCase: 'Find cheap or expensive stocks based on earnings.' },
      { field: 'price_to_book', useCase: 'Screen asset-heavy businesses by book valuation.' },
      { field: 'ev_ebitda', useCase: 'Compare companies using enterprise-value-based valuation.' },
    ],
  },
  {
    title: 'Profitability',
    description: 'Use these to find efficient, high-quality businesses.',
    rows: [
      { field: 'roe', useCase: 'Find companies generating strong return on equity.' },
      { field: 'roce', useCase: 'Find businesses using capital efficiently.' },
      { field: 'opm', useCase: 'Screen for strong operating margins.' },
      { field: 'opm_change', useCase: 'Check whether operating margin is expanding or shrinking.' },
      { field: 'profit_positive_last_3_years', useCase: 'Avoid companies with unstable profitability.' },
    ],
  },
  {
    title: 'Debt / Working Capital',
    description: 'Use these to avoid balance-sheet stress and inefficient working capital.',
    rows: [
      { field: 'debt_to_equity', useCase: 'Filter out highly leveraged businesses.' },
      { field: 'interest_coverage', useCase: 'Check whether earnings comfortably cover interest cost.' },
      { field: 'debtor_days', useCase: 'Find companies with better receivable collection efficiency.' },
      { field: 'working_capital_days', useCase: 'Screen operational efficiency of working capital usage.' },
    ],
  },
  {
    title: 'Ownership',
    description: 'Use these when shareholding trend matters to your setup.',
    rows: [
      { field: 'promoter_holding', useCase: 'Find stocks where promoter ownership is high.' },
      { field: 'promoter_holding_change_4q', useCase: 'Track whether promoters accumulated or reduced stake.' },
      { field: 'fii_holding', useCase: 'Check foreign institutional ownership level.' },
      { field: 'fii_holding_change_4q', useCase: 'Track FII accumulation or exit trend.' },
      { field: 'dii_holding', useCase: 'Check domestic institutional participation.' },
    ],
  },
  {
    title: 'Dividend',
    description: 'Use these to find income-friendly names.',
    rows: [{ field: 'dividend_yield', useCase: 'Screen for stocks paying higher cash yield.' }],
  },
  {
    title: 'Financials',
    description: 'Use these for direct thresholds on scale or profitability numbers.',
    rows: [
      { field: 'sales', useCase: 'Filter by revenue size.' },
      { field: 'net_profit', useCase: 'Filter by absolute profit level.' },
      { field: 'eps', useCase: 'Set minimum earnings-per-share requirements.' },
      { field: 'book_value', useCase: 'Use when screening asset-backed or value names.' },
      { field: 'market_cap', useCase: 'Limit the universe by company size.' },
    ],
  },
  {
    title: 'Circuit / Price',
    description: 'Use these for snapshot price and daily move filters.',
    rows: [
      { field: 'lower_circuit', useCase: 'Check lower circuit level on the selected as-of date.' },
      { field: 'upper_circuit', useCase: 'Check upper circuit level on the selected as-of date.' },
      { field: 'percent_change', useCase: 'Filter by daily percent move on that date.' },
      { field: 'eod_close', useCase: 'Use closing price as the as-of-date price filter.' },
      { field: 'eod_volume', useCase: 'Filter by traded volume on the selected date.' },
    ],
  },
  {
    title: '52 Week / ATH',
    description: 'Use these for breakout and distance-from-high setups.',
    rows: [
      { field: 'week_52_high', useCase: 'Find stocks making or nearing 52-week highs.' },
      { field: 'week_52_low', useCase: 'Find stocks near yearly lows.' },
      { field: 'week_52_high_breakout', useCase: 'Identify explicit 52-week breakout conditions.' },
      { field: 'distance_from_52_week_high_percent', useCase: 'Find stocks trading close to or far from yearly high.' },
      { field: 'all_time_high', useCase: 'Check all-time-high reference level.' },
      { field: 'all_time_high_breakout', useCase: 'Find stocks breaking to new lifetime highs.' },
    ],
  },
  {
    title: 'Volume / Liquidity',
    description: 'Use these to avoid thinly traded names or find unusual activity.',
    rows: [
      { field: 'avg_volume_20d', useCase: 'Screen for consistently traded stocks.' },
      { field: 'avg_traded_value_20d', useCase: 'Filter by rupee turnover, not only share count.' },
      { field: 'traded_days_20d', useCase: 'Check how regularly the stock traded recently.' },
      { field: 'volume_spike_20d', useCase: 'Find unusual activity compared with recent average volume.' },
      { field: 'volatility_20d', useCase: 'Filter calmer or more volatile setups.' },
      { field: 'is_liquid', useCase: 'Use a precomputed liquidity flag for easier filtering.' },
    ],
  },
  {
    title: 'DMA / Trend',
    description: 'Use these for simple trend-following and moving-average structure.',
    rows: [
      { field: 'dma_50', useCase: 'Reference the 50-day average directly.' },
      { field: 'dma_200', useCase: 'Reference the long-term 200-day trend line.' },
      { field: 'dma_50_vs_dma_200', useCase: 'Check whether medium-term trend is above long-term trend.' },
      { field: 'price_vs_dma_50_percent', useCase: 'Measure how stretched price is above or below 50 DMA.' },
      { field: 'close_above_50_dma', useCase: 'Find stocks closing above their 50 DMA.' },
      { field: 'close_above_200_dma', useCase: 'Find stocks holding above their long-term trend.' },
    ],
  },
  {
    title: 'Indicators',
    description: 'Use these when you want precomputed technical indicators from the EOD table.',
    rows: [
      { field: 'atr_14', useCase: 'Filter by recent trading range expansion or contraction.' },
      { field: 'rsi_14', useCase: 'Find overbought, oversold, or strong-RSI names.' },
      { field: 'macd_line', useCase: 'Use MACD trend direction directly.' },
      { field: 'macd_signal', useCase: 'Compare MACD line against signal behavior.' },
      { field: 'adx_14', useCase: 'Filter for stronger trend strength.' },
      { field: 'supertrend_signal', useCase: 'Use a precomputed trend-following directional signal.' },
    ],
  },
]

const ALIASES = [
  { alias: 'current_price / price / ltp / cmp', canonical: 'eod_close' },
  { alias: 'volume', canonical: 'eod_volume' },
  { alias: 'price_from_52_week_high_percent', canonical: 'distance_from_52_week_high_percent' },
  { alias: 'distance_from_52w_high_pct', canonical: 'distance_from_52_week_high_percent' },
]

const CURRENTLY_UNRELIABLE_FIELDS = [
  'price_to_earning',
  'price_to_book',
  'ev_ebitda',
  'market_cap',
  'book_value',
  'debt_to_equity',
  'interest_coverage',
]

const DERIVED_RUNTIME_FIELDS = [
  'return_1w',
  'distance_from_52_week_high_percent',
  'volume_spike_20d',
  'dma_50_vs_dma_200',
  'close_above_50_dma',
  'close_above_200_dma',
]

const HistoricalQueryFieldsPage = () => {
  const totalFields = FIELD_GROUPS.reduce((sum, group) => sum + group.rows.length, 0)

  return (
    <Box p={4}>
      <Box mb={4}>
        <Typography variant='h4' fontWeight={900} gutterBottom>
          Historical Query Fields
        </Typography>
        <Typography variant='body1' color='text.secondary'>
          This page lists the fields supported on the historical universe screener and what each field is useful for.
        </Typography>
        <Box display='flex' gap={1.5} mt={2} flexWrap='wrap'>
          <Chip label={`${totalFields} supported fields`} color='primary' />
          <Chip label='Uses as-of-date snapshot data' color='secondary' variant='outlined' />
        </Box>
      </Box>

      <Alert severity='info' sx={{ mb: 4 }}>
        These fields are meant for the historical screener flow. Most price, DMA, 52-week, return, and indicator fields
        come from precomputed EOD rows. Fundamental fields come from split fundamental tables resolved on or before the
        selected as-of date.
      </Alert>

      <Alert severity='warning' sx={{ mb: 4 }}>
        Query syntax is simple on this API. Use one clause per line with operators like <code>{'>'}</code>,{' '}
        <code>{'<'}</code>, <code>=</code>, <code>!=</code>. Do not use <code>BETWEEN</code>. For example, write
        <code>rsi_14 &gt; 45</code> and <code>rsi_14 &lt; 65</code> as two separate lines.
      </Alert>

      <Alert severity='warning' sx={{ mb: 4 }}>
        On the current historical DB clone, these fields are registered in code but should be treated as unreliable for
        now:
        <strong> {CURRENTLY_UNRELIABLE_FIELDS.join(', ')}</strong>.
      </Alert>

      <Alert severity='success' sx={{ mb: 4 }}>
        These fields are not stored as direct one-column values in every case, but the historical query engine can still
        derive them at runtime:
        <strong> {DERIVED_RUNTIME_FIELDS.join(', ')}</strong>.
      </Alert>

      <Card sx={{ mb: 4, borderRadius: 4 }}>
        <CardContent>
          <Typography variant='h6' fontWeight={800} mb={2}>
            Common Aliases
          </Typography>
          <Table size='small'>
            <TableHead>
              <TableRow>
                <TableCell>Alias</TableCell>
                <TableCell>Actually Uses</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ALIASES.map(row => (
                <TableRow key={row.alias}>
                  <TableCell>{row.alias}</TableCell>
                  <TableCell>{row.canonical}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {FIELD_GROUPS.map(group => (
          <Grid item xs={12} key={group.title}>
            <Card sx={{ borderRadius: 4 }}>
              <CardContent>
                <Typography variant='h6' fontWeight={800}>
                  {group.title}
                </Typography>
                <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
                  {group.description}
                </Typography>

                <Divider sx={{ mb: 2 }} />

                <Table size='small'>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ width: '32%' }}>Field</TableCell>
                      <TableCell>Short Use Case</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {group.rows.map(row => (
                      <TableRow key={row.field}>
                        <TableCell>
                          <Typography variant='body2' fontWeight={700}>
                            {row.field}
                          </Typography>
                        </TableCell>
                        <TableCell>{row.useCase}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}

export default HistoricalQueryFieldsPage
