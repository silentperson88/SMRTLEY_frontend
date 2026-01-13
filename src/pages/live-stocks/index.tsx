// ** MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import CardHeader from '@mui/material/CardHeader'

// ** Demo Components Imports
import LiveStocksTable from 'src/views/tables/LiveStocksTable'
import { useState } from 'react'
import { InputAdornment, TextField } from '@mui/material'
import { Magnify } from 'mdi-material-ui'
import { usePaginatedSWR } from 'src/hooks/swr/swrhooks'
import { ENDURL } from 'src/utils/constants/endurl.utils'

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

const LiveStocks = () => {
  const page = 1
  const pageSize = 50
  const [searchValue, setSearchValue] = useState<string>('')

  const { data } = usePaginatedSWR<StockData[]>(ENDURL.GET_ALL_ACTIVE_STOCKS, {
    page,
    pageSize,
    searchValue
  })

  // const [portfolioStock, setPortfolioStock] = useState<{ open: boolean; data: any; error: any }>(initialPortFolio)

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setSearchValue(value)
  }

  const handleOpen = (_id: string) => {
    console.log(_id, typeof _id)

    // setPortfolioStock({
    //   open: true,
    //   data: {
    //     liveStock: _id,
    //     atPrice: 0,
    //     quantity: 0,
    //     purchasedDate: new Date().toISOString().split('T')[0],
    //     type: ''
    //   },
    //   error: {}
    // })
  }

  // // const formValidation = () => {
  // //   const { data } = portfolioStock

  // //   const tempError: any = {}

  // //   if (data.atPrice === 0) tempError.atPrice = 'Required'

  // //   if (data.quantity === 0) tempError.quantity = 'Required'

  // //   if (data.type === '') tempError.type = 'Required'

  // //   if (data.purchasedDate === null) tempError.purchasedDate = 'Required'

  // //   setPortfolioStock({ ...portfolioStock, error: tempError })

  // //   return Object.keys(tempError).length === 0
  // // }

  // // const handleAddPortfolioStock = async () => {
  // //   console.log('here', portfolioStock)
  // //   if (!formValidation()) return
  // //   const res = await axios.post(`${baseUrl}/ps`, portfolioStock.data)
  // //   console.log(res)
  // //   if (res.status === 201) {
  // //     setPortfolioStock(initialPortFolio)
  // //     setOpenSnacker({ open: true, type: 'success', message: 'Stock Added' })
  // //   }
  // // }

  // const handlePortfolioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   console.log(e)
  //   const { name, value } = e.target
  //   if ((name === 'atPrice' || name === 'quantity') && parseFloat(value) < 0) return

  //   setPortfolioStock({ ...portfolioStock, data: { ...portfolioStock.data, [name]: value } })
  // }

  // const handleTypeChange = (event: SelectChangeEvent) => {
  //   console.log('event.target.value', event.target.value)
  //   setPortfolioStock({ ...portfolioStock, data: { ...portfolioStock.data, type: event.target.value } })
  // }

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

          // onKeyPress={e => {
          //   if (e.key === 'Enter') {
          //     setPage(1)
          //   }
          // }}
        />
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardHeader title='Live Stocks' titleTypographyProps={{ variant: 'h6' }} />
          <LiveStocksTable rawStocksData={data ?? []} handleOpen={handleOpen} />
          {/* <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <Pagination
              count={Math.max(1, Math.ceil((data?.length ?? 0) / pageSize))}
              page={page}
              onChange={(_, value) => setPage(value)}
              color='primary'
            />
          </Box> */}
        </Card>
      </Grid>

      {/* {portfolioStock.open && (
        <AddStockToPortfolio
          handleClose={handleClose}
          handleAdd={handleAddPortfolioStock}
          handleChange={handlePortfolioChange}
          handleTypeChange={handleTypeChange}
          portfolioStock={portfolioStock}
        />
      )} */}
    </Grid>
  )
}

export default LiveStocks
