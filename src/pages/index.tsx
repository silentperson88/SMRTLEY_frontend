import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'
import { useEffect } from 'react'

// ** MUI Imports
import Grid from '@mui/material/Grid'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline'
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined'
import PieChartOutlineIcon from '@mui/icons-material/PieChartOutline'

// ** Custom Components Imports
import CardStatisticsVerticalComponent from 'src/@core/components/card-statistics/card-stats-vertical'

// ** Styled Component Import
import ApexChartWrapper from 'src/@core/styles/libs/react-apexcharts'

// ** Demo Components Imports
import Table from 'src/views/dashboard/Table'
import Trophy from 'src/views/dashboard/Trophy'
import RecentTradesCard from 'src/views/dashboard/RecentTradesCard'
import StatisticsCard from 'src/views/dashboard/StatisticsCard'
import PortfolioOverview from 'src/views/dashboard/PortfolioOverview'
import DepositWithdraw from 'src/views/dashboard/DepositWithdraw'
import NewInvestements from 'src/views/dashboard/NewInvestement'

import { useSimpleSWR } from 'src/hooks/swr/swrhooks'
import { ENDURL } from 'src/utils/constants/endurl.utils'
import { TC } from 'src/utils/constants/text.constants'
import { Typography } from '@mui/material'
import { mutate } from 'swr'
import PageHero from 'src/components/page/PageHero'
import { useRouter } from 'next/router'

interface DashboardResponse {
  total_pl: number
  stats: {
    total_invested: number
    total_current_value: number
    total_stock_types: number
    revenue: number
    realized_pl: number
    unrealized_pl: number
    total_orders: number
    open_orders: number
    partially_filled_orders: number
    completed_orders: number
    cancelled_orders: number
  }
  account_totals: {
    invested_value: number
    wallet_fund: number
    total_fund_added: number
    total_fund_withdrawn: number
    available_fund: number
    locked_fund: number
    current_value: number
    realized_pl: number
    unrealized_pl: number
    total_pl: number
    total_wallet_value: number
  }
  orders_summary: {
    total: number
    buy: number
    sell: number
    open: number
    partially_filled: number
    completed: number
    cancelled: number
  }
  portfolio_performance: {
    portfolio_id: string
    portfolio_name: string
    invested_value: number
    current_value: number
    available_fund: number
    locked_fund: number
    total_fund: number
    unrealized_pl: number
    realized_pl: number
    pl: number
  }[]
  total_earnings: {
    active_stock_id: string
    symbol: string
    total_quantity: number
    invested_value: number
    current_value: number
    pl: number
  }[]
  new_investments: {
    days: number
    total_invested: number
    series: { date: string; invested_value: number; unrealized_pl?: number }[]
  }
  sales_by_portfolio: any[]
  amount_distribution: any[]
  recent_sell_performance: { days: number; items: any[] }
  last_trades: {
    _id: string
    symbol: string
    type: 'BUY' | 'SELL'
    order_type: string
    order_price: number
    order_quantity: number
    status: string
    createdAt: string
  }[]
}

