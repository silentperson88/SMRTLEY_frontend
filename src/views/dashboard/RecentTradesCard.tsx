// ** MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Avatar from '@mui/material/Avatar'
import Typography from '@mui/material/Typography'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import LinearProgress from '@mui/material/LinearProgress'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import { alpha } from '@mui/material/styles'

import { TC } from 'src/utils/constants/text.constants'
import { ThemeColor } from 'src/@core/layouts/types'

interface TradeItem {
  active_stock_id: string
  symbol: string
  total_quantity: number
  invested_value: number
  current_value: number
  pl: number
}

interface DataType {
  title: string
  currentValue: string
  plAmount: string
  subtitle: string
  progress: number
  isProfit: boolean
  color: ThemeColor
}

const RecentTradesCard = ({ rows, emptyMessage }: { rows: TradeItem[]; emptyMessage?: string }) => {
  const recentTrades = (rows || []).slice(0, 5)

  const progressByStatus: Record<string, number> = {
    HIGH: 100,
    MEDIUM: 65,
    LOW: 40
  }

  const data: DataType[] = recentTrades.map(item => {
    const isProfit = item.pl >= 0
    const progress =
      item.invested_value > 0 ? Math.min(100, Math.round((item.current_value / item.invested_value) * 100)) : 0
    const strength = progress >= 95 ? 'HIGH' : progress >= 60 ? 'MEDIUM' : 'LOW'

    return {
      title: item.symbol,
      subtitle: `Qty: ${item.total_quantity}`,
      currentValue: `${TC.CURRENCY}${item.current_value.toLocaleString()}`,
      plAmount: `${item.pl >= 0 ? '+' : ''}${TC.CURRENCY}${item.pl.toLocaleString()}`,
      progress: progressByStatus[strength] ?? progress,
      isProfit,
      color: isProfit ? 'success' : 'error'
    }
  })

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        title='Recent Trades'
        subheader='Last 5 orders'
        titleTypographyProps={{ sx: { lineHeight: '1.6 !important', letterSpacing: '0.15px !important' } }}
      />

      <CardContent sx={{ pt: theme => `${theme.spacing(2)} !important` }}>
        {data.length === 0 ? (
          <Typography variant='caption' color='text.secondary'>
            {emptyMessage}
          </Typography>
        ) : (
          data.map((item: DataType, index: number) => {
            return (
              <Box
                key={`${item.title}-${index}`}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  ...(index !== data.length - 1 ? { mb: 8.5 } : {})
                }}
              >
                <Avatar
                  variant='rounded'
                  sx={{
                    mr: 3,
                    width: 40,
                    height: 40,
                    backgroundColor: theme => alpha(theme.palette.customColors.main, 0.04),
                    color: item.isProfit ? 'success.main' : 'error.main'
                  }}
                >
                  {item.isProfit ? <TrendingUpIcon fontSize='small' /> : <TrendingDownIcon fontSize='small' />}
                </Avatar>
                <Box
                  sx={{
                    width: '100%',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <Box sx={{ marginRight: 2, display: 'flex', flexDirection: 'column' }}>
                    <Typography variant='body2' sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                      {item.title}
                    </Typography>
                    <Typography variant='caption'>{item.subtitle}</Typography>
                  </Box>

                  <Box sx={{ minWidth: 120, display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5, gap: 1.5 }}>
                      <Typography variant='body2' sx={{ fontWeight: 600, color: 'text.primary' }}>
                        {item.currentValue}
                      </Typography>
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          mr: 1.5,
                          bgcolor: item.isProfit ? 'success.main' : 'error.main'
                        }}
                      />
                      <Typography variant='caption' sx={{ color: item.isProfit ? 'success.main' : 'error.main', fontWeight: 600 }}>
                        {item.plAmount}
                      </Typography>
                    </Box>
                    <LinearProgress color={item.color} value={item.progress} variant='determinate' />
                  </Box>
                </Box>
              </Box>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}

export default RecentTradesCard
