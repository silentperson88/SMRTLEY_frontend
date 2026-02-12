import { Card, CardContent, Grid, Typography } from '@mui/material'

const SummaryCard = ({ title, value, positive }: any) => (
  <Grid item xs={12} sm={6} md={3}>
    <Card>
      <CardContent>
        <Typography variant='body2' color='text.secondary'>
          {title}
        </Typography>
        <Typography
          variant='h6'
          color={positive === undefined ? 'text.primary' : positive ? 'success.main' : 'error.main'}
        >
          {value}
        </Typography>
      </CardContent>
    </Card>
  </Grid>
)

export default SummaryCard
