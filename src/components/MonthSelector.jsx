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
    <div className={`flex items-center gap-2 w-full sm:w-auto ${className}`}>
      <div className="flex items-center justify-between flex-1 sm:flex-initial bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xs p-1">
        <button
          type="button"
          onClick={goToPreviousMonth}
          className="p-2 sm:p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
          title="Previous Month"
          aria-label="Previous Month"
        >
          <ChevronLeftIcon className="w-4 h-4" />
        </button>

        <div className="px-3 flex items-center justify-center gap-2 select-none flex-1 sm:flex-initial sm:min-w-[130px] text-center">
          <CalendarDaysIcon className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
          <span className="text-xs sm:text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
            {monthLabel}
          </span>
        </div>

        <button
          type="button"
          onClick={goToNextMonth}
          className="p-2 sm:p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
          title="Next Month"
          aria-label="Next Month"
        >
          <ChevronRightIcon className="w-4 h-4" />
        </button>
      </div>

      {!isCurrentMonth && (
        <button
          type="button"
          onClick={goToCurrentMonth}
          className="px-3 py-2 sm:px-2.5 sm:py-1.5 text-xs font-semibold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100 dark:hover:bg-sky-900/60 border border-sky-200 dark:border-sky-800 rounded-xl transition cursor-pointer shrink-0"
          title="Return to current month"
        >
          Today
        </button>
      )}
    </div>
  )
}

