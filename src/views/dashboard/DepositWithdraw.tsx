// ** React Imports
import { ReactNode } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import { styled } from '@mui/material/styles'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'
import MuiDivider, { DividerProps } from '@mui/material/Divider'
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined'
import ShowChartOutlinedIcon from '@mui/icons-material/ShowChartOutlined'

import { TC } from 'src/utils/constants/text.constants'

interface DataType {
  icon: ReactNode
  title: string
  amount: string
  subtitle: string
}

interface Item {
  portfolio_id: string
  portfolio_name: string
  invested_value: number
  available_fund: number
  total_value: number
  current_value: number
}

// Styled Divider component
const Divider = styled(MuiDivider)<DividerProps>(({ theme }) => ({
  margin: theme.spacing(5, 0),
  borderRight: `1px solid ${theme.palette.divider}`,
  [theme.breakpoints.down('md')]: {
    borderRight: 'none',
    margin: theme.spacing(0, 5),
    borderBottom: `1px solid ${theme.palette.divider}`
  }
}))

const DepositWithdraw = ({ items, emptyMessage }: { items: Item[]; emptyMessage?: string }) => {
  const depositData: DataType[] = (items || []).map(item => ({
    amount: `+${TC.CURRENCY}${item.available_fund.toLocaleString()}`,
    subtitle: 'Available Fund',
    title: item.portfolio_name,
    icon: <AccountBalanceWalletOutlinedIcon fontSize='small' color='success' />
  }))

  const withdrawData: DataType[] = (items || []).map(item => ({
    amount: `-${TC.CURRENCY}${item.invested_value.toLocaleString()}`,
    subtitle: 'Invested Value',
    title: item.portfolio_name,
    icon: <ShowChartOutlinedIcon fontSize='small' color='error' />
  }))

  return (
    <Card
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        flexDirection: ['column', 'column', 'row'],
        height: '100%'
      }}
    >
      <Box sx={{ width: '100%' }}>
        <CardHeader
          title='Portfolio Funds'
          sx={{ pt: 5.5, alignItems: 'center', '& .MuiCardHeader-action': { mt: 0.6 } }}
          action={<Typography variant='caption'>View All</Typography>}
          titleTypographyProps={{
            variant: 'h6',
            sx: { lineHeight: '1.6 !important', letterSpacing: '0.15px !important' }
          }}
        />
        <CardContent sx={{ pb: theme => `${theme.spacing(5.5)} !important` }}>
          {depositData.length === 0 ? (
            <Typography variant='caption' color='text.secondary'>
              {emptyMessage}
            </Typography>
          ) : (
            depositData.map((item: DataType, index: number) => {
              return (
                <Box
                  key={item.title}
                  sx={{ display: 'flex', alignItems: 'center', mb: index !== depositData.length - 1 ? 6 : 0 }}
                >
                  <Box sx={{ minWidth: 38, display: 'flex', justifyContent: 'center' }}>{item.icon}</Box>
                  <Box
                    sx={{
                      ml: 4,
                      width: '100%',
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <Box sx={{ marginRight: 2, display: 'flex', flexDirection: 'column' }}>
                      <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>{item.title}</Typography>
                      <Typography variant='caption'>{item.subtitle}</Typography>
                    </Box>
                    <Typography variant='subtitle2' sx={{ fontWeight: 600, color: 'success.main' }}>
                      {item.amount}
                    </Typography>
                  </Box>
                </Box>
              )
            })
          )}
        </CardContent>
      </Box>

      <Divider flexItem />

      <Box sx={{ width: '100%' }}>
        <CardHeader
          title='Portfolio Investments'
          sx={{ pt: 5.5, alignItems: 'center', '& .MuiCardHeader-action': { mt: 0.6 } }}
          action={<Typography variant='caption'>View All</Typography>}
          titleTypographyProps={{
            variant: 'h6',
            sx: { lineHeight: '1.6 !important', letterSpacing: '0.15px !important' }
          }}
        />
        <CardContent sx={{ pb: theme => `${theme.spacing(5.5)} !important` }}>
          {withdrawData.length === 0 ? (
            <Typography variant='caption' color='text.secondary'>
              {emptyMessage}
            </Typography>
          ) : (
            withdrawData.map((item: DataType, index: number) => {
              return (
                <Box
                  key={item.title}
                  sx={{ display: 'flex', alignItems: 'center', mb: index !== depositData.length - 1 ? 6 : 0 }}
                >
                  <Box sx={{ minWidth: 36, display: 'flex', justifyContent: 'center' }}>{item.icon}</Box>
                  <Box
                    sx={{
                      ml: 4,
                      width: '100%',
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <Box sx={{ marginRight: 2, display: 'flex', flexDirection: 'column' }}>
                      <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>{item.title}</Typography>
                      <Typography variant='caption'>{item.subtitle}</Typography>
                    </Box>
                    <Typography variant='subtitle2' sx={{ fontWeight: 600, color: 'error.main' }}>
                      {item.amount}
                    </Typography>
                  </Box>
                </Box>
              )
            })
          )}
        </CardContent>
      </Box>
    </Card>
  )
}

export default DepositWithdraw
