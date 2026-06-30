import { useEffect, useMemo, useState } from 'react'
import type { NextPage } from 'next'
import axiosInstance from 'src/api/axios/axiosBaseQuery'
import { ENDURL } from 'src/utils/constants/endurl.utils'
import { getTodayIsoDate, normalizeAsOfDate } from 'src/utils/asOfDate'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'
import Alert from '@mui/material/Alert'
import LinearProgress from '@mui/material/LinearProgress'
import TextField from '@mui/material/TextField'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TablePagination from '@mui/material/TablePagination'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

type TopicItem = {
  master_id?: number
  symbol?: string
  stock?: string
  headline?: string
  angle?: string
  metrics?: Record<string, string | number | boolean | null>
}

type LiveTopicPayload = {
  upper_lower_circuit_alerts?: TopicItem[]
  week_52_breakouts?: TopicItem[]
  golden_death_cross?: TopicItem[]
}

type TopicTemplate = {
  id: number
  key: keyof LiveTopicPayload | null
  title: string
  subtitle: string
  format: string
  status: 'live' | 'ready'
}

const topicTemplates: TopicTemplate[] = [
  {
    id: 1,
    key: 'upper_lower_circuit_alerts',
    title: 'Upper Circuit / Lower Circuit Alerts',
    subtitle: 'Fastest viral-format bucket for sudden stock moves.',
    format: 'Stock name / % move / reason / 10-second chart',
    status: 'live',
  },
  {
    id: 2,
    key: 'week_52_breakouts',
    title: '52 Week High / Breakout Stocks',
    subtitle: 'Momentum names that retail audience immediately understands.',
    format: 'Stock name / breakout type / level crossed / momentum summary',
    status: 'live',
  },
  {
    id: 3,
    key: 'golden_death_cross',
    title: 'Golden Cross / Death Cross',
    subtitle: 'Great technical category for traders and educational shorts.',
    format: 'Stock name / crossover type / 50 DMA vs 200 DMA / implication',
    status: 'live',
  },
  {
    id: 4,
    key: null,
    title: 'Result Reaction Shorts',
    subtitle: 'Earnings reaction clips with strong engagement potential.',
    format: 'Container ready',
    status: 'ready',
  },
  {
    id: 5,
    key: null,
    title: 'Big Order / Deal Wins',
    subtitle: 'Government and order-book stories that move fast in India.',
    format: 'Container ready',
    status: 'ready',
  },
  {
    id: 6,
    key: null,
    title: 'Dividend / Bonus / Split News',
    subtitle: 'Retail-friendly corporate action format.',
    format: 'Container ready',
    status: 'ready',
  },
  {
    id: 7,
    key: null,
    title: 'FII / DII Buying & Selling',
    subtitle: 'Authority-building flow around institutional moves.',
    format: 'Container ready',
    status: 'ready',
  },
  {
    id: 8,
    key: null,
    title: 'Sector Rotation',
    subtitle: 'Smart-money style content for stronger audience retention.',
    format: 'Container ready',
    status: 'ready',
  },
  {
    id: 9,
    key: null,
    title: 'Top Volume / Unusual Activity',
    subtitle: 'Very strong for trader-focused shorts.',
    format: 'Container ready',
    status: 'ready',
  },
  {
    id: 10,
    key: null,
    title: 'Gap Up / Gap Down Stocks',
    subtitle: 'Simple daily market-opener format with quick hooks.',
    format: 'Container ready',
    status: 'ready',
  },
  {
    id: 11,
    key: null,
    title: 'Operator / Suspicious Moves',
    subtitle: 'High-virality category that needs careful wording.',
    format: 'Container ready',
    status: 'ready',
  },
  {
    id: 12,
    key: null,
    title: 'Stocks Near Important Levels',
    subtitle: 'Technical niche with breakout/rejection storytelling.',
    format: 'Container ready',
    status: 'ready',
  },
  {
    id: 13,
    key: null,
    title: 'Market Summary in 30 Seconds',
    subtitle: 'Daily scalable wrap-up format for repeatable output.',
    format: 'Container ready',
    status: 'ready',
  },
]

