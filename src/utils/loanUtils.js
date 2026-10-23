/**
 * Utility definitions and helpers for Loans and Credit tracking.
 */

export const LOAN_FREQUENCIES = [
  {
    value: 'monthly',
    label: 'Monthly',
    short: 'mo',
    sub: '12 payments / yr',
    helper: 'Scheduled monthly installment',
  },
  {
    value: 'biweekly',
    label: 'Bi-weekly',
    short: 'bi-wk',
    sub: '24 payments / yr',
    helper: 'Scheduled bi-weekly installment',
  },
  {
    value: 'quarterly',
    label: 'Quarterly',
    short: 'quarter',
    sub: 'Every 3 months',
    helper: 'Scheduled quarterly installment (4/yr)',
  },
  {
    value: 'semiannual',
    label: 'Semi-annual',
    short: 'half-yr',
    sub: 'Twice a year',
    helper: 'Scheduled semi-annual installment (2/yr)',
  },
  {
    value: 'annual',
    label: 'Annual',
    short: 'yr',
    sub: 'Once a year',
    helper: 'Scheduled annual installment (1/yr)',
  },
  {
    value: 'weekly',
    label: 'Weekly',
    short: 'wk',
    sub: 'Every week',
    helper: 'Scheduled weekly installment (52/yr)',
  },
]

export function formatFrequency(freq) {
  const found = LOAN_FREQUENCIES.find((f) => f.value === freq)
  return found ? found.label.toLowerCase() : 'monthly'
}

export function toMonthlyEquivalent(payment, freq) {
  const p = Number(payment) || 0
  switch (freq) {
    case 'biweekly':
      return p * 2
    case 'weekly':
      return Math.round((p * 52) / 12)
    case 'quarterly':
      return Math.round(p / 3)
    case 'semiannual':
      return Math.round(p / 6)
    case 'annual':
      return Math.round(p / 12)
    case 'monthly':
    default:
      return p
  }
}

/**
 * Calculate the realistic payoff target date and remaining months for a loan.
 * Prioritizes contractual endDate if provided; falls back to linear balance/payment if null.
 */
export function getLoanPayoffEstimate(loan) {
  const currentBalance = Number(loan?.currentBalance ?? loan?.startingBalance ?? 0)
  if (currentBalance <= 0) {
    return {
      targetDateStr: 'Paid Off 🎉',
      targetDate: new Date(),
      monthsRemaining: 0,
      isContractual: false,
    }
  }

  const now = new Date()

  // 1. Contractual End Date priority
  if (loan?.endDate) {
    const end = new Date(loan.endDate)
    if (!isNaN(end.getTime())) {
      const diffMonths = Math.max(
        1,
        (end.getFullYear() - now.getFullYear()) * 12 + (end.getMonth() - now.getMonth())
      )
      return {
        targetDateStr: end.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        targetDate: end,
        monthsRemaining: diffMonths,
        isContractual: true,
      }
    }
  }

  // 2. Fallback to linear division (for informal or 0% interest loans without contractual date)
  const monthlyPayment = toMonthlyEquivalent(loan?.expectedPayment, loan?.paymentFrequency)
  const monthsRemaining = monthlyPayment > 0 ? Math.ceil(currentBalance / monthlyPayment) : 0
  const target = new Date(now.getFullYear(), now.getMonth() + monthsRemaining, 1)

  return {
    targetDateStr:
      monthsRemaining > 0
        ? target.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        : 'Debt Free 🎉',
    targetDate: target,
    monthsRemaining,
    isContractual: false,
  }
}

/**
 * Calculate consolidated payoff target for a list of active loans.
 * The portfolio is debt-free when the longest active loan reaches its target date.
 */
export function getPortfolioPayoffEstimate(loans = []) {
  const activeDebts = loans.filter(
    (l) => l.status !== 'archived' && (Number(l.currentBalance) || 0) > 0
  )
  if (activeDebts.length === 0) {
    return {
      targetDateStr: 'Debt Free 🎉',
      targetDate: new Date(),
      monthsRemaining: 0,
      isContractual: false,
    }
  }

  let latestDate = new Date()
  let maxMonths = 0
  let hasContractual = false

  activeDebts.forEach((l) => {
    const est = getLoanPayoffEstimate(l)
    if (est.monthsRemaining > maxMonths) {
      maxMonths = est.monthsRemaining
      latestDate = est.targetDate
      hasContractual = est.isContractual
    }
  })

  return {
    targetDateStr: latestDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    targetDate: latestDate,
    monthsRemaining: maxMonths,
    isContractual: hasContractual,
  }
}

