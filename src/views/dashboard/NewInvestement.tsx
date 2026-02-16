// ** React Imports
import { ReactNode } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Avatar from '@mui/material/Avatar'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'

// ** Icons Imports
import ChevronUp from 'mdi-material-ui/ChevronUp'
import ChevronDown from 'mdi-material-ui/ChevronDown'
import DotsVertical from 'mdi-material-ui/DotsVertical'

// ** Types
import { ThemeColor } from 'src/@core/layouts/types'

interface DataType {
  title: string
  sales: string
  trend: ReactNode
  trendDir: string
  subtitle: string
  avatarText: string
  trendNumber: string
  avatarColor: ThemeColor
}

interface Item {
  portfolio_id: string
  portfolio_name: string
  total_invested: number
  available_fund: number
  pl: number
  total_stock_types: number
}

const NewInvestements = ({ items, emptyMessage }: { items: Item[]; emptyMessage?: string }) => {
  const data: DataType[] = (items || []).map(item => {
    const up = item.pl >= 0

    return {
      sales: `${item.total_stock_types}`,
      trendDir: up ? 'up' : 'down',
      subtitle: item.portfolio_name,
      title: `₹${item.total_invested.toLocaleString()}`,
      avatarText: item.portfolio_name.slice(0, 2).toUpperCase(),
      trendNumber: `₹${item.pl.toLocaleString()}`,
      avatarColor: up ? 'success' : 'error',
      trend: up ? (
        <ChevronUp sx={{ color: 'success.main', fontWeight: 600 }} />
      ) : (
        <ChevronDown sx={{ color: 'error.main', fontWeight: 600 }} />
      )
    }
  })

  return (
    <Card>
      <CardHeader
        title='Recent Sales'
        titleTypographyProps={{ sx: { lineHeight: '1.2 !important', letterSpacing: '0.31px !important' } }}
        action={
          <IconButton size='small' aria-label='settings' className='card-more-options' sx={{ color: 'text.secondary' }}>
            <DotsVertical />
          </IconButton>
        }
      />
      <CardContent sx={{ pt: theme => `${theme.spacing(2)} !important` }}>
        {data.length === 0 ? (
          <Typography variant='caption' color='text.secondary'>
            {emptyMessage}
          </Typography>
        ) : (
          data.map((item: DataType, index: number) => {
            return (
              <Box
                key={item.title}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  ...(index !== data.length - 1 ? { mb: 5.875 } : {})
                }}
              >
                <Avatar
                  sx={{
                    width: 38,
                    height: 38,
                    marginRight: 3,
                    fontSize: '1rem',
                    color: 'common.white',
                    backgroundColor: `${item.avatarColor}.main`
                  }}
                >
                  {item.avatarText}
                </Avatar>

                <Box
                  sx={{
                    width: '100%',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <Box sx={{ marginRight: 2, display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex' }}>
                      <Typography sx={{ mr: 0.5, fontWeight: 600, letterSpacing: '0.25px' }}>{item.title}</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {item.trend}
                        <Typography
                          variant='caption'
                          sx={{
                            fontWeight: 600,
                            lineHeight: 1.5,
                            color: item.trendDir === 'down' ? 'error.main' : 'success.main'
                          }}
                        >
                          {item.trendNumber}
                        </Typography>
                      </Box>
                    </Box>
                    <Typography variant='caption' sx={{ lineHeight: 1.5 }}>
                      {item.subtitle}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', textAlign: 'end', flexDirection: 'column' }}>
                    <Typography
                      sx={{ fontWeight: 600, fontSize: '0.875rem', lineHeight: 1.72, letterSpacing: '0.22px' }}
                    >
                      {item.sales}
                    </Typography>
                    <Typography variant='caption' sx={{ lineHeight: 1.5 }}>
                      Sales
                    </Typography>
                  </Box>
                </Box>
              </Box>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}

export default NewInvestements
