// ** MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import CardHeader from '@mui/material/CardHeader'

// ** Demo Components Imports
import PorfolioStocksTable from 'src/views/tables/PorfolioStocksTable'
import axios from 'axios'
import { useEffect, useState } from 'react'
import { Alert, InputAdornment, Snackbar, TextField } from '@mui/material'
import { Magnify } from 'mdi-material-ui'

interface StockData {
  symbol: string
  token: string
  exchange: string
  ltp: number
  open: number
  high: number
  low: number
  close: number
  percentChange: number
  _id: string
  status: string
  name: string
  atPrice: number
  purchasedDate: string | null
  quantity: number
  type: string
}

function createData(
  name: string,
  symbol: string,
  token: string,
  exchange: string,
  ltp: number,
  open: number,
  high: number,
  low: number,
  close: number,
  percentChange: number,
  _id: string,
  status: string,
  atPrice: number,
  purchasedDate: string | null,
  quantity: number,
  type: string
): StockData {
  return {
    name,
    symbol,
    token,
    exchange,
    ltp,
    open,
    high,
    low,
    close,
    percentChange,
    _id,
    status,
    atPrice,
    purchasedDate,
    quantity,
    type
  }
}

const initialSnackbarData = {
  open: false,
  message: ''
}

const baseUrl = 'http://localhost:8000/api'

const LiveStocks = () => {
  const [searchValue, setSearchValue] = useState<string>('')
  const [rawStocksData, setRawStocksData] = useState<StockData[]>([])
  const [openSnacker, setOpenSnacker] = useState<{ open: boolean; message: string }>(initialSnackbarData)

  const handleFilter = async () => {
    try {
      const res = await axios.get(`${baseUrl}/ps${searchValue ? `?search=${searchValue}` : ''}`)
      if (res.status === 200) {
        const rawData: StockData[] = res.data.data.flatMap((item: any) =>
          item.liveStock.map((stock: any) =>
            createData(
              stock.name,
              stock.symbol,
              stock.token,
              stock.exchange,
              stock.ltp,
              stock.open,
              stock.high,
              stock.low,
              stock.close,
              stock.percentChange,
              stock._id,
              item.type, // Assuming `type` comes from the parent object
              item.atPrice, // New field
              item.purchasedDate, // New field
              item.quantity, // New field
              item.type // New field (buy/sell type)
            )
          )
        )
        setRawStocksData(rawData)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setSearchValue(value)
  }

  useEffect(() => {
    handleFilter()
  }, [])

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Typography variant='body2'>Search by name, symbol, token</Typography>
        <TextField
          size='small'
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 4 } }}
          value={searchValue}
          onChange={handleSearch}
          InputProps={{
            startAdornment: (
              <InputAdornment position='start'>
                <Magnify fontSize='small' />
              </InputAdornment>
            )
          }}
          onKeyPress={e => {
            if (e.key === 'Enter') {
              handleFilter()
            }
          }}
        />
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardHeader title='Live Stocks' titleTypographyProps={{ variant: 'h6' }} />
          <PorfolioStocksTable rawStocksData={rawStocksData} />
        </Card>
      </Grid>
      <Snackbar
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        open={openSnacker.open}
        autoHideDuration={1200}
        onClose={() => setOpenSnacker(initialSnackbarData)}
      >
        <Alert severity='success' variant='filled' sx={{ width: '100%' }}>
          {openSnacker.message}
        </Alert>
      </Snackbar>
    </Grid>
  )
}

export default LiveStocks
