import { useMemo, useState } from 'react'
import type { NextPage } from 'next'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Divider from '@mui/material/Divider'

type TopicSection = {
  id: string
  label: string
  title: string
  subtitle: string
  icon: string
  summary: string
  explanation: string
  simpleExample: string
  goodRange?: string
  warningRange?: string
  screenerUse: string
  redFlags: string[]
  greenFlags: string[]
}

const topicSections: TopicSection[] = [
  {
    id: 'equity',
    label: 'Equity',
    title: 'What is Equity?',
    subtitle: 'The owner money inside the business.',
    icon: '🏦',
    summary: 'Equity is the money belonging to shareholders after subtracting liabilities from assets.',
    explanation:
      'Think of equity as the company’s own value. If a business owns assets worth more than what it owes, the leftover value belongs to the owners. This is why equity matters in balance sheets and in return ratios.',
    simpleExample: 'If a company has ₹100 of assets and ₹40 of liabilities, equity is ₹60.',
    goodRange: 'Higher equity with healthy profits and manageable debt is usually a positive sign.',
    warningRange: 'Very low equity or shrinking equity can point to losses or balance-sheet stress.',
    screenerUse: 'Equity is the base for ROE and helps us understand ownership strength.',
    redFlags: ['Shrinking equity', 'Negative reserves', 'Equity falling while debt rises'],
    greenFlags: ['Positive reserves', 'Stable equity growth', 'Low leverage']
  },
  {
    id: 'cagr',
    label: 'CAGR',
    title: 'What is CAGR?',
    subtitle: 'The average annual growth rate over time.',
    icon: '📈',
    summary: 'CAGR tells us the smooth yearly growth rate between two points, like sales or profit over 5 years.',
    explanation:
      'CAGR is useful because it removes the noise of one-off spikes and dips. It answers the question: “On average, how fast is this metric growing every year?” You can use it for sales, profit, revenue, and even market cap.',
    simpleExample: 'If sales go from ₹100 Cr to ₹200 Cr in 5 years, CAGR shows the yearly growth pace.',
    goodRange: '10%+ is decent, 15%+ is strong, 20%+ is very strong for many businesses.',
    warningRange: 'Negative or very uneven CAGR often means the business is not compounding well.',
    screenerUse: 'We use CAGR to judge whether the business is compounding sales and profit over time.',
    redFlags: ['High one-year spike only', 'Negative CAGR', 'Very unstable growth'],
    greenFlags: ['Steady CAGR', 'Profit CAGR close to or above sales CAGR', 'Multi-year growth consistency']
  },
  {
    id: 'roe',
    label: 'ROE',
    title: 'What is ROE?',
    subtitle: 'Return on Equity = profit on shareholder money.',
    icon: '💰',
    summary: 'ROE shows how efficiently the company generates profit from shareholders’ equity.',
    explanation:
      'If you invest money in a company, ROE tells you how much profit the business creates from that equity. Strong ROE usually means the company can turn owner money into earnings efficiently, which is a very important quality signal.',
    simpleExample: 'If equity is ₹100 and profit is ₹20, ROE is 20%.',
    goodRange: '15%+ is good, 20%+ is very strong, though sector context always matters.',
    warningRange: 'Below 10% is often weak unless the sector is naturally low-return.',
    screenerUse: 'ROE helps us find efficient companies that can compound shareholder capital well.',
    redFlags: ['High ROE with heavy debt', 'ROE falling every year', 'ROE inflated by one-time gains'],
    greenFlags: ['Stable high ROE', 'ROE with low debt', 'ROE improving with profit growth']
  },
  {
    id: 'roce',
    label: 'ROCE',
    title: 'What is ROCE?',
    subtitle: 'Return on Capital Employed = profit on total business capital.',
    icon: '🏭',
    summary: 'ROCE shows how efficiently the company uses all capital, including equity and debt.',
    explanation:
      'ROCE is broader than ROE. It checks how well the company uses total money available to run the business. This makes it a strong quality measure because a business can have high ROE due to debt, while ROCE reveals whether the whole operation is actually efficient.',
    simpleExample: 'If total capital is ₹200 and profit is ₹40, ROCE is 20%.',
    goodRange: '15%+ is good, 20%+ is very strong for many businesses.',
    warningRange: 'Low or falling ROCE can mean weak pricing power, poor assets, or capital inefficiency.',
    screenerUse: 'ROCE is one of the best signals for business quality and capital efficiency.',
    redFlags: ['ROE high but ROCE low', 'ROCE falling over time', 'Capital-heavy growth without better returns'],
    greenFlags: ['ROE and ROCE both strong', 'ROCE stable for years', 'ROCE improving with growth']
  },
  {
    id: 'debt',
    label: 'Debt',
    title: 'Debt and Leverage',
    subtitle: 'How much borrowed money the business is using.',
    icon: '⚖️',
    summary: 'Debt can help growth, but too much debt raises risk and can hurt future dividends or expansion.',
    explanation:
      'Debt is not always bad. Some businesses use debt wisely to grow. But when debt rises too fast or becomes too large compared with equity, the company becomes more fragile in bad years. That is why leverage must be checked together with profit and cash flow.',
    simpleExample: 'If equity is ₹100 and debt is ₹80, debt-to-equity is 0.8.',
    goodRange: 'Debt-to-equity below 1 is usually comfortable for many businesses.',
    warningRange: 'Debt-to-equity above 1 needs more caution; above 2 is often risky unless the sector supports it.',
    screenerUse: 'Debt helps us decide whether profits are durable or being supported by borrowing.',
    redFlags: ['Debt rising faster than profit', 'High debt with weak cash flow', 'Interest burden growing'],
    greenFlags: ['Debt reducing over time', 'Strong reserves', 'Profit and cash flow comfortably cover borrowings']
  },
  {
    id: 'sales',
    label: 'Sales',
    title: 'Sales Growth',
    subtitle: 'The top line of the business.',
    icon: '🛒',
    summary: 'Sales growth shows whether demand for the company’s products or services is increasing.',
    explanation:
      'Sales are the first proof that a business is expanding. But sales alone are not enough. Growth is meaningful only when profit and cash flow also improve, otherwise the company may be buying growth through discounts or spending too much.',
    simpleExample: 'If sales grow from ₹100 Cr to ₹150 Cr over time, the business is expanding its top line.',
    goodRange: 'Consistent positive growth is better than a single big spike.',
    warningRange: 'Flat or falling sales usually need explanation unless the business is mature and stable.',
    screenerUse: 'Sales trend helps us understand demand, market share, and overall momentum.',
    redFlags: ['Sales up but profit down', 'Sales growth only in one quarter', 'Sales rising from heavy discounting'],
    greenFlags: ['Steady multi-year growth', 'Sales growth with margin stability', 'Quarterly momentum improving']
  },
  {
    id: 'profit',
    label: 'Profit',
    title: 'Profit Growth',
    subtitle: 'The actual earnings left after costs.',
    icon: '🧮',
    summary: 'Profit growth shows whether the business is becoming more valuable, not just bigger.',
    explanation:
      'Profit is where a company proves whether it can convert sales into real earnings. Strong profit growth usually means the business has pricing power, good cost control, or improving efficiency. This is often more important than sales growth alone.',
    simpleExample: 'If sales grow 20% but profit grows only 5%, the company may be losing efficiency.',
    goodRange: 'Profit CAGR above 15% is often a strong signal in many businesses.',
    warningRange: 'Negative or unstable profit growth is a warning sign, especially if it continues.',
    screenerUse: 'Profit growth helps us identify companies that are not just growing, but compounding earnings.',
    redFlags: ['Profit falling while sales rise', 'One-time gains driving earnings', 'Profit growth too volatile'],
    greenFlags: ['Profit growing with sales', 'Margins improving', 'Consistent multi-year earnings compounding']
  },
  {
    id: 'cashflow',
    label: 'Cash Flow',
    title: 'Operating Cash Flow',
    subtitle: 'Cash generated by the actual business.',
    icon: '💵',
    summary: 'Cash flow tells us whether reported profit is backed by real money coming into the business.',
    explanation:
      'A company can show profit on paper but still struggle for cash. Operating cash flow tells us whether customers are paying, inventory is under control, and the business can self-fund operations. For quality analysis, this is one of the strongest checks.',
    simpleExample: 'If profit rises but cash from operations stays weak, the business may be collecting money slowly.',
    goodRange: 'Positive and consistent operating cash flow is a strong sign.',
    warningRange: 'Weak or negative cash flow while profit looks good needs careful review.',
    screenerUse: 'Cash flow helps us separate real quality from accounting-only growth.',
    redFlags: ['Profit up but cash flow down', 'Receivables growing too fast', 'Inventory buildup'],
    greenFlags: ['Cash flow positive', 'Cash flow consistent with profit', 'Cash conversion improving']
  },
  {
    id: 'margins',
    label: 'Margins',
    title: 'Margins',
    subtitle: 'How much of sales becomes profit.',
    icon: '📊',
    summary: 'Margins tell us if the company is keeping more money from every rupee of sales.',
    explanation:
      'Margins show pricing power and cost control. If sales grow but margins fall, the company may be discounting too much or facing cost pressure. If margins improve, the business is becoming more efficient or more powerful competitively.',
    simpleExample: 'If sales are ₹100 and net profit is ₹10, net margin is 10%.',
    goodRange: 'Stable or improving margins are generally better than fast sales growth with weak margins.',
    warningRange: 'Falling margins often indicate competition, inflation, or poor cost control.',
    screenerUse: 'Margins help us understand whether growth is actually turning into profit.',
    redFlags: ['Sales growing with shrinking margins', 'Sharp margin volatility', 'Low margins in a supposedly strong business'],
    greenFlags: ['Margins improving', 'Margins stable across cycles', 'Profits growing faster than sales']
  },
  {
    id: 'dividend',
    label: 'Dividend',
    title: 'Dividend Yield and Payout Ratio',
    subtitle: 'How much cash the company returns to shareholders.',
    icon: '🏷️',
    summary: 'Dividend yield tells you the income side; payout ratio tells you if that income is sustainable.',
    explanation:
      'Dividend yield is useful, but it can be misleading if the underlying business is weak. The payout ratio gives context by showing how much of profit is being returned. A reasonable payout with healthy profits and cash flow is usually better than a very high yield with weak fundamentals.',
    simpleExample: 'If profit is ₹100 and dividend is ₹40, payout ratio is 40%.',
    goodRange: 'A payout ratio around 20% to 60% is often a healthy range for many companies.',
    warningRange: 'Very high yield or very high payout can mean sustainability risk.',
    screenerUse: 'Dividend analysis helps us find companies that can reward shareholders without weakening the business.',
    redFlags: ['High yield with falling profit', 'Dividend funded by debt', 'Payout too extreme'],
    greenFlags: ['Healthy payout ratio', 'Yield backed by cash flow', 'Dividend supported by stable profits']
  }
]

