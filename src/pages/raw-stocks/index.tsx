// ** MUI Imports
import Grid from '@mui/material/Grid'
import Link from '@mui/material/Link'
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import CardHeader from '@mui/material/CardHeader'
import { Alert, AlertColor } from '@mui/material'

// ** Demo Components Imports
import RawStocksHeader from 'src/views/tables/RawStocks'
import axios from 'axios'
import { useEffect, useState } from 'react'
import { InputAdornment, Snackbar, TextField } from '@mui/material'
import { Magnify } from 'mdi-material-ui'
import DraggableDialog from 'src/views/modal/showStockOHCL'

interface StockData {
  symbol: string
  token: string
  exch_seg: string
  _id: string
  status: string
  name: string
}

interface checkRawStock {
  exchange: string
  tradingSymbol: string
  symbolToken: string
  ltp: number
  open: number
  high: number
  low: number
  close: number
}

function createData(
  name: string,
  symbol: string,
  token: string,
  exch_seg: string,
  _id: string,
  status: string
): StockData {
  return { name, symbol, token, exch_seg, _id, status }
}

const intialliveStockData = {
  open: false,
  name: '',
  data: []
}

// Define the type for the snackbar data
interface SnackbarData {
  open: boolean
  type: AlertColor // Restrict to 'error' | 'warning' | 'info' | 'success'
  message: string
}

const intialSnackbarData: SnackbarData = {
  open: false,
  type: 'success',
  message: ''
}

const baseUrl = 'http://localhost:8000/api/v1/admin'

const MUITable = () => {
  const [liveStock, setLiveStock] =
    useState<{ open: boolean; name: string; data: Array<checkRawStock> }>(intialliveStockData)
  const [searchValue, setSearchValue] = useState<string>('')
  const [reloadPageValue, setReloadPageValue] = useState<boolean>(false)
  const [rawStocksData, setRawStocksData] = useState<StockData[]>([])
  const [checkRawStockData, setCheckRawStockData] = useState<checkRawStock[]>([])
  const [stockId, setStockId] = useState<string>('')
  const [openSnacker, setOpenSnacker] = useState<SnackbarData>(intialSnackbarData)

  useEffect(() => {
    console.log('rawStocksData', rawStocksData)
  }, [rawStocksData])

  const handleClose = () => {
    setLiveStock(intialliveStockData)
  }

  const handleFilter = async () => {
    const res = await axios.get(`${baseUrl}/raw-stocks${searchValue ? `?search=${searchValue}` : ''}`)

    if (res.status === 200) {
      setRawStocksData(res.data.data)
      setReloadPageValue(v => !v)
    }
  }

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setSearchValue(value)
  }

  useEffect(() => {
    handleFilter()
  }, [])

  const handleStockCheck = async (_id: string, token: string, name: string) => {
    setStockId(_id)

    try {
      const body = {
        mode: 'OHLC',
        tokenIds: [token]
      }
      const res = await axios.post(`${baseUrl}/raw-stock-price`, body)
      console.log(res)
      setCheckRawStockData([res.data.data])
      setLiveStock({ open: true, name, data: res.data.data.data.fetched })
    } catch (error) {
      console.error(error)
    }
  }

  const handleAddLiveStock = async () => {
    const res = await axios
      .post(`${baseUrl}/stocks`, {
        rawStockId: stockId
      })
      .catch(err => err.response)

    if (res.status === 201) {
      setOpenSnacker({ open: true, type: 'success', message: 'Stock Added' })
      handleFilter()
    } else if (res.status === 409) {
      setOpenSnacker({ open: true, type: 'error', message: 'Stock already exists' })
    }
  }

  const handleUpdateStatus = async (status: string) => {
    const body = {
      rawStockId: stockId,
      status
    }
    const res = await axios.patch(`${baseUrl}/raw-stock/status`, body)

    if (res.status === 201) {
      setOpenSnacker({
        open: true,
        type: status === 'approved' ? 'success' : 'error',
        message: status === 'approved' ? 'Stock Added' : 'Stock Rejected'
      })
      handleFilter()
    } else if (res.status === 409) {
      setOpenSnacker({ open: true, type: 'error', message: 'Stock already exists' })
    }

    setLiveStock(intialliveStockData)
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
          onKeyPress={e => {
            if (e.key === 'Enter') {
              handleFilter()
            }
          }}
        />
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardHeader title='Raw Stocks' titleTypographyProps={{ variant: 'h6' }} />
          <RawStocksHeader
            reloadPageValue={reloadPageValue}
            rawStocksData={rawStocksData}
            handleStockCheck={handleStockCheck}
          />
        </Card>
      </Grid>
      {liveStock.open && (
        <DraggableDialog handleClose={handleClose} handleUpdateStatus={handleUpdateStatus} liveStock={liveStock} />
      )}
      <Snackbar
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        open={openSnacker.open}
        autoHideDuration={1200}
        onClose={() => setOpenSnacker(intialSnackbarData)}
      >
        <Alert severity={openSnacker.type} variant='filled' sx={{ width: '100%' }}>
          {openSnacker.message}
        </Alert>
      </Snackbar>
    </Grid>
  )
}

export default MUITable
