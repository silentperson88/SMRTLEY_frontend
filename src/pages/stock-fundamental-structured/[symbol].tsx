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
import Trophy from 'src/views/overview/Trophy'
import TotalEarning from 'src/views/overview/TotalEarning'
import WeeklyOverview from 'src/views/overview/WeeklyOverview'
import SalesByCountries from 'src/views/overview/SalesByCountries'
import { useSimpleSWR } from 'src/hooks/swr/swrhooks'
import { useRouter } from 'next/router'
import { ENDURL } from 'src/utils/constants/endurl.utils'
import { useEffect, useState } from 'react'
import CompanyStatisticsCard from 'src/views/stock-fundamentals/companyStatics'
import ProsCons from 'src/views/stock-fundamentals/prosCons'
import FundamentalTable, { TableData, TableDataRow } from 'src/views/stock-fundamentals/FundamentalTable'
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Grid as MuiGrid,
  LinearProgress,
  Stack,
  Tab,
  Tabs,
  Typography
} from '@mui/material'
import Link from '@mui/material/Link'
import { useLivePrices } from 'src/hooks/socket/useLivePrice'
import { Candles } from 'src/types/ws'
import BuySellOrderModal from 'src/views/modal/BuySell'
import { useDispatch, useSelector } from 'react-redux'
import { useSWRConfig } from 'swr'
import type { RootState } from 'src/store'
import { setMyPortfolios, setPortfolioTypes, setSelectedPortfolioId } from 'src/store/slices/portfolio.slice'
import type { MyPortfolio, PortfolioType } from 'src/types/portfolio'
import { TC } from 'src/utils/constants/text.constants'

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

export interface Fundamental {
  companyName: string
  marketSnapshot: MarketSnapshot
  pros: string[]
  cons: string[]
}

interface FundamentalTableRowNode {
  title: string
  values?: Array<string | number | null>
  children?: FundamentalTableRowNode[]
}

interface FundamentalApiTable {
  title?: string
  headers?: string[]
  rows?: Record<string, FundamentalTableRowNode>
  unmatched_rows?: Array<Record<string, string | number | null>>
}

interface FundamentalPeerTable {
  title?: string
  headers?: string[]
  rows?: Array<Array<string | number | null>>
}

interface FundamentalApiPayload {
  company?: string
  last_updated_at?: string
  summary?: {
    pros?: string[]
    cons?: string[]
    market_snapshot?: {
      roe?: number
      roce?: number
      high_low?: string
      pe_ratio?: number
      stock_pe?: number
      book_value?: number
      face_value?: number
      market_cap?: number
      current_price?: number
      dividend_yield?: number
    }
  }
  company_info?: {
    company_name?: string
    about?: string | null
    key_points?: string | null
    links?: Array<{ title?: string; url?: string }>
  }
  technicals?: {
    symbol?: string
    exchange?: string
    trade_date?: string
    close?: number | string | null
    high?: number | string | null
    low?: number | string | null
    rsi_14?: number | string | null
    rsi_signal?: string | null
    macd_line?: number | string | null
    signal_line?: number | string | null
    macd_histogram?: number | string | null
    macd_signal?: string | null
    roc_10d?: number | string | null
    roc_20d?: number | string | null
    roc_60d?: number | string | null
    roc_1yr?: number | string | null
    stoch_k?: number | string | null
    stoch_d?: number | string | null
    stoch_signal?: string | null
    momentum_score?: string | null
  } | null
  tables?: {
    quarters?: FundamentalApiTable
    profit_loss?: FundamentalApiTable
    balance_sheet?: FundamentalApiTable
    cash_flow?: FundamentalApiTable
    ratios?: FundamentalApiTable
    shareholdings?: FundamentalApiTable
  }
  peers?: {
    main_table?: FundamentalPeerTable
  }
  other_details?: {
    profit_loss?: Record<
      string,
      {
        title?: string
        entries?: Array<{
          key?: string
          title?: string
          value?: string | number
        }>
      }
    >
  }
  documents?: {
    announcements?: {
      title?: string
      all_link?: string
      items?: Array<{ url?: string; title?: string; subtitle?: string }>
    }
    annual_reports?: {
      title?: string
      items?: Array<{ url?: string; title?: string; subtitle?: string }>
    }
    credit_ratings?: {
      title?: string
      items?: Array<{ url?: string; title?: string; subtitle?: string }>
    }
    concalls?: {
      title?: string
      items?: Array<{
        label?: string
        links?: Array<{ url?: string; title?: string }>
        ai_summary?: { url?: string; title?: string } | null
      }>
    }
  }
  active_stock_id?: string
}

interface QuarterlyFlatApiRow extends Record<string, string | number | null | undefined> {
  id?: string | number | null
  master_id?: string | number | null
  active_stock_id?: string | number | null
  snapshot_id?: string | number | null
  period?: string | null
  period_numeric?: string | null
  created_at?: string | null
  updated_at?: string | null
  last_updated_at?: string | null
}

interface QuarterlyFlatApiPayload {
  symbol?: string
  company_name?: string
  master_id?: string
  active_stock_id?: string
  rows?: QuarterlyFlatApiRow[]
}

const toNumber = (value: unknown, fallback = 0): number => {
  const parsed = Number(value)

  return Number.isFinite(parsed) ? parsed : fallback
}

const parseHighLow = (highLow?: string): { high: number; low: number } => {
  if (!highLow) return { high: 0, low: 0 }

  const matches = highLow.match(/[\d.]+/g)
  if (!matches || matches.length < 2) return { high: 0, low: 0 }

  return {
    high: toNumber(matches[0], 0),
    low: toNumber(matches[1], 0)
  }
}

const flattenTableRows = (
  node: FundamentalTableRowNode,
  depth: number,
  headersLength: number,
  collector: TableDataRow[],
  id: string,
  parentId?: string
) => {
  const values = (node.values || []).slice(0, headersLength).map(value => (value === null ? '-' : value))
  const padded = values.concat(Array(Math.max(headersLength - values.length, 0)).fill('-'))

  collector.push({
    id,
    label: node.title,
    cells: padded,
    level: depth,
    parentId,
    hasChildren: Boolean(node.children?.length)
  })
  ;(node.children || []).forEach((child, index) =>
    flattenTableRows(child, depth + 1, headersLength, collector, `${id}.${index + 1}`, id)
  )
}

const mapTableFromApi = (table?: FundamentalApiTable): TableData | null => {
  if (!table?.headers?.length) return null

  const headers = table.headers
  const rows: TableDataRow[] = []

  Object.values(table.rows || {}).forEach((node, index) =>
    flattenTableRows(node, 0, headers.length, rows, String(index + 1))
  )
  ;(table.unmatched_rows || []).forEach((item, index) => {
    const label = String(item.label || '-')
    const values = headers.map(header => {
      const value = item[header]

      return value === null || value === undefined || value === '' ? '-' : value
    })
    rows.push({
      id: `u.${index + 1}`,
      label,
      cells: values,
      level: 0,
      hasChildren: false
    })
  })

  if (!rows.length) return null

  return {
    columns: ['', ...headers],
    rows
  }
}

const mapPeersTableFromApi = (table?: FundamentalPeerTable): TableData | null => {
  if (!table?.headers?.length || !table.rows?.length) return null

  const rows: TableDataRow[] = table.rows.map((row, index) => {
    const safeRow = row || []

    return {
      id: `peer.${index + 1}`,
      label: String(safeRow[0] ?? `${index + 1}`),
      cells: safeRow
        .slice(1)
        .map(value => (value === null || value === undefined || value === '' ? '-' : value)) as Array<string | number>,
      level: 0,
      hasChildren: false
    }
  })

  return {
    columns: [table.headers[0], ...table.headers.slice(1)],
    rows
  }
}

