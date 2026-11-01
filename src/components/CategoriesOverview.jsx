import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FolderIcon,
  Squares2X2Icon,
  ChevronDownIcon,
  ArrowRightIcon,
  ViewColumnsIcon,
} from '@heroicons/react/24/outline'
import CategoryCard from './CategoryCard'
import { HEROICON_MAP } from '../utils/heroicons'

export default function CategoriesOverview({
  sections = [],
  categories = [],
  onSetTarget,
  onSelectCategory,
}) {
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('finper_category_dashboard_view') || 'sections'
  })

  function toggleViewMode(mode) {
    setViewMode(mode)
    localStorage.setItem('finper_category_dashboard_view', mode)
  }

  // Filter sections that have at least 1 category or budget/spent activity
  const activeSections = sections.filter(
    (sec) => sec.categories.length > 0 || sec.totalBudget > 0 || sec.totalSpent > 0
  )
  const sectionsToRender = activeSections.length > 0 ? activeSections : sections

  return (
    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-5 sm:p-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Category Breakdown
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {viewMode === 'sections'
                ? `${sectionsToRender.length} groups`
                : `${categories.length} categories`}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {viewMode === 'sections'
              ? 'Consolidated budget performance grouped by financial life area'
              : 'Individual spending limits and income target tracking'}
          </p>
        </div>

        {/* View Switcher & Link to full Budget */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => toggleViewMode('sections')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'sections'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
              title="View grouped by financial sections (Fixed, Variable, Savings, Income)"
            >
              <ViewColumnsIcon className="w-3.5 h-3.5" />
              <span>By Section</span>
            </button>
            <button
              type="button"
              onClick={() => toggleViewMode('categories')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'categories'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
              title="View all individual category cards"
            >
              <Squares2X2Icon className="w-3.5 h-3.5" />
              <span>All Categories</span>
            </button>
          </div>

          <Link
            to="/budget"
            className="text-xs font-semibold text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-sky-50 dark:hover:bg-sky-950/40 transition"
          >
            <span>Manage in Budget</span>
            <ArrowRightIcon className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Mode 1: Section Rollup Grid (Executive View - Option A) */}
      {viewMode === 'sections' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
          {sectionsToRender.map((section) => (
            <SectionRollupCard
              key={section.id}
              section={section}
              onSelectCategory={onSelectCategory}
              onSetTarget={onSetTarget}
            />
          ))}
        </div>
      ) : (
        /* Mode 2: Flat All Categories Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {categories.map((cat) => (
            <CategoryCard
              key={cat.id}
              {...cat}
              compact
              onSetTarget={onSetTarget}
              onSelect={onSelectCategory}
            />
          ))}
        </div>
      )}
    </section>
  )
}

function formatPercent(val) {
  if (!val || val <= 0) return '0%'
  if (val < 1) return `${val.toFixed(1)}%`
  return `${Math.round(val)}%`
}

function SectionRollupCard({ section, onSelectCategory }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const Icon = HEROICON_MAP[section.icon] || FolderIcon
  const isIncome = section.isIncome
  const hasBudget = section.totalBudget > 0
  const percent = hasBudget ? (section.totalSpent / section.totalBudget) * 100 : 0
  const displayPercent = formatPercent(percent)
  const isOverBudget = !isIncome && hasBudget && section.totalSpent > section.totalBudget
  const isNearLimit = !isIncome && hasBudget && percent >= 85 && !isOverBudget

  const statusColor = isIncome
    ? section.totalSpent >= section.totalBudget && hasBudget
      ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800'
      : 'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
    : isOverBudget
    ? 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800'
    : isNearLimit
    ? 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800'
    : 'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'

  const progressBarColor = isIncome
    ? '#10b981'
    : isOverBudget
    ? '#ef4444'
    : isNearLimit
    ? '#f59e0b'
    : section.color || '#3b82f6'

  return (
    <div className="bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-4 transition-all hover:border-slate-300 dark:hover:border-slate-700">
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs"
              style={{
                backgroundColor: `${section.color}18`,
                color: section.color,
              }}
            >
              <Icon className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <h3 className="font-bold text-slate-900 dark:text-white text-base truncate">
                {section.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {section.categories.length}{' '}
                {section.categories.length === 1 ? 'category' : 'categories'}
              </p>
            </div>
          </div>

          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusColor}`}>
            {!hasBudget
              ? 'No target'
              : isIncome
              ? `${displayPercent} received`
              : section.isSavings
              ? `${displayPercent} saved`
              : isOverBudget
              ? `${displayPercent} (Over)`
              : `${displayPercent} spent`}
          </span>
        </div>

        {/* Amounts Display */}
        <div className="flex items-baseline justify-between mt-3">
          <div>
            <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              ${section.totalSpent.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
            <span className="text-xs text-slate-400 ml-1.5 font-medium">
              of $
              {section.totalBudget.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>

          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {hasBudget
              ? isIncome
                ? section.totalSpent >= section.totalBudget
                  ? 'Goal reached'
                  : `$${(section.totalBudget - section.totalSpent).toLocaleString('en-US', {
                      maximumFractionDigits: 0,
                    })} left`
                : isOverBudget
                ? `$${(section.totalSpent - section.totalBudget).toLocaleString('en-US', {
                    maximumFractionDigits: 0,
                  })} over`
                : `$${(section.totalBudget - section.totalSpent).toLocaleString('en-US', {
                    maximumFractionDigits: 0,
                  })} left`
              : 'No target set'}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-200/70 dark:bg-slate-800 rounded-full h-2 overflow-hidden mt-2">
          <div
            className="h-2 rounded-full transition-all duration-700"
            style={{
              backgroundColor: progressBarColor,
              width: section.totalSpent > 0 ? `${Math.min(Math.max(percent, 2), 100)}%` : '0%',
            }}
          />
        </div>
      </div>

      {/* Accordion Footer: Drill-down Button */}
      <div className="border-t border-slate-200/60 dark:border-slate-800/80 pt-3">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 transition cursor-pointer py-0.5"
        >
          <span className="flex items-center gap-1.5">
            <span>{isExpanded ? 'Hide Categories' : 'Inspect Categories'}</span>
            <span className="text-[10px] text-slate-400">({section.categories.length})</span>
          </span>
          <ChevronDownIcon
            className={`w-3.5 h-3.5 transition-transform duration-200 ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* Child Categories Drawer */}
        {isExpanded && (
          <div className="mt-3 pt-2 border-t border-slate-200/40 dark:border-slate-800/60 space-y-1.5">
            {section.categories.length === 0 ? (
              <p className="text-xs text-slate-400 py-1 text-center">No categories in this group.</p>
            ) : (
              section.categories.map((cat) => {
                const CatIcon = cat.icon || HEROICON_MAP.TagIcon
                const catHasBudget = cat.budget > 0
                const rawCatPercent = catHasBudget ? (cat.spent / cat.budget) * 100 : 0
                const catPercent = formatPercent(rawCatPercent)
                const catOver = !isIncome && catHasBudget && cat.spent > cat.budget

                return (
                  <div
                    key={cat.id}
                    onClick={() => onSelectCategory?.(cat)}
                    className="p-2 rounded-xl flex items-center justify-between gap-3 hover:bg-white dark:hover:bg-slate-800/80 border border-transparent hover:border-slate-200/80 dark:hover:border-slate-700/60 transition cursor-pointer group"
                    title="Click to inspect category activity"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
                        style={{
                          backgroundColor: `${cat.color}18`,
                          color: cat.color,
                        }}
                      >
                        <CatIcon className="w-3.5 h-3.5" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                          {cat.name}
                        </p>
                        <span className="text-[10px] text-slate-400">
                          {catHasBudget
                            ? `$${cat.spent.toLocaleString('en-US', {
                                maximumFractionDigits: 0,
                              })} / $${cat.budget.toLocaleString('en-US', {
                                maximumFractionDigits: 0,
                              })}`
                            : `$${cat.spent.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {catHasBudget && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            catOver
                              ? 'bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {catPercent}
                        </span>
                      )}
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        $
                        {cat.spent.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>
    </div>
  )
}
