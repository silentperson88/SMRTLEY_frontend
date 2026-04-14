import type { NextPage } from 'next'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import Divider from '@mui/material/Divider'
import Alert from '@mui/material/Alert'

type WarningFlag = {
  code: string
  trigger: string
  meaning: string
}

const warningFlags: WarningFlag[] = [
  {
    code: 'W1',
    trigger: 'Promoter Holding Drop > 1.5% in any single quarter',
    meaning: 'Possible pledge invocation or promoter exit',
  },
  {
    code: 'W2',
    trigger: 'FII net 4Q change < -2%',
    meaning: 'Smart money losing confidence',
  },
  {
    code: 'W3',
    trigger: 'Profit CAGR 1Y significantly lower than 3Y CAGR',
    meaning: 'Peak growth may be behind',
  },
  {
    code: 'W4',
    trigger: 'OPM dropped > 2% vs last year',
    meaning: 'Margin pressure building',
  },
  {
    code: 'W5',
    trigger: 'Debt to Equity grew > 0.3 in 1 year',
    meaning: 'Leverage rising quietly',
  },
  {
    code: 'W6',
    trigger: 'Revenue growing but profit flat or falling',
    meaning: 'Costs out of control',
  },
  {
    code: 'W7',
    trigger: 'Working Capital Days increased > 30 days YoY',
    meaning: 'Cash getting stuck in the business',
  },
  {
    code: 'W8',
    trigger: 'Public holding up > 3% in a single quarter',
    meaning: 'Promoter / FII selling may be moving into retail',
  },
  {
    code: 'W9',
    trigger: 'EPS growth < 5% despite good revenue growth',
    meaning: 'Dilution, rising tax, or interest pressure',
  },
  {
    code: 'W10',
    trigger: 'CFO < 50% of Net Profit',
    meaning: 'Profits are not converting into real cash',
  },
]

const sampleRows = [
  {
    symbol: 'WAAREEENER',
    score: '81',
    grade: 'Buy',
    warnings: ['W5: Debt rising fast'],
  },
  {
    symbol: 'DIXON',
    score: '88',
    grade: 'Strong Buy',
    warnings: ['No warnings'],
  },
  {
    symbol: 'TATAPOWER',
    score: '72',
    grade: 'Buy',
    warnings: ['W1: Promoter drop', 'W4: OPM compressing'],
  },
  {
    symbol: 'ADANIGREEN',
    score: '58',
    grade: 'Watch',
    warnings: ['W2: FII exiting', 'W6: Revenue/Profit mismatch'],
  },
]

const WarningFlagsPage: NextPage = () => {
  return (
    <Grid container spacing={4}>
      <Grid item xs={12}>
        <Card
          sx={{
            borderRadius: 3,
            overflow: 'hidden',
            background:
              'radial-gradient(circle at 85% 15%, rgba(239, 68, 68, 0.16) 0%, transparent 28%), radial-gradient(circle at 15% 10%, rgba(245, 158, 11, 0.16) 0%, transparent 28%), linear-gradient(125deg, #1f2937 0%, #111827 52%, #0f172a 100%)',
          }}
        >
          <CardContent sx={{ p: { xs: 4, md: 6 } }}>
            <Stack spacing={2}>
              <Chip label='Warning Flags' color='warning' sx={{ alignSelf: 'flex-start' }} />
              <Typography variant='h3' sx={{ color: 'common.white', fontWeight: 800, maxWidth: 900 }}>
                Static Warning Guide for Future Screener Logic
              </Typography>
              <Typography variant='body1' sx={{ color: 'rgba(255,255,255,0.76)', maxWidth: 900 }}>
                This page is a placeholder guide for warning signals we may compute later in the backend. For now,
                it explains the trigger, the business meaning, and how we might surface it in the UI.
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Alert severity='info'>
          This is intentionally static for now. The live warning engine will come later and reuse the same labels.
        </Alert>
      </Grid>

      <Grid item xs={12}>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Stack spacing={1}>
              <Typography variant='h5' sx={{ fontWeight: 700 }}>
                Warning Flags
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                These are the first warning signals we can show when a stock begins to weaken.
              </Typography>
            </Stack>
            <Divider sx={{ my: 3 }} />
            <Grid container spacing={2}>
              {warningFlags.map(flag => (
                <Grid item xs={12} md={6} key={flag.code}>
                  <Card variant='outlined' sx={{ borderRadius: 2, height: '100%' }}>
                    <CardContent>
                      <Stack direction='row' spacing={1} alignItems='center' sx={{ mb: 1.25, flexWrap: 'wrap' }}>
                        <Chip label={flag.code} color='warning' size='small' />
                        <Typography variant='h6'>{flag.trigger}</Typography>
                      </Stack>
                      <Typography variant='body2' color='text.secondary'>
                        {flag.meaning}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Stack spacing={1}>
              <Typography variant='h5' sx={{ fontWeight: 700 }}>
                Example Display
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                This is how the warning section can look once we wire the logic in later.
              </Typography>
            </Stack>
            <Divider sx={{ my: 3 }} />
            <TableContainer component={Paper} variant='outlined' sx={{ borderRadius: 2 }}>
              <Table size='small'>
                <TableHead>
                  <TableRow>
                    <TableCell>Symbol</TableCell>
                    <TableCell>Score</TableCell>
                    <TableCell>Grade</TableCell>
                    <TableCell>Warnings</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sampleRows.map(row => (
                    <TableRow key={row.symbol}>
                      <TableCell sx={{ fontWeight: 700 }}>{row.symbol}</TableCell>
                      <TableCell>{row.score}</TableCell>
                      <TableCell>
                        <Chip
                          label={row.grade}
                          size='small'
                          color={row.grade === 'Strong Buy' ? 'success' : row.grade === 'Buy' ? 'primary' : row.grade === 'Watch' ? 'warning' : 'error'}
                        />
                      </TableCell>
                      <TableCell>
                        <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                          {row.warnings.map(warning => (
                            <Chip
                              key={warning}
                              label={warning}
                              size='small'
                              color={warning === 'No warnings' ? 'success' : 'warning'}
                              variant={warning === 'No warnings' ? 'filled' : 'outlined'}
                            />
                          ))}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default WarningFlagsPage
