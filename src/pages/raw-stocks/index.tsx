// ** MUI Imports
import Grid from '@mui/material/Grid'
import Link from '@mui/material/Link'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import CardHeader from '@mui/material/CardHeader'
import { LinearProgress, Divider, MenuItem, Button } from '@mui/material'

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

interface createRawStockBody {
  token: string
  symbol: string
  name: string
  exchange: string
  instrumenttype: string
  lotsize: number
  tick_size?: number | null
}

const MUITable = () => {
  const page = 1
  const limit = 50
  const [openReviewModal, setOpenReviewModal] = useState<reviewModal>(intialliveStockData)
  const [stockId, setStockId] = useState<string>('')
  const [searchValue, setSearchValue] = useState<string>('')
  const [newRawStock, setNewRawStock] = useState<createRawStockBody>({
    token: '',
    symbol: '',
    name: '',
    exchange: 'NSE',
    instrumenttype: 'EQ',
    lotsize: 1,
    tick_size: null
  })
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
  const { trigger: createRawStock, isMutating: isCreating } = useMutationSWR<{ message: string }, createRawStockBody>(
    ENDURL.POST_RAW_STOCK
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

  const handleNewRawStockChange = (field: keyof createRawStockBody) => (event: any) => {
    const value = field === 'lotsize' ? Number(event.target.value) : event.target.value

    setNewRawStock(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleCreateRawStock = async () => {
    try {
      await createRawStock(newRawStock)
      showSnackbar('Raw stock created successfully', 'success')
      setNewRawStock({
        token: '',
        symbol: '',
        name: '',
        exchange: 'NSE',
        instrumenttype: 'EQ',
        lotsize: 1,
        tick_size: null
      })
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
        <Card sx={{ mb: 4 }}>
          <CardHeader title='Add Raw Stock' titleTypographyProps={{ variant: 'h6' }} />
          <Divider />
          <CardContent>
            <Grid container spacing={4}>
              <Grid item xs={12} md={2}>
                <TextField
                  fullWidth
                  label='Token'
                  value={newRawStock.token}
                  onChange={handleNewRawStockChange('token')}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField
                  fullWidth
                  label='Symbol'
                  value={newRawStock.symbol}
                  onChange={handleNewRawStockChange('symbol')}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField
                  fullWidth
                  label='Name'
                  value={newRawStock.name}
                  onChange={handleNewRawStockChange('name')}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField
                  select
                  fullWidth
                  label='Exchange'
                  value={newRawStock.exchange}
                  onChange={handleNewRawStockChange('exchange')}
                >
                  <MenuItem value='NSE'>NSE</MenuItem>
                  <MenuItem value='BSE'>BSE</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField
                  select
                  fullWidth
                  label='Instrument Type'
                  value={newRawStock.instrumenttype}
                  onChange={handleNewRawStockChange('instrumenttype')}
                >
                  <MenuItem value='EQ'>EQ</MenuItem>
                  <MenuItem value='BE'>BE</MenuItem>
                  <MenuItem value='SM'>SM</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField
                  fullWidth
                  type='number'
                  label='Lot'
                  value={newRawStock.lotsize}
                  onChange={handleNewRawStockChange('lotsize')}
                />
              </Grid>
              <Grid item xs={12} md={12}>
                <Button variant='contained' onClick={handleCreateRawStock} disabled={isCreating}>
                  {isCreating ? 'Saving...' : 'Add Raw Stock'}
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

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
