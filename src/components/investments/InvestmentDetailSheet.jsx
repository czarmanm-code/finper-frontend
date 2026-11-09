import { useState, useRef, useEffect } from 'react'
import {
  XMarkIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  CalendarDaysIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  SparklesIcon,
  BuildingLibraryIcon,
  LinkIcon,
} from '@heroicons/react/24/outline'
import ConfirmDialog from '../ui/ConfirmDialog'
import { formatInvestmentType, formatMonthKey, formatDateLabel } from '../../utils/investmentUtils'
import { usePrivacy } from '../../context/PrivacyContext'
import { lockScroll, unlockScroll } from '../../utils/scrollLock'

export default function InvestmentDetailSheet({
  isOpen,
  onClose,
  investment = null,
  categories = [],
  onEditInvestment,
  onDeleteInvestment,
  onAddRecord,
  onEditRecord,
  onDeleteRecord,
}) {
  const { mask } = usePrivacy()
  const [deleteTargetRecord, setDeleteTargetRecord] = useState(null)
  const [cachedInvestment, setCachedInvestment] = useState(investment)
  const [isClosing, setIsClosing] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const touchStartY = useRef(0)

  useEffect(() => {
    if (investment) {
      setCachedInvestment(investment)
      setIsClosing(false)
      setDragOffset(0)
    }
  }, [investment])

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

  // Lock body scroll when sheet is open
  useEffect(() => {
    if (!isOpen) return
    lockScroll()
    return () => {
      unlockScroll()
    }
  }, [isOpen])

  const activeInv = investment || cachedInvestment
  if ((!isOpen && !isClosing) || !activeInv) return null

  const handleDismiss = () => {
    if (isClosing) return
    setIsClosing(true)
    setTimeout(() => {
      onClose()
      setIsClosing(false)
      setDragOffset(0)
    }, 240)
  }

  const handleTouchStart = (e) => {
    if (isClosing) return
    touchStartY.current = e.touches[0].clientY
    setIsDragging(true)
  }

  const handleTouchMove = (e) => {
    if (!isDragging || isClosing) return
    const currentY = e.touches[0].clientY
    const diff = currentY - touchStartY.current
    if (diff > 0) setDragOffset(diff)
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

  const records = (activeInv.records || []).slice().sort((a, b) => new Date(b.date) - new Date(a.date))
  const currentBalance = Number(activeInv.currentBalance) || Number(activeInv.initialBalance) || 0
  const initialBalance = Number(activeInv.initialBalance) || 0
  const totalInvested = Number(activeInv.totalInvested) || initialBalance
  const totalGainLoss = Number(activeInv.totalGainLoss) || (currentBalance - totalInvested)
  const totalReturnPercent = Number(activeInv.totalReturnPercent) || (totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0)
  const isNetPositive = totalGainLoss >= 0

  const catId =
    typeof activeInv.categoryId === 'object'
      ? activeInv.categoryId?.id || activeInv.categoryId?._id
      : activeInv.categoryId
  const linkedCategory = catId
    ? categories.find((c) => (c.id || c.serverId || c._id) === catId) || null
    : null

  return (
    <>
      <div
        className={`fixed inset-0 z-50 transition-opacity duration-240 ${
          isClosing ? 'opacity-0' : 'opacity-100'
        }`}
        role="dialog"
        aria-modal="true"
      >
        {/* Backdrop */}
        <div
          onClick={handleDismiss}
          className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-240"
        />

        {/* Sheet Container: Bottom sheet on mobile, slide-over from right on desktop */}
        <div className="absolute inset-x-0 bottom-0 sm:inset-y-0 sm:right-0 sm:left-auto flex flex-col justify-end sm:justify-start pointer-events-none">
          <div
            style={dragOffset > 0 ? { transform: `translateY(${dragOffset}px)` } : undefined}
            className={`pointer-events-auto w-full sm:max-w-xl bg-white dark:bg-slate-900 shadow-2xl rounded-t-3xl sm:rounded-none sm:rounded-l-3xl border-t sm:border-t-0 sm:border-l border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] sm:max-h-none sm:h-full transition-transform duration-240 ${
              isClosing ? 'translate-y-full sm:translate-y-0 sm:translate-x-full' : 'translate-y-0 sm:translate-x-0'
            }`}
          >
            {/* Mobile Drag Indicator */}
            <div
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className="sm:hidden w-full flex justify-center py-2.5 shrink-0 cursor-grab active:cursor-grabbing"
            >
              <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
            </div>

            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black shadow-sm"
                  style={{ backgroundColor: activeInv.color || '#10b981' }}
                >
                  <ArrowTrendingUpIcon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                    {activeInv.name}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 mt-0.5">
                    {activeInv.institution && (
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {activeInv.institution} •
                      </span>
                    )}
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatInvestmentType(activeInv.type)}
                    </span>
                    {activeInv.estimatedAnnualRate !== undefined && activeInv.estimatedAnnualRate !== null && (
                      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                        {activeInv.estimatedAnnualRate}% APR
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    handleDismiss()
                    onEditInvestment(activeInv)
                  }}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  title="Edit investment"
                >
                  <PencilSquareIcon className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteInvestment(activeInv)}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                  title="Delete investment"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  title="Close"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Primary Valuation Hero Card */}
              <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-50/50 via-teal-50/20 to-white dark:from-slate-800/80 dark:via-slate-800/40 dark:to-slate-900 border border-emerald-100 dark:border-slate-700/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Current Valuation
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                      isNetPositive
                        ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
                        : 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300'
                    }`}
                  >
                    {totalReturnPercent >= 0 ? '+' : ''}
                    {Math.round(totalReturnPercent * 100) / 100}% All-time
                  </span>
                </div>

                <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                  {mask(currentBalance)}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-200/60 dark:border-slate-700/60">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Net Gain / Yield
                    </span>
                    <span
                      className={`text-base font-black ${
                        isNetPositive
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {totalGainLoss >= 0 ? '+' : ''}
                      {mask(totalGainLoss)}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Invested Principal
                    </span>
                    <span className="text-base font-bold text-slate-700 dark:text-slate-300">
                      {mask(totalInvested)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Linked Budget Category Card */}
              {linkedCategory ? (
                <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/80 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                      <LinkIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 block">
                        Linked Budget Category
                      </span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {linkedCategory.name}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-slate-400 block font-medium">Monthly Plan</span>
                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                      {mask(linkedCategory.plannedAmount)}/mo
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <LinkIcon className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      No linked Budget category
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      handleDismiss()
                      onEditInvestment(activeInv)
                    }}
                    className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    + Link to Budget
                  </button>
                </div>
              )}

              {/* Notes if present */}
              {activeInv.notes && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  <span className="font-bold text-slate-800 dark:text-white block mb-0.5">Strategy Notes</span>
                  {activeInv.notes}
                </div>
              )}

              {/* Monthly Cutoff Snapshots Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Monthly Cutoff Records
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Snapshots recorded at end-of-month or beginning of period
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      handleDismiss()
                      onAddRecord(activeInv)
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    <PlusIcon className="w-4 h-4" />
                    <span>Log Cutoff</span>
                  </button>
                </div>

                {records.length === 0 ? (
                  <div className="p-8 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2">
                    <CalendarDaysIcon className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      No monthly cutoffs logged yet
                    </p>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Click the "Log Cutoff" button to record your closing balance and returns for CETES, GBM, or savings accounts.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {records.map((rec) => {
                      const recId = rec.id || rec._id
                      const isGain = (rec.returnAmount || 0) >= 0
                      return (
                        <div
                          key={recId}
                          className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-2xs hover:border-emerald-300 dark:hover:border-emerald-700/80 transition flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                isGain
                                  ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                                  : 'bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                              }`}
                            >
                              {isGain ? (
                                <ArrowTrendingUpIcon className="w-4 h-4" />
                              ) : (
                                <ArrowTrendingDownIcon className="w-4 h-4" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                  {formatDateLabel(rec.date)}
                                </span>
                                {rec.monthKey && (
                                  <span className="text-[10px] font-semibold text-slate-400">
                                    ({formatMonthKey(rec.monthKey)})
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                <span>Closing: <strong className="text-slate-800 dark:text-slate-200 font-semibold">{mask(rec.balance)}</strong></span>
                                {rec.contributions > 0 && (
                                  <span>• +{mask(rec.contributions)} dep.</span>
                                )}
                                {rec.withdrawals > 0 && (
                                  <span>• -{mask(rec.withdrawals)} w/d</span>
                                )}
                              </div>
                              {rec.notes && (
                                <p className="text-[11px] text-slate-400 italic mt-0.5 truncate">
                                  {rec.notes}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <div className="text-right">
                              <div
                                className={`text-sm font-black ${
                                  isGain
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-rose-600 dark:text-rose-400'
                                }`}
                              >
                                {rec.returnAmount >= 0 ? '+' : ''}
                                {mask(rec.returnAmount)}
                              </div>
                              <div
                                className={`text-[11px] font-bold ${
                                  isGain
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-rose-600 dark:text-rose-400'
                                }`}
                              >
                                {rec.returnRate >= 0 ? '+' : ''}
                                {rec.returnRate}%
                              </div>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  handleDismiss()
                                  onEditRecord(activeInv, rec)
                                }}
                                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
                                title="Edit cutoff record"
                              >
                                <PencilSquareIcon className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteTargetRecord(rec)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                                title="Delete record"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Record Delete Dialog */}
      {deleteTargetRecord && (
        <ConfirmDialog
          title="Delete Cutoff Record?"
          message={`Are you sure you want to delete the cutoff record for ${formatDateLabel(deleteTargetRecord.date)}? This will recalculate returns for subsequent months.`}
          confirmLabel="Delete Record"
          danger
          onConfirm={async () => {
            await onDeleteRecord(activeInv, deleteTargetRecord)
            setDeleteTargetRecord(null)
          }}
          onCancel={() => setDeleteTargetRecord(null)}
        />
      )}
    </>
  )
}

