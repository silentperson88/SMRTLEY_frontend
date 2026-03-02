// ** React Imports
import { ReactElement, useEffect, useState } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import Avatar from '@mui/material/Avatar'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'

// ** Icons Imports
import TrendingUp from 'mdi-material-ui/TrendingUp'
import CurrencyUsd from 'mdi-material-ui/CurrencyUsd'
import ChartPie from 'mdi-material-ui/ChartPie'
import ScaleBalance from 'mdi-material-ui/ScaleBalance'
import BookOpenPageVariant from 'mdi-material-ui/BookOpenPageVariant'
import CashMultiple from 'mdi-material-ui/CashMultiple'
import Finance from 'mdi-material-ui/Finance'
import ArrowUpBoldCircleOutline from 'mdi-material-ui/ArrowUpBoldCircleOutline'
import ArrowDownBoldCircleOutline from 'mdi-material-ui/ArrowDownBoldCircleOutline'
import CertificateOutline from 'mdi-material-ui/CertificateOutline'

// import CellphoneLink from 'mdi-material-ui/CellphoneLink'
// import AccountOutline from 'mdi-material-ui/AccountOutline'

// ** Types
import { ThemeColor } from 'src/@core/layouts/types'
import { Fundamental, TodaysMarket } from 'src/pages/stock-fundamental/[symbol]'
import { Button } from '@mui/material'
import StockGraph from './stockGraph'
import { TC } from 'src/utils/constants/text.constants'

export interface DataType {
  stats: string | number
  title: string
  color: ThemeColor
  icon: ReactElement
}

const renderStats = (stats: DataType[]) => {
  return stats.map((item: DataType, index: number) => (
    <Grid item xs={12} sm={3} key={index}>
      <Box key={index} sx={{ display: 'flex', alignItems: 'center' }}>
        <Avatar
          variant='rounded'
          sx={{
            mr: 3,
            width: 44,
            height: 44,
            boxShadow: 3,
            color: 'common.white',
            backgroundColor: `${item.color}.main`
          }}
        >
          {item.icon}
        </Avatar>
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography variant='caption'>{item.title}</Typography>
          <Typography variant='h6'>{item.stats}</Typography>
        </Box>
      </Box>
    </Grid>
  ))
}

