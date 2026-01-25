// ** MUI Imports
import Card from '@mui/material/Card'
import Table from '@mui/material/Table'
import TableRow from '@mui/material/TableRow'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import Typography from '@mui/material/Typography'
import TableContainer from '@mui/material/TableContainer'
import { styled } from '@mui/material/styles'

// ** Types Imports

type TableCell = string | number
type TableRow = TableCell[]

export interface TableData {
  columns: string[]
  rows: TableRow[]
}

// Styled TableCell for the sticky column header
const StickyHeaderCell = styled(TableCell)(({ theme }) => ({
  position: 'sticky',
  left: 0,
  zIndex: 10, // Ensure header is above body cells when scrolling
  backgroundColor: theme.palette.background.paper // Match card background
}))

// Styled TableCell for the sticky column body cells
const StickyBodyCell = styled(TableCell)(({ theme }) => ({
  position: 'sticky',
  left: 0,
  zIndex: 5, // Ensure body cells are above other scrolling body cells
  backgroundColor: theme.palette.background.paper, // Match card background
  whiteSpace: 'nowrap'
}))

const FundamentalTable = (props: { data: TableData }) => {
  const { columns, rows } = props?.data

  return (
    <Card>
      {/* Set max height and overflowX to auto to enable scrolling */}
      <TableContainer sx={{ maxHeight: 440, overflowX: 'auto' }}>
        {/* Set a minimum width greater than the container width to force scrollability */}
        <Table sx={{ minWidth: 900 }} aria-label='table in dashboard' stickyHeader>
          <TableHead>
            <TableRow>
              {columns.map((column, index: number) =>
                index === 0 ? (
                  <StickyHeaderCell key={index}>{column}</StickyHeaderCell>
                ) : (
                  <TableCell key={index}>{column}</TableCell>
                )
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row: TableRow, rowIndex: number) => (
              <TableRow hover key={rowIndex} sx={{ '&:last-of-type td, &:last-of-type th': { border: 0 } }}>
                {row.map((cell, cellIndex) =>
                  cellIndex === 0 ? (
                    <StickyBodyCell key={cellIndex} sx={{ py: theme => `${theme.spacing(0.5)} !important` }}>
                      <Typography sx={{ fontWeight: 500, fontSize: '0.875rem !important' }}>{cell}</Typography>
                    </StickyBodyCell>
                  ) : (
                    <TableCell key={cellIndex}>{cell ?? 0}</TableCell>
                  )
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  )
}

export default FundamentalTable
