// ** MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import CardHeader from '@mui/material/CardHeader'

// ** Demo Components Imports
import LiveStocksTable from 'src/views/tables/LiveStocksTable'
import { useEffect, useRef, useState } from 'react'
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, InputAdornment, LinearProgress, TextField } from '@mui/material'
import { Magnify } from 'mdi-material-ui'
import { useMutationSWR, usePaginatedSWR } from 'src/hooks/swr/swrhooks'
import { ENDURL } from 'src/utils/constants/endurl.utils'
import { useSnackbar } from 'src/layouts/components/SnackbarContext'
import { mutate } from 'swr'
import { useRouter } from 'next/router'
import MarketOverviewBanner from 'src/components/page/MarketOverviewBanner'
import { useDebounce } from 'src/utils/useDebounce'
import { useAppDispatch, useAppSelector } from 'src/store/hooks'
import { setLiveStocksSnapshot } from 'src/store/slices/liveStocks.slice'

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
  id: string
  status: string
  name: string
  hasHistoryData?: boolean
  historyDataFromDate?: string | null
  historyDataToDate?: string | null
}

interface FetchEodResponse {
  count: number
}

const LiveStocks = () => {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const liveStocksCache = useAppSelector(state => state.liveStocks)
  const pageSize = 50
  const getSafeNextPage = (stocksCount: number) => Math.max(1, Math.floor(stocksCount / pageSize) + 1)
  const [apiPage, setApiPage] = useState<number>(getSafeNextPage(Array.isArray(liveStocksCache.stocks) ? liveStocksCache.stocks.length : 0))
  const [allStocks, setAllStocks] = useState<StockData[]>(
    liveStocksCache.searchKey === '' ? (liveStocksCache.stocks as StockData[]) : []
  )
  const [hasMore, setHasMore] = useState<boolean>(liveStocksCache.hasMore)
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false)
  const [searchValue, setSearchValue] = useState<string>('')
  const debouncedSearchValue = useDebounce(searchValue, 400)
  const lastHydratedSearchRef = useRef<string | null>(null)
  const [historyForm, setHistoryForm] = useState<{
    open: boolean
    masterId: string
    stockName: string
    fromDate: string
    toDate: string
  }>({
    open: false,
    masterId: '',
    stockName: '',
    fromDate: '2007-01-01',
    toDate: new Date().toISOString().slice(0, 10)
  })
  const { showSnackbar } = useSnackbar()

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.removeItem('run4dream-live-stocks-cache')
  }, [])

  const { data: apiData, isLoading } = usePaginatedSWR<StockData[]>(ENDURL.GET_ALL_ACTIVE_STOCKS, {
    page: apiPage,
    pageSize,
    search: debouncedSearchValue,
    debounceMs: 0
  })

  useEffect(() => {
    if (!apiData) return

    const currentStocks = allStocks
    const nextStocks =
      apiPage === 1
        ? apiData
        : (() => {
            const existing = new Set(currentStocks.map(item => String(item.id)))
            const next = [...currentStocks]
            for (const row of apiData) {
              const key = String(row.id)
              if (!existing.has(key)) {
                next.push(row)
                existing.add(key)
              }
            }
            return next
          })()

    setAllStocks(nextStocks)

    setHasMore(apiData.length === pageSize)
    dispatch(
      setLiveStocksSnapshot({
        searchKey: debouncedSearchValue,
        stocks: nextStocks,
        nextPage: apiData.length === pageSize ? apiPage + 1 : apiPage,
        hasMore: apiData.length === pageSize
      })
    )
    setIsLoadingMore(false)
  }, [apiData, apiPage, pageSize, debouncedSearchValue, dispatch])

  const { trigger: triggerEodFetch } = useMutationSWR<
    FetchEodResponse,
    { master_id: string; fromDate: string; toDate: string }
  >(ENDURL.FETCH_EOD_BY_RANGE_CHUNKED)

  // const [portfolioStock, setPortfolioStock] = useState<{ open: boolean; data: any; error: any }>(initialPortFolio)

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setSearchValue(value)
  }

  useEffect(() => {
    if (lastHydratedSearchRef.current === debouncedSearchValue) {
      return
    }

    lastHydratedSearchRef.current = debouncedSearchValue

    const cacheMatchesSearch = liveStocksCache.searchKey === debouncedSearchValue
    const cachedStocks = Array.isArray(liveStocksCache.stocks) ? (liveStocksCache.stocks as StockData[]) : []

    if (cacheMatchesSearch) {
      const safeNextPage = getSafeNextPage(cachedStocks.length)
      setApiPage(safeNextPage)
      setAllStocks(cachedStocks)
      setHasMore(liveStocksCache.hasMore)
    } else {
      setApiPage(1)
      setAllStocks([])
      setHasMore(true)
    }

    setIsLoadingMore(false)
  }, [debouncedSearchValue])

  const handleFetchNextPage = () => {
    if (isLoading || isLoadingMore || !hasMore) return
    setIsLoadingMore(true)
    setApiPage(prev => prev + 1)
  }

  const handleOpenHistoryForm = (id: string, stockName: string) => {
    setHistoryForm({
      open: true,
      masterId: id,
      stockName,
      fromDate: '2007-01-01',
      toDate: new Date().toISOString().slice(0, 10)
    })
  }

  const handleViewEod = (id: string) => {
    router.push(`/eod-graph?master_id=${id}`)
  }

  const handleCloseHistoryForm = () => {
    setHistoryForm(prev => ({ ...prev, open: false }))
  }

  const handleHistoryDateChange = (field: 'fromDate' | 'toDate', value: string) => {
    setHistoryForm(prev => ({ ...prev, [field]: value }))
  }

  const handleContinueHistoryFetch = async () => {
    const { masterId, fromDate, toDate } = historyForm
    if (!masterId) return
    if (!fromDate || !toDate) {
      showSnackbar('Please select both from and to dates', 'error')
      return
    }
    if (fromDate > toDate) {
      showSnackbar('From date must be before or equal to to date', 'error')
      return
    }

    const res = await triggerEodFetch({ master_id: masterId, fromDate, toDate })
    showSnackbar(`EOD fetched: ${res?.count || 0} candles`, 'success')
    handleCloseHistoryForm()
    mutate([ENDURL.GET_ALL_ACTIVE_STOCKS, { page: 1, pageSize, search: debouncedSearchValue }])
  }

  const mergedStocksData = allStocks ?? []

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <MarketOverviewBanner
          trackedCount={mergedStocksData.length}
          scopeLabel={searchValue ? 'Filtered' : 'All'}
          onPrimaryAction={() => router.push('/portfolio-stocks')}
        />
      </Grid>
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
          {isLoading && !allStocks.length ? (
            <LinearProgress color='primary' />
          ) : (
            <>
              {(isLoading || isLoadingMore) && <LinearProgress color='primary' />}
              <LiveStocksTable
                rawStocksData={mergedStocksData ?? []}
                handleFetchHistory={handleOpenHistoryForm}
                handleViewEod={handleViewEod}
                hasMore={hasMore}
                isLoadingMore={isLoadingMore}
                onReachEnd={handleFetchNextPage}
              />
            </>
          )}
        </Card>
      </Grid>

      <Dialog open={historyForm.open} onClose={handleCloseHistoryForm} fullWidth maxWidth='xs'>
        <DialogTitle>Fetch EOD History</DialogTitle>
        <DialogContent>
          <TextField
            margin='dense'
            label='Stock'
            fullWidth
            value={historyForm.stockName}
            InputProps={{ readOnly: true }}
          />
          <TextField
            margin='dense'
            label='From Date'
            type='date'
            fullWidth
            value={historyForm.fromDate}
            onChange={e => handleHistoryDateChange('fromDate', e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            margin='dense'
            label='To Date'
            type='date'
            fullWidth
            value={historyForm.toDate}
            onChange={e => handleHistoryDateChange('toDate', e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseHistoryForm} color='inherit'>
            Cancel
          </Button>
          <Button onClick={handleContinueHistoryFetch} variant='contained'>
            Continue
          </Button>
        </DialogActions>
      </Dialog>

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
