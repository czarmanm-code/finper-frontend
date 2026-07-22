import { useState, useEffect } from 'react'
import {
  BanknotesIcon,
  TicketIcon,
  CurrencyDollarIcon,
  Squares2X2Icon,
  ChevronUpIcon
} from '@heroicons/react/24/outline'

export default function BudgetSummary({ month, income, expenses, savings }) {
  const available = income - expenses - savings
  const [collapsed, setCollapsed] = useState(false)

  const summaryData = [
    {
      label: 'Ingresos',
      total: income,
      used: expenses + savings,
      icon: BanknotesIcon,
      colorFrom: 'from-emerald-400',
      colorTo: 'to-emerald-600'
    },
    {
      label: 'Gastos',
      total: income,
      used: expenses,
      icon: TicketIcon,
      colorFrom: 'from-rose-400',
      colorTo: 'to-rose-600'
    },
    {
      label: 'Ahorro',
      total: income,
      used: savings,
      icon: CurrencyDollarIcon,
      colorFrom: 'from-sky-400',
      colorTo: 'to-sky-600'
    },
    {
      label: 'Disponible',
      total: income,
      used: income - available,
      icon: Squares2X2Icon,
      colorFrom: 'from-slate-400',
      colorTo: 'to-slate-700'
    },
  ]

  return (
    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
          Resumen · {month}
        </h2>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          aria-label="Colapsar resumen"
        >
          <ChevronUpIcon
            className={`w-5 h-5 transition-transform duration-300 ${
              collapsed ? 'rotate-180' : ''
            }`}
          />
        </button>
      </div>

      {/* Contenido colapsable */}
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

function SummaryItem({ label, total, used, colorFrom, colorTo, icon: Icon }) {
  const targetPercent = Math.min((used / total) * 100, 100)
  const [percent, setPercent] = useState(0)
  const [displayedUsed, setDisplayedUsed] = useState(0)
  const [displayedRemaining, setDisplayedRemaining] = useState(total)

  useEffect(() => {
    let start = null
    const duration = 1000

    const step = (timestamp) => {
      if (!start) start = timestamp
      const progress = Math.min((timestamp - start) / duration, 1)

      setPercent(progress * targetPercent)
      setDisplayedUsed(Math.round(progress * used))
      setDisplayedRemaining(Math.round(total - progress * used))

      if (progress < 1) requestAnimationFrame(step)
    }

    requestAnimationFrame(step)
  }, [used, total, targetPercent])

  return (
    <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl p-4 flex flex-col gap-3 hover:shadow-sm transition-shadow duration-300">
      <div className="flex items-center gap-2">
        <Icon className="w-5 h-5 text-slate-500 dark:text-slate-400" />
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{label}</p>
      </div>

      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
        <div
          className={`h-3 rounded-full bg-gradient-to-r ${colorFrom} ${colorTo} transition-all duration-500`}
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="flex justify-between text-sm text-slate-600 dark:text-slate-300 mt-1 font-semibold">
        <span>${displayedUsed.toLocaleString('es-MX')}</span>
        <span>${displayedRemaining.toLocaleString('es-MX')}</span>
      </div>
    </div>
  )
}
