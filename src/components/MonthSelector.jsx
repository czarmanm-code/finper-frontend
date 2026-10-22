import { ChevronLeftIcon, ChevronRightIcon, CalendarDaysIcon } from '@heroicons/react/24/outline'
import { useDateFilter } from '../context/DateContext'

export default function MonthSelector({ className = '' }) {
  const {
    monthLabel,
    isCurrentMonth,
    goToPreviousMonth,
    goToNextMonth,
    goToCurrentMonth,
  } = useDateFilter()

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xs p-1">
        <button
          type="button"
          onClick={goToPreviousMonth}
          className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
          title="Previous Month"
        >
          <ChevronLeftIcon className="w-4 h-4" />
        </button>

        <div className="px-3 flex items-center gap-2 select-none min-w-[130px] justify-center">
          <CalendarDaysIcon className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
            {monthLabel}
          </span>
        </div>

        <button
          type="button"
          onClick={goToNextMonth}
          className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
          title="Next Month"
        >
          <ChevronRightIcon className="w-4 h-4" />
        </button>
      </div>

      {!isCurrentMonth && (
        <button
          type="button"
          onClick={goToCurrentMonth}
          className="px-2.5 py-1.5 text-xs font-semibold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100 dark:hover:bg-sky-900/60 border border-sky-200 dark:border-sky-800 rounded-xl transition cursor-pointer"
          title="Return to current month"
        >
          Today
        </button>
      )}
    </div>
  )
}

