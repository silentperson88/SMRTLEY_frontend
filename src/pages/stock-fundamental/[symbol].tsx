// ** MUI Imports
import Grid from '@mui/material/Grid'

// ** Icons Imports
import Poll from 'mdi-material-ui/Poll'
import CurrencyUsd from 'mdi-material-ui/CurrencyUsd'
import HelpCircleOutline from 'mdi-material-ui/HelpCircleOutline'
import BriefcaseVariantOutline from 'mdi-material-ui/BriefcaseVariantOutline'

// ** Custom Components Imports
import CardStatisticsVerticalComponent from 'src/@core/components/card-statistics/card-stats-vertical'

// ** Styled Component Import
import ApexChartWrapper from 'src/@core/styles/libs/react-apexcharts'

// ** Demo Components Imports
import Trophy from 'src/views/dashboard/Trophy'
import TotalEarning from 'src/views/dashboard/TotalEarning'
import WeeklyOverview from 'src/views/dashboard/WeeklyOverview'
import SalesByCountries from 'src/views/dashboard/SalesByCountries'
import { useSimpleSWR } from 'src/hooks/swr/swrhooks'
import { useRouter } from 'next/router'
import { ENDURL } from 'src/utils/constants/endurl.utils'
import { useEffect, useState } from 'react'
import CompanyStatisticsCard from 'src/views/stock-fundamentals/companyStatics'
import ProsCons from 'src/views/stock-fundamentals/prosCons'
import FundamentalTable, { TableData } from 'src/views/stock-fundamentals/FundamentalTable'
import { Card, CardHeader, LinearProgress } from '@mui/material'

interface MarketSnapshot {
  marketCap: number
  currentPrice: number
  peRatio: number
  roce: number
  roe: number
  bookValue: number
  dividendYield: number
  faceValue: number
  high: number
  low: number
  open: number
  close: number
  date: string
}

interface YearlyPnL {
  date: string
  sales: number
  revenue: number
  expenses: number
  operatingProfit: number
  financingProfit: number
  financingMargin: number
  opm: number
  otherIncome: number
  interest: number
  depreciation: number
  profitBeforeTax: number
  tax: number
  netProfit: number
  epsInRs: number
  dividendPayout: number
}

interface QuarterlyResults {
  date: string
  revenue: number
  sales: number
  expenses: number
  operatingProfit: number
  financingProfit: number
  financingMargin: number
  opm: number
  otherIncome: number
  interest: number
  depreciation: number
  profitBeforeTax: number
  tax: number
  netProfit: number
  epsInRs: number
  rawPdf: string
}

interface BalanceSheet {
  date: string
  equityCapital: number
  reserves: number
  borrowings: number
  otherLiabilities: number
  totalLiabilities: number
  fixedAssets: number
  cwip: number
  investments: number
  otherAssets: number
  totalAssets: number
}

interface CashFlows {
  date: string
  cashFromOperatingActivity: number
  cashFromInvestingActivity: number
  cashFromFinancingActivity: number
  netCashFlow: number
}

interface Ratios {
  date: string
  debtorDays: number
  inventoryDays: number
  payableDays: number
  cashConversionCycle: number
  workingCapitalDays: number
  roce: number
  roe: number
}

export interface Fundamental {
  companyName: string
  marketSnapshot: MarketSnapshot
  pros: string[]
  cons: string[]
  quarterlyResults: QuarterlyResults[]
  yearlyPnl: YearlyPnL[]
  balanceSheet: BalanceSheet[]
  cashFlows: CashFlows[]
  ratios: Ratios[]
}

interface QuarterlyResultsEntryMap {
  name: string
  key: keyof QuarterlyResults
}

interface BalanceSheetEntryMap {
  name: string
  key: keyof BalanceSheet
}

interface CashFlowsEntryMap {
  name: string
  key: keyof CashFlows
}

interface RatiosEntryMap {
  name: string
  key: keyof Ratios
}

