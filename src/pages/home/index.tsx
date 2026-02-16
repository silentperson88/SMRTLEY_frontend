import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Avatar from '@mui/material/Avatar'
import Stack from '@mui/material/Stack'
import Divider from '@mui/material/Divider'
import LinearProgress from '@mui/material/LinearProgress'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import ShowChartIcon from '@mui/icons-material/ShowChart'
import InsightsIcon from '@mui/icons-material/Insights'
import ChecklistRtlIcon from '@mui/icons-material/ChecklistRtl'
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'
import PsychologyIcon from '@mui/icons-material/Psychology'
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch'
import GroupsIcon from '@mui/icons-material/Groups'
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline'
import InstagramIcon from '@mui/icons-material/Instagram'
import FacebookIcon from '@mui/icons-material/Facebook'
import AutoGraphIcon from '@mui/icons-material/AutoGraph'
import CandlestickChartIcon from '@mui/icons-material/CandlestickChart'
import ShieldIcon from '@mui/icons-material/Shield'
import { usePaginatedSWR, useSimpleSWR } from 'src/hooks/swr/swrhooks'
import { ENDURL } from 'src/utils/constants/endurl.utils'

interface DashboardData {
  stats?: {
    total_orders?: number
    total_stock_types?: number
    total_invested?: number
    unrealized_pl?: number
  }
  account_totals?: {
    total_wallet_value?: number
    invested_value?: number
    available_fund?: number
  }
}

interface StockData {
  symbol: string
  name: string
  ltp: number
  percentChange: number
}

const featureSlides = [
  {
    title: 'Stylish Dashboard',
    subtitle: 'A modern dashboard experience with clear insights and better control.',
    icon: <InsightsIcon />,
    badge: 'Dashboard',
    points: ['Clean analytics', 'Real-time overview', 'Action-first layout']
  },
  {
    title: 'Smarter Watchlist',
    subtitle: 'Track preferred stocks quickly and stay focused on important moves.',
    icon: <ChecklistRtlIcon />,
    badge: 'Watchlist',
    points: ['Favorite symbols', 'Quick scan', 'Focused decisions']
  },
  {
    title: 'Trade Without Money',
    subtitle: 'Practice safely with virtual execution and realistic market behavior.',
    icon: <AccountBalanceWalletIcon />,
    badge: 'Simulation',
    points: ['No risk capital', 'Real flow behavior', 'Strategy testing']
  },
  {
    title: 'Analyze Each Stock (Fundamentals)',
    subtitle: 'Evaluate stock fundamentals before taking any trade decision.',
    icon: <PsychologyIcon />,
    badge: 'Research',
    points: ['Fundamental checks', 'Business quality', 'Decision confidence']
  }
]

const capabilities = [
  { title: 'Smarter Portfolio', text: 'Build portfolio plans based on your goals and risk style.', icon: <AutoGraphIcon /> },
  {
    title: 'Create Portfolio by Strategy',
    text: 'Create portfolios as per requirement, strategy, or investment style.',
    icon: <ShieldIcon />
  },
  { title: 'Live Graphs', text: 'Monitor market movement through clear live graph experiences.', icon: <ShowChartIcon /> },
  {
    title: 'Real Trading System Behavior',
    text: 'Experience order placement and execution behavior close to real trading systems.',
    icon: <CandlestickChartIcon />
  },
  { title: 'Trending Stocks', text: 'Identify moving opportunities early from active symbols.', icon: <TrendingUpIcon /> },
  {
    title: 'Advice Before Trade (Upcoming)',
    text: 'Get pre-trade advice on each stock before you place an order. (Upcoming)',
    icon: <RocketLaunchIcon />
  }
]

const recentViewedStocks = [
  { symbol: 'SBIN-EQ', name: 'State Bank of India', price: 890.45 },
  { symbol: 'RELIANCE-EQ', name: 'Reliance Industries', price: 2942.15 },
  { symbol: 'INFY-EQ', name: 'Infosys', price: 1845.6 },
  { symbol: 'TCS-EQ', name: 'Tata Consultancy Services', price: 4210.8 }
]

const staticTopGainers = [
  { symbol: 'IRFC-EQ', change: 8.5, price: 192.3 },
  { symbol: 'BHEL-EQ', change: 6.9, price: 295.75 },
  { symbol: 'HAL-EQ', change: 5.2, price: 4758.1 }
]

