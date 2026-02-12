// ** MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Button from '@mui/material/Button'
import ButtonGroup from '@mui/material/ButtonGroup'
import { useTheme } from '@mui/material/styles'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'
import { useMemo, useState } from 'react'

// ** Third Party Imports
import { ApexOptions } from 'apexcharts'

// ** Custom Components Imports
import ReactApexcharts from 'src/@core/components/react-apexcharts'
import { Candles } from 'src/types/ws'

const StockGraph = (props: { candles: Candles[]; pln: number }) => {
  const theme = useTheme()
  const { candles } = props
  const [interval, setInterval] = useState<5 | 10 | 15 | 30 | 60>(5)

  const filteredCandles = useMemo(() => {
    const step = interval / 5
    if (!candles?.length || step <= 1) return candles

    return candles.filter((_, idx) => idx % step === 0)
  }, [candles, interval])

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
      data: filteredCandles.map((candle: Candles) => ({
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

        // action={
        //   <IconButton size='small' sx={{ color: 'text.secondary' }}>
        //     <DotsVertical />
        //   </IconButton>
        // }
      />

      <CardContent>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <ButtonGroup size='small' variant='outlined'>
            {[5, 10, 15, 30, 60].map(val => (
              <Button
                key={val}
                onClick={() => setInterval(val as 5 | 10 | 15 | 30 | 60)}
                variant={interval === val ? 'contained' : 'outlined'}
              >
                {val === 60 ? '1hr' : `${val}min`}
              </Button>
            ))}
          </ButtonGroup>
        </Box>
        <ReactApexcharts type='candlestick' height={280} options={options} series={series} />

        <Box sx={{ mt: 4, mb: 5, display: 'flex', alignItems: 'center' }}>
          <Typography variant='h6' color={props.pln > 0 ? 'green' : 'error'} sx={{ mr: 2 }}>
            {props.pln}
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Stock is trending {props.pln > 0 ? 'upward today 📈' : 'downward today'}  
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
