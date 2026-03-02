// ** MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Chip from '@mui/material/Chip'
import Table from '@mui/material/Table'
import TableRow from '@mui/material/TableRow'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import Typography from '@mui/material/Typography'
import TableContainer from '@mui/material/TableContainer'

// ** Types Imports
import { ThemeColor } from 'src/@core/layouts/types'

interface RowType {
  id: string
  symbol: string
  type: 'BUY' | 'SELL'
  order_type: string
  order_price: number
  order_quantity: number
  status: string
  createdAt: string
}

interface StatusObj {
  [key: string]: {
    color: ThemeColor
  }
}

const statusObj: StatusObj = {
  OPEN: { color: 'warning' },
  PARTIALLY_FILLED: { color: 'info' },
  COMPLETED: { color: 'success' },
  CANCELLED: { color: 'error' },
  EXPIRED: { color: 'secondary' }
}

const DashboardTable = ({ rows, emptyMessage }: { rows: RowType[]; emptyMessage?: string }) => {
  return (
    <Card>
      {rows.length === 0 ? (
        <Box sx={{ p: 5 }}>
          <Typography variant='caption' color='text.secondary'>
            {emptyMessage}
          </Typography>
        </Box>
      ) : (
        <TableContainer>
          <Table sx={{ minWidth: 800 }} aria-label='table in dashboard'>
            <TableHead>
              <TableRow>
                <TableCell>Symbol</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Order</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Qty</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row: RowType) => (
                <TableRow hover key={row.id} sx={{ '&:last-of-type td, &:last-of-type th': { border: 0 } }}>
                  <TableCell sx={{ py: theme => `${theme.spacing(0.5)} !important` }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      <Typography sx={{ fontWeight: 500, fontSize: '0.875rem !important' }}>{row.symbol}</Typography>
                      <Typography variant='caption'>{new Date(row.createdAt).toLocaleString()}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{row.type}</TableCell>
                  <TableCell>{row.order_type}</TableCell>
                  <TableCell>{row.order_price}</TableCell>
                  <TableCell>{row.order_quantity}</TableCell>
                  <TableCell>
                    <Chip
                      label={row.status}
                      color={(statusObj[row.status] || { color: 'secondary' }).color}
                      sx={{
                        height: 24,
                        fontSize: '0.75rem',
                        textTransform: 'capitalize',
                        '& .MuiChip-label': { fontWeight: 500 }
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Card>
  )
}

export default DashboardTable
