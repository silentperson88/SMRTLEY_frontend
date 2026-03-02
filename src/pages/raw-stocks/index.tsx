// ** MUI Imports
import Grid from '@mui/material/Grid'
import Link from '@mui/material/Link'
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import CardHeader from '@mui/material/CardHeader'
import { LinearProgress } from '@mui/material'

// ** Demo Components Imports
import RawStocksHeader from 'src/views/tables/RawStocks'
import { useState } from 'react'
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
  id: string
  status: string
  name: string
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

  const { data, isLoading } = usePaginatedSWR<StockData[]>(ENDURL.GET_RAW_STOCKS, {
    page,
    limit,
    search: searchValue.length > 1 ? searchValue : ''
  })

  const { trigger: checkPrice } = useMutationSWR<stockPriceResponse, { mode: string; tokenIds: [string] }>(
    ENDURL.POST_RAW_STOCK_PRICE
  )

  const { trigger: patch, isMutating } = usePatchSWR<{ message: string }, updateStatusBody>(
    ENDURL.POST_RAW_STOCK_STATUS
  )

  const handleClose = () => setOpenReviewModal(intialliveStockData)

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setSearchValue(value)
  }

  const handleStockCheck = async (id: string, token: string, name: string, exch_seg: string) => {
    setStockId(id)

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
        <Card>
          <CardHeader title='Raw Stocks' titleTypographyProps={{ variant: 'h6' }} />
          {isLoading ? (
            <LinearProgress color='primary' />
          ) : (
            <RawStocksHeader rawStocksData={data ?? []} handleStockCheck={handleStockCheck} />
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
