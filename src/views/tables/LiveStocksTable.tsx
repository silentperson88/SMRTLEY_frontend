import React, { useState, ChangeEvent, useEffect } from 'react'
import Paper from '@mui/material/Paper'
import Table from '@mui/material/Table'
import TableRow from '@mui/material/TableRow'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TablePagination from '@mui/material/TablePagination'
import { Button, Chip, Tooltip, Typography } from '@mui/material'
import Profit from '@mui/icons-material/TrendingUp'
import Loss from '@mui/icons-material/TrendingDown'
import NextLink from 'next/link'
import Link from '@mui/material/Link'

interface Column {
  id: 'srNo' | 'name' | 'token' | 'ltp' | 'open' | 'high' | 'low' | 'close' | 'status' | 'action'
  label: string
  minWidth?: number
  align?: 'left' | 'right' | 'center'
  format?: (value: number) => string
}

const columns: readonly Column[] = [
  { id: 'srNo', label: 'Sr. No.' },
  { id: 'name', label: 'Name', align: 'left' },
  { id: 'token', label: 'Token', align: 'center' },
  { id: 'ltp', label: 'LTP', align: 'center' },
  { id: 'open', label: 'Open', align: 'center' },
  { id: 'high', label: 'High', align: 'center' },
  { id: 'low', label: 'Low', align: 'center' },
  { id: 'close', label: 'Close', align: 'center' },
  { id: 'status', label: 'Status', minWidth: 40, align: 'center' },
  { id: 'action', label: 'Action', minWidth: 170, align: 'center' }
]

interface Data {
  master_id?: string
  id: string
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
  hasHistoryData?: boolean
  historyDataFromDate?: string | null
  historyDataToDate?: string | null
}

interface RawFormat {
  srNo: JSX.Element
  name: JSX.Element
  token: JSX.Element
  ltp: JSX.Element
  open: JSX.Element
  high: JSX.Element
  low: JSX.Element
  close: JSX.Element
  status: JSX.Element
  action: JSX.Element
}

const TableStickyHeader = ({
  rawStocksData,
  handleFetchHistory,
  handleViewEod,
  onReachEnd,
  hasMore,
  isLoadingMore
}: {
  rawStocksData: Data[]
  handleFetchHistory: (id: string, name: string) => void
  handleViewEod: (id: string) => void
  onReachEnd: () => void
  hasMore: boolean
  isLoadingMore: boolean
}) => {
  const [page, setPage] = useState<number>(0)
  const [rowsPerPage, setRowsPerPage] = useState<number>(10)
  const [formattedRows, setFormattedRows] = useState<RawFormat[]>([])

  useEffect(() => {
    const temp: RawFormat[] = rawStocksData.map(
        (
          {
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
            master_id,
            hasHistoryData,
            historyDataFromDate,
            historyDataToDate
          }: Data,
          index: number
        ) => ({
          srNo: <Typography>{index + 1}</Typography>,
          name: (
            <NextLink
              href={{
                pathname: `/stock-fundamental/${encodeURIComponent(symbol || name)}`
              }}
              passHref

              // target='_blank'
            >
              <Link
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'start'
                }}
              >
                <Typography>{name}</Typography>
                <Typography variant='caption'>{symbol}</Typography>
              </Link>
            </NextLink>
          ),
          token: (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'start' }}>
              <Typography>{token}</Typography>
              <Typography variant='caption'>{exchange}</Typography>
            </div>
          ),
          ltp: <Typography>{ltp}</Typography>,
          open: <Typography>{open}</Typography>,
          high: <Typography>{high}</Typography>,
          low: <Typography>{low}</Typography>,
          close: <Typography>{close}</Typography>,
          status: percentChange > 0 ? <Profit color='success' /> : <Loss color='error' />,
          action: (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center' }}>
              {hasHistoryData ? (
                <Tooltip
                  title={`History: ${historyDataFromDate || '-'} to ${historyDataToDate || '-'}`}
                  arrow
                  placement='top'
                >
                  <Chip label='History Ready' size='small' color='success' variant='outlined' />
                </Tooltip>
              ) : (
                <Button
                  variant='contained'
                  color='primary'
                  style={{ color: '#ffffff' }}
                  onClick={() => master_id && handleFetchHistory(master_id, name)}
                >
                  Fetch EOD
                </Button>
              )}
              <Button
                variant='outlined'
                size='small'
                onClick={() => master_id && handleViewEod(master_id)}
              >
                View EOD
              </Button>
            </div>
          )
        })
      )
    setFormattedRows(temp)
  }, [rawStocksData])

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(rawStocksData.length / rowsPerPage))
    if (page > totalPages - 1) {
      setPage(0)
    }
  }, [page, rawStocksData.length, rowsPerPage])

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage)
    const totalPages = Math.max(1, Math.ceil(rawStocksData.length / rowsPerPage))
    if (newPage >= totalPages - 1 && hasMore && !isLoadingMore) {
      onReachEnd()
    }
  }

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
              formattedRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row, index) => {
                return (
                  <TableRow hover role='checkbox' tabIndex={-1} key={index}>
                    {columns.map(column => (
                      <TableCell key={column.id} align={column.align}>
                        {row[column.id]}
                      </TableCell>
                    ))}
                  </TableRow>
                )
              })
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
