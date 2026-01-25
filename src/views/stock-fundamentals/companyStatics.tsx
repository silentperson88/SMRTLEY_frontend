// ** React Imports
import { ReactElement, useEffect, useMemo, useState } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import Avatar from '@mui/material/Avatar'
import CardHeader from '@mui/material/CardHeader'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'

// ** Icons Imports
import TrendingUp from 'mdi-material-ui/TrendingUp'
import CurrencyUsd from 'mdi-material-ui/CurrencyUsd'
import DotsVertical from 'mdi-material-ui/DotsVertical'
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
import { Fundamental } from 'src/pages/stock-fundamental/[symbol]'

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

const CompanyStatisticsCard = (props: { fundamentals: Fundamental }) => {
  const [stats, setStats] = useState<DataType[]>([])
  const { companyName, marketSnapshot } = props?.fundamentals

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
          title: 'Revenue',
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

  const growth = useMemo(() => {
    return (((marketSnapshot?.open - marketSnapshot?.close) / marketSnapshot?.close) * 100).toFixed(2)
  }, [stats])

  return (
    <Card>
      <CardHeader
        title={companyName}
        action={
          <IconButton size='small' aria-label='settings' className='card-more-options' sx={{ color: 'text.secondary' }}>
            <DotsVertical />
          </IconButton>
        }
        subheader={
          <Typography variant='body2'>
            <Box component='span' sx={{ fontWeight: 600, color: 'text.primary' }}>
              Total {growth}% growth on {new Date(marketSnapshot?.date).toDateString()}
            </Box>{' '}
            😎 
          </Typography>
        }
        titleTypographyProps={{
          sx: {
            mb: 2.5,
            lineHeight: '2rem !important',
            letterSpacing: '0.15px !important'
          }
        }}
      />
      <CardContent sx={{ pt: theme => `${theme.spacing(3)} !important` }}>
        <Grid container spacing={[5, 0]}>
          {renderStats(stats)}
        </Grid>
      </CardContent>
    </Card>
  )
}

export default CompanyStatisticsCard
