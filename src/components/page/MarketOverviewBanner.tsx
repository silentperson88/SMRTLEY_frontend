import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'

interface MarketOverviewBannerProps {
  trackedCount: number
  scopeLabel: string
  onPrimaryAction?: () => void
}

const MarketOverviewBanner = ({ trackedCount, scopeLabel, onPrimaryAction }: MarketOverviewBannerProps) => {
  return (
    <Card
      sx={{
        borderRadius: 3,
        background: 'linear-gradient(120deg, #0f172a 0%, #1e1b4b 55%, #172554 100%)',
        color: 'common.white'
      }}
    >
      <CardContent sx={{ p: { xs: 4, md: 5 } }}>
        <Grid container spacing={4} alignItems='center'>
          <Grid item xs={12} md={6}>
            <Typography variant='h5' sx={{ fontWeight: 700, mb: 1.5, color: 'common.white' }}>
              Live Market Watch
            </Typography>
            <Typography variant='body2' sx={{ color: 'rgba(255,255,255,0.72)', mb: 3 }}>
              Real-time stream of active symbols with quick filters and instant quote updates.
            </Typography>
            <Button variant='contained' size='small' onClick={onPrimaryAction}>
              Open My Portfolio
            </Button>
          </Grid>
          <Grid item xs={12} md={6}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent='flex-end'>
              <Box sx={{ p: 3, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.08)', minWidth: 170 }}>
                <Typography variant='caption' sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  Tracked Symbols
                </Typography>
                <Typography variant='h5' sx={{ mt: 0.5, color: 'common.white' }}>
                  {trackedCount}
                </Typography>
              </Box>
              <Box sx={{ p: 3, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.08)', minWidth: 170 }}>
                <Typography variant='caption' sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  Current Scope
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <Chip label={scopeLabel} color={scopeLabel === 'Filtered' ? 'warning' : 'success'} size='small' />
                </Box>
              </Box>
            </Stack>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}

export default MarketOverviewBanner
