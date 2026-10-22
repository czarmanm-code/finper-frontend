import { useState } from 'react'
import { Bars3BottomLeftIcon, Squares2X2Icon } from '@heroicons/react/24/outline'
import CategoryCard from './CategoryCard'

export default function CategoriesOverview({ categories, onSetTarget }) {
  const [isExpanded, setIsExpanded] = useState(() => {
    return localStorage.getItem('finper_category_view_mode') === 'detailed'
  })

  function toggleMode(expanded) {
    setIsExpanded(expanded)
    localStorage.setItem('finper_category_view_mode', expanded ? 'detailed' : 'compact')
  }

  return (
    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Category Breakdown
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
              {categories.length}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Active spending limits and expected income tracking
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl self-start sm:self-auto">
          <button
            type="button"
            onClick={() => toggleMode(false)}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
              !isExpanded
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Bars3BottomLeftIcon className="w-3.5 h-3.5" />
            <span>Compact</span>
          </button>
          <button
            type="button"
            onClick={() => toggleMode(true)}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
              isExpanded
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Squares2X2Icon className="w-3.5 h-3.5" />
            <span>Detailed</span>
          </button>
        </div>
      </div>

      <div
        className={
          isExpanded
            ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6'
            : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3'
        }
      >
        {categories.map((cat) => (
          <CategoryCard
            key={cat.id}
            {...cat}
            compact={!isExpanded}
            onSetTarget={onSetTarget}
          />
        ))}
      </div>
    </section>
  )
}