interface YearlyPnLEntryMap {
  name: string
  key: keyof YearlyPnL
}

const quarterlyResultType: QuarterlyResultsEntryMap[] = [
  { name: 'Revenue', key: 'revenue' },
  { name: 'Sales', key: 'sales' },
  { name: 'Expenses', key: 'expenses' },
  { name: 'Operating Profit', key: 'operatingProfit' },
  { name: 'Financing Profit', key: 'financingProfit' },
  { name: 'Financing Margin', key: 'financingMargin' },
  { name: 'OPM', key: 'opm' },
  { name: 'Other Income', key: 'otherIncome' },
  { name: 'Interest', key: 'interest' },
  { name: 'Depreciation', key: 'depreciation' },
  { name: 'Profit Before Tax', key: 'profitBeforeTax' },
  { name: 'Tax', key: 'tax' },
  { name: 'Net Profit', key: 'netProfit' }
]

const yearlyPnlType: YearlyPnLEntryMap[] = [
  { name: 'Sales', key: 'sales' },
  { name: 'Revenue', key: 'revenue' },
  { name: 'Expenses', key: 'expenses' },
  { name: 'Operating Profit', key: 'operatingProfit' },
  { name: 'Financing Profit', key: 'financingProfit' },
  { name: 'Financing Margin', key: 'financingMargin' },
  { name: 'OPM', key: 'opm' },
  { name: 'Other Income', key: 'otherIncome' },
  { name: 'Interest', key: 'interest' },
  { name: 'Depreciation', key: 'depreciation' },
  { name: 'Profit Before Tax', key: 'profitBeforeTax' },
  { name: 'Tax', key: 'tax' },
  { name: 'Net Profit', key: 'netProfit' },
  { name: 'Eps in Rs', key: 'epsInRs' },
  { name: 'Dividend Payout', key: 'dividendPayout' }
]

const balanceSheetType: BalanceSheetEntryMap[] = [
  { name: 'Equity Capital', key: 'equityCapital' },
  { name: 'Reserves', key: 'reserves' },
  { name: 'Borrowings', key: 'borrowings' },
  { name: 'Other Liabilities', key: 'otherLiabilities' },
  { name: 'Total Liabilities', key: 'totalLiabilities' },
  { name: 'Fixed Assets', key: 'fixedAssets' },
  { name: 'CWIP', key: 'cwip' },
  { name: 'Investments', key: 'investments' },
  { name: 'Other Assets', key: 'otherAssets' },
  { name: 'Total Assets', key: 'totalAssets' }
]

const cashFlowsType: CashFlowsEntryMap[] = [
  { name: 'Cash From Operating Activity', key: 'cashFromOperatingActivity' },
  { name: 'Cash From Investing Activity', key: 'cashFromInvestingActivity' },
  { name: 'Cash From Financing Activity', key: 'cashFromFinancingActivity' },
  { name: 'Net Cash Flow', key: 'netCashFlow' }
]

const ratiosType: RatiosEntryMap[] = [
  { name: 'Debtor Days', key: 'debtorDays' },
  { name: 'Inventory Days', key: 'inventoryDays' },
  { name: 'Payable Days', key: 'payableDays' },
  { name: 'Cash Conversion Cycle', key: 'cashConversionCycle' },
  { name: 'Working Capital Days', key: 'workingCapitalDays' },
  { name: 'ROCE', key: 'roce' },
  { name: 'ROE', key: 'roe' }
]

