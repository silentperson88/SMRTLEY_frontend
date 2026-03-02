import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Stack from '@mui/material/Stack'
import MenuItem from '@mui/material/MenuItem'
import Divider from '@mui/material/Divider'
import LinearProgress from '@mui/material/LinearProgress'
import { useEffect, useMemo, useState } from 'react'
import TrendingUp from 'mdi-material-ui/TrendingUp'
import { useSimpleSWR } from 'src/hooks/swr/swrhooks'
import { ENDURL } from 'src/utils/constants/endurl.utils'

interface IpoGmpApiItem {
  id: string
  name: string
  status: string
  gain_price: string | null
  gain_percentage: string | null
  ai_score: number | null
  rating: number | null
  subscribed: string | null
  price: string | null
  ipo_size: string | null
  lot: string | null
  open_date: string | null
  open_gmp: string | null
  close_date: string | null
  close_gmp: string | null
  boarding_date: string | null
  listing_date: string | null
  listing_gmp: string | null
  institutional_backing: number | null
  type: string | null
  inserted?: boolean
}

interface IpoGmpResponse {
  source_url: string
  total_scraped: number
  total: number
  inserted: number
  updated: number
  items: IpoGmpApiItem[]
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const normalizeStatus = (status: string | null | undefined): 'O' | 'U' | 'L' | 'C' => {
  const value = (status || '').toUpperCase()

  if (value === 'O') return 'O'
  if (value === 'U') return 'U'
  if (value === 'L') return 'L'

  return 'C'
}

const formatDate = (value: string | null | undefined): string => {
  if (!value) return '-'

  const parts = value.split('-')

  if (parts.length < 2) return value

  const day = Number(parts[0])
  const month = Number(parts[1])

  if (Number.isNaN(day) || Number.isNaN(month) || month < 1 || month > 12) return value

  return `${day}-${MONTHS[month - 1]}`
}

const formatInr = (value: string | null | undefined, suffix = ''): string => {
  if (!value) return '-'

  return `\u20B9${value}${suffix}`
}

const asText = (value: string | number | boolean | null | undefined): string => {
  if (value === null || value === undefined || value === '') return '-'

  return String(value)
}

const formatType = (value: string | null | undefined): string => {
  if (!value) return 'SME'

  return value.toUpperCase() === 'MAINBOARD' ? 'Mainboard' : 'SME'
}

const IpoPage = () => {
  const [selectedIpoId, setSelectedIpoId] = useState('')
  const [discussionPrompt, setDiscussionPrompt] = useState('')

  const { data, isLoading, error } = useSimpleSWR<IpoGmpResponse>(ENDURL.FETCH_IPO_GMP)

  const upcomingIpos = data?.items ?? []

  useEffect(() => {
    if (!selectedIpoId && upcomingIpos.length > 0) {
      setSelectedIpoId(upcomingIpos[0].id)
    }
  }, [selectedIpoId, upcomingIpos])

  const ipoDetails = useMemo(
    () => upcomingIpos.find(item => item.id === selectedIpoId) || upcomingIpos[0],
    [selectedIpoId, upcomingIpos]
  )

  const stats = useMemo(() => {
    const openCount = upcomingIpos.filter(item => normalizeStatus(item.status) === 'O').length
    const upcomingCount = upcomingIpos.filter(item => normalizeStatus(item.status) === 'U').length
    const activeIpos = upcomingIpos.filter(item => {
      const status = normalizeStatus(item.status)

      return status === 'O' || status === 'U'
    })
    const mainboardCount = activeIpos.filter(item => (item.type || '').toUpperCase() === 'MAINBOARD').length
    const smeCount = activeIpos.filter(item => (item.type || '').toUpperCase() !== 'MAINBOARD').length

    return {
      openCount,
      upcomingCount,
      mainboardCount,
      smeCount
    }
  }, [upcomingIpos])

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Card
          sx={{
            borderRadius: 3,
            overflow: 'hidden',
            background:
              'radial-gradient(circle at 15% 10%, rgba(65, 105, 225, 0.36) 0%, transparent 38%), linear-gradient(130deg, #0f162d 0%, #1f2a4d 60%, #173a52 100%)'
          }}
        >
          <CardContent sx={{ p: { xs: 5, md: 7 } }}>
            <Grid container spacing={4} alignItems='center'>
              <Grid item xs={12} md={8}>
                <Chip label='IPO Zone' color='primary' size='small' sx={{ mb: 2 }} />
                <Typography variant='h3' sx={{ color: 'common.white', fontWeight: 700, mb: 1.5 }}>
                  Discover IPO Opportunities
                </Typography>
                <Typography variant='body1' sx={{ color: 'rgba(255,255,255,0.75)', maxWidth: 760 }}>
                  Review upcoming IPOs, compare price bands and issue size, and plan your entries with better clarity.
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card sx={{ bgcolor: 'rgba(10, 16, 36, 0.8)', border: '1px solid rgba(255,255,255,0.14)' }}>
                  <CardContent>
                    <Typography variant='h6' sx={{ color: 'common.white', fontWeight: 700, mb: 0.5 }}>
                      Live IPO Snapshot
                    </Typography>
                    <Typography variant='caption' sx={{ color: 'rgba(255,255,255,0.62)', display: 'block', mb: 2.5 }}>
                      Active market mix and application window pulse
                    </Typography>
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                        gap: 1.5
                      }}
                    >
                      <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <Chip size='small' label='Mainboard' color='primary' sx={{ mb: 1 }} />
                        <Typography variant='h4' sx={{ color: 'common.white', fontWeight: 700, lineHeight: 1.1 }}>
                          {stats.mainboardCount}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          textAlign: 'right',
                          bgcolor: 'rgba(255,255,255,0.06)',
                          border: '1px solid rgba(255,255,255,0.1)'
                        }}
                      >
                        <Typography variant='subtitle2' sx={{ color: 'rgba(255,255,255,0.8)', mb: 0.5 }}>
                          SME
                        </Typography>
                        <Chip size='small' label='SME' color='secondary' sx={{ mb: 1 }} />
                        <Typography variant='h4' sx={{ color: 'common.white', fontWeight: 700, lineHeight: 1.1 }}>
                          {stats.smeCount}
                        </Typography>
                      </Box>
                      <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <Stack direction='row' spacing={1} alignItems='center' sx={{ mb: 1 }}>
                          <Typography variant='subtitle2' sx={{ color: 'rgba(255,255,255,0.8)' }}>
                            Open
                          </Typography>
                          <Chip size='small' label='O' color='success' />
                        </Stack>
                        <Typography variant='h4' sx={{ color: 'common.white', fontWeight: 700, lineHeight: 1.1 }}>
                          {stats.openCount}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          textAlign: 'right',
                          bgcolor: 'rgba(255,255,255,0.06)',
                          border: '1px solid rgba(255,255,255,0.1)'
                        }}
                      >
                        <Stack direction='row' spacing={1} alignItems='center' justifyContent='flex-end' sx={{ mb: 1 }}>
                          <Typography variant='subtitle2' sx={{ color: 'rgba(255,255,255,0.8)' }}>
                            Upcoming
                          </Typography>
                          <Chip size='small' label='U' color='warning' />
                        </Stack>
                        <Typography variant='h4' sx={{ color: 'common.white', fontWeight: 700, lineHeight: 1.1 }}>
                          {stats.upcomingCount}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ px: 5, py: 4 }}>
              <Typography variant='h6'>Upcoming IPO Listings (Live GMP)</Typography>
              <Typography variant='body2' color='text.secondary'>
                Live data is fetched from the IPO GMP endpoint.
              </Typography>
            </Box>
            {isLoading && <LinearProgress color='primary' />}
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Sr No.</TableCell>
                    <TableCell>Name / Type</TableCell>
                    <TableCell>Gain</TableCell>
                    <TableCell>Rating</TableCell>
                    <TableCell>Issue Details</TableCell>
                    <TableCell>Open</TableCell>
                    <TableCell>Close</TableCell>
                    <TableCell>Listing</TableCell>
                    <TableCell>Demand</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {!isLoading && upcomingIpos.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9}>
                        <Typography variant='body2' color='text.secondary'>
                          {error ? 'Unable to load IPO GMP data right now.' : 'No IPO GMP records found.'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                  {upcomingIpos.map((row, index) => {
                    const status = normalizeStatus(row.status)
                    const ratingCount = Math.max(0, Math.min(Number(row.rating || 0), 5))
                    const typeLabel = formatType(row.type)

                    return (
                      <TableRow key={row.id} hover>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>
                          <Typography variant='body2' sx={{ fontWeight: 600 }}>
                            {asText(row.name)}
                          </Typography>
                          <Stack direction='row' spacing={1} sx={{ mt: 1 }}>
                            <Chip
                              size='small'
                              label={typeLabel}
                              color={typeLabel === 'Mainboard' ? 'primary' : 'secondary'}
                            />
                            <Chip
                              size='small'
                              label={status}
                              color={status === 'O' ? 'success' : status === 'U' ? 'warning' : status === 'L' ? 'info' : 'error'}
                            />
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography variant='caption' display='block'>
                            {asText(row.gain_price)}
                          </Typography>
                          <Typography variant='caption' display='block'>
                            {row.gain_percentage ? `${row.gain_percentage}%` : '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Stack direction='row' spacing={0.5} sx={{ alignItems: 'center' }}>
                            {ratingCount > 0 ? (
                              Array.from({ length: ratingCount }).map((_, i) => (
                                <TrendingUp key={`${row.id}-rating-${i}`} fontSize='small' color='primary' />
                              ))
                            ) : (
                              <Typography variant='caption'>-</Typography>
                            )}
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography variant='caption' display='block'>
                            Price: {formatInr(row.price)}
                          </Typography>
                          <Typography variant='caption' display='block'>
                            Size: {formatInr(row.ipo_size, ' Cr')}
                          </Typography>
                          <Typography variant='caption' display='block'>
                            Lot: {asText(row.lot)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant='caption' display='block'>
                            Date: {formatDate(row.open_date)}
                          </Typography>
                          <Typography variant='caption' display='block'>
                            GMP: {asText(row.open_gmp)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant='caption' display='block'>
                            Date: {formatDate(row.close_date)}
                          </Typography>
                          <Typography variant='caption' display='block'>
                            GMP: {asText(row.close_gmp)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant='caption' display='block'>
                            Date: {formatDate(row.listing_date)}
                          </Typography>
                          <Typography variant='caption' display='block'>
                            GMP: {asText(row.listing_gmp)}
                          </Typography>
                          <Typography variant='caption' display='block'>
                            Boarding: {formatDate(row.boarding_date)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant='caption' display='block'>
                            Subscribed: {asText(row.subscribed)}
                          </Typography>
                          <Typography variant='caption' display='block'>
                            Institutional: {row.institutional_backing === 1 ? 'Yes' : row.institutional_backing === 0 ? 'No' : '-'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 5 }}>
            <Typography variant='h6' sx={{ mb: 2 }}>
              IPO Checklist
            </Typography>
            <Stack spacing={1.5}>
              <Typography variant='body2' color='text.secondary'>
                1. Check company business model and promoters.
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                2. Compare valuation with listed peers.
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                3. Read risks in DRHP and growth triggers.
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                4. Plan listing-day and long-term strategy.
              </Typography>
            </Stack>
            <Button variant='contained' sx={{ mt: 4 }}>
              Start IPO Tracking
            </Button>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: { xs: 4, md: 5 } }}>
            <Grid container spacing={4}>
              <Grid item xs={12} md={4}>
                <Typography variant='h6' sx={{ mb: 2 }}>
                  Discuss IPO with AI
                </Typography>
                <Typography variant='body2' color='text.secondary' sx={{ mb: 2.5 }}>
                  Select an IPO and start discussion for valuation, risks, listing strategy, and allocation plan.
                </Typography>
                <TextField
                  select
                  fullWidth
                  label='Select IPO'
                  value={selectedIpoId}
                  onChange={event => setSelectedIpoId(event.target.value)}
                  sx={{ mb: 2 }}
                  disabled={upcomingIpos.length === 0}
                >
                  {upcomingIpos.map(item => (
                    <MenuItem key={item.id} value={item.id}>
                      {item.name}
                    </MenuItem>
                  ))}
                </TextField>
                <Stack spacing={1}>
                  <Typography variant='caption' color='text.secondary'>
                    Price: {formatInr(ipoDetails?.price)}
                  </Typography>
                  <Typography variant='caption' color='text.secondary'>
                    Issue Size: {formatInr(ipoDetails?.ipo_size, ' Cr')}
                  </Typography>
                  <Typography variant='caption' color='text.secondary'>
                    Window: {formatDate(ipoDetails?.open_date)} to {formatDate(ipoDetails?.close_date)}
                  </Typography>
                  <Typography variant='caption' color='text.secondary'>
                    Listing: {formatDate(ipoDetails?.listing_date)}
                  </Typography>
                </Stack>
              </Grid>

              <Grid item xs={12} md={8}>
                <Box sx={{ p: 3, borderRadius: 2, bgcolor: 'action.hover', mb: 2 }}>
                  <Typography variant='subtitle2' sx={{ mb: 0.5 }}>
                    Suggested prompts
                  </Typography>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                    <Chip
                      clickable
                      label='Is valuation fair for listing gain?'
                      onClick={() => setDiscussionPrompt('Is valuation fair for listing gain?')}
                    />
                    <Chip
                      clickable
                      label='What are major risk factors here?'
                      onClick={() => setDiscussionPrompt('What are major risk factors here?')}
                    />
                    <Chip
                      clickable
                      label='Should I apply for short term or long term?'
                      onClick={() => setDiscussionPrompt('Should I apply for short term or long term?')}
                    />
                  </Stack>
                </Box>
                <TextField
                  fullWidth
                  multiline
                  minRows={4}
                  label='Ask AI about this IPO'
                  placeholder='Example: Compare this IPO with similar listed companies and tell me allocation strategy.'
                  value={discussionPrompt}
                  onChange={event => setDiscussionPrompt(event.target.value)}
                />
                <Stack direction='row' spacing={1.5} sx={{ mt: 2 }}>
                  <Button variant='contained'>Start AI Discussion</Button>
                  <Button variant='outlined' onClick={() => setDiscussionPrompt('')}>
                    Clear
                  </Button>
                </Stack>
                <Divider sx={{ my: 3 }} />
                <Typography variant='caption' color='text.secondary'>
                  AI discussion preview: The assistant can explain business model, valuation comfort, subscription
                  sentiment, risk-reward, and expected listing behavior.
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default IpoPage
