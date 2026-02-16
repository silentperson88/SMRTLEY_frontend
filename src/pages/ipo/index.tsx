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
import { useMemo, useState } from 'react'

const upcomingIpos = [
  {
    company: 'Aarvi Mobility Limited',
    openDate: '2026-02-18',
    closeDate: '2026-02-20',
    priceBand: 'INR 210 - 225',
    lotSize: 66,
    issueSize: 'INR 640 Cr',
    category: 'Mainboard'
  },
  {
    company: 'Nova Green Energy',
    openDate: '2026-02-24',
    closeDate: '2026-02-27',
    priceBand: 'INR 148 - 156',
    lotSize: 96,
    issueSize: 'INR 280 Cr',
    category: 'SME'
  },
  {
    company: 'Aster Retail Chain',
    openDate: '2026-03-03',
    closeDate: '2026-03-05',
    priceBand: 'INR 365 - 384',
    lotSize: 39,
    issueSize: 'INR 1,120 Cr',
    category: 'Mainboard'
  },
  {
    company: 'Trionix Tech Systems',
    openDate: '2026-03-09',
    closeDate: '2026-03-11',
    priceBand: 'INR 520 - 548',
    lotSize: 27,
    issueSize: 'INR 910 Cr',
    category: 'Mainboard'
  }
]

const IpoPage = () => {
  const [selectedIpo, setSelectedIpo] = useState(upcomingIpos[0].company)
  const [discussionPrompt, setDiscussionPrompt] = useState('')

  const ipoDetails = useMemo(
    () => upcomingIpos.find(item => item.company === selectedIpo) || upcomingIpos[0],
    [selectedIpo]
  )

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
                    <Typography variant='caption' sx={{ color: 'rgba(255,255,255,0.65)' }}>
                      Upcoming IPOs
                    </Typography>
                    <Typography variant='h4' sx={{ color: 'common.white', mb: 2 }}>
                      {upcomingIpos.length}
                    </Typography>
                    <Typography variant='caption' sx={{ color: 'rgba(255,255,255,0.65)' }}>
                      Mainboard Listings
                    </Typography>
                    <Typography variant='h6' sx={{ color: 'common.white' }}>
                      {upcomingIpos.filter(item => item.category === 'Mainboard').length}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={8}>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ px: 5, py: 4 }}>
              <Typography variant='h6'>Upcoming IPO Listings (Static)</Typography>
              <Typography variant='body2' color='text.secondary'>
                This is a static preview list. Live IPO feed can be connected next.
              </Typography>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Company</TableCell>
                    <TableCell>Open</TableCell>
                    <TableCell>Close</TableCell>
                    <TableCell>Price Band</TableCell>
                    <TableCell>Lot Size</TableCell>
                    <TableCell>Issue Size</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {upcomingIpos.map(row => (
                    <TableRow key={row.company} hover>
                      <TableCell>
                        <Typography variant='body2' sx={{ fontWeight: 600 }}>
                          {row.company}
                        </Typography>
                        <Chip size='small' label={row.category} color={row.category === 'Mainboard' ? 'primary' : 'secondary'} />
                      </TableCell>
                      <TableCell>{row.openDate}</TableCell>
                      <TableCell>{row.closeDate}</TableCell>
                      <TableCell>{row.priceBand}</TableCell>
                      <TableCell>{row.lotSize}</TableCell>
                      <TableCell>{row.issueSize}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card sx={{ borderRadius: 3, height: '100%' }}>
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
            <Button variant='contained' fullWidth sx={{ mt: 4 }}>
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
                  value={selectedIpo}
                  onChange={event => setSelectedIpo(event.target.value)}
                  sx={{ mb: 2 }}
                >
                  {upcomingIpos.map(item => (
                    <MenuItem key={item.company} value={item.company}>
                      {item.company}
                    </MenuItem>
                  ))}
                </TextField>
                <Stack spacing={1}>
                  <Typography variant='caption' color='text.secondary'>
                    Price Band: {ipoDetails.priceBand}
                  </Typography>
                  <Typography variant='caption' color='text.secondary'>
                    Issue Size: {ipoDetails.issueSize}
                  </Typography>
                  <Typography variant='caption' color='text.secondary'>
                    Window: {ipoDetails.openDate} to {ipoDetails.closeDate}
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
