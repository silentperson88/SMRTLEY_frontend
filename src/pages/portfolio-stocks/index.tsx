import { useEffect, useState } from 'react'

// ** MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardActions from '@mui/material/CardActions'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'
import CreatePortfolioDialog from 'src/views/portfolio/CreatePortfolioDialog'
import { useSimpleSWR } from 'src/hooks/swr/swrhooks'
import { ENDURL } from 'src/utils/constants/endurl.utils'

// ------------------------------------------------------

export interface PortfolioType {
  _id: string
  code: string
  display_name: string
  description: string
  risk_level: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH'
  important_notes: string[]
  fund: number
}

export interface MyPortfolio {
  _id: string
  name: string
  portfolio_type: {
    display_name: string
    risk_level: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH'
  }
  fund: number
  invested: number
  pnl: number
  created_at: string
}

const DUMMY_MY_PORTFOLIOS: MyPortfolio[] = [
  {
    _id: 'p1',
    name: 'IPO Practice Jan',
    portfolio_type: {
      display_name: 'IPO Simulation',
      risk_level: 'MEDIUM'
    },
    fund: 100000,
    invested: 60000,
    pnl: 4200,
    created_at: '2026-01-10'
  },
  {
    _id: 'p2',
    name: 'Retirement Wealth',
    portfolio_type: {
      display_name: 'Retirement Plan',
      risk_level: 'LOW'
    },
    fund: 500000,
    invested: 480000,
    pnl: -3200,
    created_at: '2025-12-01'
  }
]

export const getRiskColor = (risk: string) => {
  switch (risk) {
    case 'LOW':
      return 'success'
    case 'MEDIUM':
      return 'warning'
    case 'HIGH':
      return 'error'
    default:
      return 'default'
  }
}

// ------------------------------------------------------

const PortfolioList = () => {
  const [openCreate, setOpenCreate] = useState(false)
  const [portfolioTypes, setPortfolioTypes] = useState<PortfolioType[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [myPortfolios, setMyPortfolios] = useState<MyPortfolio[]>([])

  const { data } = useSimpleSWR<PortfolioType[]>(ENDURL.GET_PORTFOLIO_TYPES)
  const { data: myPortfolioData } = useSimpleSWR<MyPortfolio[]>(ENDURL.GET_MY_PORTFOLIOS)

  useEffect(() => {
    if (myPortfolioData?.length) {
      setMyPortfolios(myPortfolioData)
    } else {
      setMyPortfolios(DUMMY_MY_PORTFOLIOS)
    }
  }, [myPortfolioData])

  const fetchPortfolioTypes = async (data: PortfolioType[]) => {
    try {
      console.log('fetchPortfolioTypes', data)
      if (data.length) {
        setPortfolioTypes(data.map(item => item))
      }
    } catch (error) {
      console.warn('Using dummy portfolio types')
    }
  }

  useEffect(() => {
    if (!data) return
    fetchPortfolioTypes(data)
  }, [data])

  const handleSelect = (id: string) => {
    setSelected(id)
    setOpenCreate(true)
  }

  return (
    <>
      <Grid container spacing={6}>
        {/* Header */}
        <Grid item xs={12}>
          <Box display='flex' justifyContent='space-between' alignItems='center'>
            <Typography variant='h5'>My Portfolios</Typography>
            <Button variant='contained' onClick={() => setOpenCreate(true)}>
              + Create New Portfolio
            </Button>
          </Box>
        </Grid>

        {/* My Portfolios Section */}
        {myPortfolios.map(portfolio => (
          <Grid item xs={12} sm={6} md={4} key={portfolio._id}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box display='flex' justifyContent='space-between' alignItems='center' mb={1}>
                  <Typography variant='h6'>{portfolio.name}</Typography>
                  <Chip
                    label={portfolio.portfolio_type.risk_level}
                    size='small'
                    color={getRiskColor(portfolio.portfolio_type.risk_level)}
                  />
                </Box>

                <Typography variant='body2' color='text.secondary'>
                  {portfolio.portfolio_type.display_name}
                </Typography>

                <Box mt={2}>
                  <Typography variant='body2'>
                    💰 Fund: <strong>₹{portfolio.fund.toLocaleString()}</strong>
                  </Typography>
                  <Typography variant='body2'>📊 Invested: ₹{portfolio.invested.toLocaleString()}</Typography>
                  <Typography variant='body2' color={portfolio.pnl >= 0 ? 'success.main' : 'error.main'}>
                    📈 P&L: {portfolio.pnl >= 0 ? '+' : ''}₹{portfolio.pnl.toLocaleString()}
                  </Typography>
                </Box>

                <Typography variant='caption' color='text.secondary' display='block' mt={1}>
                  Created on {new Date(portfolio.created_at).toLocaleDateString()}
                </Typography>
              </CardContent>

              <CardActions>
                <Button size='small' variant='outlined'>
                  View
                </Button>
                <Button size='small' variant='contained'>
                  Trade
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}

        {/* PortfolioType Label */}
        <Grid item xs={12}>
          <Box my={2}>
            <Typography variant='h6' color='text.secondary'>
              Available Portfolio Types
            </Typography>
          </Box>
        </Grid>
        {/* Portfolio Cards */}
        {portfolioTypes.map(portfolio => (
          <Grid item xs={12} sm={6} md={4} key={portfolio._id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent>
                <Box display='flex' justifyContent='space-between' alignItems='center' mb={2}>
                  <Typography variant='h6'>{portfolio.display_name}</Typography>
                  <Chip label={portfolio.risk_level} size='small' color={getRiskColor(portfolio.risk_level)} />
                </Box>

                <Typography variant='body2' color='text.secondary' mb={2}>
                  {portfolio.description}
                </Typography>

                {portfolio.important_notes?.slice(0, 2).map((note, index) => (
                  <Typography key={index} variant='caption' display='block' color='text.secondary'>
                    • {note}
                  </Typography>
                ))}
              </CardContent>

              <CardActions sx={{ mt: 'auto', px: 4, pb: 4 }}>
                <Button size='small' variant='contained' onClick={() => handleSelect(portfolio._id)}>
                  Create
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
      <CreatePortfolioDialog
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        portfolioTypes={portfolioTypes}
        selectedId={selected}
      />
    </>
  )
}

export default PortfolioList
