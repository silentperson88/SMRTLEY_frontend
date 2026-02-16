import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'

interface PortfolioSummaryHeroProps {
  totalFund: string
  totalInvested: string
  totalPl: string
  isPositivePl: boolean
  onCreate: () => void
}

const PortfolioSummaryHero = ({
  totalFund,
  totalInvested,
  totalPl,
  isPositivePl,
  onCreate
}: PortfolioSummaryHeroProps) => {
  return (
    <Card sx={{ borderRadius: 3 }}>
      <CardContent sx={{ p: { xs: 4, md: 5 } }}>
        <Grid container spacing={4} alignItems='center'>
          <Grid item xs={12} md={5}>
            <Typography variant='h4' sx={{ fontWeight: 700, mb: 1 }}>
              Your Investment Journey
            </Typography>
            <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
              Monitor portfolio allocation, fund usage, and performance in one place.
            </Typography>
            <Button variant='contained' onClick={onCreate}>
              Create New Portfolio
            </Button>
          </Grid>
          <Grid item xs={12} md={7}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Box sx={{ p: 2.5, borderRadius: 2, bgcolor: 'action.hover' }}>
                  <Typography variant='caption' color='text.secondary'>
                    Total Fund
                  </Typography>
                  <Typography variant='h6' sx={{ mt: 0.5 }}>
                    {totalFund}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box sx={{ p: 2.5, borderRadius: 2, bgcolor: 'action.hover' }}>
                  <Typography variant='caption' color='text.secondary'>
                    Invested Value
                  </Typography>
                  <Typography variant='h6' sx={{ mt: 0.5 }}>
                    {totalInvested}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box sx={{ p: 2.5, borderRadius: 2, bgcolor: 'action.hover' }}>
                  <Typography variant='caption' color='text.secondary'>
                    Total P/L
                  </Typography>
                  <Typography variant='h6' sx={{ mt: 0.5, color: isPositivePl ? 'success.main' : 'error.main' }}>
                    {totalPl}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}

export default PortfolioSummaryHero
