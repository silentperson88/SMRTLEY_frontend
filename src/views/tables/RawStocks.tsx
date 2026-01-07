import React, { useState, ChangeEvent, useEffect } from 'react'
import Paper from '@mui/material/Paper'
import Table from '@mui/material/Table'
import TableRow from '@mui/material/TableRow'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TablePagination from '@mui/material/TablePagination'
import Button from '@mui/material/Button'
import { Typography } from '@mui/material'
import Chip from '@mui/material/Chip'
import { ThemeColor } from 'src/@core/layouts/types'

interface Column {
  id: 'srNo' | 'name' | 'symbol' | 'token' | 'exch_seg' | '_id' | 'status'
  label: string
  minWidth?: number
  align?: 'right' | 'center'
  format?: (value: number) => string
}

const columns: readonly Column[] = [
  { id: 'srNo', label: 'Sr. No.' },
  { id: 'name', label: 'Name' },
  { id: 'symbol', label: 'Symbol' },
  { id: 'token', label: 'Token', align: 'center' },
  { id: 'exch_seg', label: 'Exchange', align: 'right' },
  { id: 'status', label: 'Status', minWidth: 170, align: 'center' },
  { id: '_id', label: 'Action', minWidth: 170, align: 'center' }
]

interface Data {
  name: string
  symbol: string
  token: string
  exch_seg: string
  _id: string
  status: string
}

interface RawFormat {
  srNo: JSX.Element
  name: JSX.Element
  symbol: JSX.Element
  token: JSX.Element
  exch_seg: JSX.Element
  _id: JSX.Element
  status: JSX.Element
}

interface StatusObj {
  [key: string]: {
    color: ThemeColor
  }
}

const statusObj: StatusObj = {
  pending: { color: 'primary' },
  approved: { color: 'success' },
  rejected: { color: 'error' }
}

const TableStickyHeader = ({
  reloadPageValue,
  rawStocksData,
  handleStockCheck
}: {
  reloadPageValue: boolean
  rawStocksData: Data[]
  handleStockCheck: (_id: string, token: string, name: string, exch_seg: string) => void
}) => {
  const [page, setPage] = useState<number>(0)
  const [rowsPerPage, setRowsPerPage] = useState<number>(10)
  const [formattedRows, setFormattedRows] = useState<RawFormat[]>([])

  useEffect(() => {
    setPage(0)
  }, [reloadPageValue])

  useEffect(() => {
    // if (rawStocksData.length > 0) {
    const temp: RawFormat[] = rawStocksData.map(
      ({ name, symbol, token, exch_seg, _id, status }: Data, index: number) => ({
        srNo: <Typography>{index + 1}</Typography>,
        name: <Typography>{name}</Typography>,
        symbol: <Typography>{symbol}</Typography>,
        token: <Typography>{token}</Typography>,
        exch_seg: <Typography>{exch_seg}</Typography>,

        status: (
          <Chip
            label={status ?? 'pending'}
            color={statusObj[status ? status : 'pending'].color}
            sx={{
              height: 24,
              fontSize: '0.75rem',
              textTransform: 'capitalize',
              '& .MuiChip-label': { fontWeight: 500 }
            }}
          />
        ),
        _id: (
          <Button variant='contained' color='primary' onClick={() => handleStockCheck(_id, token, name, exch_seg)}>
            Check
          </Button>
        )
      })
    )
    setFormattedRows(temp)

    // }
  }, [rawStocksData])

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(+event.target.value)
    setPage(0)
  }

  // const handleButtonClick = (id: string) => {
  //   // Add your button click logic here
  //   console.log(`Button clicked for row with id: ${id}`)
  // }

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
