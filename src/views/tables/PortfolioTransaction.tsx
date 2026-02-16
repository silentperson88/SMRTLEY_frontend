// src/views/portfolio/TradesTable.tsx
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Card,
  CardContent,
  Typography,
  Chip
} from '@mui/material'

const TradesTable = ({ trades }: any) => {
  return (
    <Card>
      <CardContent>
        <Typography variant='h6' gutterBottom>
          Trades
        </Typography>

        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Symbol</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Qty</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Value</TableCell>
              <TableCell>Date</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {trades.map((t: any) => (
              <TableRow key={t._id}>
                <TableCell>{t.symbol}</TableCell>
                <TableCell>
                  <Chip
                    label={t.transaction_type}
                    color={t.transaction_type === 'BUY' ? 'success' : 'error'}
                    size='small'
                  />
                </TableCell>
                <TableCell>{t.quantity}</TableCell>
                <TableCell>₹{t.price}</TableCell>
                <TableCell>₹{t.invested_value}</TableCell>
                <TableCell>{new Date(t.executed_at).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

export default TradesTable
