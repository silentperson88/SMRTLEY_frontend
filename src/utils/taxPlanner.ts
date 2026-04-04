export type BuyLot = {
  id: string
  symbol: string
  buyDate: string
  qty: number
  buyPrice: number
  currentPrice: number
  notes?: string
}

export type SellTrade = {
  id: string
  symbol: string
  sellDate: string
  qty: number
  sellPrice: number
  notes?: string
}

export type TaxPlannerSettings = {
  ltcgDays: number
  stcgRate: number
  ltcgRate: number
  ltcgExemption: number
  exitCostPercent: number
  showLossHarvesting: boolean
}

export type LotMatchRow = {
  buyLotId: string
  symbol: string
  buyDate: string
  buyPrice: number
  currentPrice: number
  boughtQty: number
  soldQty: number
  remainingQty: number
  realizedGain: number
  realizedStcgGain: number
  realizedLtcgGain: number
  unrealizedGain: number
  currentValue: number
  holdingDaysNow: number
  holdingBucketNow: 'STCG' | 'LTCG'
}

export type TaxSummary = {
  totalBuyValue: number
  totalCurrentValue: number
  totalUnrealizedGain: number
  totalRealizedGain: number
  totalRealizedStcgGain: number
  totalRealizedLtcgGain: number
  openQuantity: number
  soldQuantity: number
  bookedLtcgThisFY: number
  bookedStcgThisFY: number
  remainingLtcgExemption: number
}

export type TaxBucketSummary = {
  realizedStcgGain: number
  realizedLtcgGain: number
  realizedStcgLoss: number
  realizedLtcgLoss: number
  unrealizedStcgGain: number
  unrealizedLtcgGain: number
  unrealizedStcgLoss: number
  unrealizedLtcgLoss: number
  currentStcgPnl: number
  currentLtcgPnl: number
  currentStcgGain: number
  currentLtcgGain: number
  currentStcgLoss: number
  currentLtcgLoss: number
  currentStcgTax: number
  currentLtcgTax: number
  totalCurrentTax: number
}

export type TaxRecommendation = {
  id: string
  symbol: string
  buyLotId: string
  buyDate: string
  qty: number
  suggestedSellQty: number
  buyPrice: number
  currentPrice: number
  currentValue: number
  gain: number
  gainPct: number
  bucket: 'STCG' | 'LTCG'
  estimatedTaxIfSoldNow: number
  estimatedTaxAfterAdjustment: number
  estimatedNetAfterTax: number
  taxSavingIfLossHarvested: number
  offsetAmount: number
  offsetDetails: Array<{ symbol: string; buyLotId: string; qty: number; amount: number }>
  adjustedAgainst: string
  netBenefitScore: number
  reason: string
  type: 'profit-booking' | 'loss-harvesting'
}

export type TradePlanRow = {
  sequence: number
  actionType: 'PROFIT_SELL' | 'LOSS_SELL'
  category: 'TAX_FREE_LTCG' | 'TAXABLE_LTCG' | 'STCG_PROFIT' | 'LOSS_OFFSET'
  symbol: string
  buyLotId: string
  buyDate: string
  qty: number
  price: number
  value: number
  bucket: 'STCG' | 'LTCG'
  gainOrLoss: number
  linkedTo: string
  reason: string
}

const MS_PER_DAY = 24 * 60 * 60 * 1000