const tabOrder = topicSections.map(section => section.id)

const ScreenerPlaybookPage: NextPage = () => {
  const [activeTab, setActiveTab] = useState(tabOrder[0])

  const activeSection = useMemo(
    () => topicSections.find(section => section.id === activeTab) || topicSections[0],
    [activeTab]
  )

  return (
    <Grid container spacing={4}>
      <Grid item xs={12}>
        <Card
          sx={{
            borderRadius: 3,
            overflow: 'hidden',
            background:
              'radial-gradient(circle at 82% 15%, rgba(59, 130, 246, 0.18) 0%, transparent 30%), radial-gradient(circle at 12% 12%, rgba(16, 185, 129, 0.2) 0%, transparent 30%), linear-gradient(125deg, #0f172a 0%, #111827 45%, #1e293b 100%)'
          }}
        >
          <CardContent sx={{ p: { xs: 4, md: 6 } }}>
            <Stack spacing={2}>
              <Chip label='Fundamental Screener Playbook' color='primary' sx={{ alignSelf: 'flex-start' }} />
              <Typography variant='h3' sx={{ color: 'common.white', fontWeight: 800, maxWidth: 900 }}>
                Learn the Key Screener Metrics One at a Time
              </Typography>
              <Typography variant='body1' sx={{ color: 'rgba(255,255,255,0.75)', maxWidth: 900 }}>
                This page is a step-by-step guide for understanding the most important fundamental terms used in
                screener analysis. Each topic is separated so it is easier to learn and compare.
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
            <Tabs
              value={activeTab}
              onChange={(_, value) => setActiveTab(value)}
              variant='scrollable'
              scrollButtons='auto'
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              {topicSections.map(section => (
                <Tab key={section.id} value={section.id} label={section.label} />
              ))}
            </Tabs>

            <Box sx={{ pt: 3 }}>
              <Stack direction='row' spacing={1} sx={{ mb: 2, alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                <Chip label={activeSection.icon} />
                <Chip label={activeSection.subtitle} variant='outlined' />
              </Stack>

              <Typography variant='h4' sx={{ fontWeight: 800, mb: 1 }}>
                {activeSection.title}
              </Typography>
              <Typography variant='body1' color='text.secondary' sx={{ mb: 3, maxWidth: 980 }}>
                {activeSection.summary}
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12} md={7}>
                  <Stack spacing={2}>
                    <Box sx={{ p: 2.5, borderRadius: 2, bgcolor: 'action.hover' }}>
                      <Typography variant='subtitle2' sx={{ mb: 0.75 }}>
                        Simple explanation
                      </Typography>
                      <Typography variant='body2'>{activeSection.explanation}</Typography>
                    </Box>

                    <Box sx={{ p: 2.5, borderRadius: 2, bgcolor: 'success.lighter' }}>
                      <Typography variant='subtitle2' sx={{ mb: 0.75, color: 'success.dark' }}>
                        Easy example
                      </Typography>
                      <Typography variant='body2'>{activeSection.simpleExample}</Typography>
                    </Box>

                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Box sx={{ p: 2.5, borderRadius: 2, bgcolor: 'info.lighter', height: '100%' }}>
                          <Typography variant='subtitle2' sx={{ mb: 0.75, color: 'info.dark' }}>
                            Good sign
                          </Typography>
                          <Typography variant='body2'>{activeSection.goodRange || 'Healthy trends and stability are good.'}</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Box sx={{ p: 2.5, borderRadius: 2, bgcolor: 'warning.lighter', height: '100%' }}>
                          <Typography variant='subtitle2' sx={{ mb: 0.75, color: 'warning.dark' }}>
                            Be careful if
                          </Typography>
                          <Typography variant='body2'>
                            {activeSection.warningRange || 'Numbers are unstable, inconsistent, or falling.'}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Stack>
                </Grid>

                <Grid item xs={12} md={5}>
                  <Stack spacing={2}>
                    <Box sx={{ p: 2.5, borderRadius: 2, bgcolor: 'action.hover' }}>
                      <Typography variant='subtitle2' sx={{ mb: 1 }}>
                        How screener uses this
                      </Typography>
                      <Typography variant='body2' color='text.secondary'>
                        {activeSection.screenerUse}
                      </Typography>
                    </Box>

                    <Box sx={{ p: 2.5, borderRadius: 2, bgcolor: 'error.lighter' }}>
                      <Typography variant='subtitle2' sx={{ mb: 1, color: 'error.dark' }}>
                        Red flags
                      </Typography>
                      <Stack spacing={1}>
                        {activeSection.redFlags.map(item => (
                          <Box key={item} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                            <Typography variant='body2' sx={{ mt: 0.1 }}>
                              •
                            </Typography>
                            <Typography variant='body2' color='text.secondary'>
                              {item}
                            </Typography>
                          </Box>
                        ))}
                      </Stack>
                    </Box>

                    <Box sx={{ p: 2.5, borderRadius: 2, bgcolor: 'success.lighter' }}>
                      <Typography variant='subtitle2' sx={{ mb: 1, color: 'success.dark' }}>
                        Green flags
                      </Typography>
                      <Stack spacing={1}>
                        {activeSection.greenFlags.map(item => (
                          <Box key={item} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                            <Typography variant='body2' sx={{ mt: 0.1 }}>
                              •
                            </Typography>
                            <Typography variant='body2' color='text.secondary'>
                              {item}
                            </Typography>
                          </Box>
                        ))}
                      </Stack>
                    </Box>
                  </Stack>
                </Grid>
              </Grid>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            <Typography variant='h6' sx={{ mb: 1.5 }}>
              How To Read A Screener Row
            </Typography>
            <Typography variant='body2' color='text.secondary' sx={{ maxWidth: 960 }}>
              A good row usually has sales growing, profit growing, margins stable or improving, cash flow backing
              profit, and debt under control. A risky row often shows the opposite: growth without cash, rising debt,
              shrinking margins, or one-time profit spikes.
            </Typography>
            <Divider sx={{ my: 2.5 }} />
            <Stack direction='row' spacing={1} useFlexGap flexWrap='wrap'>
              <Chip label='Sales up + profit up = healthy' />
              <Chip label='Sales up + profit down = cost pressure' />
              <Chip label='Profit up + cash down = check quality' />
              <Chip label='ROE high + ROCE strong = quality signal' />
              <Chip label='Debt rising fast = risk grows' />
              <Chip label='Stable margins = consistency' />
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default ScreenerPlaybookPage
