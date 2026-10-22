import { PencilSquareIcon, PlusIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

export default function CategoryCard({
  id,
  name,
  type = 'expense',
  icon: Icon,
  budget = 0,
  spent = 0,
  color = '#3b82f6',
  onSetTarget,
  compact = false,
}) {
  const isIncome = type === 'income'
  const hasBudget = Boolean(budget && budget > 0)

  // Real percentage calculation without artificial capping or 100% inflation
  const rawPercent = hasBudget ? (spent / budget) * 100 : 0
  const displayPercent = Math.round(rawPercent)
  const barWidth = Math.min(Math.max(rawPercent, 0), 100)

  // Calculate remaining or overage
  const remaining = budget - spent
  const isOverBudget = !isIncome && hasBudget && spent > budget
  const isNearLimit = !isIncome && hasBudget && rawPercent >= 85 && !isOverBudget

  // Determine progress bar color based on status
  const getProgressBarColor = () => {
    if (isIncome) {
      return spent >= budget && hasBudget ? '#10b981' : color
    }
    if (isOverBudget) return '#ef4444' // Rose / Alert
    if (isNearLimit) return '#f59e0b' // Amber / Warning
    return color
  }

  const barColor = getProgressBarColor()

  if (compact) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xs p-3 hover:shadow-xs dark:hover:border-slate-700 transition-all group">
        {/* Top: Icon, Name, and Quick Status / Edit */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            {Icon ? (
              <span
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
                style={{
                  backgroundColor: color.startsWith('#') ? `${color}18` : 'rgba(59, 130, 246, 0.12)',
                  color: color,
                }}
              >
                <Icon className="w-3.5 h-3.5" />
              </span>
            ) : (
              <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 font-bold text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {name ? name.charAt(0).toUpperCase() : 'C'}
              </span>
            )}
            <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-xs truncate" title={name}>
              {name}
            </h4>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {hasBudget && (
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                  isOverBudget
                    ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
                    : isNearLimit
                    ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                {displayPercent}%
              </span>
            )}
            <button
              type="button"
              onClick={() => onSetTarget?.({ id, name, type, budget, color, icon: Icon })}
              className="p-1 text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 rounded transition shrink-0 cursor-pointer"
              title={`Edit ${isIncome ? 'target' : 'budget'}`}
            >
              <PencilSquareIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Metrics Row: Spent vs Target & Remaining Overage */}
        <div className="flex items-baseline justify-between text-xs mb-1.5">
          <div className="flex items-baseline gap-1">
            <span className="font-bold text-slate-900 dark:text-white">
              ${spent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            {hasBudget ? (
              <span className="text-[11px] text-slate-400 font-medium">
                / ${budget.toLocaleString('en-US')}
              </span>
            ) : (
              <span className="text-[10px] text-slate-400 italic">No budget</span>
            )}
          </div>

          {hasBudget && (
            <span className="text-[10px] font-medium text-slate-400">
              {isIncome ? (
                remaining > 0 ? `$${remaining.toLocaleString('en-US')} left` : 'Target hit'
              ) : isOverBudget ? (
                <span className="text-rose-600 dark:text-rose-400 font-semibold">
                  +${Math.abs(remaining).toLocaleString('en-US', { maximumFractionDigits: 0 })} over
                </span>
              ) : (
                `$${remaining.toLocaleString('en-US', { maximumFractionDigits: 0 })} left`
              )}
            </span>
          )}
        </div>

        {/* Mini Progress Bar */}
        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: hasBudget ? `${barWidth}%` : '0%',
              backgroundColor: hasBudget ? barColor : 'transparent',
            }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-5 flex flex-col justify-between hover:shadow-md dark:hover:border-slate-700 transition-all group">
      {/* Top Header: Category Icon, Name, Type & Edit Action */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          {Icon ? (
            <span
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 shadow-xs"
              style={{
                backgroundColor: color.startsWith('#') ? `${color}18` : 'rgba(59, 130, 246, 0.12)',
                color: color,
              }}
            >
              <Icon className="w-5 h-5" />
            </span>
          ) : (
            <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {name ? name.charAt(0).toUpperCase() : 'C'}
            </span>
          )}

          <div className="min-w-0">
            <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm truncate" title={name}>
              {name}
            </h4>
            <span className="text-[11px] font-medium text-slate-400 capitalize">
              {isIncome ? 'Expected Income' : 'Expense Category'}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onSetTarget?.({ id, name, type, budget, color, icon: Icon })}
          className="p-1.5 text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition shrink-0 cursor-pointer"
          title={`Edit ${isIncome ? 'target' : 'budget'}`}
        >
          <PencilSquareIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Main Metric: Amount Spent / Budget Target */}
      <div className="mb-3">
        <div className="flex items-baseline justify-between gap-2">
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              ${spent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            {hasBudget && (
              <span className="text-xs text-slate-400 font-medium">
                / ${budget.toLocaleString('en-US')}
              </span>
            )}
          </div>

          {hasBudget && (
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                isOverBudget
                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
                  : isNearLimit
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              {displayPercent}%
            </span>
          )}
        </div>
      </div>

      {/* Progress Bar & Footer */}
      <div className="space-y-2">
        {hasBudget ? (
          <>
            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${barWidth}%`,
                  backgroundColor: barColor,
                }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              {isIncome ? (
                <>
                  <span>
                    {remaining > 0
                      ? `$${remaining.toLocaleString('en-US', { minimumFractionDigits: 2 })} remaining`
                      : 'Target reached!'}
                  </span>
                  <span className="font-medium text-slate-600 dark:text-slate-300">
                    {displayPercent}% of goal
                  </span>
                </>
              ) : isOverBudget ? (
                <div className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-medium">
                  <ExclamationTriangleIcon className="w-3.5 h-3.5" />
                  <span>
                    ${Math.abs(remaining).toLocaleString('en-US', { minimumFractionDigits: 2 })} over budget
                  </span>
                </div>
              ) : (
                <>
                  <span>
                    <strong className="font-semibold text-slate-700 dark:text-slate-200">
                      ${remaining.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </strong>{' '}
                    remaining
                  </span>
                  <span>{Math.max(0, 100 - displayPercent)}% left</span>
                </>
              )}
            </div>
          </>
        ) : (
          <div className="pt-1">
            <button
              type="button"
              onClick={() => onSetTarget?.({ id, name, type, budget, color, icon: Icon })}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/30 hover:bg-sky-100 dark:hover:bg-sky-950/60 border border-sky-100 dark:border-sky-900/50 transition cursor-pointer"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              <span>Set {isIncome ? 'target' : 'budget limit'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
