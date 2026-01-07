// ** MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import CardHeader from '@mui/material/CardHeader'

// ** Demo Components Imports
import LiveStocksTable from 'src/views/tables/LiveStocksTable'
import axios from 'axios'
import { useEffect, useState } from 'react'
import { Alert, InputAdornment, SelectChangeEvent, Snackbar, TextField } from '@mui/material'
import { Magnify } from 'mdi-material-ui'
import AddStockToPortfolio from 'src/views/modal/AddStockToPortfolio'

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
  status: string
): StockData {
  return { name, symbol, token, exchange, ltp, open, high, low, close, percentChange, _id, status }
}

const intialSnackbarData = {
  open: false,
  type: '',
  message: ''
}

const protfolioForm = {
  liveStock: '',
  atPrice: 0,
  quantity: 0,
  purchasedDate: '',
  type: ''
}

const initialPortFolio = {
  open: false,
  data: protfolioForm,
  error: {}
}

const baseUrl = 'http://localhost:8000/api'

const LiveStocks = () => {
  console.log('here')
  const [searchValue, setSearchValue] = useState<string>('')
  const [rawStocksData, setRawStocksData] = useState<StockData[]>([])
  const [openSnacker, setOpenSnacker] = useState<{ open: boolean; type: string; message: string }>(intialSnackbarData)
  const [portfolioStock, setPortfolioStock] = useState<{ open: boolean; data: any; error: any }>(initialPortFolio)

  const handleFilter = async () => {
    const res = await axios.get(`${baseUrl}/live-stocks${searchValue && `?search=${searchValue}`}`)
    console.log(res)
    if (res.status === 200) {
      const rawData: StockData[] = res.data.data.map(
        ({ name, symbol, token, exchange, ltp, open, high, low, close, percentChange, _id, status }: StockData) =>
          createData(name, symbol, token, exchange, ltp, open, high, low, close, percentChange, _id, status)
      )
      console.log('rawData', rawData)
      setRawStocksData(rawData)
    }
  }

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setSearchValue(value)
  }

  useEffect(() => {
    handleFilter()
  }, [])

  const handleClose = () => {
    setPortfolioStock(initialPortFolio)
  }

  const handleOpen = (_id: string) => {
    console.log(_id, typeof _id)
    setPortfolioStock({
      open: true,
      data: {
        liveStock: _id,
        atPrice: 0,
        quantity: 0,
        purchasedDate: new Date().toISOString().split('T')[0],
        type: ''
      },
      error: {}
    })
  }

  const formValidation = () => {
    const { data } = portfolioStock

    const tempError: any = {}

    if (data.atPrice === 0) tempError.atPrice = 'Required'

    if (data.quantity === 0) tempError.quantity = 'Required'

    if (data.type === '') tempError.type = 'Required'

    if (data.purchasedDate === null) tempError.purchasedDate = 'Required'

    setPortfolioStock({ ...portfolioStock, error: tempError })

    return Object.keys(tempError).length === 0
  }

  const handleAddPortfolioStock = async () => {
    console.log('here', portfolioStock)
    if (!formValidation()) return
    const res = await axios.post(`${baseUrl}/ps`, portfolioStock.data)
    console.log(res)
    if (res.status === 201) {
      setPortfolioStock(initialPortFolio)
      setOpenSnacker({ open: true, type: 'success', message: 'Stock Added' })
    }
  }

  const handlePortfolioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log(e)
    const { name, value } = e.target
    if ((name === 'atPrice' || name === 'quantity') && parseFloat(value) < 0) return

    setPortfolioStock({ ...portfolioStock, data: { ...portfolioStock.data, [name]: value } })
  }

  const handleTypeChange = (event: SelectChangeEvent) => {
    console.log('event.target.value', event.target.value)
    setPortfolioStock({ ...portfolioStock, data: { ...portfolioStock.data, type: event.target.value } })
  }

  useEffect(() => {
    console.log(portfolioStock)
  }, [portfolioStock])

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
          <LiveStocksTable rawStocksData={rawStocksData} handleOpen={handleOpen} />
        </Card>
      </Grid>

      {portfolioStock.open && (
        <AddStockToPortfolio
          handleClose={handleClose}
          handleAdd={handleAddPortfolioStock}
          handleChange={handlePortfolioChange}
          handleTypeChange={handleTypeChange}
          portfolioStock={portfolioStock}
        />
      )}

      <Snackbar
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        open={openSnacker.open}
        autoHideDuration={1200}
        onClose={() => setOpenSnacker(intialSnackbarData)}
      >
        <Alert severity='success' variant='filled' sx={{ width: '100%' }}>
          {openSnacker.message}
        </Alert>
      </Snackbar>
    </Grid>
  )
}

export default LiveStocks
