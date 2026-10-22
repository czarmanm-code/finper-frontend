import { useState, useMemo, useRef, useEffect } from 'react'
import {
  XMarkIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  BanknotesIcon,
  TagIcon,
  FolderIcon,
} from '@heroicons/react/24/outline'
import { HEROICON_MAP } from '../utils/heroicons'
import ConfirmDialog from './ui/ConfirmDialog'

export default function CategoryDetailSheet({
  isOpen,
  onClose,
  item = null, // Can be category or section
  type = 'category', // 'category' | 'section'
  monthLabel = '',
  transactions = [],
  onEditTransaction,
  onDeleteTransaction,
  onAddTransaction,
  onEditTarget,
}) {
  const [deleteTargetTx, setDeleteTargetTx] = useState(null)
  const [cachedItem, setCachedItem] = useState(item)
  const [isClosing, setIsClosing] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const touchStartY = useRef(0)

  useEffect(() => {
    if (item) {
      setCachedItem(item)
      setIsClosing(false)
      setDragOffset(0)
    }
  }, [item])

  const activeItem = item || cachedItem
  const isSection = type === 'section'

  // Filter transactions for this specific category or section
  const filteredTransactions = useMemo(() => {
    if ((!isOpen && !isClosing) || !activeItem || !transactions || transactions.length === 0) return []

    if (isSection) {
      const categoryIds = new Set((activeItem.categories || []).map((c) => String(c.id || c._id)))
      return transactions.filter((tx) => {
        const txCatId = String(
          typeof tx.categoryId === 'object' ? tx.categoryId?.id || tx.categoryId?._id : tx.categoryId
        )
        return categoryIds.has(txCatId)
      })
    }

    // By single category
    const targetId = String(activeItem.serverId || activeItem.id || activeItem._id)
    const targetName = (activeItem.name || '').trim().toLowerCase()

    return transactions.filter((tx) => {
      const rawCatId = typeof tx.categoryId === 'object' ? tx.categoryId?.id || tx.categoryId?._id : tx.categoryId
      const catKey = rawCatId ? String(rawCatId) : null
      const catName = (tx.categoryName || tx.category || '').trim().toLowerCase()

      return (catKey && catKey === targetId) || (catName && catName === targetName)
    })
  }, [isOpen, isClosing, transactions, activeItem, isSection])

  // Total spent in this month for this category / section
  const totalSpent = useMemo(() => {
    return filteredTransactions.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0)
  }, [filteredTransactions])

  // Animated dismiss handler
  const handleDismiss = () => {
    if (isClosing) return
    setIsClosing(true)
    setTimeout(() => {
      onClose()
      setIsClosing(false)
      setDragOffset(0)
    }, 240)
  }

  // Drag down handlers to dismiss on mobile
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

  if ((!isOpen && !isClosing) || !activeItem) return null

  const isIncome = activeItem.type === 'income'
  const name = activeItem.name || 'Category Details'
  const color = activeItem.color || '#3b82f6'
  const budget = Number(activeItem.budget || activeItem.plannedAmount || 0)

  // Find icon component
  const IconComponent =
    (typeof activeItem.icon === 'function' ? activeItem.icon : null) ||
    HEROICON_MAP[activeItem.icon] ||
    (isSection ? FolderIcon : isIncome ? BanknotesIcon : TagIcon)

  const hasBudget = budget > 0
  const rawPercent = hasBudget ? (totalSpent / budget) * 100 : 0
  const displayPercent = Math.round(rawPercent)
  const barWidth = Math.min(Math.max(rawPercent, 0), 100)
  const remaining = budget - totalSpent
  const isOverBudget = !isIncome && hasBudget && totalSpent > budget
  const isNearLimit = !isIncome && hasBudget && rawPercent >= 85 && !isOverBudget

  const getProgressBarColor = () => {
    if (isIncome) return totalSpent >= budget && hasBudget ? '#10b981' : color
    if (isOverBudget) return '#ef4444'
    if (isNearLimit) return '#f59e0b'
    return color
  }

  const barColor = getProgressBarColor()

  // Dynamic backdrop opacity reacting to user touch drag
  const backdropOpacity = isClosing
    ? 0
    : isDragging && dragOffset > 0
    ? Math.max(0.05, 0.5 * (1 - dragOffset / 350))
    : 0.5

  return (
    <>
      {/* Dimmed Backdrop with smooth fading */}
      <div
        className="fixed inset-0 z-40 bg-slate-950 backdrop-blur-xs transition-opacity duration-250 ease-out"
        style={{
          opacity: backdropOpacity,
        }}
        onClick={handleDismiss}
        aria-hidden="true"
      />

      {/* Sheet Container: Bottom Sheet on Mobile (<sm), Slide-over on Desktop (sm+) */}
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
        {/* Mobile Drag Handle (Touch Target) */}
        <div
          className="w-full pt-3 pb-1 cursor-grab active:cursor-grabbing sm:hidden shrink-0 touch-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto" />
        </div>

        {/* Top Bar: Badges & Close Button */}
        <div
          className="flex items-center justify-between px-6 pt-2 pb-2 sm:pt-6 border-b border-slate-100 dark:border-slate-800/80 shrink-0 touch-none sm:touch-auto"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {isSection ? 'Section Drill-down' : isIncome ? 'Income Source' : 'Expense Category'}
            </span>
            {monthLabel && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800">
                {monthLabel}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            aria-label="Close details"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Entity Header Banner */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <span
                className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs"
                style={{
                  backgroundColor: color.startsWith('#') ? `${color}18` : 'rgba(59, 130, 246, 0.12)',
                  color: color,
                }}
              >
                <IconComponent className="w-6 h-6" />
              </span>

              <div className="min-w-0">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate">
                  {name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {isSection
                    ? `${(activeItem.categories || []).length} categories included`
                    : activeItem.sectionName
                    ? `Inside ${activeItem.sectionName}`
                    : 'Personal Budget Category'}
                </p>
              </div>
            </div>

            {!isSection && onEditTarget && (
              <button
                type="button"
                onClick={() => {
                  handleDismiss()
                  onEditTarget(activeItem)
                }}
                className="p-2 text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer shrink-0"
                title="Edit budget target"
              >
                <PencilSquareIcon className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Budget vs Actual Card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {isIncome ? 'Actual Inflows' : 'Actual Spending'}
                </span>
                <div className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5 tracking-tight">
                  ${totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>

              {hasBudget && (
                <div className="text-right">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {isIncome ? 'Target Goal' : 'Budget Limit'}
                  </span>
                  <div className="text-lg font-semibold text-slate-600 dark:text-slate-300 mt-0.5">
                    ${budget.toLocaleString('en-US')}
                  </div>
                </div>
              )}
            </div>

            {hasBudget ? (
              <div className="space-y-1.5 pt-1">
                <div className="h-2 w-full bg-slate-200/70 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${barWidth}%`,
                      backgroundColor: barColor,
                    }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-0.5">
                  <span
                    className={`font-semibold ${
                      isOverBudget
                        ? 'text-rose-600 dark:text-rose-400'
                        : isNearLimit
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {displayPercent}% of {isIncome ? 'target' : 'budget'}
                  </span>

                  <span>
                    {isIncome ? (
                      remaining > 0 ? (
                        `$${remaining.toLocaleString('en-US', { minimumFractionDigits: 2 })} to goal`
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                          Goal reached!
                        </span>
                      )
                    ) : isOverBudget ? (
                      <span className="text-rose-600 dark:text-rose-400 font-medium">
                        +${Math.abs(remaining).toLocaleString('en-US', { minimumFractionDigits: 2 })} over
                      </span>
                    ) : (
                      `$${remaining.toLocaleString('en-US', { minimumFractionDigits: 2 })} remaining`
                    )}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400 italic pt-1">
                No budget target configured for this period.
              </div>
            )}
          </div>

          {/* Action Button: Quick Add Transaction */}
          {onAddTransaction && (
            <button
              type="button"
              onClick={() => {
                handleDismiss()
                onAddTransaction(activeItem)
              }}
              className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 active:scale-98 transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <PlusIcon className="w-4 h-4" />
              <span>Add Movement in {name}</span>
            </button>
          )}

          {/* Transactions List */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Recorded Movements
              </h4>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {filteredTransactions.length}
              </span>
            </div>

            {filteredTransactions.length === 0 ? (
              <div className="p-8 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  No movements in {monthLabel || 'this period'}
                </p>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Transactions logged under {name} will appear here with full date and description breakdown.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
                {filteredTransactions.map((tx) => {
                  const txDate = tx.rawDate || tx.date
                  const formattedDate = txDate
                    ? new Date(txDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'Recent'

                  const isTxIncome =
                    tx.type === 'income' || tx.type === 'Income' || tx.type === 'Ingreso'

                  return (
                    <div
                      key={tx.id || tx.serverId}
                      className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition group"
                    >
                      <div className="min-w-0">
                        <div className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">
                          {tx.description || 'Movement'}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                          <span>{formattedDate}</span>
                          {isSection && tx.categoryName && (
                            <>
                              <span>·</span>
                              <span className="text-sky-600 dark:text-sky-400 font-medium">
                                {tx.categoryName}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`font-bold text-sm ${
                            isTxIncome
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {isTxIncome ? '+' : '-'}$
                          {Number(tx.amount).toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>

                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                          {onEditTransaction && (
                            <button
                              type="button"
                              onClick={() => {
                                onClose()
                                onEditTransaction(tx)
                              }}
                              className="p-1 text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 rounded transition cursor-pointer"
                              title="Edit transaction"
                            >
                              <PencilSquareIcon className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {onDeleteTransaction && (
                            <button
                              type="button"
                              onClick={() => setDeleteTargetTx(tx)}
                              className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded transition cursor-pointer"
                              title="Delete transaction"
                            >
                              <TrashIcon className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Delete Transaction Confirmation Dialog */}
      {deleteTargetTx && (
        <ConfirmDialog
          title="Delete Transaction"
          message={`Are you sure you want to delete "${
            deleteTargetTx.description || 'this movement'
          }" for $${Number(deleteTargetTx.amount).toFixed(2)}? This action cannot be undone.`}
          confirmLabel="Delete"
          danger
          onConfirm={() => {
            onDeleteTransaction(deleteTargetTx)
            setDeleteTargetTx(null)
          }}
          onCancel={() => setDeleteTargetTx(null)}
        />
      )}
    </>
  )
}

