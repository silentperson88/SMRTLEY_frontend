import React, { useState, ChangeEvent, useMemo } from 'react'
import Paper from '@mui/material/Paper'
import Table from '@mui/material/Table'
import TableRow from '@mui/material/TableRow'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TablePagination from '@mui/material/TablePagination'
import { Box, Typography } from '@mui/material'
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee'

interface Column {
  id: 'srNo' | 'name' | 'ltp' | 'OHLC' | 'atPrice' | 'quantity' | 'status' | 'STCG' | 'LTCG'
  label: string
  minWidth?: number
  align?: 'left' | 'right' | 'center'
}

const columns: readonly Column[] = [
  { id: 'srNo', label: 'Sr. No.' },
  { id: 'name', label: 'Name', align: 'left', minWidth: 140 },
  { id: 'ltp', label: 'LTP', align: 'center' },
  { id: 'OHLC', label: 'OHLC', align: 'center' },
  { id: 'atPrice', label: 'At Price', align: 'center' },
  { id: 'quantity', label: 'Quantity', align: 'left' },
  { id: 'status', label: 'Status', minWidth: 200, align: 'left' },
  { id: 'STCG', label: 'STCG (T20%|E80%)', minWidth: 200, align: 'center' },
  { id: 'LTCG', label: 'LTCG (T12.5%|E87.5%)', minWidth: 200, align: 'center' }
]

interface Data {
  name: string
  symbol: string
  token: string
  exchange: string
  ltp: number
  open: number
  high: number
  low: number
  close: number
  percentChange: number
  status: string
  atPrice: number
  purchasedDate: string | null
  quantity: number
  type: string
}

interface RawFormat {
  srNo: JSX.Element
  name: JSX.Element
  ltp: JSX.Element
  OHLC: JSX.Element
  status: JSX.Element
  atPrice: JSX.Element
  quantity: JSX.Element
  STCG: JSX.Element
  LTCG: JSX.Element
}

const TableStickyHeader = ({ rawStocksData }: { rawStocksData: Data[] }) => {
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const calculateDateDifference = (purchasedDate: string | null) => {
    if (!purchasedDate) return null
    const purchaseDate = new Date(purchasedDate)
    const currentDate = new Date()

    return Math.floor((currentDate.getTime() - purchaseDate.getTime()) / (1000 * 3600 * 24)) // convert milliseconds to days
  }

  const formatRow = (stock: Data, index: number): RawFormat => {
    const {
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
      atPrice,
      purchasedDate,
      quantity,
      type
    } = stock
    const dateDifference = calculateDateDifference(purchasedDate)
    const capitalGain = quantity * ltp - quantity * atPrice
    const isSTCG = dateDifference !== null && dateDifference < 366
    const isLTCG = dateDifference !== null && dateDifference >= 366

    const formatGain = (gain: number, taxRate: number, exemptRate: number) => (
      <Typography>
        {`(T${((gain * taxRate) / 100).toFixed(2)} | E ${((gain * exemptRate) / 100).toFixed(2)})`}
      </Typography>
    )

    return {
      srNo: <Typography>{index + 1}</Typography>,
      name: (
        <Box display='flex' flexDirection='column' alignItems='start'>
          <Typography>{`${name} (${token})`}</Typography>
          <Typography variant='caption'>{`${exchange} - ${symbol}`}</Typography>
        </Box>
      ),
      ltp: (
        <Box display='flex' alignItems='start'>
          <CurrencyRupeeIcon color={percentChange > 0 ? 'success' : 'error'} />
          <Typography>{ltp}</Typography>
        </Box>
      ),
      OHLC: <Typography>{`${open}|${high}|${low}|${close}`}</Typography>,
      status: (
        <Box display='flex' flexDirection='column' alignItems='start'>
          <Typography sx={{ color: capitalGain > 0 ? 'green' : 'red' }}>
            {(quantity * ltp).toFixed(2)} | {capitalGain.toFixed(2)}
          </Typography>
          <Typography>{`(${(quantity * atPrice).toFixed(2)})`}</Typography>
        </Box>
      ),
      atPrice: (
        <Typography sx={{ color: type === 'buy' ? 'green' : 'red' }}>{`${
          type === 'buy' ? 'B' : 'S'
        } ${atPrice}`}</Typography>
      ),
      quantity: (
        <Box display='flex' flexDirection='column' alignItems='start'>
          <Typography>{quantity}</Typography>
          <Typography>{purchasedDate ? new Date(purchasedDate).toLocaleDateString() : 'N/A'}</Typography>
        </Box>
      ),
      STCG: (
        <Box display='flex' flexDirection='column' alignItems='start'>
          <Typography sx={{ color: !isSTCG ? 'grey' : capitalGain < 0 ? 'red' : 'green' }}>
            {isSTCG ? capitalGain.toFixed(2) : '0.00'}
          </Typography>
          {isSTCG && capitalGain > 0 && formatGain(capitalGain, 20, 80)}
        </Box>
      ),
      LTCG: (
        <Box display='flex' flexDirection='column' alignItems='start'>
          <Typography sx={{ color: !isLTCG ? 'grey' : capitalGain < 0 ? 'red' : 'green' }}>
            {isLTCG ? capitalGain.toFixed(2) : '0.00'}
          </Typography>
          {isLTCG && capitalGain > 0 && formatGain(capitalGain, 12.5, 87.5)}
        </Box>
      )
    }
  }

  const formattedRows = useMemo(() => rawStocksData.map(formatRow), [rawStocksData])

  const handleChangePage = (event: unknown, newPage: number) => setPage(newPage)
  const handleChangeRowsPerPage = (event: ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(+event.target.value)
    setPage(0)
  }

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      <TableContainer sx={{ maxHeight: 440 }}>
        <Table stickyHeader aria-label='sticky table'>
          <TableHead>
            <TableRow>
              {columns.map(column => (
                <TableCell key={column.id} align={column.align} sx={{ minWidth: column.minWidth }}>
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {formattedRows.length > 0 ? (
              formattedRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row, index) => (
                <TableRow hover role='checkbox' tabIndex={-1} key={index}>
                  {columns.map(column => (
                    <TableCell key={column.id} align={column.align}>
                      {row[column.id]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow hover role='checkbox' tabIndex={-1} key='noData'>
                <TableCell colSpan={12} align='center' sx={{ fontSize: '1.875rem' }}>
                  No Data Found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[10, 25, 100]}
        component='div'
        count={rawStocksData.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  )
}

export default TableStickyHeader
