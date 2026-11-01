import {
  BanknotesIcon,
  TicketIcon,
  SparklesIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline'

export default function BudgetSummary({ month, income = 0, expenses = 0, savings = 0 }) {
  const available = income - expenses - savings
  const isPositive = available > 0
  const isNegative = available < 0

  // Percentages relative to total inflows
  const expensesPercent = income > 0 ? Math.round((expenses / income) * 100) : 0
  const savingsPercent = income > 0 ? Math.round((savings / income) * 100) : 0
  const availablePercent = income > 0 ? Math.max(0, Math.round((available / income) * 100)) : 0

  return (
    <section className="space-y-4">
      {/* Hero Banner: Available Balance (Star Metric / Net Cash Flow) */}
      <div
        className={`w-full rounded-3xl p-5 sm:p-7 border shadow-sm transition-all duration-300 ${
          isNegative
            ? 'bg-rose-50/60 dark:bg-rose-950/25 border-rose-300 dark:border-rose-900/60'
            : isPositive
            ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-900/60'
            : 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900/60'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Left Column: Big Highlighted Balance & Guidance */}
          <div className="space-y-2.5 min-w-0 flex-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Available Balance
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                  isNegative
                    ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400 border border-rose-300/80 dark:border-rose-800'
                    : isPositive
                    ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-300/80 dark:border-emerald-800'
                    : 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-400 border border-indigo-300/80 dark:border-indigo-800'
                }`}
              >
                {isNegative ? (
                  <ExclamationTriangleIcon className="w-3.5 h-3.5" />
                ) : isPositive ? (
                  <ArrowTrendingUpIcon className="w-3.5 h-3.5" />
                ) : (
                  <CheckCircleIcon className="w-3.5 h-3.5" />
                )}
                <span>
                  {isNegative
                    ? 'Cash Deficit (Overspent)'
                    : isPositive
                    ? 'Positive Cash Flow (Surplus)'
                    : 'Zero-Based Neutral'}
                </span>
              </span>
            </div>

            <div className="flex items-baseline gap-3">
              <div
                className={`text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight ${
                  isNegative
                    ? 'text-rose-600 dark:text-rose-400'
                    : isPositive
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-indigo-600 dark:text-indigo-400'
                }`}
              >
                {isNegative ? '-' : isPositive ? '+' : ''}$
                {Math.abs(available).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {isNegative
                  ? 'spending exceeds inflows and savings'
                  : isPositive
                  ? 'net liquid cash remaining this month'
                  : 'inflows exactly match outflows'}
              </span>
            </div>
          </div>

          {/* Right Column: Cash Flow Equation Breakdown */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xs flex flex-col gap-3 shrink-0 lg:w-96">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Cash Flow Breakdown</span>
              <span>{income > 0 ? `${availablePercent}% retained` : '0%'}</span>
            </div>

            {/* Equation Badges */}
            <div className="flex items-center justify-between text-xs sm:text-sm gap-1 sm:gap-2">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400">Inflows</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  ${income.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </span>
              </div>

              <span className="text-slate-400 font-bold text-base">−</span>

              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400">Expenses</span>
                <span className="font-bold text-rose-600 dark:text-rose-400">
                  ${expenses.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </span>
              </div>

              <span className="text-slate-400 font-bold text-base">−</span>

              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400">Savings</span>
                <span className="font-bold text-sky-600 dark:text-sky-400">
                  ${savings.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </span>
              </div>

              <span className="text-slate-400 font-bold text-base">=</span>

              <div className="flex flex-col text-right">
                <span className="text-[10px] text-slate-400">Available</span>
                <span
                  className={`font-bold ${
                    isNegative
                      ? 'text-rose-600 dark:text-rose-400'
                      : isPositive
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-indigo-600 dark:text-indigo-400'
                  }`}
                >
                  {isNegative ? '-' : isPositive ? '+' : ''}$
                  {Math.abs(available).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>

            {/* Cash Flow Distribution Progress Bar */}
            <div className="space-y-1 pt-1">
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden flex">
                {/* Expenses Share */}
                <div
                  className="bg-rose-500 h-2 transition-all duration-700"
                  style={{
                    width: income > 0 ? `${Math.min((expenses / income) * 100, 100)}%` : '0%',
                  }}
                  title={`Expenses: $${expenses.toLocaleString('en-US')}`}
                />
                {/* Savings Share */}
                <div
                  className="bg-sky-500 h-2 transition-all duration-700"
                  style={{
                    width: income > 0
                      ? `${Math.min((savings / income) * 100, Math.max(0, 100 - (expenses / income) * 100))}%`
                      : '0%',
                  }}
                  title={`Savings: $${savings.toLocaleString('en-US')}`}
                />
                {/* Remaining Available Share */}
                {isPositive && (
                  <div
                    className="bg-emerald-500 h-2 transition-all duration-700"
                    style={{
                      width: `${Math.max(0, 100 - (expenses / income) * 100 - (savings / income) * 100)}%`,
                    }}
                    title={`Available: $${available.toLocaleString('en-US')}`}
                  />
                )}
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> Expenses ({expensesPercent}%)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-sky-500 inline-block" /> Savings ({savingsPercent}%)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Available ({availablePercent}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary 3 Pillar Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Inflows Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Inflows
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <BanknotesIcon className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              ${income.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Total income received this month
            </div>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-700"
              style={{ width: income > 0 ? '100%' : '0%' }}
            />
          </div>
        </div>

        {/* Living Expenses Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Living Expenses
            </span>
            <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
              <TicketIcon className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              ${expenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {income > 0 ? `${expensesPercent}% of total inflows` : 'Total spent'}
            </div>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className="bg-rose-500 h-1.5 rounded-full transition-all duration-700"
              style={{ width: `${Math.min(expensesPercent, 100)}%` }}
            />
          </div>
        </div>

        {/* Saved & Invested Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Saved & Invested
            </span>
            <div className="p-2 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400">
              <SparklesIcon className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-sky-600 dark:text-sky-400">
              ${savings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {income > 0 ? `${savingsPercent}% of total inflows` : 'Target reserve'}
            </div>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className="bg-sky-500 h-1.5 rounded-full transition-all duration-700"
              style={{ width: `${Math.min(savingsPercent, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
