// ** Icon imports
import Table from 'mdi-material-ui/Table'
import HomeOutline from 'mdi-material-ui/HomeOutline'
import LogoutVariant from 'mdi-material-ui/LogoutVariant'
import WalletPlusOutline from 'mdi-material-ui/WalletPlusOutline'
import CurrencyUsd from 'mdi-material-ui/CurrencyUsd'
import LinkVariant from 'mdi-material-ui/LinkVariant'

// ** Type import
import { VerticalNavItemsType } from 'src/@core/layouts/types'

const navigation = (): VerticalNavItemsType => {
  const userItems: VerticalNavItemsType = [
    {
      sectionTitle: 'Main'
    },
    {
      title: 'Home',
      icon: HomeOutline,
      path: '/home'
    },
    {
      title: 'Dashboard',
      icon: HomeOutline,
      path: '/'
    },
    {
      title: 'AI Chat',
      icon: Table,
      path: '/ollama-chat'
    },
    {
      title: 'News Creator',
      icon: Table,
      path: '/news-creator'
    },
    {
      title: 'News Content',
      icon: Table,
      path: '/news-content'
    },
    {
      title: 'Music Library',
      icon: Table,
      path: '/music-library'
    },
    {
      title: 'Social Accounts',
      icon: LinkVariant,
      path: '/social-accounts'
    },
    {
      title: 'Render Jobs',
      icon: Table,
      path: '/news-content/render-jobs'
    },
    {
      title: 'Audio Tools',
      icon: Table,
      path: '/news-content/audio-tools'
    },
    {
      title: 'Voice Styles',
      icon: Table,
      path: '/news-content/audio-voice-styles'
    },
    {
      sectionTitle: 'Market'
    },
    {
      title: 'Live Stocks',
      icon: Table,
      path: '/live-stocks'
    },
    {
      title: 'EOD Trend',
      icon: Table,
      path: '/eod-trend'
    },
    {
      title: 'Stock Analysis',
      icon: Table,
      path: '/stock-analysis'
    },
    {
      title: 'Historical Universe',
      icon: Table,
      path: '/historical-universe'
    },
    {
      title: 'Historical Screener',
      icon: Table,
      path: '/historical-screener'
    },
    {
      title: 'IPO',
      icon: Table,
      path: '/ipo'
    },
    {
      title: 'Fundamentals',
      icon: Table,
      path: '/fundamentals'
    },
    {
      title: 'Dividend Screener',
      icon: Table,
      path: '/fundamentals/dividend-analysis'
    },
    {
      title: 'Growth Screener',
      icon: Table,
      path: '/fundamentals/growth-analysis'
    },
    {
      title: 'Value Screener',
      icon: Table,
      path: '/fundamentals/value-analysis'
    },
    {
      title: 'Screener Search',
      icon: Table,
      path: '/fundamentals/screener-search'
    },
    {
      title: 'Pivot Strategies',
      icon: Table,
      path: '/fundamentals/pivot-strategies'
    },
    {
      title: 'GARP Screener',
      icon: Table,
      path: '/fundamentals/garp-analysis'
    },
    {
      title: 'Screener Playbook',
      icon: Table,
      path: '/fundamentals/screener-playbook'
    },
    {
      title: 'Warning Flags',
      icon: Table,
      path: '/fundamentals/warning-flags'
    },
    {
      title: 'Schema Audit',
      icon: Table,
      path: '/fundamentals-schema-audit'
    },
    {
      title: 'Tax Planner',
      icon: CurrencyUsd,
      path: '/tax-planner'
    },
    {
      sectionTitle: 'Portfolio'
    },
    {
      title: 'My Portfolio',
      icon: Table,
      path: '/portfolio-stocks'
    },
    {
      sectionTitle: 'Wallet'
    },
    {
      title: 'Add Funds',
      icon: WalletPlusOutline,
      path: '/?quickAction=add-fund'
    },
    {
      title: 'Transfer Fund',
      icon: CurrencyUsd,
      path: '/?quickAction=transfer-fund'
    },
    {
      sectionTitle: 'Session'
    },
    {
      title: 'Logout',
      icon: LogoutVariant,
      path: '/auth/logout'
    }
  ]

  const superAdminItems: VerticalNavItemsType = [
    {
      sectionTitle: 'Main'
    },
    {
      title: 'Home',
      icon: HomeOutline,
      path: '/home'
    },
    {
      title: 'Dashboard',
      icon: HomeOutline,
      path: '/'
    },
    {
      title: 'AI Chat',
      icon: Table,
      path: '/ollama-chat'
    },
    {
      title: 'News Creator',
      icon: Table,
      path: '/news-creator'
    },
    {
      title: 'News Content',
      icon: Table,
      path: '/news-content'
    },
    {
      title: 'Music Library',
      icon: Table,
      path: '/music-library'
    },
    {
      title: 'Social Accounts',
      icon: LinkVariant,
      path: '/social-accounts'
    },
    {
      title: 'Render Jobs',
      icon: Table,
      path: '/news-content/render-jobs'
    },
    {
      title: 'Audio Tools',
      icon: Table,
      path: '/news-content/audio-tools'
    },
    {
      title: 'Voice Styles',
      icon: Table,
      path: '/news-content/audio-voice-styles'
    },
    {
      sectionTitle: 'Market'
    },
    {
      title: 'Live Stocks',
      icon: Table,
      path: '/live-stocks'
    },
    {
      title: 'EOD Trend',
      icon: Table,
      path: '/eod-trend'
    },
    {
      title: 'Stock Analysis',
      icon: Table,
      path: '/stock-analysis'
    },
    {
      title: 'Historical Universe',
      icon: Table,
      path: '/historical-universe'
    },
    {
      title: 'IPO',
      icon: Table,
      path: '/ipo'
    },
    {
      title: 'Fundamentals',
      icon: Table,
      path: '/fundamentals'
    },
    {
      title: 'Dividend Screener',
      icon: Table,
      path: '/fundamentals/dividend-analysis'
    },
    {
      title: 'Growth Screener',
      icon: Table,
      path: '/fundamentals/growth-analysis'
    },
    {
      title: 'Value Screener',
      icon: Table,
      path: '/fundamentals/value-analysis'
    },
    {
      title: 'Screener Search',
      icon: Table,
      path: '/fundamentals/screener-search'
    },
    {
      title: 'Pivot Strategies',
      icon: Table,
      path: '/fundamentals/pivot-strategies'
    },
    {
      title: 'GARP Screener',
      icon: Table,
      path: '/fundamentals/garp-analysis'
    },
    {
      title: 'Screener Playbook',
      icon: Table,
      path: '/fundamentals/screener-playbook'
    },
    {
      title: 'Warning Flags',
      icon: Table,
      path: '/fundamentals/warning-flags'
    },
    {
      title: 'Schema Audit',
      icon: Table,
      path: '/fundamentals-schema-audit'
    },
    {
      title: 'Tax Planner',
      icon: CurrencyUsd,
      path: '/tax-planner'
    },
    {
      title: 'Raw Stocks',
      icon: Table,
      path: '/raw-stocks'
    },
    {
      title: 'Stock Universe',
      icon: Table,
      path: '/stock-universe-audit'
    },
    {
      sectionTitle: 'Portfolio'
    },
    {
      title: 'My Portfolio',
      icon: Table,
      path: '/portfolio-stocks'
    },
    {
      sectionTitle: 'Wallet'
    },
    {
      title: 'Add Funds',
      icon: WalletPlusOutline,
      path: '/?quickAction=add-fund'
    },
    {
      title: 'Transfer Fund',
      icon: CurrencyUsd,
      path: '/?quickAction=transfer-fund'
    },
    {
      sectionTitle: 'Session'
    },
    {
      title: 'Logout',
      icon: LogoutVariant,
      path: '/auth/logout'
    }
  ]

  if (typeof window === 'undefined') {
    return userItems
  }

  try {
    const rawUser = localStorage.getItem('user')
    const parsedUser = rawUser ? JSON.parse(rawUser) : null
    const role = String(parsedUser?.role || '').toUpperCase()
    const isSuperAdmin = role === 'SUPERADMIN' || role === 'SUPER_ADMIN'

    if (isSuperAdmin) return superAdminItems
  } catch {
    // ignore and fallback to limited navigation
  }

  return userItems
}

export default navigation