const QUARTERLY_TABLE_COLUMNS = [
  'id',
  'master_id',
  'active_stock_id',
  'snapshot_id',
  'period',
  'period_numeric',
  'sales',
  'revenue',
  'financing_profit',
  'financing_margin_percent',
  'expenses',
  'interest',
  'net_profit',
  'opm_percent',
  'tax_percent',
  'depreciation',
  'other_income',
  'operating_profit',
  'profit_before_tax',
  'eps',
  'raw_pdf',
  'gross_npa_percent',
  'net_npa_percent',
  'sales_yoy_growth_percent',
  'expenses_material_cost_percent',
  'expenses_employee_cost_percent',
  'other_income_normal',
  'net_profit_profit_from_associates',
  'net_profit_minority_share',
  'net_profit_profit_excl_excep',
  'net_profit_profit_for_pe',
  'net_profit_profit_for_eps',
  'net_profit_exceptional_items',
  'net_profit_exceptional_items_at',
  'net_profit_yoy_profit_growth_percent',
  'last_updated_at',
  'created_at',
  'updated_at'
]

const QUARTERLY_ROW_DEFS: Array<{ key: string; label: string }> = [
  { key: 'eps', label: 'EPS in Rs' },
  { key: 'sales', label: 'Sales' },
  { key: 'revenue', label: 'Revenue' },
  { key: 'financing_profit', label: 'Financing Profit' },
  { key: 'financing_margin_percent', label: 'Financing Margin %' },
  { key: 'expenses', label: 'Expenses' },
  { key: 'interest', label: 'Interest' },
  { key: 'net_profit', label: 'Net Profit' },
  { key: 'opm_percent', label: 'OPM %' },
  { key: 'tax_percent', label: 'Tax %' },
  { key: 'depreciation', label: 'Depreciation' },
  { key: 'other_income', label: 'Other Income' },
  { key: 'operating_profit', label: 'Operating Profit' },
  { key: 'profit_before_tax', label: 'Profit before tax' },
  { key: 'raw_pdf', label: 'Raw PDF' },
  { key: 'gross_npa_percent', label: 'Gross NPA %' },
  { key: 'net_npa_percent', label: 'Net NPA %' },
  { key: 'sales_yoy_growth_percent', label: 'YOY Sales Growth %' },
  { key: 'expenses_material_cost_percent', label: 'Material Cost %' },
  { key: 'expenses_employee_cost_percent', label: 'Employee Cost %' },
  { key: 'other_income_normal', label: 'Other income normal' },
  { key: 'net_profit_profit_from_associates', label: 'Profit from Associates' },
  { key: 'net_profit_minority_share', label: 'Minority share' },
  { key: 'net_profit_profit_excl_excep', label: 'Profit excl Excep' },
  { key: 'net_profit_profit_for_pe', label: 'Profit for PE' },
  { key: 'net_profit_profit_for_eps', label: 'Profit for EPS' },
  { key: 'net_profit_exceptional_items', label: 'Exceptional items' },
  { key: 'net_profit_exceptional_items_at', label: 'Exceptional items AT' },
  { key: 'net_profit_yoy_profit_growth_percent', label: 'YOY Profit Growth %' }
]

const PROFIT_LOSS_ROW_DEFS: Array<{ key: string; label: string }> = [
  { key: 'sales', label: 'Sales' },
  { key: 'revenue', label: 'Revenue' },
  { key: 'financing_profit', label: 'Financing Profit' },
  { key: 'financing_margin_percent', label: 'Financing Margin %' },
  { key: 'expenses', label: 'Expenses' },
  { key: 'operating_profit', label: 'Operating Profit' },
  { key: 'opm_percent', label: 'OPM %' },
  { key: 'other_income', label: 'Other Income' },
  { key: 'interest', label: 'Interest' },
  { key: 'depreciation', label: 'Depreciation' },
  { key: 'profit_before_tax', label: 'Profit before tax' },
  { key: 'tax_percent', label: 'Tax %' },
  { key: 'net_profit', label: 'Net Profit' },
  { key: 'eps', label: 'EPS in Rs' },
  { key: 'dividend_payout_percent', label: 'Dividend Payout %' },
  { key: 'sales_yoy_growth_percent', label: 'Sales Growth %' },
  { key: 'expenses_manufacturing_cost_percent', label: 'Manufacturing Cost %' },
  { key: 'expenses_material_cost_percent', label: 'Material Cost %' },
  { key: 'expenses_employee_cost_percent', label: 'Employee Cost %' },
  { key: 'expenses_other_cost_percent', label: 'Other Cost %' },
  { key: 'other_income_normal', label: 'Other income normal' },
  { key: 'net_profit_profit_from_associates', label: 'Profit from Associates' },
  { key: 'net_profit_minority_share', label: 'Minority share' },
  { key: 'net_profit_profit_excl_excep', label: 'Profit excl Excep' },
  { key: 'net_profit_exceptional_items', label: 'Exceptional items' },
  { key: 'net_profit_exceptional_items_at', label: 'Exceptional items AT' },
  { key: 'net_profit_profit_for_eps', label: 'Profit for EPS' },
  { key: 'net_profit_profit_for_pe', label: 'Profit for PE' },
  { key: 'net_profit_yoy_profit_growth_percent', label: 'Profit Growth %' }
]

const BALANCE_SHEET_ROW_DEFS: Array<{ key: string; label: string }> = [
  { key: 'equity_capital', label: 'Equity Capital' },
  { key: 'reserves', label: 'Reserves' },
  { key: 'borrowing', label: 'Borrowing' },
  { key: 'deposits', label: 'Deposits' },
  { key: 'borrowings', label: 'Borrowings' },
  { key: 'long_term_borrowings', label: 'Long term Borrowings' },
  { key: 'short_term_borrowings', label: 'Short term Borrowings' },
  { key: 'other_borrowings', label: 'Other Borrowings' },
  { key: 'other_liabilities', label: 'Other Liabilities' },
  { key: 'advance_from_customers', label: 'Advance from Customers' },
  { key: 'lease_liabilities', label: 'Lease Liabilities' },
  { key: 'trade_payables', label: 'Trade Payables' },
  { key: 'other_liability_items', label: 'Other liability items' },
  { key: 'non_controlling_int', label: 'Non controlling int' },
  { key: 'total_liabilities', label: 'Total Liabilities' },
  { key: 'fixed_assets', label: 'Fixed Assets' },
  { key: 'gross_block', label: 'Gross Block' },
  { key: 'accumulated_depreciation', label: 'Accumulated Depreciation' },
  { key: 'building', label: 'Building' },
  { key: 'land', label: 'Land' },
  { key: 'plant_machinery', label: 'Plant Machinery' },
  { key: 'railway_sidings', label: 'Railway sidings' },
  { key: 'vehicles', label: 'Vehicles' },
  { key: 'computers', label: 'Computers' },
  { key: 'furniture_n_fittings', label: 'Furniture n fittings' },
  { key: 'equipments', label: 'Equipments' },
  { key: 'other_fixed_assets', label: 'Other fixed assets' },
  { key: 'intangible_assets', label: 'Intangible Assets' },
  { key: 'cwip', label: 'CWIP' },
  { key: 'investments', label: 'Investments' },
  { key: 'other_assets', label: 'Other Assets' },
  { key: 'inventories', label: 'Inventories' },
  { key: 'trade_receivables', label: 'Trade receivables' },
  { key: 'cash_equivalents', label: 'Cash Equivalents' },
  { key: 'loans_n_advances', label: 'Loans n Advances' },
  { key: 'other_asset_items', label: 'Other asset items' },
  { key: 'total_assets', label: 'Total Assets' }
]

