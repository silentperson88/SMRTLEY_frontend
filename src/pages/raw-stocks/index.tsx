// ** MUI Imports
import Grid from '@mui/material/Grid'
import Link from '@mui/material/Link'
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import CardHeader from '@mui/material/CardHeader'
import { Box, Button, LinearProgress } from '@mui/material'

// ** Demo Components Imports
import RawStocksHeader from 'src/views/tables/RawStocks'
import { useEffect, useState } from 'react'
import { InputAdornment, TextField } from '@mui/material'
import { Magnify } from 'mdi-material-ui'
import ReviewRawStock from 'src/views/modal/ReviewRawStock'
import { useMutationSWR, usePaginatedSWR, usePatchSWR } from 'src/hooks/swr/swrhooks'
import { ENDURL } from 'src/utils/constants/endurl.utils'
import { mutate } from 'swr'
import { useSnackbar } from 'src/layouts/components/SnackbarContext'
import { getErrorMessage } from 'src/api/axios/errorhandler'

interface StockData {
  symbol: string
  token: string
  exch_seg: string
  _id: string
  status: string
  name: string
  ltp?: number
  open?: number
  high?: number
  low?: number
  close?: number
  fetched?: boolean
}

interface rawStockPrice {
  exchange: string
  tradingSymbol: string
  symbolToken: string
  ltp: number
  open: number
  high: number
  low: number
  close: number
}

interface stockPriceResponse {
  data: {
    fetched: rawStockPrice[]
    unfetched: [{ message: string }]
  }
}

export interface reviewModal {
  open: boolean
  name: string
  data: rawStockPrice[]
  error: string
}

const intialliveStockData = {
  open: false,
  name: '',
  data: [],
  error: ''
}

interface updateStatusBody {
  rawStockId: string
  status: string
  screenerUrl?: string
}

const MUITable = () => {
  const page = 1
  const limit = 50
  const [openReviewModal, setOpenReviewModal] = useState<reviewModal>(intialliveStockData)
  const [stockId, setStockId] = useState<string>('')
  const [searchValue, setSearchValue] = useState<string>('')
  const { showSnackbar } = useSnackbar()
  const [stockList, setStockList] = useState<StockData[]>([])

  const { data, isLoading } = usePaginatedSWR<StockData[]>(ENDURL.GET_RAW_STOCKS, {
    page,
    limit,
    search: searchValue.length > 1 ? searchValue : ''
  })

  useEffect(() => {
    setStockList(data ?? [])
  }, [data])

  const { trigger: checkPrice, isMutating: isLoadingPrice } = useMutationSWR<
    stockPriceResponse,
    { mode: string; tokenIds: string[] }
  >(ENDURL.POST_RAW_STOCK_PRICE)

  const { trigger: patch, isMutating } = usePatchSWR<{ message: string }, updateStatusBody>(
    ENDURL.POST_RAW_STOCK_STATUS
  )

  const handleClose = () => setOpenReviewModal(intialliveStockData)

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setSearchValue(value)
  }

  const handleStockCheck = async (
    _id: string,
    token: string,
    name: string,
    exch_seg: string,
    fetched: boolean,
    ltp?: number,
    open?: number,
    high?: number,
    low?: number,
    close?: number
  ) => {
    if (fetched) {
      setOpenReviewModal({
        open: true,
        name,
        data: [
          {
            exchange: exch_seg,
            tradingSymbol: name,
            symbolToken: token,
            ltp: ltp || 0,
            open: open || 0,
            high: high || 0,
            low: low || 0,
            close: close || 0
          }
        ],
        error: ''
      })

      return
    }
    setStockId(_id)

    try {
      const body: { mode: string; tokenIds: [string]; exchange: string } = {
        mode: 'OHLC',
        tokenIds: [token],
        exchange: exch_seg
      }

      const res = await checkPrice(body)
      console.log(res)

      setOpenReviewModal({
        open: true,
        name,
        data: res.data.fetched.length > 0 ? res.data.fetched : [],
        error: res.data.unfetched[0]?.message
      })
    } catch (error) {
      console.error(error)
    }
  }

  const fetchPriceinBunch = async (exch_seg: string) => {
    try {
      const token = data?.filter(item => item.exch_seg === exch_seg) || []
      const body: { mode: string; tokenIds: string[]; exchange: string } = {
        mode: 'OHLC',
        tokenIds: token.map(item => item.token),
        exchange: exch_seg
      }

      const res = await checkPrice(body)

      // now add ltp, open, high, low, close in data array
      // stockList?.forEach(item => {
      //   const stock = res.data.fetched.find(stock => stock.tradingSymbol === item.symbol)
      //   if (stock) {
      //     item.ltp = stock.ltp
      //     item.open = stock.open
      //     item.high = stock.high
      //     item.low = stock.low
      //     item.close = stock.close
      //     item.fetched = true
      //   }
      // })
      setStockList((prevStockList: StockData[]) => {
        return prevStockList.map(item => {
          const stock = res.data.fetched.find(stock => stock.tradingSymbol === item.symbol)
          if (stock) {
            item.ltp = stock.ltp
            item.open = stock.open
            item.high = stock.high
            item.low = stock.low
            item.close = stock.close
            item.fetched = true
          }

          return item
        })
      })
      console.log(res)
    } catch (error) {
      console.error(error)
    }
  }

  const handleUpdateStatus = async (status: string, screenerUrl?: string) => {
    try {
      const body: updateStatusBody = {
        rawStockId: stockId,
        status,
        screenerUrl
      }
      await patch(body)

      setOpenReviewModal(intialliveStockData)

      showSnackbar('Status updated', 'success')

      // Manually revalidate GET only on success
      mutate([ENDURL.GET_RAW_STOCKS, { page, limit, search: searchValue }])
    } catch (err) {
      showSnackbar(getErrorMessage(err), 'error')
    }
  }

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Typography variant='h5'>
          <Link href='https://mui.com/components/tables/' target='_blank'>
            MUI Tables
          </Link>
        </Typography>
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
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            color='primary'
            variant='contained'
            sx={{ mr: 2 }}
            onClick={() => fetchPriceinBunch('NSE')}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'NSE'}
          </Button>
          <Button color='primary' variant='contained' disabled={isLoading} onClick={() => fetchPriceinBunch('BSE')}>
            {isLoading ? 'Loading...' : 'BSE'}
          </Button>
        </Box>
        <Card>
          <CardHeader title='Raw Stocks' titleTypographyProps={{ variant: 'h6' }} />

          {isLoading ? (
            <LinearProgress color='primary' />
          ) : (
            <RawStocksHeader
              rawStocksData={stockList ?? []}
              handleStockCheck={handleStockCheck}
              isPriceLoading={isLoadingPrice}
            />
          )}
        </Card>
      </Grid>
      {openReviewModal.open && (
        <ReviewRawStock
          handleClose={handleClose}
          handleUpdateStatus={handleUpdateStatus}
          liveStock={openReviewModal}
          isLoading={isMutating}
        />
      )}
    </Grid>
  )
}

export default MUITable
