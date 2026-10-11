import { useState, useEffect } from 'react'
import {
  BanknotesIcon,
  TicketIcon,
  CurrencyDollarIcon,
  Squares2X2Icon,
  ChevronUpIcon
} from '@heroicons/react/24/outline'

export default function BudgetSummary({ month, income, expenses, savings = 0 }) {
  const available = income - expenses - savings
  const [collapsed, setCollapsed] = useState(false)

  // Meaningful visual summary items
  const summaryData = [
    {
      label: 'Income',
      amount: income,
      sublabel: 'Total inflows',
      icon: BanknotesIcon,
      accentColor: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/40',
      borderColor: 'border-emerald-200 dark:border-emerald-800/60',
      progressPercent: income > 0 ? 100 : 0,
      gradient: 'from-emerald-400 to-emerald-600',
    },
    {
      label: 'Expenses',
      amount: expenses,
      sublabel: income > 0 ? `${Math.round((expenses / income) * 100)}% of income` : 'Total spent',
      icon: TicketIcon,
      accentColor: 'text-rose-600 dark:text-rose-400',
      bgColor: 'bg-rose-50 dark:bg-rose-950/40',
      borderColor: 'border-rose-200 dark:border-rose-800/60',
      progressPercent: income > 0 ? Math.min((expenses / income) * 100, 100) : expenses > 0 ? 100 : 0,
      gradient: 'from-rose-400 to-rose-600',
    },
    {
      label: 'Savings',
      amount: savings,
      sublabel: income > 0 ? `${Math.round((savings / income) * 100)}% of income` : 'Target reserve',
      icon: CurrencyDollarIcon,
      accentColor: 'text-sky-600 dark:text-sky-400',
      bgColor: 'bg-sky-50 dark:bg-sky-950/40',
      borderColor: 'border-sky-200 dark:border-sky-800/60',
      progressPercent: income > 0 ? Math.min((savings / income) * 100, 100) : 0,
      gradient: 'from-sky-400 to-sky-600',
    },
    {
      label: 'Available Balance',
      amount: available,
      sublabel: 'Net cash flow',
      icon: Squares2X2Icon,
      accentColor: available >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600 dark:text-rose-400',
      bgColor: available >= 0 ? 'bg-indigo-50 dark:bg-indigo-950/40' : 'bg-rose-50 dark:bg-rose-950/40',
      borderColor: available >= 0 ? 'border-indigo-200 dark:border-indigo-800/60' : 'border-rose-200 dark:border-rose-800/60',
      progressPercent: income > 0 ? Math.max(0, Math.min((available / income) * 100, 100)) : 0,
      gradient: available >= 0 ? 'from-indigo-400 to-indigo-600' : 'from-rose-400 to-rose-600',
    },
  ]

  return (
    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Summary · {month}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Overview of current month financial performance
          </p>
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          aria-label="Collapse summary"
        >
          <ChevronUpIcon
            className={`w-5 h-5 transition-transform duration-300 ${
              collapsed ? 'rotate-180' : ''
            }`}
          />
        </button>
      </div>

      {/* Collapsible Content */}
      <div
        className={`transition-all duration-300 overflow-hidden ${
          collapsed ? 'max-h-0 opacity-0' : 'max-h-[500px] opacity-100'
        }`}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
          {summaryData.map((item) => (
            <SummaryItem key={item.label} {...item} />
          ))}
        </div>
      </div>
    </section>
  )
}

function SummaryItem({
  label,
  amount,
  sublabel,
  icon: Icon,
  accentColor,
  bgColor,
  borderColor,
  progressPercent,
  gradient,
}) {
  const [animatedAmount, setAnimatedAmount] = useState(0)

  useEffect(() => {
    let start = null
    const duration = 800

    const step = (timestamp) => {
      if (!start) start = timestamp
      const progress = Math.min((timestamp - start) / duration, 1)
      setAnimatedAmount(progress * amount)
      if (progress < 1) requestAnimationFrame(step)
    }

    requestAnimationFrame(step)
  }, [amount])

  return (
    <div className={`rounded-xl border ${borderColor} ${bgColor} p-4 flex flex-col justify-between gap-3 shadow-sm hover:shadow transition`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
          {label}
        </span>
        <div className={`p-2 rounded-lg bg-white/80 dark:bg-slate-800/80 shadow-xs ${accentColor}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div>
        <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          ${animatedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {sublabel}
        </p>
      </div>

      {/* Modern Progress Bar */}
      <div className="w-full bg-slate-200/70 dark:bg-slate-700/60 rounded-full h-2 overflow-hidden mt-1">
        <div
          className={`h-2 rounded-full bg-gradient-to-r ${gradient} transition-all duration-700`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  )
}