const CASH_FLOW_ROW_DEFS: Array<{ key: string; label: string }> = [
  { key: 'cash_from_operating_activity', label: 'Cash from Operating Activity' },
  { key: 'profit_from_operations', label: 'Profit from operations' },
  { key: 'working_capital_changes', label: 'Working capital changes' },
  { key: 'receivables', label: 'Receivables' },
  { key: 'inventory', label: 'Inventory' },
  { key: 'payables', label: 'Payables' },
  { key: 'other_wc_items', label: 'Other WC items' },
  { key: 'direct_taxes', label: 'Direct taxes' },
  { key: 'interest_received', label: 'Interest received' },
  { key: 'dividends_received', label: 'Dividends received' },
  { key: 'exceptional_cf_items', label: 'Exceptional CF items' },
  { key: 'operating_investments', label: 'Operating investments' },
  { key: 'operating_borrowings', label: 'Operating borrowings' },
  { key: 'operating_deposits', label: 'Operating deposits' },
  { key: 'cash_from_investing_activity', label: 'Cash from Investing Activity' },
  { key: 'investments_purchased', label: 'Investments purchased' },
  { key: 'investments_sold', label: 'Investments sold' },
  { key: 'fixed_assets_purchased', label: 'Fixed assets purchased' },
  { key: 'fixed_assets_sold', label: 'Fixed assets sold' },
  { key: 'acquisition_of_companies', label: 'Acquisition of companies' },
  { key: 'invest_in_subsidiaries', label: 'Invest in subsidiaries' },
  { key: 'investment_in_group_cos', label: 'Investment in group cos' },
  { key: 'loans_advances', label: 'Loans Advances' },
  { key: 'other_investing_items', label: 'Other investing items' },
  { key: 'cash_from_financing_activity', label: 'Cash from Financing Activity' },
  { key: 'proceeds_from_shares', label: 'Proceeds from shares' },
  { key: 'proceeds_from_borrowings', label: 'Proceeds from borrowings' },
  { key: 'repayment_of_borrowings', label: 'Repayment of borrowings' },
  { key: 'interest_paid_fin', label: 'Interest paid fin' },
  { key: 'dividends_paid', label: 'Dividends paid' },
  { key: 'financial_liabilities', label: 'Financial liabilities' },
  { key: 'share_application_money', label: 'Share application money' },
  { key: 'other_financing_items', label: 'Other financing items' },
  { key: 'net_cash_flow', label: 'Net Cash Flow' }
]

const RATIOS_ROW_DEFS: Array<{ key: string; label: string }> = [
  { key: 'debtor_days', label: 'Debtor Days' },
  { key: 'inventory_days', label: 'Inventory Days' },
  { key: 'days_payable', label: 'Days Payable' },
  { key: 'cash_conversion_cycle', label: 'Cash Conversion Cycle' },
  { key: 'working_capital_days', label: 'Working Capital Days' },
  { key: 'roce_percent', label: 'ROCE %' },
  { key: 'roe_percent', label: 'ROE %' }
]

const SHAREHOLDING_ROW_DEFS: Array<{ key: string; label: string }> = [
  { key: 'promoters', label: 'Promoters' },
  { key: 'fiis', label: 'FIIs' },
  { key: 'diis', label: 'DIIs' },
  { key: 'public', label: 'Public' },
  { key: 'government', label: 'Government' },
  { key: 'others', label: 'Others' },
  { key: 'no_of_shareholders', label: 'No. of Shareholders' }
]

const createPeriodSortKey = (period?: string | null, periodNumeric?: string | null) => {
  const numeric = String(periodNumeric || '').trim()
  const numericMatch = numeric.match(/^(\d{1,2})-(\d{4})$/)
  if (numericMatch) return Number(numericMatch[2]) * 100 + Number(numericMatch[1])

  const label = String(period || '').trim()
  const monthOrder: Record<string, number> = {
    jan: 1,
    feb: 2,
    mar: 3,
    apr: 4,
    may: 5,
    jun: 6,
    jul: 7,
    aug: 8,
    sep: 9,
    oct: 10,
    nov: 11,
    dec: 12
  }
  const periodMatch = label.match(/^([A-Za-z]{3,9})\s+(\d{4})$/)
  if (periodMatch) {
    const monthKey = periodMatch[1].slice(0, 3).toLowerCase()
    const month = monthOrder[monthKey]
    if (month) return Number(periodMatch[2]) * 100 + month
  }

  return Number.MAX_SAFE_INTEGER
}

const mapSplitRowsFromApi = (
  rows?: QuarterlyFlatApiRow[],
  metricDefs: Array<{ key: string; label: string }> = QUARTERLY_ROW_DEFS
): TableData | null => {
  if (!Array.isArray(rows) || !rows.length) return null

  const sortedRows = [...rows].sort((a, b) => {
    const diff = createPeriodSortKey(a.period, a.period_numeric) - createPeriodSortKey(b.period, b.period_numeric)
    if (diff !== 0) return diff
    return String(a.period || a.period_numeric || '').localeCompare(String(b.period || b.period_numeric || ''), undefined, {
      numeric: true,
      sensitivity: 'base'
    })
  })
  if (!sortedRows.length) return null
  const columns = ['Metric', ...sortedRows.map((row, index) => String(row.period ?? row.period_numeric ?? `Period ${index + 1}`))]
  const mappedRows: TableDataRow[] = metricDefs.map((metric, index) => ({
    id: `quarter.metric.${index + 1}`,
    label: metric.label,
    cells: sortedRows.map(row => {
      const value = row?.[metric.key as keyof QuarterlyFlatApiRow]
      return value === null || value === undefined || value === '' ? '-' : (value as string | number)
    }),
    level: 0,
    hasChildren: false
  }))

  return {
    columns,
    rows: mappedRows
  }
}

export interface TodaysMarket {
  ltp: number
  open: number
  high: number
  low: number
  close: number
  percentChange: number
  dayCandles?: Candles[]
}

interface BuySellModal {
  type: 'BUY' | 'SELL'
  open: boolean
}

interface HoldingItem {
  portfolio_id: string
  portfolio_name: string
  portfolio_type: {
    display_name: string
    risk_level: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH'
  }
  holding: {
    active_stock_id: string
    symbol: string
    quantity: number
    locked_sell_quantity: number
    avg_buy_price: number
    invested_value: number
    last_updated_at: string
  }
}

interface GrowthMetricCard {
  title: string
  entries: Array<{
    title: string
    value: string | number
  }>
}

type MomentumTab = 'summary' | 'rsi' | 'macd' | 'roc' | 'stochastic'

const renameMetricTitle = (title: string): string => {
  const normalized = title.trim().toLowerCase()
  if (normalized === 'compounded sales growth') return 'Revenue CAGR'
  if (normalized === 'compounded profit growth') return 'Earnings CAGR'
  if (normalized === 'stock price cagr') return 'Price CAGR'
  if (normalized === 'return on equity') return 'Equity Return Trend'

  return title
}

const formatNumber = (value: unknown, digits = 2) => {
  const parsed = Number(value)
  if (value === null || value === undefined || !Number.isFinite(parsed)) return '-'
  return parsed.toFixed(digits)
}

const formatSignedPct = (value: unknown, digits = 2) => {
  const parsed = Number(value)
  if (value === null || value === undefined || !Number.isFinite(parsed)) return '-'
  return `${parsed >= 0 ? '+' : ''}${parsed.toFixed(digits)}%`
}