const metricLabelMap: Record<string, string> = {
  day_move_percent: 'Day Move %',
  ltp: 'LTP',
  close: 'Close',
  upper_circuit: 'Upper Circuit',
  lower_circuit: 'Lower Circuit',
  week_52_high: '52W High',
  dma_50: 'DMA 50',
  dma_200: 'DMA 200',
  signal_type: 'Signal',
  alert_type: 'Alert',
}

const liveTableColumnsByKey: Partial<Record<keyof LiveTopicPayload, string[]>> = {
  upper_lower_circuit_alerts: ['alert_type', 'day_move_percent', 'ltp', 'upper_circuit', 'lower_circuit'],
  week_52_breakouts: ['day_move_percent', 'close', 'week_52_high'],
  golden_death_cross: ['signal_type', 'close', 'dma_50', 'dma_200'],
}

const formatMetricValue = (value: unknown) => {
  if (value === null || value === undefined || value === '') return '-'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'number') return Number.isInteger(value) ? String(value) : value.toFixed(2)

  return String(value)
}

const sliceItems = (items: TopicItem[], page: number, rowsPerPage: number) =>
  items.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

const StockShortsPage: NextPage = () => {
  const [selectedDate, setSelectedDate] = useState(getTodayIsoDate())
  const [liveTopics, setLiveTopics] = useState<LiveTopicPayload>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [expandedTopics, setExpandedTopics] = useState<Record<number, boolean>>({})
  const [topicPages, setTopicPages] = useState<Record<number, number>>({})
  const liveTopicCount = useMemo(() => topicTemplates.filter(topic => topic.status === 'live').length, [])

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        setLoading(true)
        setError('')
        const res = await axiosInstance.get(ENDURL.GET_STOCK_SHORTS_TOPICS, {
          params: { as_of_date: selectedDate },
          timeout: 20000,
        })

        if (!active) return
        setLiveTopics(res?.data?.data?.topics || {})
        setTopicPages({})
      } catch (err: any) {
        if (!active) return
        setError(err?.response?.data?.message || err?.message || 'Failed to load stock shorts topics')
        setLiveTopics({})
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [selectedDate])

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Card
          sx={{
            overflow: 'hidden',
            background: theme =>
              `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.background.paper} 68%)`,
          }}
        >
          {loading ? <LinearProgress /> : null}
          <CardContent sx={{ py: 6 }}>
            <Stack spacing={2.5}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} useFlexGap flexWrap='wrap'>
                <Chip label='Shorts Planning' color='primary' sx={{ color: 'common.white', borderColor: 'transparent' }} />
                <Chip
                  label={`${topicTemplates.length} content containers`}
                  variant='outlined'
                  sx={{ color: 'common.white', borderColor: 'rgba(255,255,255,0.24)' }}
                />
                <Chip
                  label={`${liveTopicCount} live categories`}
                  variant='outlined'
                  sx={{ color: 'common.white', borderColor: 'rgba(255,255,255,0.24)' }}
                />
                <Chip
                  label={`Selected date: ${selectedDate}`}
                  variant='outlined'
                  sx={{ color: 'common.white', borderColor: 'rgba(255,255,255,0.24)' }}
                />
              </Stack>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems={{ xs: 'stretch', md: 'center' }}>
                <TextField
                  label='Select Date'
                  type='date'
                  size='small'
                  value={selectedDate}
                  onChange={event => {
                    const nextValue = normalizeAsOfDate(event.target.value)
                    if (nextValue) setSelectedDate(nextValue)
                  }}
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    minWidth: { xs: '100%', sm: 220 },
                    '& .MuiInputBase-root': {
                      color: 'common.white',
                      bgcolor: 'rgba(255,255,255,0.08)',
                    },
                    '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.82)' },
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.24)' },
                    '& .MuiSvgIcon-root': { color: 'common.white' },
                  }}
                />
                <Typography variant='body2' sx={{ color: 'rgba(255,255,255,0.82)', maxWidth: 760 }}>
                  Each topic now sits in its own collapsed row. Open any container to inspect the full day’s matching stocks
                  with 5 rows per page.
                </Typography>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      {error ? (
        <Grid item xs={12}>
          <Alert severity='error'>{error}</Alert>
        </Grid>
      ) : null}

      {topicTemplates.map(topic => {
        const items = topic.key ? liveTopics[topic.key] || [] : []
        const page = topicPages[topic.id] || 0
        const rowsPerPage = 5
        const visibleRows = sliceItems(items, page, rowsPerPage)
        const columns = topic.key ? liveTableColumnsByKey[topic.key] || [] : []
        const isExpanded = expandedTopics[topic.id] || false

        return (
          <Grid item xs={12} key={topic.id}>
            <Accordion
              expanded={isExpanded}
              onChange={(_, expanded) => {
                setExpandedTopics(prev => ({ ...prev, [topic.id]: expanded }))
              }}
              sx={{
                border: theme =>
                  topic.status === 'live'
                    ? `1px solid ${theme.palette.primary.main}`
                    : `1px dashed ${theme.palette.divider}`,
                boxShadow: topic.status === 'live' ? 6 : 1,
                '&:before': { display: 'none' },
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Stack
                  direction={{ xs: 'column', md: 'row' }}
                  spacing={1.5}
                  justifyContent='space-between'
                  alignItems={{ xs: 'flex-start', md: 'center' }}
                  sx={{ width: '100%', pr: 2 }}
                >
                  <Box>
                    <Stack direction='row' spacing={1.5} alignItems='center' useFlexGap flexWrap='wrap'>
                      <Typography variant='h6'>{`${topic.id}. ${topic.title}`}</Typography>
                      <Chip
                        size='small'
                        color={topic.status === 'live' ? 'success' : 'default'}
                        label={topic.status === 'live' ? `${items.length} matches` : 'Container ready'}
                        variant={topic.status === 'live' ? 'filled' : 'outlined'}
                      />
                    </Stack>
                    <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
                      {topic.subtitle}
                    </Typography>
                  </Box>
                  <Typography variant='caption' color='text.secondary'>
                    {topic.format}
                  </Typography>
                </Stack>
              </AccordionSummary>

              <AccordionDetails>
                {topic.status === 'live' ? (
                  items.length ? (
                    <Stack spacing={2}>
                      <TableContainer>
                        <Table size='small'>
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ minWidth: 220 }}>Stock</TableCell>
                              {columns.map(column => (
                                <TableCell key={`${topic.id}-${column}`}>{metricLabelMap[column] || column}</TableCell>
                              ))}
                              <TableCell sx={{ minWidth: 320 }}>Headline</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {visibleRows.map((item, index) => (
                              <TableRow hover key={`${topic.id}-${item.symbol || item.stock}-${page}-${index}`}>
                                <TableCell>
                                  <Stack spacing={0.4}>
                                    <Typography variant='subtitle2' sx={{ fontWeight: 700 }}>
                                      {item.stock || item.symbol || 'Unknown'}
                                    </Typography>
                                    <Typography variant='caption' color='text.secondary'>
                                      {item.symbol || '-'}
                                    </Typography>
                                  </Stack>
                                </TableCell>
                                {columns.map(column => (
                                  <TableCell key={`${topic.id}-${item.symbol || index}-${column}`}>
                                    {formatMetricValue(item.metrics?.[column])}
                                  </TableCell>
                                ))}
                                <TableCell>
                                  <Stack spacing={0.6}>
                                    <Typography variant='body2' sx={{ fontWeight: 600 }}>
                                      {item.headline || '-'}
                                    </Typography>
                                    <Typography variant='caption' color='text.secondary'>
                                      {item.angle || '-'}
                                    </Typography>
                                  </Stack>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>

                      <TablePagination
                        component='div'
                        count={items.length}
                        page={page}
                        onPageChange={(_, nextPage) => {
                          setTopicPages(prev => ({ ...prev, [topic.id]: nextPage }))
                        }}
                        rowsPerPage={rowsPerPage}
                        rowsPerPageOptions={[5]}
                        onRowsPerPageChange={() => undefined}
                      />
                    </Stack>
                  ) : (
                    <Alert severity='info'>No matching stocks found in EOD for this category on {selectedDate}.</Alert>
                  )
                ) : (
                  <Box
                    sx={{
                      minHeight: 100,
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      px: 3,
                      bgcolor: 'background.default',
                    }}
                  >
                    <Typography variant='body2' color='text.secondary'>
                      Ready for live stock/news mapping next. We can wire this container later without changing the overall UI.
                    </Typography>
                  </Box>
                )}
              </AccordionDetails>
            </Accordion>
          </Grid>
        )
      })}
    </Grid>
  )
}

export default StockShortsPage