export const toDateInput = (value: Date) => {
  const year = value.getFullYear()
  const month = `${value.getMonth() + 1}`.padStart(2, '0')
  const day = `${value.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const daysBetween = (fromDate: string, toDate: string) => {
  const start = new Date(fromDate)
  const end = new Date(toDate)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0
  return Math.max(0, Math.floor((end.getTime() - start.getTime()) / MS_PER_DAY))
}

export const getCurrentFinancialYearStart = (referenceDate = new Date()) => {
  const year = referenceDate.getMonth() >= 3 ? referenceDate.getFullYear() : referenceDate.getFullYear() - 1
  return `${year}-04-01`
}

export const getCurrentFinancialYearLabel = (referenceDate = new Date()) => {
  const startYear = referenceDate.getMonth() >= 3 ? referenceDate.getFullYear() : referenceDate.getFullYear() - 1
  return `${startYear}-${startYear + 1}`
}

export const formatCurrencyNumber = (value: number) =>
  new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2
  }).format(Number.isFinite(value) ? value : 0)

const parseDate = (value: string) => {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

const sortByDateAsc = <T extends { buyDate?: string; sellDate?: string }>(items: T[], key: 'buyDate' | 'sellDate') =>
  [...items].sort((a, b) => {
    const aTime = parseDate(String(a[key] || ''))?.getTime() || 0
    const bTime = parseDate(String(b[key] || ''))?.getTime() || 0
    return aTime - bTime
  })

const calcLtcgTaxIncrement = (
  existingBookedLtcg: number,
  additionalLtcgGain: number,
  exemption: number,
  ratePercent: number
) => {
  const beforeTaxable = Math.max(0, existingBookedLtcg - exemption)
  const afterTaxable = Math.max(0, existingBookedLtcg + additionalLtcgGain - exemption)
  return Math.max(0, afterTaxable - beforeTaxable) * (ratePercent / 100)
}

const formatLotLabel = (symbol: string, buyDate: string, value: number) => {
  const dateLabel = buyDate ? ` (${buyDate})` : ''
  return `${symbol}${dateLabel} Rs. ${formatCurrencyNumber(Math.abs(value))}`
}

export const matchLotsAndSummarize = (
  buys: BuyLot[],
  sells: SellTrade[],
  settings: TaxPlannerSettings
): {
  rows: LotMatchRow[]
  summary: TaxSummary
  bucketSummary: TaxBucketSummary
  recommendations: TaxRecommendation[]
  tradePlan: TradePlanRow[]
} => {
  const sortedBuys = sortByDateAsc(buys, 'buyDate')
  const sortedSells = sortByDateAsc(sells, 'sellDate')
  const now = new Date()

  const bySymbol = new Map<string, { buys: BuyLot[]; sells: SellTrade[] }>()

  for (const buy of sortedBuys) {
    const symbol = String(buy.symbol || '').trim().toUpperCase()
    if (!symbol) continue
    if (!bySymbol.has(symbol)) bySymbol.set(symbol, { buys: [], sells: [] })
    bySymbol.get(symbol)!.buys.push({ ...buy, symbol })
  }

  for (const sell of sortedSells) {
    const symbol = String(sell.symbol || '').trim().toUpperCase()
    if (!symbol) continue
    if (!bySymbol.has(symbol)) bySymbol.set(symbol, { buys: [], sells: [] })
    bySymbol.get(symbol)!.sells.push({ ...sell, symbol })
  }

  const rows: LotMatchRow[] = []
  let totalBuyValue = 0
  let totalCurrentValue = 0
  let totalUnrealizedGain = 0
  let totalRealizedGain = 0
  let totalRealizedStcgGain = 0
  let totalRealizedLtcgGain = 0
  let openQuantity = 0
  let soldQuantity = 0

  for (const [symbol, group] of bySymbol.entries()) {
    const buyState = group.buys.map(b => ({
      ...b,
      remainingQty: Math.max(0, Number(b.qty || 0)),
      soldQty: 0,
      realizedGain: 0,
      realizedStcgGain: 0,
      realizedLtcgGain: 0
    }))

    for (const sell of group.sells) {
      let remainingSellQty = Math.max(0, Number(sell.qty || 0))
      if (!remainingSellQty) continue

      for (const buy of buyState) {
        if (remainingSellQty <= 0) break
        if (buy.remainingQty <= 0) continue

        const matchedQty = Math.min(buy.remainingQty, remainingSellQty)
        const buyDate = parseDate(buy.buyDate)
        const sellDate = parseDate(sell.sellDate)
        const holdingDays = buyDate && sellDate ? Math.max(0, Math.floor((sellDate.getTime() - buyDate.getTime()) / MS_PER_DAY)) : 0
        const bucket = holdingDays >= settings.ltcgDays ? 'LTCG' : 'STCG'
        const gainPerShare = Number(sell.sellPrice || 0) - Number(buy.buyPrice || 0)
        const gain = gainPerShare * matchedQty

        buy.remainingQty -= matchedQty
        buy.soldQty += matchedQty
        remainingSellQty -= matchedQty
        soldQuantity += matchedQty
        totalRealizedGain += gain
        buy.realizedGain += gain
        if (bucket === 'LTCG') {
          totalRealizedLtcgGain += gain
          buy.realizedLtcgGain += gain
        } else {
          totalRealizedStcgGain += gain
          buy.realizedStcgGain += gain
        }
      }
    }

    const currentPrice = Math.max(
      0,
      ...buyState.map(b => (Number.isFinite(Number(b.currentPrice)) ? Number(b.currentPrice || 0) : 0))
    )

    for (const buy of buyState) {
      const buyDate = parseDate(buy.buyDate)
      const holdingDaysNow = buyDate ? Math.max(0, Math.floor((now.getTime() - buyDate.getTime()) / MS_PER_DAY)) : 0
      const holdingBucketNow = holdingDaysNow >= settings.ltcgDays ? 'LTCG' : 'STCG'
      const currentPx = Number(buy.currentPrice || currentPrice || 0)
      const currentValue = currentPx * buy.remainingQty
      const invested = Number(buy.buyPrice || 0) * buy.remainingQty
      const unrealizedGain = currentValue - invested

      rows.push({
        buyLotId: buy.id,
        symbol,
        buyDate: buy.buyDate,
        buyPrice: Number(buy.buyPrice || 0),
        currentPrice: currentPx,
        boughtQty: Number(buy.qty || 0),
        soldQty: buy.soldQty,
        remainingQty: buy.remainingQty,
        realizedGain: buy.realizedGain,
        realizedStcgGain: buy.realizedStcgGain,
        realizedLtcgGain: buy.realizedLtcgGain,
        unrealizedGain,
        currentValue,
        holdingDaysNow,
        holdingBucketNow
      })

      totalBuyValue += invested
      totalCurrentValue += currentValue
      totalUnrealizedGain += unrealizedGain
      openQuantity += buy.remainingQty
    }
  }

  const bookedLtcgThisFY = totalRealizedLtcgGain
  const bookedStcgThisFY = totalRealizedStcgGain
  const remainingLtcgExemption = Math.max(0, settings.ltcgExemption - bookedLtcgThisFY)

  const bucketSummary: TaxBucketSummary = {
    realizedStcgGain: 0,
    realizedLtcgGain: 0,
    realizedStcgLoss: 0,
    realizedLtcgLoss: 0,
    unrealizedStcgGain: 0,
    unrealizedLtcgGain: 0,
    unrealizedStcgLoss: 0,
    unrealizedLtcgLoss: 0,
    currentStcgPnl: 0,
    currentLtcgPnl: 0,
    currentStcgGain: 0,
    currentLtcgGain: 0,
    currentStcgLoss: 0,
    currentLtcgLoss: 0,
    currentStcgTax: 0,
    currentLtcgTax: 0,
    totalCurrentTax: 0
  }

  for (const row of rows) {
    const realizedStcg = Number(row.realizedStcgGain || 0)
    const realizedLtcg = Number(row.realizedLtcgGain || 0)
    bucketSummary.realizedStcgGain += Math.max(0, realizedStcg)
    bucketSummary.realizedLtcgGain += Math.max(0, realizedLtcg)
    bucketSummary.realizedStcgLoss += Math.abs(Math.min(0, realizedStcg))
    bucketSummary.realizedLtcgLoss += Math.abs(Math.min(0, realizedLtcg))
    if (row.remainingQty > 0) {
      if (row.holdingBucketNow === 'LTCG') {
        const unrealized = Number(row.unrealizedGain || 0)
        bucketSummary.unrealizedLtcgGain += Math.max(0, unrealized)
        bucketSummary.unrealizedLtcgLoss += Math.abs(Math.min(0, unrealized))
      } else {
        const unrealized = Number(row.unrealizedGain || 0)
        bucketSummary.unrealizedStcgGain += Math.max(0, unrealized)
        bucketSummary.unrealizedStcgLoss += Math.abs(Math.min(0, unrealized))
      }
    }
  }

  bucketSummary.currentStcgGain = bucketSummary.realizedStcgGain + bucketSummary.unrealizedStcgGain
  bucketSummary.currentLtcgGain = bucketSummary.realizedLtcgGain + bucketSummary.unrealizedLtcgGain
  bucketSummary.currentStcgLoss = bucketSummary.realizedStcgLoss + bucketSummary.unrealizedStcgLoss
  bucketSummary.currentLtcgLoss = bucketSummary.realizedLtcgLoss + bucketSummary.unrealizedLtcgLoss
  bucketSummary.currentStcgPnl = bucketSummary.currentStcgGain - bucketSummary.currentStcgLoss
  bucketSummary.currentLtcgPnl = bucketSummary.currentLtcgGain - bucketSummary.currentLtcgLoss
  bucketSummary.currentStcgTax = Math.max(0, bucketSummary.currentStcgPnl) * (settings.stcgRate / 100)
  bucketSummary.currentLtcgTax = Math.max(0, bucketSummary.currentLtcgPnl - settings.ltcgExemption) * (settings.ltcgRate / 100)
  bucketSummary.totalCurrentTax = bucketSummary.currentStcgTax + bucketSummary.currentLtcgTax

  const recommendations: TaxRecommendation[] = []
  const tradePlan: TradePlanRow[] = []
  const stcgLossInventory = rows
    .filter(row => row.remainingQty > 0 && row.unrealizedGain < 0 && row.holdingBucketNow === 'STCG')
    .map(row => ({
      buyLotId: row.buyLotId,
      symbol: row.symbol,
      buyDate: row.buyDate,
      qty: row.remainingQty,
      remainingQty: row.remainingQty,
      buyPrice: row.buyPrice,
      currentPrice: row.currentPrice,
      lossPerShare: Math.max(0, row.buyPrice - row.currentPrice),
      remainingLossValue: Math.abs(row.unrealizedGain),
      bucket: row.holdingBucketNow
    }))
  const ltcgLossInventory = rows
    .filter(row => row.remainingQty > 0 && row.unrealizedGain < 0 && row.holdingBucketNow === 'LTCG')
    .map(row => ({
      buyLotId: row.buyLotId,
      symbol: row.symbol,
      buyDate: row.buyDate,
      qty: row.remainingQty,
      remainingQty: row.remainingQty,
      buyPrice: row.buyPrice,
      currentPrice: row.currentPrice,
      lossPerShare: Math.max(0, row.buyPrice - row.currentPrice),
      remainingLossValue: Math.abs(row.unrealizedGain),
      bucket: row.holdingBucketNow
    }))

  const profitInventory = rows
    .filter(row => row.remainingQty > 0 && row.unrealizedGain > 0)
    .map(row => ({
      buyLotId: row.buyLotId,
      symbol: row.symbol,
      buyDate: row.buyDate,
      qty: row.remainingQty,
      buyPrice: row.buyPrice,
      currentPrice: row.currentPrice,
      currentValue: row.currentValue,
      gainPerShare: Math.max(0, row.currentPrice - row.buyPrice),
      fullGain: Math.max(0, row.unrealizedGain),
      bucket: row.holdingBucketNow,
      holdingDaysNow: row.holdingDaysNow
    }))

  profitInventory.sort((a, b) => {
    const priority = (bucket: 'STCG' | 'LTCG') => (bucket === 'STCG' ? 0 : 1)
    const bucketDiff = priority(a.bucket) - priority(b.bucket)
    if (bucketDiff !== 0) return bucketDiff
    return b.fullGain - a.fullGain
  })

  const showLossHarvesting = settings.showLossHarvesting
  let remainingLtcgExemptionForPlanning = remainingLtcgExemption
  let sequence = 1

  const totalSTCGProfitPlanned = profitInventory
    .filter(item => item.bucket === 'STCG')
    .reduce((sum, item) => sum + item.fullGain, 0)
  const totalLTCGProfitPlanned = profitInventory
    .filter(item => item.bucket === 'LTCG')
    .reduce((sum, item) => sum + item.fullGain, 0)

  const stcgTaxRate = settings.stcgRate / 100
  const ltcgTaxRate = settings.ltcgRate / 100

  for (const profit of profitInventory) {
    const exitCost = profit.currentValue * (settings.exitCostPercent / 100)
    const gainBeforeTax = profit.fullGain

    let suggestedSellQty = profit.qty
    let adjustedAgainst = ''
    let plannedSellGain = gainBeforeTax
    let baseTaxIfSoldNow = 0
    let lossOffsetValue = 0
    const offsetDetails: Array<{ symbol: string; buyLotId: string; qty: number; amount: number }> = []

    if (profit.bucket === 'LTCG') {
      if (remainingLtcgExemptionForPlanning >= gainBeforeTax) {
        suggestedSellQty = profit.qty
        plannedSellGain = gainBeforeTax
        baseTaxIfSoldNow = 0
        adjustedAgainst = `Within LTCG exemption room (${formatCurrencyNumber(gainBeforeTax)})`
        remainingLtcgExemptionForPlanning = Math.max(0, remainingLtcgExemptionForPlanning - gainBeforeTax)
      } else {
        const exemptionUsed = Math.max(0, remainingLtcgExemptionForPlanning)
        remainingLtcgExemptionForPlanning = 0
        const taxableLtcgGain = Math.max(0, gainBeforeTax - exemptionUsed)
        suggestedSellQty = Math.min(
          profit.qty,
          Math.max(1, Math.ceil(taxableLtcgGain / Math.max(1, profit.gainPerShare)))
        )
        plannedSellGain = profit.gainPerShare * suggestedSellQty
        baseTaxIfSoldNow = taxableLtcgGain * ltcgTaxRate
        adjustedAgainst = exemptionUsed > 0 ? `LTCG exemption Rs. ${formatCurrencyNumber(exemptionUsed)}` : 'LTCG taxable gain'
      }
    } else {
      baseTaxIfSoldNow = gainBeforeTax * stcgTaxRate
      adjustedAgainst = 'STCG is always taxable'
    }

    const shouldOffsetLosses = !(profit.bucket === 'LTCG' && baseTaxIfSoldNow === 0)
    const eligibleLossInventory =
      profit.bucket === 'STCG'
        ? [...stcgLossInventory]
        : [...stcgLossInventory, ...ltcgLossInventory]

    let remainingOffsetNeed = shouldOffsetLosses ? Math.max(0, plannedSellGain) : 0
    const allocations: Array<{ lossLotId: string; symbol: string; qty: number; amount: number }> = []

    if (remainingOffsetNeed > 0 && eligibleLossInventory.length > 0) {
      for (const lossLot of eligibleLossInventory) {
        if (remainingOffsetNeed <= 0) break
        if (lossLot.remainingQty <= 0 || lossLot.lossPerShare <= 0) continue

        const qtyNeededToCover = Math.ceil(remainingOffsetNeed / lossLot.lossPerShare)
        const qtyToUse = Math.min(lossLot.remainingQty, qtyNeededToCover)
        if (qtyToUse <= 0) continue

        const coveredAmount = qtyToUse * lossLot.lossPerShare
        lossLot.remainingQty -= qtyToUse
        lossLot.remainingLossValue = Math.max(0, lossLot.remainingLossValue - coveredAmount)
        remainingOffsetNeed = Math.max(0, remainingOffsetNeed - coveredAmount)
        lossOffsetValue += coveredAmount
        allocations.push({
          lossLotId: lossLot.buyLotId,
          symbol: lossLot.symbol,
          qty: qtyToUse,
          amount: coveredAmount
        })
        offsetDetails.push({
          symbol: lossLot.symbol,
          buyLotId: lossLot.buyLotId,
          qty: qtyToUse,
          amount: coveredAmount
        })
      }
    }

    if (allocations.length) {
      const text = allocations
        .map(item => `${item.symbol} x ${item.qty} (Rs. ${formatCurrencyNumber(item.amount)})`)
        .join(', ')
      adjustedAgainst = adjustedAgainst ? `${adjustedAgainst}; offset by ${text}` : `Offset by ${text}`
    }

    const estimatedTaxAfterAdjustment =
      Math.max(0, plannedSellGain - lossOffsetValue) * (profit.bucket === 'LTCG' ? ltcgTaxRate : stcgTaxRate)
    const estimatedNetAfterTax = plannedSellGain - estimatedTaxAfterAdjustment - exitCost

    recommendations.push({
      id: `${profit.buyLotId}-profit`,
      symbol: profit.symbol,
      buyLotId: profit.buyLotId,
      buyDate: profit.buyDate,
      qty: profit.qty,
      suggestedSellQty,
      buyPrice: profit.buyPrice,
      currentPrice: profit.currentPrice,
      currentValue: profit.currentValue,
      gain: gainBeforeTax,
      gainPct: profit.buyPrice > 0 ? ((profit.currentPrice - profit.buyPrice) / profit.buyPrice) * 100 : 0,
      bucket: profit.bucket,
      estimatedTaxIfSoldNow: baseTaxIfSoldNow,
      estimatedTaxAfterAdjustment,
      estimatedNetAfterTax,
      taxSavingIfLossHarvested: Math.max(0, baseTaxIfSoldNow - estimatedTaxAfterAdjustment),
      offsetAmount: lossOffsetValue,
      offsetDetails,
      adjustedAgainst: suggestedSellQty > 0 ? adjustedAgainst : adjustedAgainst || 'Hold within LTCG exemption',
      netBenefitScore: estimatedNetAfterTax,
      reason:
        profit.bucket === 'LTCG'
          ? suggestedSellQty > 0
            ? baseTaxIfSoldNow === 0
              ? 'Long-term profit. It is within the LTCG exemption room, so it can be sold tax-free.'
              : 'Long-term profit. Suggested only after exemption room is used.'
            : 'Long-term profit. Hold for now because it is still within LTCG exemption room.'
          : 'Short-term profit. Suggested for profit booking.',
      type: 'profit-booking'
    })

    if (suggestedSellQty > 0) {
      tradePlan.push({
        sequence: sequence++,
        actionType: 'PROFIT_SELL',
        category:
          profit.bucket === 'LTCG'
            ? baseTaxIfSoldNow === 0
              ? 'TAX_FREE_LTCG'
              : 'TAXABLE_LTCG'
            : 'STCG_PROFIT',
        symbol: profit.symbol,
        buyLotId: profit.buyLotId,
        buyDate: profit.buyDate,
        qty: suggestedSellQty,
        price: profit.currentPrice,
        value: suggestedSellQty * profit.currentPrice,
        bucket: profit.bucket,
        gainOrLoss: plannedSellGain,
        linkedTo: allocations.length ? allocations.map(a => a.symbol).join(', ') : 'No loss offset',
        reason:
          profit.bucket === 'LTCG'
            ? 'Sell this profit lot after exemption check.'
            : 'Sell this profit lot to book gains.'
      })
    }

    for (const allocation of allocations) {
      tradePlan.push({
        sequence: sequence++,
        actionType: 'LOSS_SELL',
        category: 'LOSS_OFFSET',
        symbol: allocation.symbol,
        buyLotId: allocation.lossLotId,
        buyDate: '',
        qty: allocation.qty,
        price: 0,
        value: allocation.amount,
        bucket: 'STCG',
        gainOrLoss: -allocation.amount,
        linkedTo: profit.symbol,
        reason: `Offset loss against ${profit.symbol}`
      })
    }
  }

    if (showLossHarvesting) {
    for (const loss of [...stcgLossInventory, ...ltcgLossInventory]) {
      if (loss.remainingQty <= 0 || loss.lossPerShare <= 0) continue
      const potentialSaving = loss.remainingLossValue * (loss.bucket === 'LTCG' ? ltcgTaxRate : stcgTaxRate)
      if (potentialSaving <= 0) continue

      recommendations.push({
        id: `${loss.buyLotId}-loss`,
        symbol: loss.symbol,
        buyLotId: loss.buyLotId,
        buyDate: loss.buyDate,
        qty: loss.remainingQty,
        suggestedSellQty: loss.remainingQty,
        buyPrice: loss.buyPrice,
        currentPrice: loss.currentPrice,
        currentValue: loss.remainingQty * loss.currentPrice,
        gain: -loss.remainingLossValue,
        gainPct: loss.buyPrice > 0 ? ((loss.currentPrice - loss.buyPrice) / loss.buyPrice) * 100 : 0,
        bucket: loss.bucket,
        estimatedTaxIfSoldNow: 0,
        estimatedTaxAfterAdjustment: 0,
        estimatedNetAfterTax: -loss.remainingLossValue,
        taxSavingIfLossHarvested: potentialSaving,
        offsetAmount: loss.remainingLossValue,
        offsetDetails: [],
        adjustedAgainst: 'Potential future profits',
        netBenefitScore: potentialSaving,
        reason: 'Loss harvesting candidate if you want to offset future gains.',
        type: 'loss-harvesting'
      })
    }
  }

  return {
    rows,
    summary: {
      totalBuyValue,
      totalCurrentValue,
      totalUnrealizedGain,
      totalRealizedGain,
      totalRealizedStcgGain,
      totalRealizedLtcgGain,
      openQuantity,
      soldQuantity,
      bookedLtcgThisFY,
      bookedStcgThisFY,
      remainingLtcgExemption
    },
    bucketSummary,
    recommendations: recommendations.sort((a, b) => b.netBenefitScore - a.netBenefitScore),
    tradePlan: tradePlan.sort((a, b) => a.sequence - b.sequence)
  }
}
