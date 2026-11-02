import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  XMarkIcon,
  ChevronRightIcon,
  FolderIcon,
  ArrowRightIcon,
  BanknotesIcon,
  SparklesIcon,
  TagIcon,
} from '@heroicons/react/24/outline'
import { HEROICON_MAP } from '../utils/heroicons'
import { useDateFilter } from '../context/DateContext'
import { usePrivacy } from '../context/PrivacyContext'

function formatPercent(val) {
  if (!val || val <= 0) return '0%'
  if (val < 1) return `${val.toFixed(1)}%`
  return `${Math.round(val)}%`
}

export default function SectionDetailSheet({
  isOpen,
  onClose,
  section = null,
  onSelectCategory,
}) {
  const { mask } = usePrivacy()
  const { monthLabel } = useDateFilter()
  const [cachedSection, setCachedSection] = useState(section)
  const [isClosing, setIsClosing] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const touchStartY = useRef(0)

  useEffect(() => {
    if (section) {
      setCachedSection(section)
      setIsClosing(false)
      setDragOffset(0)
    }
  }, [section])

  // ESC key support
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleDismiss()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isClosing])

  // Lock body scroll when sheet is open to prevent background touch-bleed
  useEffect(() => {
    if (!isOpen) return
    const originalOverflow = document.body.style.overflow
    const originalOverscroll = document.body.style.overscrollBehavior
    document.body.style.overflow = 'hidden'
    document.body.style.overscrollBehavior = 'none'

    return () => {
      document.body.style.overflow = originalOverflow
      document.body.style.overscrollBehavior = originalOverscroll
    }
  }, [isOpen])

  const activeSection = section || cachedSection
  if ((!isOpen && !isClosing) || !activeSection) return null

  const handleDismiss = () => {
    if (isClosing) return
    setIsClosing(true)
    setTimeout(() => {
      onClose()
      setIsClosing(false)
      setDragOffset(0)
    }, 240)
  }

  // Touch handlers for mobile bottom sheet swipe down
  const handleTouchStart = (e) => {
    if (isClosing) return
    touchStartY.current = e.touches[0].clientY
    setIsDragging(true)
  }

  const handleTouchMove = (e) => {
    if (!isDragging || isClosing) return
    const currentY = e.touches[0].clientY
    const diff = currentY - touchStartY.current
    if (diff > 0) {
      setDragOffset(diff)
    }
  }

  const handleTouchEnd = () => {
    if (!isDragging || isClosing) return
    setIsDragging(false)
    if (dragOffset > 75) {
      handleDismiss()
    } else {
      setDragOffset(0)
    }
  }

  const Icon =
    (typeof activeSection.icon === 'function' ? activeSection.icon : null) ||
    HEROICON_MAP[activeSection.icon] ||
    (activeSection.isIncome ? BanknotesIcon : activeSection.isSavings ? SparklesIcon : FolderIcon)

  const isIncome = activeSection.isIncome
  const hasBudget = activeSection.totalBudget > 0
  const percent = hasBudget ? (activeSection.totalSpent / activeSection.totalBudget) * 100 : 0
  const displayPercent = formatPercent(percent)
  const isOverBudget = !isIncome && hasBudget && activeSection.totalSpent > activeSection.totalBudget
  const isNearLimit = !isIncome && hasBudget && percent >= 85 && !isOverBudget

  const statusColor = isIncome
    ? activeSection.totalSpent >= activeSection.totalBudget && hasBudget
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
    : activeSection.color || '#3b82f6'

  const backdropOpacity = isClosing
    ? 0
    : isDragging && dragOffset > 0
    ? Math.max(0.05, 0.5 * (1 - dragOffset / 350))
    : 0.5

  const categories = activeSection.categories || []

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-slate-950 backdrop-blur-xs transition-opacity duration-250 ease-out touch-none"
        style={{ opacity: backdropOpacity }}
        onTouchMove={(e) => e.preventDefault()}
        onClick={handleDismiss}
        aria-hidden="true"
      />

      {/* Sheet Container: Bottom Sheet on Mobile, Slide-over on Desktop */}
      <aside
        className={`fixed z-50 bg-white dark:bg-slate-900 shadow-2xl flex flex-col
          inset-x-0 bottom-0 h-[85vh] rounded-t-3xl border-t border-slate-200 dark:border-slate-800
          sm:inset-y-0 sm:right-0 sm:left-auto sm:h-full sm:w-full sm:max-w-md sm:rounded-none sm:border-t-0 sm:border-l ${
            isClosing
              ? 'translate-y-full sm:translate-y-0 sm:translate-x-full transition-transform duration-250 ease-in'
              : isDragging
              ? 'transition-none select-none'
              : 'transition-transform duration-250 ease-out animate-sheet-drawer'
          }`}
        style={{
          transform: !isClosing && dragOffset > 0 ? `translateY(${dragOffset}px)` : undefined,
        }}
        role="dialog"
        aria-modal="true"
      >
        {/* Mobile Drag Handle */}
        <div
          className="w-full pt-3 pb-1 cursor-grab active:cursor-grabbing sm:hidden shrink-0 touch-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto" />
        </div>

        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 pt-3 pb-3 sm:pt-6 border-b border-slate-100 dark:border-slate-800/80 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Section Breakdown
            </span>
            {monthLabel && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800">
                {monthLabel}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              handleDismiss()
            }}
            onTouchEnd={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleDismiss()
            }}
            className="p-2 -mr-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            aria-label="Close panel"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto overscroll-y-contain px-6 py-5 space-y-6">
          {/* Section Hero Banner */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <span
                className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs"
                style={{
                  backgroundColor: `${activeSection.color || '#3b82f6'}18`,
                  color: activeSection.color || '#3b82f6',
                }}
              >
                <Icon className="w-6 h-6" />
              </span>

              <div className="min-w-0">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate">
                  {activeSection.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {categories.length} {categories.length === 1 ? 'category' : 'categories'} included
                </p>
              </div>
            </div>

            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${statusColor} shrink-0`}>
              {!hasBudget
                ? 'No target'
                : isIncome
                ? `${displayPercent} received`
                : activeSection.isSavings
                ? `${displayPercent} saved`
                : isOverBudget
                ? `${displayPercent} (Over)`
                : `${displayPercent} spent`}
            </span>
          </div>

          {/* Section Consolidated Progress Card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {isIncome ? 'Actual Received' : 'Actual Spent'}
                </span>
                <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5 tracking-tight">
                  {mask(activeSection.totalSpent)}
                </div>
              </div>

              {hasBudget && (
                <div className="text-right">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {isIncome ? 'Target Goal' : 'Planned Budget'}
                  </span>
                  <div className="text-lg font-bold text-slate-600 dark:text-slate-300 mt-0.5">
                    {mask(activeSection.totalBudget)}
                  </div>
                </div>
              )}
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-200/70 dark:bg-slate-700 rounded-full h-2 overflow-hidden mt-1">
              <div
                className="h-2 rounded-full transition-all duration-700"
                style={{
                  backgroundColor: progressBarColor,
                  width:
                    activeSection.totalSpent > 0
                      ? `${Math.min(Math.max(percent, 2), 100)}%`
                      : '0%',
                }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-0.5">
              <span>{hasBudget ? `${displayPercent} of total allocation` : 'No budget set for this section'}</span>
              <span>
                {hasBudget
                  ? isIncome
                    ? activeSection.totalSpent >= activeSection.totalBudget
                      ? 'Goal reached!'
                      : `${mask(activeSection.totalBudget - activeSection.totalSpent)} left to goal`
                    : isOverBudget
                    ? `+${mask(activeSection.totalSpent - activeSection.totalBudget)} over budget`
                    : `${mask(activeSection.totalBudget - activeSection.totalSpent)} remaining`
                  : '—'}
              </span>
            </div>
          </div>

          {/* Child Categories Breakdown List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Categories in this Section
              </h4>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {categories.length}
              </span>
            </div>

            {categories.length === 0 ? (
              <div className="p-8 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  No categories in this section
                </p>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Assign categories to this group in the Categories settings to see them consolidated here.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {categories.map((cat) => {
                  const CatIcon = cat.icon || HEROICON_MAP[cat.iconName] || TagIcon
                  const catHasBudget = cat.budget > 0
                  const rawCatPercent = catHasBudget ? (cat.spent / cat.budget) * 100 : 0
                  const catPercent = formatPercent(rawCatPercent)
                  const catOver = !isIncome && catHasBudget && cat.spent > cat.budget

                  return (
                    <div
                      key={cat.id}
                      onClick={() => {
                        handleDismiss()
                        onSelectCategory?.(cat)
                      }}
                      className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 hover:border-sky-300 dark:hover:border-sky-700/80 hover:shadow-xs transition cursor-pointer group"
                      title="Click to view detailed movements"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
                            style={{
                              backgroundColor: `${cat.color || '#3b82f6'}18`,
                              color: cat.color || '#3b82f6',
                            }}
                          >
                            <CatIcon className="w-4 h-4" />
                          </span>

                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                              {cat.name}
                            </p>
                            <span className="text-[11px] text-slate-400">
                              {catHasBudget
                                ? `${mask(cat.spent)} of ${mask(cat.budget)}`
                                : mask(cat.spent)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
                          {catHasBudget && (
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                catOver
                                  ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              {catPercent}
                            </span>
                          )}
                          <ChevronRightIcon className="w-4 h-4 text-slate-400 group-hover:text-sky-600 dark:group-hover:text-sky-400 group-hover:translate-x-0.5 transition" />
                        </div>
                      </div>

                      {/* Mini Progress Bar for each category */}
                      {catHasBudget && (
                        <div className="w-full bg-slate-100 dark:bg-slate-700/60 rounded-full h-1.5 mt-2.5 overflow-hidden">
                          <div
                            className="h-1.5 rounded-full transition-all duration-500"
                            style={{
                              backgroundColor: catOver ? '#ef4444' : cat.color || '#3b82f6',
                              width:
                                cat.spent > 0
                                  ? `${Math.min(Math.max(rawCatPercent, 2), 100)}%`
                                  : '0%',
                            }}
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer with Manage Link */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          <Link
            to="/budget"
            onClick={handleDismiss}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/80 transition shadow-2xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Manage section limits in Budget</span>
            <ArrowRightIcon className="w-3.5 h-3.5" />
          </Link>
        </div>
      </aside>
    </>
  )
}