const staticTopLosers = [
  { symbol: 'HDFCLIFE-EQ', change: -4.2, price: 622.8 },
  { symbol: 'WIPRO-EQ', change: -3.6, price: 542.2 },
  { symbol: 'ITC-EQ', change: -2.9, price: 468.95 }
]

const HomePage = () => {
  const router = useRouter()
  const [activeSlide, setActiveSlide] = useState(0)

  const { data: dashboardData } = useSimpleSWR<DashboardData>(ENDURL.GET_DASHBOARD)
  const { data: stocksData } = usePaginatedSWR<StockData[]>(ENDURL.GET_ALL_ACTIVE_STOCKS, {
    page: 1,
    pageSize: 100,
    searchValue: ''
  })

  useEffect(() => {
    const id = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % featureSlides.length)
    }, 3500)

    return () => clearInterval(id)
  }, [])

  const trendingStocks = useMemo(() => {
    const rows = Array.isArray(stocksData) ? [...stocksData] : []

    return rows.sort((a, b) => (b.percentChange || 0) - (a.percentChange || 0)).slice(0, 5)
  }, [stocksData])

  const walletValue = dashboardData?.account_totals?.total_wallet_value || 0
  const investedValue = dashboardData?.account_totals?.invested_value || 0
  const availableFund = dashboardData?.account_totals?.available_fund || 0
  const totalOrders = dashboardData?.stats?.total_orders || 0
  const trackedStockTypes = dashboardData?.stats?.total_stock_types || 0
  const unrealizedPL = dashboardData?.stats?.unrealized_pl || 0

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Card
          sx={{
            overflow: 'hidden',
            borderRadius: 3,
            background:
              'radial-gradient(circle at 82% 16%, rgba(85,137,255,0.32) 0%, transparent 38%), linear-gradient(130deg, #11152f 0%, #181f44 56%, #10253f 100%)'
          }}
        >
          <CardContent sx={{ p: { xs: 5, md: 7 } }}>
            <Grid container spacing={6} alignItems='center'>
              <Grid item xs={12} md={7}>
                <Chip label='Run4Dream Platform' color='primary' size='small' sx={{ mb: 3 }} />
                <Typography variant='h3' sx={{ color: 'common.white', fontWeight: 700, mb: 2 }}>
                  Learn, Build, Analyze, and Trade Smarter
                </Typography>
                <Typography variant='body1' sx={{ color: 'rgba(255,255,255,0.72)', maxWidth: 720, mb: 4 }}>
                  We provide a stylish dashboard, smarter watchlist, smarter portfolio tools, live graphs, stock
                  fundamentals, trading simulation, and trending market views to improve your complete journey.
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <Button variant='contained' onClick={() => router.push('/portfolio-stocks')}>
                    Create Portfolio
                  </Button>
                  <Button variant='outlined' sx={{ color: 'common.white', borderColor: 'rgba(255,255,255,0.45)' }} onClick={() => router.push('/live-stocks')}>
                    Explore Live Stocks
                  </Button>
                </Stack>
              </Grid>
              <Grid item xs={12} md={5}>
                <Card sx={{ bgcolor: 'rgba(13,18,40,0.8)', border: '1px solid rgba(255,255,255,0.12)' }}>
                  <CardContent>
                    <Typography variant='subtitle1' sx={{ color: 'common.white', mb: 2, fontWeight: 600 }}>
                      Platform snapshot
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant='caption' sx={{ color: 'rgba(255,255,255,0.65)' }}>
                          Wallet Value
                        </Typography>
                        <Typography variant='h6' sx={{ color: 'common.white' }}>
                          INR {walletValue.toLocaleString()}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant='caption' sx={{ color: 'rgba(255,255,255,0.65)' }}>
                          Stock Types
                        </Typography>
                        <Typography variant='h6' sx={{ color: 'common.white' }}>
                          {trackedStockTypes}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant='caption' sx={{ color: 'rgba(255,255,255,0.65)' }}>
                          Total Orders
                        </Typography>
                        <Typography variant='h6' sx={{ color: 'common.white' }}>
                          {totalOrders}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant='caption' sx={{ color: 'rgba(255,255,255,0.65)' }}>
                          Unrealized P/L
                        </Typography>
                        <Typography variant='h6' sx={{ color: unrealizedPL >= 0 ? '#60d394' : '#ff6b6b' }}>
                          {unrealizedPL >= 0 ? '+' : '-'}INR {Math.abs(unrealizedPL).toLocaleString()}
                        </Typography>
                      </Grid>
                    </Grid>
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
            <Typography variant='h6' sx={{ mb: 1 }}>
              Feature Spotlight
            </Typography>
            <Typography variant='body2' color='text.secondary' sx={{ mb: 4 }}>
              Rotating highlights of what makes Run4Dream different.
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={7}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>{featureSlides[activeSlide].icon}</Avatar>
                  <Typography variant='h5'>{featureSlides[activeSlide].title}</Typography>
                </Box>
                <Typography variant='body1' color='text.secondary' sx={{ mb: 2.5 }}>
                  {featureSlides[activeSlide].subtitle}
                </Typography>
                <Chip label={featureSlides[activeSlide].badge} size='small' color='primary' sx={{ mb: 2.5 }} />
                <Stack spacing={1}>
                  {featureSlides[activeSlide].points.map(point => (
                    <Typography key={point} variant='caption' color='text.secondary'>
                      • {point}
                    </Typography>
                  ))}
                </Stack>
              </Grid>
              <Grid item xs={12} md={5}>
                <Box
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    border: theme => `1px solid ${theme.palette.divider}`,
                    background: 'linear-gradient(140deg, rgba(93, 114, 255, 0.12) 0%, rgba(0,0,0,0) 70%)'
                  }}
                >
                  <Typography variant='caption' color='text.secondary'>
                    UI Preview
                  </Typography>
                  <Box
                    sx={{
                      mt: 1.5,
                      p: 2,
                      borderRadius: 2,
                      bgcolor: 'background.paper',
                      boxShadow: 2
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                      <Typography variant='caption' color='text.secondary'>
                        Feature Panel
                      </Typography>
                      {featureSlides[activeSlide].icon}
                    </Box>
                    <LinearProgress variant='determinate' value={72} sx={{ mb: 1.5 }} />
                    <Stack direction='row' spacing={1}>
                      <Chip size='small' label='Live' color='success' />
                      <Chip size='small' label='Smart' color='primary' />
                    </Stack>
                  </Box>
                </Box>
              </Grid>
            </Grid>
            <LinearProgress variant='determinate' value={((activeSlide + 1) / featureSlides.length) * 100} />
            <Stack direction='row' spacing={1} sx={{ mt: 2 }}>
              {featureSlides.map((_, idx) => (
                <Box
                  key={idx}
                  onClick={() => setActiveSlide(idx)}
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    cursor: 'pointer',
                    bgcolor: idx === activeSlide ? 'primary.main' : 'divider'
                  }}
                />
              ))}
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card sx={{ borderRadius: 3, height: '100%' }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant='h6' sx={{ mb: 2 }}>
              Recent Viewed Stocks
            </Typography>
            <Stack spacing={1.8}>
              {recentViewedStocks.map(stock => (
                <Box key={stock.symbol} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant='body2' sx={{ fontWeight: 600 }}>
                      {stock.symbol}
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      {stock.name}
                    </Typography>
                  </Box>
                  <Typography variant='body2'>INR {stock.price.toLocaleString()}</Typography>
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card sx={{ borderRadius: 3, height: '100%' }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TrendingUpIcon color='success' sx={{ mr: 1 }} />
              <Typography variant='h6'>Top Gainers (Static)</Typography>
            </Box>
            <Stack spacing={1.8}>
              {staticTopGainers.map(stock => (
                <Box key={stock.symbol} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant='body2' sx={{ fontWeight: 600 }}>
                      {stock.symbol}
                    </Typography>
                    <Typography variant='caption' color='success.main'>
                      +{stock.change.toFixed(2)}%
                    </Typography>
                  </Box>
                  <Typography variant='body2'>INR {stock.price.toLocaleString()}</Typography>
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card sx={{ borderRadius: 3, height: '100%' }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TrendingDownIcon color='error' sx={{ mr: 1 }} />
              <Typography variant='h6'>Top Losers (Static)</Typography>
            </Box>
            <Stack spacing={1.8}>
              {staticTopLosers.map(stock => (
                <Box key={stock.symbol} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant='body2' sx={{ fontWeight: 600 }}>
                      {stock.symbol}
                    </Typography>
                    <Typography variant='caption' color='error.main'>
                      {stock.change.toFixed(2)}%
                    </Typography>
                  </Box>
                  <Typography variant='body2'>INR {stock.price.toLocaleString()}</Typography>
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={5}>
        <Card sx={{ borderRadius: 3, height: '100%' }}>
          <CardContent sx={{ p: 5 }}>
            <Typography variant='h6' sx={{ mb: 3 }}>
              Live Stats
            </Typography>
            <Stack spacing={2.5}>
              <Box>
                <Typography variant='caption' color='text.secondary'>
                  Invested Value
                </Typography>
                <Typography variant='h5'>INR {investedValue.toLocaleString()}</Typography>
              </Box>
              <Divider />
              <Box>
                <Typography variant='caption' color='text.secondary'>
                  Available Fund
                </Typography>
                <Typography variant='h5'>INR {availableFund.toLocaleString()}</Typography>
              </Box>
              <Divider />
              <Box>
                <Typography variant='caption' color='text.secondary'>
                  Active Stocks Tracked
                </Typography>
                <Typography variant='h5'>{Array.isArray(stocksData) ? stocksData.length : 0}</Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Typography variant='h5' sx={{ mb: 3 }}>
          What We Do on Run4Dream
        </Typography>
        <Grid container spacing={4}>
          {capabilities.map(item => (
            <Grid item xs={12} sm={6} md={4} key={item.title}>
              <Card sx={{ height: '100%', borderRadius: 3 }}>
                <CardContent sx={{ p: 4 }}>
                  <Avatar sx={{ width: 44, height: 44, mb: 2, bgcolor: 'primary.main' }}>{item.icon}</Avatar>
                  <Typography variant='h6' sx={{ mb: 1 }}>
                    {item.title}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    {item.text}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card sx={{ borderRadius: 3, height: '100%' }}>
          <CardContent sx={{ p: 5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <TrendingUpIcon sx={{ mr: 1.5, color: 'primary.main' }} />
              <Typography variant='h6'>Trending Stocks</Typography>
            </Box>
            {trendingStocks.length === 0 ? (
              <Typography variant='body2' color='text.secondary'>
                No trending data available right now.
              </Typography>
            ) : (
              <Stack spacing={2.2}>
                {trendingStocks.map(stock => (
                  <Box key={stock.symbol} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant='body2' sx={{ fontWeight: 600 }}>
                        {stock.symbol}
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        {stock.name}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant='body2'>INR {Number(stock.ltp || 0).toLocaleString()}</Typography>
                      <Chip
                        size='small'
                        label={`${stock.percentChange >= 0 ? '+' : ''}${Number(stock.percentChange || 0).toFixed(2)}%`}
                        color={stock.percentChange >= 0 ? 'success' : 'error'}
                      />
                    </Box>
                  </Box>
                ))}
              </Stack>
            )}
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card sx={{ borderRadius: 3, height: '100%' }}>
          <CardContent sx={{ p: 5 }}>
              <Typography variant='h6' sx={{ mb: 3 }}>
                Upcoming
              </Typography>
              <Stack spacing={2.5}>
                <Box sx={{ p: 3, borderRadius: 2, bgcolor: 'action.hover' }}>
                  <Typography variant='subtitle2' sx={{ mb: 0.5 }}>
                    Advice Before Trade
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Get stock-specific guidance before placing order. (Upcoming)
                  </Typography>
                </Box>
                <Box sx={{ p: 3, borderRadius: 2, bgcolor: 'action.hover' }}>
                  <Typography variant='subtitle2' sx={{ mb: 0.5 }}>
                    Find Stocks with AI Discussion
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Discuss your requirement with AI and get analyzed stock suggestions. (Upcoming)
                  </Typography>
                </Box>
              </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card sx={{ borderRadius: 3, height: '100%' }}>
          <CardContent sx={{ p: 5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <GroupsIcon sx={{ mr: 1.5, color: 'primary.main' }} />
              <Typography variant='h6'>Refer Us For Motivation</Typography>
            </Box>
            <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
              If you like what we are building, refer Run4Dream to your friends and community.
            </Typography>
            <Button variant='contained'>Refer Run4Dream</Button>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card sx={{ borderRadius: 3, height: '100%' }}>
          <CardContent sx={{ p: 5 }}>
            <Typography variant='h6' sx={{ mb: 2 }}>
              Follow Us: Run4Dream
            </Typography>
            <Stack direction='row' spacing={1.5}>
              <Chip icon={<PlayCircleOutlineIcon />} label='YouTube' />
              <Chip icon={<InstagramIcon />} label='Instagram' />
              <Chip icon={<FacebookIcon />} label='Facebook' />
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default HomePage
