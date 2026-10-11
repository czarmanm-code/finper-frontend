import {
  SparklesIcon,
  PlusIcon,
  TagIcon,
  DocumentArrowUpIcon,
} from '@heroicons/react/24/outline'
import { Link } from 'react-router-dom'

/**
 * Onboarding empty state displayed when a new user has zero recorded transactions.
 * Guides them with clear next steps: configure categories & budget, or record a transaction.
 */
export function DashboardEmptyState({ onAddTransaction }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 sm:p-12 text-center shadow-sm">
      <div className="mx-auto w-16 h-16 rounded-2xl bg-sky-50 dark:bg-sky-950/50 flex items-center justify-center text-sky-600 dark:text-sky-400 mb-5">
        <SparklesIcon className="w-8 h-8" />
      </div>

      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
        Welcome to PerFin!
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto mb-8">
        Your personal finance dashboard is ready. To get the most out of your budget, you can review your categories or start recording your income and expenses right away.
      </p>

      {/* Recommended 2-step onboarding cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto mb-8 text-left">
        <Link
          to="/categorias"
          className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-sky-500 dark:hover:border-sky-500 bg-slate-50/50 dark:bg-slate-800/30 transition group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400 font-semibold text-sm mb-1">
              <TagIcon className="w-4 h-4" />
              <span>Step 1: Set Monthly Targets (Optional)</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Define your expected income (e.g. Salary) and spending budgets to track monthly progress percentages.
            </p>
          </div>
          <span className="text-xs font-medium text-sky-600 dark:text-sky-400 mt-3 group-hover:underline">
            Plan monthly targets &rarr;
          </span>
        </Link>

        <button
          onClick={onAddTransaction}
          className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-sky-500 dark:hover:border-sky-500 bg-slate-50/50 dark:bg-slate-800/30 transition group flex flex-col justify-between text-left"
        >
          <div>
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-sm mb-1">
              <PlusIcon className="w-4 h-4" />
              <span>Step 2: Add First Movement</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Log an expense or register your income to see live balance updates and analytics.
            </p>
          </div>
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mt-3 group-hover:underline">
            Record movement &rarr;
          </span>
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={onAddTransaction}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-sm transition"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Add Transaction</span>
        </button>

        <button
          disabled
          title="Receipt scanner coming soon"
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-slate-400 dark:text-slate-600 border border-slate-200 dark:border-slate-800 rounded-xl cursor-not-allowed opacity-75"
        >
          <DocumentArrowUpIcon className="w-5 h-5" />
          <span>Scan Receipt (Soon)</span>
        </button>
      </div>
    </div>
  )
}
