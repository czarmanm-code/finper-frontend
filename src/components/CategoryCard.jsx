import { useEffect, useState } from 'react'

export default function CategoryCard({
  id,
  name,
  type = 'expense',
  icon: Icon,
  budget = 0,
  spent = 0,
  color = '#3b82f6',
  onSetTarget,
}) {
  const isIncome = type === 'income'
  const hasBudget = Boolean(budget && budget > 0)

  // Calculate percentage safely
  const percent = hasBudget ? Math.min((spent / budget) * 100, 100) : 0

  const radius = 42
  const stroke = 8
  const normalizedRadius = radius - stroke * 2
  const circumference = normalizedRadius * 2 * Math.PI

  const strokeDashoffset = hasBudget
    ? circumference - (percent / 100) * circumference
    : spent > 0
    ? 0 // Full circle indicator for active movements
    : circumference

  const [animatedOffset, setAnimatedOffset] = useState(circumference)

  useEffect(() => {
    setAnimatedOffset(strokeDashoffset)
  }, [strokeDashoffset])

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6 flex flex-col items-center gap-3 hover:shadow-md dark:hover:border-slate-700 transition-all group">
      <div className="relative w-28 h-28">
        <svg height="112" width="112" className="rotate-[-90deg]">
          {/* Background track */}
          <circle
            className="text-slate-200 dark:text-slate-800"
            stroke="currentColor"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx="56"
            cy="56"
          />
          {/* Progress arc */}
          <circle
            stroke={color}
            fill="transparent"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={animatedOffset}
            r={normalizedRadius}
            cx="56"
            cy="56"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          {hasBudget ? (
            <span className="text-base font-bold text-slate-800 dark:text-slate-100">
              {Math.round(percent)}%
            </span>
          ) : spent > 0 ? (
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Tracked
            </span>
          ) : (
            <span className="text-sm font-semibold text-slate-400">
              0%
            </span>
          )}
        </div>
      </div>

      <div className="text-center flex flex-col items-center">
        {Icon && (
          <span
            className="w-8 h-8 rounded-lg flex items-center justify-center mb-1.5 transition-transform group-hover:scale-105 shadow-xs"
            style={{
              backgroundColor: color.startsWith('#') ? `${color}20` : 'rgba(59, 130, 246, 0.1)',
              color: color,
            }}
          >
            <Icon className="w-4.5 h-4.5" />
          </span>
        )}
        <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{name}</p>
        
        <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-0.5 flex flex-col items-center gap-1">
          {hasBudget ? (
            <>
              <span>
                ${spent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / ${budget.toLocaleString('en-US')}
              </span>
              <button
                type="button"
                onClick={() => onSetTarget?.({ id, name, type, budget, color, icon: Icon })}
                className="text-[11px] font-normal text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition cursor-pointer"
                title={`Edit monthly ${isIncome ? 'expected' : 'budget'}`}
              >
                {isIncome ? 'of expected' : 'of budget'} ✎
              </button>
            </>
          ) : (
            <>
              <span>
                ${spent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <button
                type="button"
                onClick={() => onSetTarget?.({ id, name, type, budget, color, icon: Icon })}
                className="text-[11px] font-medium text-sky-600 dark:text-sky-400 hover:underline transition cursor-pointer"
              >
                + Set {isIncome ? 'target' : 'budget'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