const Dashboard = () => {
  // get symbol from url
  const [fundamentals, setFundamentals] = useState<Fundamental | null>()
  const [yearlyResult, setYearlyResult] = useState<TableData | null>()
  const [quarterlyResult, setQuarterlyResult] = useState<TableData | null>()
  const [balanceSheet, setBalanceSheet] = useState<TableData | null>()
  const [cashFlows, setCashFlows] = useState<TableData | null>()
  const [ratios, setRatios] = useState<TableData | null>()
  const router = useRouter()
  const { symbol } = router.query
  const { data } = useSimpleSWR<any>(`${ENDURL.GET_STOCK_FUNDAMENTAL_DETAILS}/${symbol}`)

  useEffect(() => {
    if (data) {
      const marketSnapshot: MarketSnapshot = {
        marketCap: data?.summary?.market_snapshot?.market_cap,
        currentPrice: data?.active_stock_id?.ltp || data?.summary?.market_snapshot?.current_price,
        peRatio: data?.summary?.market_snapshot?.peRatio || null,
        roce: data?.summary?.market_snapshot?.roce || null,
        roe: data?.summary?.market_snapshot?.roe || null,
        bookValue: data?.summary?.market_snapshot?.book_value || null,
        dividendYield: data?.summary?.market_snapshot?.dividend_yield || null,
        faceValue: data?.summary?.market_snapshot?.faceValue || null,
        high: data?.summary?.market_snapshot?.high || data?.active_stock_id?.high,
        low: data?.summary?.market_snapshot?.low || data?.active_stock_id?.low,
        open: data?.active_stock_id?.open || null,
        close: data?.active_stock_id?.close || null,
        date: data?.active_stock_id?.lastUpdate || null
      }

      const yearlyPnl: YearlyPnL[] = data?.financials?.yearly_pnl?.map((item: any) => ({
        date: item?.date,
        sales: item?.sales,
        revenue: item?.revenue,
        expenses: item?.expenses,
        operatingProfit: item?.operating_profit,
        financingProfit: item?.financing_profit,
        financingMargin: item?.financing_margin,
        opm: item?.opm,
        otherIncome: item?.other_income,
        interest: item?.interest,
        depreciation: item?.depreciation,
        profitBeforeTax: item?.profit_before_tax,
        tax: item?.tax,
        netProfit: item?.net_profit,
        epsInRs: item?.eps,
        dividendPayout: item?.dividend_payout
      }))

      const quarterlyResults: QuarterlyResults[] = data?.financials?.quarterly_results?.map((item: any) => ({
        date: item?.date || null,
        sales: item?.sales || null,
        revenue: item?.revenue || null,
        expenses: item?.expenses || null,
        operatingProfit: item?.operating_profit || null,
        financingProfit: item?.financing_profit || null,
        financingMargin: item?.financing_margin || null,
        opm: item?.opm || null,
        otherIncome: item?.other_income || null,
        interest: item?.interest || null,
        depreciation: item?.depreciation || null,
        profitBeforeTax: item?.profit_before_tax || null,
        tax: item?.tax || null,
        netProfit: item?.net_profit || null,
        epsInRs: item?.eps_in_rs || null,
        rawPdf: item?.raw_pdf || null
      }))

      const balanceSheet: BalanceSheet[] = data?.statements?.balance_sheet?.map((item: any) => ({
        date: item?.date || null,
        equityCapital: item?.equity_capital || null,
        reserves: item?.reserves || null,
        borrowings: item?.borrowings || null,
        otherLiabilities: item?.other_liabilities || null,
        totalLiabilities: item?.total_liabilities || null,
        fixedAssets: item?.fixed_assets || null,
        cwip: item?.cwip || null,
        investments: item?.investments || null,
        otherAssets: item?.other_assets || null,
        totalAssets: item?.total_assets || null
      }))

      const cashFlows: CashFlows[] = data?.statements?.cash_flows?.map((item: any) => ({
        date: item.date,
        cashFromOperatingActivity: item.cash_from_operating_activity,
        cashFromInvestingActivity: item.cash_from_investing_activity,
        cashFromFinancingActivity: item.cash_from_financing_activity,
        netCashFlow: item.net_cash_flow
      }))

      const ratios: Ratios[] = data?.ratios?.map((item: any) => ({
        date: item?.date || null,
        debtorDays: item?.debtor_days || null,
        inventoryDays: item?.inventory_days || null,
        payableDays: item?.payable_days || null,
        cashConversionCycle: item?.cash_conversion_cycle || null,
        workingCapitalDays: item?.working_capital_days || null,
        roce: item?.roce || null,
        roe: item?.roe || null
      }))

      setFundamentals({
        companyName: data?.company,
        marketSnapshot,
        pros: data?.summary?.pros,
        cons: data?.summary?.cons,
        yearlyPnl,
        quarterlyResults,
        balanceSheet,
        cashFlows,
        ratios
      })
    }
  }, [data])

  const generateTableData = (type: string, stockFundamental: Fundamental) => {
    switch (type) {
      case 'quarterly': {
        if (!stockFundamental?.quarterlyResults?.length) return

        setQuarterlyResult({
          // first column is metric name, rest are dates
          columns: ['', ...stockFundamental.quarterlyResults.map((item: QuarterlyResults) => item.date)],

          // each row = [metricName, q1Value, q2Value, ...]
          rows: quarterlyResultType
            .map(type => [
              type.name,
              ...stockFundamental.quarterlyResults.map((item: QuarterlyResults) => item[type.key])
            ])
            .filter(row => row.filter(item => item !== undefined && item !== null && item !== 0).length > 1)
        })
      }

      // return quarterlyResult
      case 'yearly':
        if (!stockFundamental?.yearlyPnl?.length) return

        setYearlyResult({
          // first column is metric name, rest are dates
          columns: ['', ...stockFundamental.yearlyPnl.map((item: YearlyPnL) => item.date)],

          // each row = [metricName, q1Value, q2Value, ...]
          rows: yearlyPnlType
            .map(type => [type.name, ...stockFundamental.yearlyPnl.map((item: YearlyPnL) => item[type.key])])
            .filter(row => row.filter(item => item !== undefined && item !== null && item !== 0).length > 1)
        })

      case 'balanceSheet':
        if (!stockFundamental?.balanceSheet?.length) return

        setBalanceSheet({
          // first column is metric name, rest are dates
          columns: ['', ...stockFundamental.balanceSheet.map((item: BalanceSheet) => item.date)],

          // each row = [metricName, q1Value, q2Value, ...]
          rows: balanceSheetType
            .map(type => [type.name, ...stockFundamental.balanceSheet.map((item: BalanceSheet) => item[type.key])])
            .filter(row => row.filter(item => item !== undefined && item !== null && item !== 0).length > 1)
        })

      case 'cashFlows':
        if (!stockFundamental?.cashFlows?.length) return

        setCashFlows({
          // first column is metric name, rest are dates
          columns: ['', ...stockFundamental.cashFlows.map((item: CashFlows) => item.date)],

          // each row = [metricName, q1Value, q2Value, ...]
          rows: cashFlowsType
            .map(type => [type.name, ...stockFundamental.cashFlows.map((item: CashFlows) => item[type.key])])
            .filter(row => row.filter(item => item !== undefined && item !== null && item !== 0).length > 1)
        })

      case 'ratios':
        if (!stockFundamental?.ratios?.length) return

        setRatios({
          // first column is metric name, rest are dates
          columns: ['', ...stockFundamental.ratios.map((item: Ratios) => item.date)],

          // each row = [metricName, q1Value, q2Value, ...]
          rows: ratiosType
            .map(type => [type.name, ...stockFundamental.ratios.map((item: Ratios) => item[type.key])])
            .filter(row => row.filter(item => item !== undefined && item !== null && item !== 0).length > 1)
        })

      default:
        break
    }
  }

  useEffect(() => {
    if (fundamentals?.quarterlyResults?.length) generateTableData('quarterly', fundamentals)

    if (fundamentals?.yearlyPnl?.length) generateTableData('yearly', fundamentals)

    if (fundamentals?.balanceSheet?.length) generateTableData('balanceSheet', fundamentals)

    if (fundamentals?.cashFlows?.length) generateTableData('cashFlows', fundamentals)

    if (fundamentals?.ratios?.length) generateTableData('ratios', fundamentals)

    return () => {
      setQuarterlyResult(null)
      setYearlyResult(null)
      setBalanceSheet(null)
      setCashFlows(null)
      setRatios(null)
    }
  }, [fundamentals])

  return (
    <ApexChartWrapper>
      {!fundamentals ? (
        <LinearProgress color='primary' />
      ) : (
        <Grid container spacing={6}>
          <Grid item xs={12} md={12}>
            <CompanyStatisticsCard fundamentals={fundamentals} />
          </Grid>

          <Grid item xs={12} md={12} lg={12}>
            <ProsCons fundamentals={fundamentals} />
          </Grid>

          {quarterlyResult && (
            <Grid item xs={12}>
              <Card>
                <CardHeader title='Quarterly Results' titleTypographyProps={{ variant: 'h6', color: 'primary' }} />
                <FundamentalTable data={quarterlyResult} />
              </Card>
            </Grid>
          )}

          {yearlyResult && (
            <Grid item xs={12}>
              <Card>
                <CardHeader title='Yearly PnL' titleTypographyProps={{ variant: 'h6', color: 'primary' }} />
                <FundamentalTable data={yearlyResult} />
              </Card>
            </Grid>
          )}

          {balanceSheet && (
            <Grid item xs={12}>
              <Card>
                <CardHeader title='Balance Sheet' titleTypographyProps={{ variant: 'h6', color: 'primary' }} />
                <FundamentalTable data={balanceSheet} />
              </Card>
            </Grid>
          )}

          {cashFlows && (
            <Grid item xs={12}>
              <Card>
                <CardHeader title='Cash Flows' titleTypographyProps={{ variant: 'h6', color: 'primary' }} />
                <FundamentalTable data={cashFlows} />
              </Card>
            </Grid>
          )}

          {ratios && (
            <Grid item xs={12}>
              <Card>
                <CardHeader title='Ratios' titleTypographyProps={{ variant: 'h6', color: 'primary' }} />
                <FundamentalTable data={ratios} />
              </Card>
            </Grid>
          )}

          <Grid item xs={12} md={4}>
            <Trophy />
          </Grid>
          <Grid item xs={12} md={6} lg={4}>
            <WeeklyOverview />
          </Grid>
          <Grid item xs={12} md={6} lg={4}>
            <TotalEarning />
          </Grid>
          <Grid item xs={12} md={6} lg={4}>
            <Grid container spacing={6}>
              <Grid item xs={6}>
                <CardStatisticsVerticalComponent
                  stats='$25.6k'
                  icon={<Poll />}
                  color='success'
                  trendNumber='+42%'
                  title='Total Profit'
                  subtitle='Weekly Profit'
                />
              </Grid>
              <Grid item xs={6}>
                <CardStatisticsVerticalComponent
                  stats='$78'
                  title='Refunds'
                  trend='negative'
                  color='secondary'
                  trendNumber='-15%'
                  subtitle='Past Month'
                  icon={<CurrencyUsd />}
                />
              </Grid>
              <Grid item xs={6}>
                <CardStatisticsVerticalComponent
                  stats='862'
                  trend='negative'
                  trendNumber='-18%'
                  title='New Project'
                  subtitle='Yearly Project'
                  icon={<BriefcaseVariantOutline />}
                />
              </Grid>
              <Grid item xs={6}>
                <CardStatisticsVerticalComponent
                  stats='15'
                  color='warning'
                  trend='negative'
                  trendNumber='-18%'
                  subtitle='Last Week'
                  title='Sales Queries'
                  icon={<HelpCircleOutline />}
                />
              </Grid>
            </Grid>
          </Grid>
          <Grid item xs={12} md={6} lg={4}>
            <SalesByCountries />
          </Grid>
        </Grid>
      )}
    </ApexChartWrapper>
  )
}

export default Dashboard
