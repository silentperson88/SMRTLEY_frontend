// ** MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import CardHeader from '@mui/material/CardHeader'

// ** Demo Components Imports
import LiveStocksTable from 'src/views/tables/LiveStocksTable'
import { useEffect, useState } from 'react'
import { InputAdornment, LinearProgress, TextField } from '@mui/material'
import { Magnify } from 'mdi-material-ui'
import { useMutationSWR, usePaginatedSWR } from 'src/hooks/swr/swrhooks'
import { ENDURL } from 'src/utils/constants/endurl.utils'
import { useLivePrices } from 'src/hooks/socket/useLivePrice'
import { useSnackbar } from 'src/layouts/components/SnackbarContext'
import { mutate } from 'swr'

interface StockData {
  master_id?: string
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

interface FetchFundaMentalResponse {
  isSussess: boolean
}

const LiveStocks = () => {
  const page = 1
  const pageSize = 50
  const [searchValue, setSearchValue] = useState<string>('')
  const { showSnackbar } = useSnackbar()

  const { data: apiData, isLoading } = usePaginatedSWR<StockData[]>(ENDURL.GET_ALL_ACTIVE_STOCKS, {
    page,
    pageSize,
    searchValue
  })

  const { trigger } = useMutationSWR<FetchFundaMentalResponse, { master_id: string }>(ENDURL.Fetch_STOCK_FUNDAMENTAL)

  // Get live prices and merged data from websocket hook
  const liveStocksData = useLivePrices(apiData?.flatMap(item => item.symbol) ?? [])

  useEffect(() => {
    console.log('Live Stocks Data Updated:', liveStocksData, apiData)
  }, [liveStocksData, apiData])

  // const [portfolioStock, setPortfolioStock] = useState<{ open: boolean; data: any; error: any }>(initialPortFolio)

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setSearchValue(value)
  }

  const handleFetchfundamental = async (_id: string) => {
    console.log(_id)
    if (_id) {
      const res = await trigger({ master_id: _id })
      console.log(res)
      showSnackbar('Status updated', 'success')
      mutate([ENDURL.GET_RAW_STOCKS, { page, pageSize, search: searchValue }])
    }
  }

  const mergedStocksData =
    apiData?.map(stock => {
      const live = liveStocksData[stock.symbol]

      if (!live) return stock

      return {
        ...stock,
        ltp: live.ltp ?? stock.ltp,
        open: live.open ?? stock.open,
        high: live.high ?? stock.high,
        low: live.low ?? stock.low,
        close: live.close ?? stock.close,
        percentChange: live.open ? ((live.ltp - live.open) / live.open) * 100 : stock.percentChange
      }
    }) ?? []

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
        />
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardHeader title='Live Stocks' titleTypographyProps={{ variant: 'h6' }} />
          {isLoading ? (
            <LinearProgress color='primary' />
          ) : (
            <LiveStocksTable rawStocksData={mergedStocksData ?? []} handleFetchfundamental={handleFetchfundamental} />
          )}
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
