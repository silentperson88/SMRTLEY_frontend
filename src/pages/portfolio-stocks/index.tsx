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
import NextLink from 'next/link'
import Link from '@mui/material/Link'
import { CircularProgress } from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'
import type { RootState } from 'src/store'
import { setMyPortfolios, setPortfolioTypes } from 'src/store/slices/portfolio.slice'
import type { MyPortfolio, PortfolioType } from 'src/types/portfolio'
import PortfolioSummaryHero from 'src/components/page/PortfolioSummaryHero'

// ------------------------------------------------------

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
  const [selected, setSelected] = useState<string | null>(null)
  const dispatch = useDispatch()
  const portfolioTypes = useSelector((state: RootState) => state.portfolio.portfolioTypes)
  const myPortfolios = useSelector((state: RootState) => state.portfolio.myPortfolios)

  const { data: portfolioTypesData, isLoading: portfolioTypesLoading } =
    useSimpleSWR<PortfolioType[]>(ENDURL.GET_PORTFOLIO_TYPES)
  const { data: myPortfolioData, isLoading: myPortfoliosLoading } =
    useSimpleSWR<MyPortfolio[]>(ENDURL.GET_MY_PORTFOLIOS)

  useEffect(() => {
    if (myPortfolioData?.length) {
      const newPortfolios: MyPortfolio[] = myPortfolioData.map(item => {
        return {
          ...item,
          portfolio_type_id: {
            display_name: item.portfolio_type_id.display_name,
            risk_level: item.portfolio_type_id.risk_level
          }
        }
      })
      dispatch(setMyPortfolios(newPortfolios))
    }
  }, [dispatch, myPortfolioData])

  useEffect(() => {
    if (!portfolioTypesData?.length) return
    dispatch(setPortfolioTypes(portfolioTypesData))
  }, [dispatch, portfolioTypesData])

  const handleSelect = (id: string) => {
    setSelected(id)
    setOpenCreate(true)
  }

  const totalFund = myPortfolios.reduce((acc, item) => acc + Number(item.initial_fund || 0), 0)
  const totalInvested = myPortfolios.reduce((acc, item) => acc + Number(item.initial_fund || 0) - Number(item.available_fund || 0), 0)
  const totalPl = myPortfolios.reduce((acc, item) => acc + Number(item.pnl || 0), 0)

  return (
    <>
      <Grid container spacing={6}>
        <Grid item xs={12}>
          <PortfolioSummaryHero
            totalFund={`INR ${totalFund.toLocaleString()}`}
            totalInvested={`INR ${totalInvested.toLocaleString()}`}
            totalPl={`${totalPl >= 0 ? '+' : '-'}INR ${Math.abs(totalPl).toLocaleString()}`}
            isPositivePl={totalPl >= 0}
            onCreate={() => setOpenCreate(true)}
          />
        </Grid>
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
        {myPortfolios.length > 0 ? (
          myPortfolios.map(portfolio => (
            <Grid item xs={12} sm={6} md={4} key={portfolio._id}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box display='flex' justifyContent='space-between' alignItems='center' mb={1}>
                    <Typography variant='h6'>{portfolio.name}</Typography>
                    <Chip
                      label={portfolio.portfolio_type_id.risk_level}
                      size='small'
                      color={getRiskColor(portfolio.portfolio_type_id.risk_level)}
                    />
                  </Box>

                  <Typography variant='body2' color='text.secondary'>
                    {portfolio.portfolio_type_id.display_name}
                  </Typography>

                  <Box mt={2}>
                    <Typography variant='body2'>
                      💰 Fund: <strong>₹{portfolio.initial_fund}</strong>
                    </Typography>
                    <Typography variant='body2'>
                      📊 Invested: ₹{portfolio.initial_fund - portfolio.available_fund}
                    </Typography>
                    <Typography variant='body2' color={portfolio?.pnl >= 0 ? 'success.main' : 'error.main'}>
                      📈 P&L: {portfolio?.pnl >= 0 ? '+' : ''}₹{portfolio?.pnl?.toLocaleString()}
                    </Typography>
                  </Box>

                  <Typography variant='caption' color='text.secondary' display='block' mt={1}>
                    Created on {new Date(portfolio.created_at).toLocaleDateString()}
                  </Typography>
                </CardContent>

                <CardActions>
                  <NextLink
                    href={{
                      pathname: `/portfolio-stocks/${portfolio._id}`
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
                      <Button size='small' variant='outlined'>
                        View
                      </Button>
                    </Link>
                  </NextLink>
                  <Button size='small' variant='contained'>
                    Trade
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))
        ) : portfolioTypesLoading || myPortfoliosLoading ? (
          <Box sx={{ my: 10, textAlign: 'center', width: '100%' }}>
            <CircularProgress color='primary' />
          </Box>
        ) : (
          <Typography variant='h5' color='text.secondary' sx={{ my: 10, textAlign: 'center', width: '100%' }}>
            No Portfolios Found, Try From Following Options
          </Typography>
        )}

        {/* PortfolioType Label */}
        <Grid item xs={12}>
          <Box my={2}>
            <Typography variant='h6' color='text.primary'>
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