const CompanyStatisticsCard = (props: {
  fundamentals: Fundamental
  todaysMarket?: TodaysMarket
  onBuy?: () => void
  onSell?: () => void
  totalHoldingQty?: number
  totalHoldingValue?: number
}) => {
  const [stats, setStats] = useState<DataType[]>([])

  const { companyName, marketSnapshot } = props?.fundamentals
  const { todaysMarket, onBuy, onSell, totalHoldingQty = 0, totalHoldingValue = 0 } = props

  useEffect(() => {
    console.log(marketSnapshot)
    if (marketSnapshot) {
      const newStats: DataType[] = []
      if (marketSnapshot.marketCap) {
        newStats.push({
          stats: marketSnapshot.marketCap,
          title: 'Market Cap',
          color: 'primary',
          icon: <ChartPie sx={{ fontSize: '1.75rem' }} />
        })
      }

      if (marketSnapshot.currentPrice) {
        newStats.push({
          stats: marketSnapshot.currentPrice,
          title: 'Current Price',
          color: 'secondary',
          icon: <CurrencyUsd sx={{ fontSize: '1.75rem' }} />
        })
      }

      if (marketSnapshot.high) {
        newStats.push({
          stats: marketSnapshot.high,
          title: 'High',
          color: 'success',
          icon: <ArrowUpBoldCircleOutline sx={{ fontSize: '1.75rem' }} />
        })
      }

      if (marketSnapshot.low) {
        newStats.push({
          stats: marketSnapshot.low,
          title: 'Low',
          color: 'error',
          icon: <ArrowDownBoldCircleOutline sx={{ fontSize: '1.75rem' }} />
        })
      }

      if (marketSnapshot.peRatio) {
        newStats.push({
          stats: marketSnapshot.peRatio,
          title: 'PE Ratio',
          color: 'info',
          icon: <ScaleBalance sx={{ fontSize: '1.75rem' }} />
        })
      }

      if (marketSnapshot.bookValue) {
        newStats.push({
          stats: marketSnapshot.bookValue,
          title: 'Book Value',
          color: 'info',
          icon: <BookOpenPageVariant sx={{ fontSize: '1.75rem' }} />
        })
      }

      if (marketSnapshot.dividendYield) {
        newStats.push({
          stats: marketSnapshot.dividendYield,
          title: 'Dividend Yield',
          color: 'info',
          icon: <CashMultiple sx={{ fontSize: '1.75rem' }} />
        })
      }

      if (marketSnapshot.roce) {
        newStats.push({
          stats: marketSnapshot.roce,
          title: 'ROCE',
          color: 'info',
          icon: <TrendingUp sx={{ fontSize: '1.75rem' }} />
        })
      }

      if (marketSnapshot.roe) {
        newStats.push({
          stats: marketSnapshot.roe,
          title: 'ROE',
          color: 'info',
          icon: <Finance sx={{ fontSize: '1.75rem' }} />
        })
      }

      if (marketSnapshot.faceValue) {
        newStats.push({
          stats: marketSnapshot.faceValue,
          title: 'Face Value',
          color: 'info',
          icon: <CertificateOutline sx={{ fontSize: '1.75rem' }} />
        })
      }

      setStats(newStats)
    }
  }, [marketSnapshot])

  const currentValue = todaysMarket ? todaysMarket.ltp * totalHoldingQty : totalHoldingValue

  const pnl = currentValue - totalHoldingValue
  const pnlPercent = totalHoldingValue > 0 ? (pnl / totalHoldingValue) * 100 : 0

  const isProfit = pnl > 0
  const isLoss = pnl < 0

  return (
    <Card>
      <CardHeader
        title={companyName}
        action={
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant='contained' color='success' onClick={onBuy} disabled={!onBuy}>
              Buy
            </Button>
            <Button variant='contained' color='error' onClick={onSell} disabled={!onSell}>
              Sell
            </Button>
          </Box>
        }
        subheader={
          todaysMarket && (
            <>
              <Typography variant='h5' color={todaysMarket.percentChange > 0 ? 'green' : 'error'}>
                <Box component='span' sx={{ fontWeight: 600 }}>
                  {todaysMarket?.ltp}
                </Box>{' '}
              </Typography>
              <Typography variant='body2' color={todaysMarket.percentChange > 0 ? 'green' : 'error'}>
                <Box component='span' sx={{ fontWeight: 600 }}>
                  {(todaysMarket.ltp - todaysMarket.open).toFixed(2)}{' '}
                  {/* Total {growth}% growth on {new Date(marketSnapshot?.date).toDateString()} */}(
                  {todaysMarket.percentChange.toFixed(2)} %)
                </Box>{' '}
                {todaysMarket.percentChange > 0 ? '😎' : ''}
              </Typography>
            </>
          )
        }
        titleTypographyProps={{
          sx: {
            mb: 2.5,
            lineHeight: '2rem !important',
            letterSpacing: '0.15px !important'
          }
        }}
      />

      <Box sx={{ px: 6, pb: 3 }}>
        <Card
          variant='outlined'
          sx={{
            borderRadius: 2,
            borderColor: isProfit ? 'success.main' : isLoss ? 'error.main' : 'divider'
          }}
        >
          <CardContent sx={{ py: 2 }}>
            <Grid container spacing={3} alignItems='center'>
              {/* Qty */}
              <Grid item xs={6}>
                <Typography variant='caption' color='text.secondary'>
                  Holding Qty
                </Typography>
                <Typography variant='h6' sx={{ fontWeight: 700 }}>
                  {totalHoldingQty}
                </Typography>
              </Grid>

              {/* Value + P/L */}
              <Grid item xs={6} textAlign='right'>
                <Typography variant='caption' color='text.secondary'>
                  Current Value
                </Typography>
                <Typography variant='h6' sx={{ fontWeight: 700 }}>
                  {TC.CURRENCY}
                  {currentValue.toLocaleString()}
                </Typography>

                {totalHoldingQty > 0 && (
                  <Typography
                    variant='caption'
                    sx={{
                      color: isProfit ? 'success.main' : isLoss ? 'error.main' : 'text.secondary',
                      fontWeight: 600
                    }}
                  >
                    {isProfit ? '+' : ''}
                    {pnl.toFixed(2)} ({pnlPercent.toFixed(2)}%)
                  </Typography>
                )}
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>

      {todaysMarket?.dayCandles && (
        <StockGraph candles={todaysMarket?.dayCandles} pln={parseFloat(todaysMarket.percentChange.toFixed(2))} />
      )}

      <CardContent sx={{ pt: theme => `${theme.spacing(3)} !important` }}>
        <Grid container spacing={[5, 0]}>
          {renderStats(stats)}
        </Grid>
      </CardContent>
    </Card>
  )
}

export default CompanyStatisticsCard
