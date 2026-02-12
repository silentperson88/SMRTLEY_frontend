// ** MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import { useTheme } from '@mui/material/styles'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'

// ** Third Party Imports
import { ApexOptions } from 'apexcharts'

// ** Custom Components Imports
import ReactApexcharts from 'src/@core/components/react-apexcharts'
import { TC } from 'src/utils/constants/text.constants'

interface PortfolioPerformanceItem {
  portfolio_id: string
  portfolio_name: string
  invested_value: number
  current_value: number
  available_fund: number
  locked_fund: number
  total_fund: number
  unrealized_pl: number
  realized_pl: number
  pl: number
}

const PortfolioOverview = ({
  portfolios,
  emptyMessage
}: {
  portfolios: PortfolioPerformanceItem[]
  emptyMessage?: string
}) => {
  // ** Hook
  const theme = useTheme()

  const categories = (portfolios || []).map(item => item.portfolio_name)
  const totalPortfolioValue = (portfolios || []).reduce((sum, item) => sum + item.total_fund, 0)
  const totalFundSeriesData = (portfolios || []).map(item => item.total_fund)
  const investedSeriesData = (portfolios || []).map(item => item.invested_value)
  const plSeriesData = (portfolios || []).map(item => item.pl)
  const hasNegativePl = plSeriesData.some(value => value < 0)

  const options: ApexOptions = {
    chart: {
      parentHeightOffset: 0,
      toolbar: { show: false }
    },
    tooltip: {
      y: {
        formatter: value => `${TC.CURRENCY} ${Number(value || 0).toLocaleString()}`
      }
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '58%',
        borderRadius: 4
      }
    },
    stroke: { width: 0 },
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'left'
    },
    grid: {
      strokeDashArray: 7,
      padding: {
        top: -1,
        right: 0,
        left: 0,
        bottom: 5
      }
    },
    dataLabels: { enabled: false },
    colors: [theme.palette.primary.main, theme.palette.info.main, hasNegativePl ? theme.palette.error.main : theme.palette.success.main],
    states: {
      hover: {
        filter: { type: 'none' }
      },
      active: {
        filter: { type: 'none' }
      }
    },
    xaxis: {
      categories,
      labels: {
        show: true,
        rotate: -15,
        rotateAlways: false,
        trim: true
      },
      axisTicks: { show: false }
    },
    yaxis: {
      show: true,
      tickAmount: 4,
      labels: {
        offsetX: -8,
        formatter: value => `${TC.CURRENCY} ${Number(value).toLocaleString()}`
      }
    }
  }

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        title='Portfolio Overview'
        titleTypographyProps={{
          sx: { lineHeight: '2rem !important', letterSpacing: '0.15px !important' }
        }}
      />
      <CardContent sx={{ '& .apexcharts-xcrosshairs.apexcharts-active': { opacity: 0 }, height: '100%' }}>
        <Box sx={{ mb: 7, display: 'flex', alignItems: 'center' }}>
          <Typography variant='h5' sx={{ mr: 4 }}>
            {TC.CURRENCY}{totalPortfolioValue.toLocaleString()}
          </Typography>
          <Typography variant='body2'>Total funds across portfolios</Typography>
        </Box>

        {portfolios.length === 0 ? (
          <Typography
            variant='caption'
            color='text.secondary'
            sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
          >
            {emptyMessage}
          </Typography>
        ) : (
          <ReactApexcharts
            type='bar'
            height={270}
            options={options}
            series={[
              { name: 'Total Fund', data: totalFundSeriesData },
              { name: 'Invested Value', data: investedSeriesData },
              { name: 'P/L', data: plSeriesData }
            ]}
          />
        )}
      </CardContent>
    </Card>
  )
}

export default PortfolioOverview