const Overview = () => {
  const { data, isLoading } = useSimpleSWR<DashboardResponse>(ENDURL.GET_DASHBOARD)
  const router = useRouter()

  useEffect(() => {
    const intervalId = setInterval(() => {
      mutate(ENDURL.GET_DASHBOARD)
    }, TC.ORDER_REFRESH_MS)

    return () => clearInterval(intervalId)
  }, [])

  if (isLoading) {
    return (
      <Box display='flex' justifyContent='center' mt={10}>
        <CircularProgress />
      </Box>
    )
  }

  if (!data) {
    return (
      <Box display='flex' justifyContent='center' mt={10}>
        <Typography color='text.secondary'>No overview data found.</Typography>
      </Box>
    )
  }

  return (
    <ApexChartWrapper>
      <Grid container spacing={6}>
        <Grid item xs={12}>
          <PageHero
            title='Manage Your Wealth Smarter'
            subtitle='Your summary for your account growth, portfolio trends and active holdings.'
            primaryInfoLabel='Total Fund'
            primaryInfoValue={`${TC.CURRENCY}${data.account_totals.total_wallet_value.toLocaleString()}`}
            actionLabel='Create New Portfolio'
            onAction={() => router.push('/portfolio-stocks')}
            panelTitle='Your current portfolio'
            panelSubtitle='Snapshot of your active investment account'
            panelLeftLabel='Invested Value'
            panelLeftValue={`${TC.CURRENCY}${data.account_totals.invested_value.toLocaleString()}`}
            panelRightLabel='Net P/L'
            panelRightValue={`${data.account_totals.total_pl >= 0 ? '+' : '-'}${TC.CURRENCY}${Math.abs(
              data.account_totals.total_pl
            ).toLocaleString()}`}
            panelRightValueColor={data.account_totals.total_pl >= 0 ? 'success.main' : 'error.main'}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <Trophy totalPl={data.total_pl} message={data.total_pl === 0 ? TC.DASHBOARD_MESSAGES.QUOTE : undefined} />
        </Grid>
        <Grid item xs={12} md={8}>
          <StatisticsCard stats={data.stats} />
        </Grid>
        <Grid item xs={12} md={6} lg={4}>
          <PortfolioOverview
            portfolios={data.portfolio_performance}
            emptyMessage={TC.DASHBOARD_MESSAGES.NO_PORTFOLIO_DATA}
          />
        </Grid>
        <Grid item xs={12} md={6} lg={4}>
          <RecentTradesCard rows={data.total_earnings} emptyMessage={TC.DASHBOARD_MESSAGES.NO_EARNINGS_DATA} />
        </Grid>
        <Grid item xs={12} md={6} lg={4}>
          <Grid container spacing={6}>
            <Grid item xs={6}>
              <CardStatisticsVerticalComponent
                stats={`${TC.CURRENCY}${data.account_totals.total_fund_added.toLocaleString()}`}
                icon={<AddCircleOutlineIcon />}
                color='success'
                trendNumber=''
                title='Total Fund Added'
                subtitle='All Time'
              />
            </Grid>
            <Grid item xs={6}>
              <CardStatisticsVerticalComponent
                stats={`${TC.CURRENCY}${data.account_totals.total_fund_withdrawn.toLocaleString()}`}
                title='Total Withdrawn'
                trend='negative'
                color='secondary'
                trendNumber=''
                subtitle='All Time'
                icon={<RemoveCircleOutlineIcon />}
              />
            </Grid>
            <Grid item xs={6}>
              <CardStatisticsVerticalComponent
                stats={`${TC.CURRENCY}${data.account_totals.wallet_fund.toLocaleString()}`}
                trend='negative'
                trendNumber=''
                title='Wallet Fund'
                subtitle='Available'
                icon={<AccountBalanceWalletOutlinedIcon />}
              />
            </Grid>
            <Grid item xs={6}>
              <CardStatisticsVerticalComponent
                stats={`${TC.CURRENCY}${data.account_totals.available_fund.toLocaleString()}`}
                color='warning'
                trend='negative'
                trendNumber=''
                subtitle='Available'
                title='Total Portfolio Fund'
                icon={<PieChartOutlineIcon />}
              />
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={12} md={6} lg={4}>
          <NewInvestements items={data.sales_by_portfolio} emptyMessage={TC.DASHBOARD_MESSAGES.NO_SALES_DATA} />
        </Grid>
        <Grid item xs={12} md={12} lg={8}>
          <DepositWithdraw items={data.amount_distribution} emptyMessage={TC.DASHBOARD_MESSAGES.NO_DISTRIBUTION_DATA} />
        </Grid>
        <Grid item xs={12}>
          <Table rows={data.last_trades} emptyMessage={TC.DASHBOARD_MESSAGES.NO_TRADES_DATA} />
        </Grid>
      </Grid>
    </ApexChartWrapper>
  )
}

export default Overview
