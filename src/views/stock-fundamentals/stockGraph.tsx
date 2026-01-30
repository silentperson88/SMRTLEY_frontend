// ** MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Button from '@mui/material/Button'
import { useTheme } from '@mui/material/styles'
import CardHeader from '@mui/material/CardHeader'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'

// ** Icons Imports
import DotsVertical from 'mdi-material-ui/DotsVertical'

// ** Third Party Imports
import { ApexOptions } from 'apexcharts'

// ** Custom Components Imports
import ReactApexcharts from 'src/@core/components/react-apexcharts'
import { Candles } from 'src/types/ws'

const StockGraph = (props: { candles: Candles[] }) => {
  const theme = useTheme()
  const { candles } = props

  /* ------------------ Dummy Candle Data ------------------ */
  const series = [
    {
      name: 'Price',

      //   data: [
      //     { x: '2024-01-01', y: [120, 135, 115, 130] },
      //     { x: '2024-01-02', y: [130, 142, 125, 138] },
      //     { x: '2024-01-03', y: [138, 145, 132, 140] },
      //     { x: '2024-01-04', y: [140, 150, 138, 148] },
      //     { x: '2024-01-05', y: [148, 155, 140, 142] },
      //     { x: '2024-01-06', y: [142, 146, 135, 138] },
      //     { x: '2024-01-07', y: [138, 144, 130, 140] }
      //   ]
      data: candles.map((candle: Candles) => ({
        x: new Date(candle.t).getHours() + ':' + new Date(candle.t).getMinutes(),
        y: [candle.o, candle.h, candle.l, candle.c]
      }))
    }
  ]

  /* ------------------ Chart Options ------------------ */
  const options: ApexOptions = {
    chart: {
      type: 'candlestick',
      height: 300,
      toolbar: { show: false },
      parentHeightOffset: 0
    },
    plotOptions: {
      candlestick: {
        colors: {
          upward: theme.palette.success.main,
          downward: theme.palette.error.main
        },
        wick: {
          useFillColor: true
        }
      }
    },
    grid: {
      strokeDashArray: 6,
      borderColor: theme.palette.divider
    },
    xaxis: {
      type: 'category',
      labels: {
        style: {
          colors: theme.palette.text.secondary
        }
      }
    },
    yaxis: {
      tooltip: { enabled: true },
      labels: {
        style: {
          colors: theme.palette.text.secondary
        }
      }
    },
    tooltip: {
      theme: theme.palette.mode
    }
  }

  return (
    <Card>
      <CardHeader
        title='Price Movement'
        titleTypographyProps={{
          sx: { lineHeight: '2rem !important', letterSpacing: '0.15px !important' }
        }}
        action={
          <IconButton size='small' sx={{ color: 'text.secondary' }}>
            <DotsVertical />
          </IconButton>
        }
      />

      <CardContent>
        <ReactApexcharts type='candlestick' height={280} options={options} series={series} />

        <Box sx={{ mt: 4, mb: 5, display: 'flex', alignItems: 'center' }}>
          <Typography variant='h6' sx={{ mr: 2 }}>
            +6.4%
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Stock is trending upward this week 📈
          </Typography>
        </Box>

        <Button fullWidth variant='contained'>
          View Details
        </Button>
      </CardContent>
    </Card>
  )
}

export default StockGraph
