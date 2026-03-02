import { useState } from 'react'
import { useRouter } from 'next/router'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import SearchIcon from '@mui/icons-material/Search'
import InsightsIcon from '@mui/icons-material/Insights'
import BalanceIcon from '@mui/icons-material/Balance'
import TimelineIcon from '@mui/icons-material/Timeline'
import CompareArrowsIcon from '@mui/icons-material/CompareArrows'

const featuredSymbols = ['SBIN-EQ', 'RELIANCE-EQ', 'INFY-EQ', 'TCS-EQ', 'ITC-EQ']

const analysisBlocks = [
  {
    title: 'Business Quality Snapshot',
    detail: 'Understand sector positioning, management quality, and growth durability.',
    icon: <InsightsIcon />
  },
  {
    title: 'Financial Strength',
    detail: 'Evaluate revenue trend, profitability, debt load, and return metrics.',
    icon: <BalanceIcon />
  },
  {
    title: 'Valuation Ratios & Trend',
    detail: 'Review P/E, ROE, margins, and long-term operating consistency.',
    icon: <TimelineIcon />
  },
  {
    title: 'Quarterly vs Yearly Momentum',
    detail: 'Compare recent acceleration versus long-term compounding signals.',
    icon: <CompareArrowsIcon />
  }
]

const FundamentalsPage = () => {
  const router = useRouter()
  const [symbol, setSymbol] = useState('')

  const handleSearch = () => {
    const value = symbol.trim()
    if (!value) return
    router.push(`/stock-fundamental/${encodeURIComponent(value)}`)
  }

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Card
          sx={{
            borderRadius: 3,
            overflow: 'hidden',
            background:
              'radial-gradient(circle at 85% 12%, rgba(34, 197, 94, 0.24) 0%, transparent 32%), radial-gradient(circle at 10% 14%, rgba(59, 130, 246, 0.24) 0%, transparent 36%), linear-gradient(125deg, #111827 0%, #172554 52%, #064e3b 100%)'
          }}
        >
          <CardContent sx={{ p: { xs: 5, md: 7 } }}>
            <Grid container spacing={4} alignItems='center'>
              <Grid item xs={12} md={8}>
                <Chip label='Fundamental Analysis' color='success' size='small' sx={{ mb: 2 }} />
                <Typography variant='h3' sx={{ color: 'common.white', fontWeight: 700, mb: 1.5 }}>
                  Ask AI to Analyze Any Stock Before You Trade
                </Typography>
                <Typography variant='body1' sx={{ color: 'rgba(255,255,255,0.74)', maxWidth: 760 }}>
                  Search a stock, discuss with AI, and review structured fundamentals to make confident trading and
                  investment decisions.
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card sx={{ bgcolor: 'rgba(8, 14, 26, 0.75)', border: '1px solid rgba(255,255,255,0.13)' }}>
                  <CardContent>
                    <Typography variant='caption' sx={{ color: 'rgba(255,255,255,0.65)' }}>
                      Coverage
                    </Typography>
                    <Typography variant='h5' sx={{ color: 'common.white', mb: 2 }}>
                      AI + Multi-Section Analysis
                    </Typography>
                    <Typography variant='body2' sx={{ color: 'rgba(255,255,255,0.72)' }}>
                      Financials, ratios, momentum, balance sheet, and AI discussion-ready insights.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={7}>
        <Card sx={{ borderRadius: 3, height: '100%' }}>
          <CardContent sx={{ p: 5 }}>
            <Typography variant='h6' sx={{ mb: 1.5 }}>
              Search Stock and Start AI Discussion
            </Typography>
            <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
              Enter symbol like `SBIN-EQ`, `INFY-EQ`, `TCS-EQ` and ask AI to discuss valuation, strength, and risk.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                fullWidth
                placeholder='Enter stock symbol'
                value={symbol}
                onChange={event => setSymbol(event.target.value.toUpperCase())}
                onKeyDown={event => {
                  if (event.key === 'Enter') handleSearch()
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position='start'>
                      <SearchIcon />
                    </InputAdornment>
                  )
                }}
              />
              <Button variant='contained' onClick={handleSearch}>
                Analyze
              </Button>
            </Stack>
            <Box sx={{ mt: 2.5, p: 2.5, borderRadius: 2, bgcolor: 'action.hover' }}>
              <Typography variant='subtitle2' sx={{ mb: 1 }}>
                Suggested AI prompts
              </Typography>
              <Stack spacing={1}>
                <Typography variant='caption' color='text.secondary'>
                  • Is this stock fundamentally strong for long-term holding?
                </Typography>
                <Typography variant='caption' color='text.secondary'>
                  • Compare valuation of this stock with peers.
                </Typography>
                <Typography variant='caption' color='text.secondary'>
                  • What are key risks before taking entry?
                </Typography>
              </Stack>
            </Box>
            <Box sx={{ mt: 3 }}>
              <Typography variant='caption' color='text.secondary'>
                Quick symbols
              </Typography>
              <Stack direction='row' spacing={1} sx={{ mt: 1, flexWrap: 'wrap', gap: 1 }}>
                {featuredSymbols.map(item => (
                  <Chip
                    key={item}
                    label={item}
                    onClick={() => {
                      setSymbol(item)
                      router.push(`/stock-fundamental/${encodeURIComponent(item)}`)
                    }}
                    clickable
                    color='primary'
                    variant='outlined'
                  />
                ))}
              </Stack>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={5}>
        <Card sx={{ borderRadius: 3, height: '100%' }}>
          <CardContent sx={{ p: 5 }}>
            <Typography variant='h6' sx={{ mb: 2 }}>
              What AI Will Discuss
            </Typography>
            <Stack spacing={2}>
              {analysisBlocks.map(block => (
                <Box key={block.title} sx={{ p: 2.5, borderRadius: 2, bgcolor: 'action.hover' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Box sx={{ mr: 1.2, color: 'primary.main', display: 'flex' }}>{block.icon}</Box>
                    <Typography variant='subtitle2'>{block.title}</Typography>
                  </Box>
                  <Typography variant='body2' color='text.secondary'>
                    {block.detail}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default FundamentalsPage