const getMomentumChipColor = (signal?: string | null) => {
  const normalized = String(signal || '').toLowerCase()

  if (normalized.includes('strong bullish') || normalized.includes('bullish crossover') || normalized === 'bullish') {
    return 'success' as const
  }

  if (normalized.includes('strong bearish') || normalized.includes('bearish crossover') || normalized === 'bearish') {
    return 'error' as const
  }

  if (normalized.includes('overbought')) {
    return 'warning' as const
  }

  if (normalized.includes('oversold')) {
    return 'success' as const
  }

  if (normalized.includes('neutral')) {
    return 'primary' as const
  }

  return 'default' as const
}

const Dashboard = () => {
  // get symbol from url
  const [fundamentals, setFundamentals] = useState<Fundamental | null>()
  const [peersTable, setPeersTable] = useState<TableData | null>()
  const [yearlyResult, setYearlyResult] = useState<TableData | null>()
  const [quarterlyResult, setQuarterlyResult] = useState<TableData | null>()
  const [profitLossResult, setProfitLossResult] = useState<TableData | null>()
  const [balanceSheetResult, setBalanceSheetResult] = useState<TableData | null>()
  const [cashFlowResult, setCashFlowResult] = useState<TableData | null>()
  const [ratiosResult, setRatiosResult] = useState<TableData | null>()
  const [shareholdingResult, setShareholdingResult] = useState<TableData | null>()
  const [balanceSheet, setBalanceSheet] = useState<TableData | null>()
  const [cashFlows, setCashFlows] = useState<TableData | null>()
  const [todaysMarket, setTodaysMarket] = useState<TodaysMarket | null>()
  const [ratios, setRatios] = useState<TableData | null>()
  const [shareholdingTable, setShareholdingTable] = useState<TableData | null>()
  const [momentumTab, setMomentumTab] = useState<MomentumTab>('summary')
  const [showBuySellModal, setShowBuySellModal] = useState<BuySellModal>({ type: 'BUY', open: false })
  const [growthMetricCards, setGrowthMetricCards] = useState<GrowthMetricCard[]>([])
  const router = useRouter()
  const { symbol } = router.query
  const symbolCode = typeof symbol === 'string' ? symbol : ''
  const { data } = useSimpleSWR<FundamentalApiPayload>(
    symbolCode ? `${ENDURL.GET_STOCK_FUNDAMENTAL_OVERVIEW_DETAILS}/${symbolCode}` : (null as any)
  )
  const { data: rawFundamentalsData } = useSimpleSWR<FundamentalApiPayload>(
    symbolCode ? `${ENDURL.GET_STOCK_FUNDAMENTAL_DETAILS}/${symbolCode}` : (null as any)
  )
  const { data: quarterlySplitData } = useSimpleSWR<QuarterlyFlatApiPayload>(
    symbolCode ? `${ENDURL.GET_STOCK_FUNDAMENTAL_QUARTERLY_DETAILS}/${symbolCode}` : (null as any)
  )
  const { data: profitLossSplitData } = useSimpleSWR<QuarterlyFlatApiPayload>(
    symbolCode ? `${ENDURL.GET_STOCK_FUNDAMENTAL_PROFIT_LOSS_DETAILS}/${symbolCode}` : (null as any)
  )
  const { data: balanceSheetSplitData } = useSimpleSWR<QuarterlyFlatApiPayload>(
    symbolCode ? `${ENDURL.GET_STOCK_FUNDAMENTAL_BALANCE_SHEET_DETAILS}/${symbolCode}` : (null as any)
  )
  const { data: cashFlowSplitData } = useSimpleSWR<QuarterlyFlatApiPayload>(
    symbolCode ? `${ENDURL.GET_STOCK_FUNDAMENTAL_CASH_FLOW_DETAILS}/${symbolCode}` : (null as any)
  )
  const { data: ratiosSplitData } = useSimpleSWR<QuarterlyFlatApiPayload>(
    symbolCode ? `${ENDURL.GET_STOCK_FUNDAMENTAL_RATIOS_DETAILS}/${symbolCode}` : (null as any)
  )
  const { data: shareholdingSplitData } = useSimpleSWR<QuarterlyFlatApiPayload>(
    symbolCode ? `${ENDURL.GET_STOCK_FUNDAMENTAL_SHAREHOLDING_DETAILS}/${symbolCode}` : (null as any)
  )
  const dispatch = useDispatch()
  const { mutate } = useSWRConfig()
  const myPortfolios = useSelector((state: RootState) => state.portfolio.myPortfolios)
  const selectedPortfolioId = useSelector((state: RootState) => state.portfolio.selectedPortfolioId)
  const { data: portfolioTypesData } = useSimpleSWR<PortfolioType[]>(ENDURL.GET_PORTFOLIO_TYPES)
  const { data: myPortfolioData } = useSimpleSWR<MyPortfolio[]>(ENDURL.GET_MY_PORTFOLIOS)
  const activeStockId = data?.active_stock_id || ''
  const { data: holdingsData } = useSimpleSWR<HoldingItem[]>(
    activeStockId ? (`${ENDURL.GET_STOCK_HOLDINGS}/${activeStockId}` as string) : (null as any)
  )

  const liveStocksData = useLivePrices(symbolCode ? [symbolCode] : [])

  const handleOpenBuySellModal = (type: 'BUY' | 'SELL') => {
    console.log('handleOpenBuySellModal', type)
    setShowBuySellModal({ type, open: true })
  }

  const handleCloseBuySellModal = () => {
    setShowBuySellModal({ type: 'BUY', open: false })
  }

  const handleOrderSuccess = () => {
    if (symbolCode) mutate(`${ENDURL.GET_STOCK_FUNDAMENTAL_DETAILS}/${symbolCode}`)
    if (activeStockId) mutate(`${ENDURL.GET_STOCK_HOLDINGS}/${activeStockId}`)
    mutate(ENDURL.GET_PORTFOLIO_TYPES)
    mutate(ENDURL.GET_MY_PORTFOLIOS)
  }

  useEffect(() => {
    if (portfolioTypesData?.length) {
      dispatch(setPortfolioTypes(portfolioTypesData))
    }
  }, [dispatch, portfolioTypesData])

  useEffect(() => {
    if (myPortfolioData?.length) {
      dispatch(setMyPortfolios(myPortfolioData))
    }
  }, [dispatch, myPortfolioData])

  useEffect(() => {
    const live = symbolCode ? liveStocksData?.[symbolCode] : null
    const snapshot = data?.summary?.market_snapshot
    const parsedHighLow = parseHighLow(snapshot?.high_low)
    const fallbackLtp = toNumber(snapshot?.current_price, 0)

    if (live && Object.keys(live).length > 0) {
      const open = toNumber(live.open, 0)
      const ltp = toNumber(live.ltp, fallbackLtp)

      setTodaysMarket({
        ltp,
        open,
        high: toNumber(live.high, parsedHighLow.high),
        low: toNumber(live.low, parsedHighLow.low),
        close: toNumber(live.close, ltp),
        percentChange: open ? ((ltp - open) / open) * 100 : 0,
        dayCandles: (live.dayCandles || []) as Candles[]
      })

      return
    }

    setTodaysMarket({
      ltp: fallbackLtp,
      open: 0,
      high: parsedHighLow.high,
      low: parsedHighLow.low,
      close: fallbackLtp,
      percentChange: 0,
      dayCandles: []
    })
  }, [data, liveStocksData, symbolCode])

  useEffect(() => {
    if (!data) return

    const snapshot = data.summary?.market_snapshot
    const parsedHighLow = parseHighLow(snapshot?.high_low)

    setFundamentals({
      companyName: data.company || symbolCode.toUpperCase(),
      marketSnapshot: {
        marketCap: toNumber(snapshot?.market_cap, 0),
        currentPrice: toNumber(todaysMarket?.ltp, toNumber(snapshot?.current_price, 0)),
        peRatio: toNumber(snapshot?.pe_ratio ?? snapshot?.stock_pe, 0),
        roce: toNumber(snapshot?.roce, 0),
        roe: toNumber(snapshot?.roe, 0),
        bookValue: toNumber(snapshot?.book_value, 0),
        dividendYield: toNumber(snapshot?.dividend_yield, 0),
        faceValue: toNumber(snapshot?.face_value, 0),
        high: toNumber(todaysMarket?.high, parsedHighLow.high),
        low: toNumber(todaysMarket?.low, parsedHighLow.low),
        open: toNumber(todaysMarket?.open, 0),
        close: toNumber(todaysMarket?.close, 0),
        date: data.last_updated_at || ''
      },
      pros: data.summary?.pros || [],
      cons: data.summary?.cons || []
    })

    setQuarterlyResult(mapSplitRowsFromApi(quarterlySplitData?.rows, QUARTERLY_ROW_DEFS))
    setProfitLossResult(mapSplitRowsFromApi(profitLossSplitData?.rows, PROFIT_LOSS_ROW_DEFS))
    setBalanceSheetResult(mapSplitRowsFromApi(balanceSheetSplitData?.rows, BALANCE_SHEET_ROW_DEFS))
    setCashFlowResult(mapSplitRowsFromApi(cashFlowSplitData?.rows, CASH_FLOW_ROW_DEFS))
    setRatiosResult(mapSplitRowsFromApi(ratiosSplitData?.rows, RATIOS_ROW_DEFS))
    setShareholdingResult(mapSplitRowsFromApi(shareholdingSplitData?.rows, SHAREHOLDING_ROW_DEFS))
    setYearlyResult(mapTableFromApi(data.tables?.profit_loss))
    setBalanceSheet(mapTableFromApi(data.tables?.balance_sheet))
    setCashFlows(mapTableFromApi(data.tables?.cash_flow))
    setRatios(mapTableFromApi(data.tables?.ratios))
    setPeersTable(mapPeersTableFromApi(data.peers?.main_table))
    setShareholdingTable(mapTableFromApi(data.tables?.shareholdings))
    setGrowthMetricCards(
      Object.values(rawFundamentalsData?.other_details?.profit_loss || {})
        .filter(item => item?.title && item?.entries?.length)
        .map(item => ({
          title: renameMetricTitle(item.title || ''),
          entries: (item.entries || []).map(entry => ({
            title: entry.title || '',
            value: entry.value ?? '-'
          }))
        }))
    )
  }, [
    data,
    rawFundamentalsData,
    quarterlySplitData,
    profitLossSplitData,
    balanceSheetSplitData,
    cashFlowSplitData,
    ratiosSplitData,
    shareholdingSplitData,
    symbolCode,
    todaysMarket
  ])
  const holdings = holdingsData || []
  const totalHoldingQty = holdings.reduce((sum, item) => sum + (item.holding?.quantity || 0), 0)
  const totalHoldingValue = holdings.reduce((sum, item) => sum + (item.holding?.invested_value || 0), 0)
  const documents = data?.documents
  const announcements = documents?.announcements?.items || []
  const annualReports = documents?.annual_reports?.items || []
  const creditRatings = documents?.credit_ratings?.items || []
  const concalls = documents?.concalls?.items || []
  const momentumSnapshot = data?.technicals || null
  const companyInfo = data?.company_info || null

  const getRiskColor = (risk: string) => {
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

  return (
    <ApexChartWrapper>
      {symbolCode && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant='h6' sx={{ fontWeight: 700 }}>
            Structured Overview View
          </Typography>
          <Button component={Link} href={`/stock-fundamental/${symbolCode}`} variant='outlined' size='small'>
            Open Raw View
          </Button>
        </Box>
      )}

      {!fundamentals ? (
        <LinearProgress color='primary' />
      ) : (
        <Grid container spacing={6}>
          <Grid item xs={12} md={12}>
            <CompanyStatisticsCard
              fundamentals={fundamentals}
              stockSymbol={symbolCode}
              todaysMarket={todaysMarket as TodaysMarket}
              onBuy={() => handleOpenBuySellModal('BUY')}
              onSell={() => handleOpenBuySellModal('SELL')}
              totalHoldingQty={totalHoldingQty}
              totalHoldingValue={totalHoldingValue}
            />
          </Grid>

          {companyInfo && (
            <Grid item xs={12}>
              <Card>
                <CardHeader title='Company Overview' titleTypographyProps={{ variant: 'h6', color: 'primary' }} />
                <CardContent>
                  {companyInfo.about && (
                    <Box sx={{ mb: companyInfo.key_points ? 3 : 0 }}>
                      <Typography variant='subtitle2' sx={{ fontWeight: 700, mb: 1 }}>
                        About
                      </Typography>
                      <Typography variant='body2' color='text.secondary' sx={{ whiteSpace: 'pre-wrap' }}>
                        {companyInfo.about}
                      </Typography>
                    </Box>
                  )}

                  {companyInfo.key_points && (
                    <Box sx={{ mb: companyInfo.links?.length ? 3 : 0 }}>
                      <Typography variant='subtitle2' sx={{ fontWeight: 700, mb: 1 }}>
                        Key Points
                      </Typography>
                      <Typography variant='body2' color='text.secondary' sx={{ whiteSpace: 'pre-wrap' }}>
                        {companyInfo.key_points}
                      </Typography>
                    </Box>
                  )}

                  {companyInfo.links?.length ? (
                    <Box>
                      <Typography variant='subtitle2' sx={{ fontWeight: 700, mb: 1 }}>
                        Links
                      </Typography>
                      <Stack direction='row' spacing={1} useFlexGap flexWrap='wrap'>
                        {companyInfo.links.map((linkItem, index) => (
                          <Button
                            key={`${linkItem.title || 'link'}-${index}`}
                            component={Link}
                            href={linkItem.url || '#'}
                            target='_blank'
                            rel='noopener noreferrer'
                            variant='outlined'
                            size='small'
                          >
                            {linkItem.title || 'Link'}
                          </Button>
                        ))}
                      </Stack>
                    </Box>
                  ) : null}
                </CardContent>
              </Card>
            </Grid>
          )}

          <Grid item xs={12}>
            <Card sx={{ borderRadius: 3 }}>
              <CardHeader title='Holdings By Portfolio' titleTypographyProps={{ variant: 'h6', fontWeight: 600 }} />

              <Box sx={{ px: 6, pb: 6 }}>
                {holdings.length === 0 ? (
                  <Typography variant='body2' color='text.secondary'>
                    No holdings found for this stock.
                  </Typography>
                ) : (
                  <Grid container spacing={4}>
                    {holdings.map(item => (
                      <Grid item xs={12} md={6} key={`${item.portfolio_id}-${item.holding.active_stock_id}`}>
                        <Card
                          sx={{
                            height: '100%',
                            borderRadius: 3,
                            p: 0,
                            overflow: 'hidden',
                            boxShadow: '0 6px 18px rgba(0,0,0,0.06)'
                          }}
                        >
                          {/* Header strip */}
                          <Box
                            sx={{
                              px: 4,
                              py: 3,
                              background: theme =>
                                `linear-gradient(135deg, ${theme.palette.primary.light}22, ${theme.palette.primary.main}11)`
                            }}
                          >
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                              }}
                            >
                              <Box>
                                <Typography variant='subtitle1' fontWeight={600}>
                                  {item.portfolio_name}
                                </Typography>
                                <Typography variant='caption' color='text.secondary'>
                                  {item.portfolio_type?.display_name}
                                </Typography>
                              </Box>

                              <Chip
                                label={item.portfolio_type?.risk_level || 'NONE'}
                                size='small'
                                color={getRiskColor(item.portfolio_type?.risk_level || 'NONE')}
                                sx={{ fontWeight: 500 }}
                              />
                            </Box>
                          </Box>

                          {/* Body */}
                          <Box sx={{ p: 4 }}>
                            <Grid container spacing={3}>
                              <Grid item xs={6}>
                                <Typography variant='caption' color='text.secondary'>
                                  Quantity
                                </Typography>
                                <Typography variant='subtitle1' fontWeight={600}>
                                  {item.holding?.quantity ?? 0}
                                </Typography>
                              </Grid>

                              <Grid item xs={6}>
                                <Typography variant='caption' color='text.secondary'>
                                  Avg Buy
                                </Typography>
                                <Typography variant='subtitle1' fontWeight={600}>
                                  {TC.CURRENCY}
                                  {item.holding?.avg_buy_price.toFixed(2) ?? 0}
                                </Typography>
                              </Grid>

                              <Grid item xs={6}>
                                <Typography variant='caption' color='text.secondary'>
                                  Invested
                                </Typography>
                                <Typography variant='subtitle1' fontWeight={600}>
                                  {TC.CURRENCY}
                                  {item.holding?.invested_value.toFixed(2) ?? 0}
                                </Typography>
                              </Grid>

                              <Grid item xs={6}>
                                <Typography variant='caption' color='text.secondary'>
                                  Last Updated
                                </Typography>
                                <Typography variant='body2'>
                                  {item.holding?.last_updated_at
                                    ? new Date(item.holding.last_updated_at).toLocaleString()
                                    : '-'}
                                </Typography>
                              </Grid>
                            </Grid>
                          </Box>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Box>
            </Card>
          </Grid>

          <Grid item xs={12} md={12} lg={12}>
            <ProsCons fundamentals={fundamentals} />
          </Grid>

          {peersTable && (
            <Grid item xs={12}>
              <Card>
                <CardHeader title='Peer Benchmark' titleTypographyProps={{ variant: 'h6', color: 'primary' }} />
                <FundamentalTable data={peersTable} />
              </Card>
            </Grid>
          )}

          {quarterlyResult && (
            <Grid item xs={12}>
              <Card>
                <CardHeader title='Quarterly Performance (Split Table)' titleTypographyProps={{ variant: 'h6', color: 'primary' }} />
                <FundamentalTable data={quarterlyResult} />
              </Card>
            </Grid>
          )}

          {profitLossResult && (
            <Grid item xs={12}>
              <Card>
                <CardHeader title='Income Statement (Split Table)' titleTypographyProps={{ variant: 'h6', color: 'primary' }} />
                <FundamentalTable data={profitLossResult} />
              </Card>
            </Grid>
          )}

          {balanceSheetResult && (
            <Grid item xs={12}>
              <Card>
                <CardHeader title='Financial Position (Split Table)' titleTypographyProps={{ variant: 'h6', color: 'primary' }} />
                <FundamentalTable data={balanceSheetResult} />
              </Card>
            </Grid>
          )}

          {cashFlowResult && (
            <Grid item xs={12}>
              <Card>
                <CardHeader title='Cash Movement (Split Table)' titleTypographyProps={{ variant: 'h6', color: 'primary' }} />
                <FundamentalTable data={cashFlowResult} />
              </Card>
            </Grid>
          )}

          {ratiosResult && (
            <Grid item xs={12}>
              <Card>
                <CardHeader title='Key Ratios (Split Table)' titleTypographyProps={{ variant: 'h6', color: 'primary' }} />
                <FundamentalTable data={ratiosResult} />
              </Card>
            </Grid>
          )}

          {shareholdingResult && (
            <Grid item xs={12}>
              <Card>
                <CardHeader title='Ownership Structure (Split Table)' titleTypographyProps={{ variant: 'h6', color: 'primary' }} />
                <FundamentalTable data={shareholdingResult} />
              </Card>
            </Grid>
          )}

          {yearlyResult && (
            <Grid item xs={12}>
              <Card>
                <CardHeader title='Income Statement' titleTypographyProps={{ variant: 'h6', color: 'primary' }} />
                <FundamentalTable data={yearlyResult} />
              </Card>
            </Grid>
          )}

          {growthMetricCards.length > 0 && (
            <Grid item xs={12}>
              <Grid container spacing={4}>
                {growthMetricCards.map(card => (
                  <Grid item xs={12} sm={6} lg={3} key={card.title}>
                    <Card variant='outlined'>
                      <CardHeader
                        title={card.title}
                        titleTypographyProps={{ variant: 'h6', sx: { fontWeight: 600, fontSize: '1.1rem' } }}
                        sx={{ pb: 1 }}
                      />
                      <Box sx={{ px: 4, pb: 4 }}>
                        {card.entries.map(entry => (
                          <Box
                            key={`${card.title}-${entry.title}`}
                            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}
                          >
                            <Typography variant='body1' color='text.secondary'>
                              {entry.title}
                            </Typography>
                            <Typography variant='body1' sx={{ fontWeight: 600 }}>
                              {entry.value}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Grid>
          )}

          {balanceSheet && (
            <Grid item xs={12}>
              <Card>
                <CardHeader title='Financial Position' titleTypographyProps={{ variant: 'h6', color: 'primary' }} />
                <FundamentalTable data={balanceSheet} />
              </Card>
            </Grid>
          )}

          {cashFlows && (
            <Grid item xs={12}>
              <Card>
                <CardHeader title='Cash Movement' titleTypographyProps={{ variant: 'h6', color: 'primary' }} />
                <FundamentalTable data={cashFlows} />
              </Card>
            </Grid>
          )}

          {ratios && (
            <Grid item xs={12}>
              <Card>
                <CardHeader title='Key Ratios' titleTypographyProps={{ variant: 'h6', color: 'primary' }} />
                <FundamentalTable data={ratios} />
              </Card>
            </Grid>
          )}

          {shareholdingTable && (
            <Grid item xs={12}>
              <Card>
                <CardHeader title='Ownership Structure' titleTypographyProps={{ variant: 'h6', color: 'primary' }} />
                <FundamentalTable data={shareholdingTable} />
              </Card>
            </Grid>
          )}

          <Grid item xs={12}>
            <Card sx={{ borderRadius: 3 }}>
              <CardHeader
                title='Momentum Analysis'
                subheader='RSI, MACD, ROC, and Stochastic signals from daily EOD data.'
                titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
              />
              <CardContent sx={{ pt: 0 }}>
                {momentumSnapshot ? (
                  <Stack spacing={3}>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                      <Tabs
                        value={momentumTab}
                        onChange={(_, value) => setMomentumTab(value as MomentumTab)}
                        aria-label='momentum analysis tabs'
                        variant='scrollable'
                        scrollButtons='auto'
                      >
                        <Tab value='summary' label='Summary' />
                        <Tab value='rsi' label='RSI' />
                        <Tab value='macd' label='MACD' />
                        <Tab value='roc' label='ROC' />
                        <Tab value='stochastic' label='Stochastic' />
                      </Tabs>
                    </Box>

                    <Box
                      sx={{
                        p: 3,
                        borderRadius: 2,
                        bgcolor: theme => `${theme.palette.primary.main}08`,
                        border: '1px solid',
                        borderColor: 'divider'
                      }}
                    >
                      {momentumTab === 'summary' && (
                        <Stack spacing={2}>
                          <Box>
                            <Typography variant='subtitle1' fontWeight={700}>
                              Momentum Snapshot
                            </Typography>
                            <Typography variant='body2' color='text.secondary'>
                              {momentumSnapshot.trade_date
                                ? `Latest EOD date: ${momentumSnapshot.trade_date}`
                                : 'Latest EOD data is available, but the date could not be resolved.'}
                            </Typography>
                          </Box>

                          <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                            <Chip label={`Score: ${momentumSnapshot.momentum_score || 'Neutral'}`} color={getMomentumChipColor(momentumSnapshot.momentum_score)} />
                            <Chip label={`RSI: ${formatNumber(momentumSnapshot.rsi_14)}`} variant='outlined' />
                            <Chip label={`MACD: ${formatNumber(momentumSnapshot.macd_line)}`} variant='outlined' />
                            <Chip label={`ROC 20D: ${formatSignedPct(momentumSnapshot.roc_20d)}`} variant='outlined' />
                            <Chip label={`Stoch %K: ${formatNumber(momentumSnapshot.stoch_k)}`} variant='outlined' />
                          </Stack>

                          <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                              <Card variant='outlined' sx={{ height: '100%' }}>
                                <CardContent>
                                  <Typography variant='subtitle2' color='text.secondary'>
                                    What this tab means
                                  </Typography>
                                  <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
                                    This combines trend speed, price acceleration, and short-term range position into one quick read.
                                    Use it to see whether the stock is heating up, cooling down, or staying mixed.
                                  </Typography>
                                </CardContent>
                              </Card>
                            </Grid>
                            <Grid item xs={12} md={6}>
                              <Card variant='outlined' sx={{ height: '100%' }}>
                                <CardContent>
                                  <Typography variant='subtitle2' color='text.secondary'>
                                    Quick interpretation
                                  </Typography>
                                  <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
                                    Bullish combinations usually mean RSI is firm, MACD is above signal, ROC is positive, and Stochastic is
                                    not stuck near oversold levels. Bearish setups do the opposite.
                                  </Typography>
                                </CardContent>
                              </Card>
                            </Grid>
                          </Grid>
                        </Stack>
                      )}

                      {momentumTab === 'rsi' && (
                        <Stack spacing={2}>
                          <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap alignItems='center'>
                            <Chip label={`RSI ${formatNumber(momentumSnapshot.rsi_14)}`} color={getMomentumChipColor(momentumSnapshot.rsi_signal)} />
                            <Chip label={momentumSnapshot.rsi_signal || 'Neutral'} variant='outlined' />
                            <Chip label={`Close ${formatNumber(momentumSnapshot.close)}`} variant='outlined' />
                          </Stack>
                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={4}>
                              <Card variant='outlined'>
                                <CardContent>
                                  <Typography variant='caption' color='text.secondary'>
                                    Latest RSI
                                  </Typography>
                                  <Typography variant='h5'>{formatNumber(momentumSnapshot.rsi_14)}</Typography>
                                </CardContent>
                              </Card>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                              <Card variant='outlined'>
                                <CardContent>
                                  <Typography variant='caption' color='text.secondary'>
                                    RSI Signal
                                  </Typography>
                                  <Typography variant='h5'>{momentumSnapshot.rsi_signal || '-'}</Typography>
                                </CardContent>
                              </Card>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                              <Card variant='outlined'>
                                <CardContent>
                                  <Typography variant='caption' color='text.secondary'>
                                    Latest Close
                                  </Typography>
                                  <Typography variant='h5'>{formatNumber(momentumSnapshot.close)}</Typography>
                                </CardContent>
                              </Card>
                            </Grid>
                          </Grid>
                          <Box>
                            <Typography variant='subtitle2' sx={{ mb: 1 }}>
                              How to read RSI
                            </Typography>
                            <Typography variant='body2' color='text.secondary'>
                              RSI tracks whether recent gains are outpacing recent losses. Above 70 usually means the stock is stretched to
                              the upside. Below 30 usually means it is stretched to the downside. Around 50 is the middle zone.
                            </Typography>
                          </Box>
                        </Stack>
                      )}

                      {momentumTab === 'macd' && (
                        <Stack spacing={2}>
                          <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap alignItems='center'>
                            <Chip label={momentumSnapshot.macd_signal || 'Neutral'} color={getMomentumChipColor(momentumSnapshot.macd_signal)} />
                            <Chip label={`MACD ${formatNumber(momentumSnapshot.macd_line)}`} variant='outlined' />
                            <Chip label={`Signal ${formatNumber(momentumSnapshot.signal_line)}`} variant='outlined' />
                            <Chip label={`Histogram ${formatNumber(momentumSnapshot.macd_histogram)}`} variant='outlined' />
                          </Stack>
                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={4}>
                              <Card variant='outlined'>
                                <CardContent>
                                  <Typography variant='caption' color='text.secondary'>
                                    MACD Line
                                  </Typography>
                                  <Typography variant='h5'>{formatNumber(momentumSnapshot.macd_line)}</Typography>
                                </CardContent>
                              </Card>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                              <Card variant='outlined'>
                                <CardContent>
                                  <Typography variant='caption' color='text.secondary'>
                                    Signal Line
                                  </Typography>
                                  <Typography variant='h5'>{formatNumber(momentumSnapshot.signal_line)}</Typography>
                                </CardContent>
                              </Card>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                              <Card variant='outlined'>
                                <CardContent>
                                  <Typography variant='caption' color='text.secondary'>
                                    Histogram
                                  </Typography>
                                  <Typography variant='h5'>{formatNumber(momentumSnapshot.macd_histogram)}</Typography>
                                </CardContent>
                              </Card>
                            </Grid>
                          </Grid>
                          <Box>
                            <Typography variant='subtitle2' sx={{ mb: 1 }}>
                              How to read MACD
                            </Typography>
                            <Typography variant='body2' color='text.secondary'>
                              MACD compares a faster moving average with a slower one to show momentum shifts. When MACD crosses above the
                              signal line, momentum is improving. When it crosses below, momentum is fading.
                            </Typography>
                          </Box>
                        </Stack>
                      )}

                      {momentumTab === 'roc' && (
                        <Stack spacing={2}>
                          <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap alignItems='center'>
                            <Chip label={`10D ${formatSignedPct(momentumSnapshot.roc_10d)}`} variant='outlined' />
                            <Chip label={`20D ${formatSignedPct(momentumSnapshot.roc_20d)}`} variant='outlined' />
                            <Chip label={`60D ${formatSignedPct(momentumSnapshot.roc_60d)}`} variant='outlined' />
                            <Chip label={`1Y ${formatSignedPct(momentumSnapshot.roc_1yr)}`} variant='outlined' />
                          </Stack>
                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={6} md={3}>
                              <Card variant='outlined'>
                                <CardContent>
                                  <Typography variant='caption' color='text.secondary'>
                                    10 Day ROC
                                  </Typography>
                                  <Typography variant='h5'>{formatSignedPct(momentumSnapshot.roc_10d)}</Typography>
                                </CardContent>
                              </Card>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                              <Card variant='outlined'>
                                <CardContent>
                                  <Typography variant='caption' color='text.secondary'>
                                    20 Day ROC
                                  </Typography>
                                  <Typography variant='h5'>{formatSignedPct(momentumSnapshot.roc_20d)}</Typography>
                                </CardContent>
                              </Card>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                              <Card variant='outlined'>
                                <CardContent>
                                  <Typography variant='caption' color='text.secondary'>
                                    60 Day ROC
                                  </Typography>
                                  <Typography variant='h5'>{formatSignedPct(momentumSnapshot.roc_60d)}</Typography>
                                </CardContent>
                              </Card>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                              <Card variant='outlined'>
                                <CardContent>
                                  <Typography variant='caption' color='text.secondary'>
                                    1 Year ROC
                                  </Typography>
                                  <Typography variant='h5'>{formatSignedPct(momentumSnapshot.roc_1yr)}</Typography>
                                </CardContent>
                              </Card>
                            </Grid>
                          </Grid>
                          <Box>
                            <Typography variant='subtitle2' sx={{ mb: 1 }}>
                              How to read ROC
                            </Typography>
                            <Typography variant='body2' color='text.secondary'>
                              Rate of Change shows how far price has moved over fixed windows. Positive ROC means the stock is above its
                              earlier price. Negative ROC means it is trading below that earlier reference point.
                            </Typography>
                          </Box>
                        </Stack>
                      )}

                      {momentumTab === 'stochastic' && (
                        <Stack spacing={2}>
                          <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap alignItems='center'>
                            <Chip label={`K ${formatNumber(momentumSnapshot.stoch_k)}`} color={getMomentumChipColor(momentumSnapshot.stoch_signal)} />
                            <Chip label={`D ${formatNumber(momentumSnapshot.stoch_d)}`} variant='outlined' />
                            <Chip label={momentumSnapshot.stoch_signal || 'Neutral'} variant='outlined' />
                          </Stack>
                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={4}>
                              <Card variant='outlined'>
                                <CardContent>
                                  <Typography variant='caption' color='text.secondary'>
                                    %K
                                  </Typography>
                                  <Typography variant='h5'>{formatNumber(momentumSnapshot.stoch_k)}</Typography>
                                </CardContent>
                              </Card>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                              <Card variant='outlined'>
                                <CardContent>
                                  <Typography variant='caption' color='text.secondary'>
                                    %D
                                  </Typography>
                                  <Typography variant='h5'>{formatNumber(momentumSnapshot.stoch_d)}</Typography>
                                </CardContent>
                              </Card>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                              <Card variant='outlined'>
                                <CardContent>
                                  <Typography variant='caption' color='text.secondary'>
                                    Signal
                                  </Typography>
                                  <Typography variant='h5'>{momentumSnapshot.stoch_signal || '-'}</Typography>
                                </CardContent>
                              </Card>
                            </Grid>
                          </Grid>
                          <Box>
                            <Typography variant='subtitle2' sx={{ mb: 1 }}>
                              How to read Stochastic
                            </Typography>
                            <Typography variant='body2' color='text.secondary'>
                              The Stochastic Oscillator compares the latest close with the recent high-low range. Values near 80 or above
                              suggest the stock is near the top of its range. Values near 20 or below suggest it is near the bottom of its
                              range.
                            </Typography>
                          </Box>
                        </Stack>
                      )}
                    </Box>
                  </Stack>
                ) : (
                  <Box sx={{ px: 1, pb: 1 }}>
                    <Typography variant='body2' color='text.secondary'>
                      Not enough EOD history is available yet to calculate the momentum indicators. Once daily candles are loaded, this
                      tab will show RSI, MACD, ROC, and Stochastic signals automatically.
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {(announcements.length > 0 ||
            annualReports.length > 0 ||
            creditRatings.length > 0 ||
            concalls.length > 0) && (
            <Grid item xs={12}>
              <Card>
                <CardHeader title='Research Library' titleTypographyProps={{ variant: 'h4' }} />
                <Box sx={{ px: 4, pb: 4 }}>
                  <MuiGrid container spacing={4}>
                    <MuiGrid item xs={12} md={6} lg={4}>
                      <Card variant='outlined'>
                        <CardHeader
                          title='Regulatory Updates'
                          titleTypographyProps={{ variant: 'h6' }}
                          sx={{ pb: 1 }}
                        />
                        <Box sx={{ px: 4, pb: 4 }}>
                          {announcements.slice(0, 4).map((item, index) => (
                            <Box key={`announcement-${index}`} sx={{ mb: 3 }}>
                              <Link href={item.url || '#'} target='_blank' rel='noopener noreferrer' underline='hover'>
                                {item.title || '-'}
                              </Link>
                              <Typography variant='body2' color='text.secondary'>
                                {item.subtitle || ''}
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      </Card>
                    </MuiGrid>

                    <MuiGrid item xs={12} sm={6} lg={2}>
                      <Card variant='outlined'>
                        <CardHeader title='Yearly Filings' titleTypographyProps={{ variant: 'h6' }} sx={{ pb: 1 }} />
                        <Box sx={{ px: 4, pb: 4 }}>
                          {annualReports.slice(0, 6).map((item, index) => (
                            <Box key={`annual-${index}`} sx={{ mb: 3 }}>
                              <Link href={item.url || '#'} target='_blank' rel='noopener noreferrer' underline='hover'>
                                {item.title || '-'}
                              </Link>
                              <Typography variant='body2' color='text.secondary'>
                                {item.subtitle || ''}
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      </Card>
                    </MuiGrid>

                    <MuiGrid item xs={12} sm={6} lg={2}>
                      <Card variant='outlined'>
                        <CardHeader title='Rating Actions' titleTypographyProps={{ variant: 'h6' }} sx={{ pb: 1 }} />
                        <Box sx={{ px: 4, pb: 4 }}>
                          {creditRatings.slice(0, 6).map((item, index) => (
                            <Box key={`rating-${index}`} sx={{ mb: 3 }}>
                              <Link href={item.url || '#'} target='_blank' rel='noopener noreferrer' underline='hover'>
                                {item.title || '-'}
                              </Link>
                              <Typography variant='body2' color='text.secondary'>
                                {item.subtitle || ''}
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      </Card>
                    </MuiGrid>

                    <MuiGrid item xs={12} lg={4}>
                      <Card variant='outlined'>
                        <CardHeader title='Earnings Calls' titleTypographyProps={{ variant: 'h6' }} sx={{ pb: 1 }} />
                        <Box sx={{ px: 4, pb: 4 }}>
                          {concalls.slice(0, 8).map((item, index) => (
                            <Box
                              key={`concall-${index}`}
                              sx={{
                                mb: 2.5,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 2
                              }}
                            >
                              <Typography variant='body1' color='text.secondary' sx={{ minWidth: 84 }}>
                                {item.label || '-'}
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                {(item.links || []).map((linkItem, linkIndex) => (
                                  <Button
                                    key={`concall-link-${index}-${linkIndex}`}
                                    size='small'
                                    variant='outlined'
                                    component='a'
                                    href={linkItem.url || '#'}
                                    target='_blank'
                                    rel='noopener noreferrer'
                                  >
                                    {linkItem.title || 'Link'}
                                  </Button>
                                ))}
                              </Box>
                            </Box>
                          ))}
                        </Box>
                      </Card>
                    </MuiGrid>
                  </MuiGrid>
                </Box>
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
      <BuySellOrderModal
        open={showBuySellModal.open}
        onClose={handleCloseBuySellModal}
        mode={showBuySellModal.type}
        portfolios={myPortfolios}
        selectedPortfolioId={selectedPortfolioId}
        onSelectPortfolio={id => dispatch(setSelectedPortfolioId(id))}
        activeStockId={activeStockId}
        stockSymbol={symbolCode}
        ltp={todaysMarket?.ltp || 0}
        onSuccess={handleOrderSuccess}
      />
    </ApexChartWrapper>
  )
}

export default Dashboard
