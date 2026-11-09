/**
 * Constants and utility functions for the Investments & Savings module.
 */

export const INVESTMENT_TYPES = [
  {
    id: 'fixed_income',
    label: 'Fixed Income & Debt',
    description: 'Government bonds, CETES, Pagares, Sofipos, Fixed yields',
    badgeClass: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    color: '#10b981',
    defaultAnnualRate: 10.0,
  },
  {
    id: 'variable_income',
    label: 'Equities & Variable',
    description: 'GBM+, Stocks, ETFs (S&P 500, VT), Mutual Funds',
    badgeClass: 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800',
    color: '#0284c7',
    defaultAnnualRate: 11.0,
  },
  {
    id: 'cash_equivalent',
    label: 'High-Yield Liquid Cash',
    description: 'Nu Cajitas, Ualá, Klar, Emergency fund with immediate liquidity',
    badgeClass: 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    color: '#8b5cf6',
    defaultAnnualRate: 12.0,
  },
  {
    id: 'retirement',
    label: 'Retirement & PPR',
    description: 'Afore, Voluntary pension contributions, Long-term plans',
    badgeClass: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    color: '#f59e0b',
    defaultAnnualRate: 8.0,
  },
  {
    id: 'other',
    label: 'Other Alternative Assets',
    description: 'Real Estate, Crowdfunding, Crypto, Precious metals',
    badgeClass: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    color: '#64748b',
    defaultAnnualRate: 5.0,
  },
]

export function getInvestmentTypeConfig(typeId) {
  return INVESTMENT_TYPES.find((t) => t.id === typeId) || INVESTMENT_TYPES[0]
}

export function formatInvestmentType(typeId) {
  const cfg = getInvestmentTypeConfig(typeId)
  return cfg ? cfg.label : 'Investment'
}

export function getDefaultAnnualRate(typeId) {
  const cfg = getInvestmentTypeConfig(typeId)
  return cfg ? cfg.defaultAnnualRate : 8.0
}

export function getInvestmentAnnualRate(investment) {
  if (!investment) return 10.0
  if (
    investment.estimatedAnnualRate !== undefined &&
    investment.estimatedAnnualRate !== null &&
    !isNaN(Number(investment.estimatedAnnualRate))
  ) {
    return Number(investment.estimatedAnnualRate)
  }
  return getDefaultAnnualRate(investment.type)
}

export function formatMonthKey(monthKey) {
  if (!monthKey) return ''
  const [yearStr, monthStr] = monthKey.split('-')
  const year = parseInt(yearStr, 10)
  const month = parseInt(monthStr, 10) - 1
  const d = new Date(year, month, 1)
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

export function formatDateLabel(dateInput) {
  if (!dateInput) return ''
  const d = new Date(dateInput)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/**
 * Calculates compound growth projection runway points for N future months.
 *
 * @param {Object} params
 * @param {number} params.startingBalance Current valuation of instrument or portfolio
 * @param {number} params.monthlyContribution Monthly deposit (e.g. from Budget category plannedAmount)
 * @param {number} params.annualRatePercent Estimated annual percentage yield (e.g. 10.0)
 * @param {number} params.horizonMonths Number of future months to project (e.g. 6, 12, 24, 36, 60)
 * @param {Date|string} [params.fromDate] Starting date anchor (defaults to now)
 * @returns {Array<Object>} Projected points array
 */
export function calculateInvestmentProjection({
  startingBalance,
  monthlyContribution = 0,
  annualRatePercent = 0,
  horizonMonths = 12,
  fromDate = new Date(),
}) {
  const points = []
  let balance = Math.max(0, Number(startingBalance) || 0)
  const monthlyDeposit = Math.max(0, Number(monthlyContribution) || 0)
  const monthlyRate = (Number(annualRatePercent) || 0) / 100 / 12
  const start = new Date(fromDate)

  let totalDeposited = 0
  let totalInterest = 0

  for (let m = 1; m <= horizonMonths; m++) {
    const futureDate = new Date(start.getFullYear(), start.getMonth() + m, 1)
    const monthKey = `${futureDate.getFullYear()}-${String(futureDate.getMonth() + 1).padStart(2, '0')}`
    const label = futureDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })

    const interestThisMonth = balance * monthlyRate
    balance = balance + monthlyDeposit + interestThisMonth
    totalDeposited += monthlyDeposit
    totalInterest += interestThisMonth

    points.push({
      date: futureDate.toISOString(),
      monthKey,
      label,
      relativeMonth: m,
      balance: Math.round(balance * 100) / 100,
      monthlyDeposit,
      totalDeposited: Math.round(totalDeposited * 100) / 100,
      totalInterest: Math.round(totalInterest * 100) / 100,
      isProjected: true,
    })
  }

  return points
}
