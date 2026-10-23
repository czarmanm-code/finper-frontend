import { useState, useRef } from 'react'
import {
  XMarkIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  CalendarDaysIcon,
  CreditCardIcon,
  CheckCircleIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'
import PayoffChart from './PayoffChart'
import ConfirmDialog from '../ui/ConfirmDialog'
import { formatFrequency } from '../../utils/loanUtils'

export default function LoanDetailSheet({
  isOpen,
  onClose,
  loan = null,
  loanDetails = null, // Detailed object with payments and timeline
  onEditLoan,
  onDeleteLoan,
  onAddPayment,
  onDeleteTransaction,
}) {
  const [deleteTargetTx, setDeleteTargetTx] = useState(null)
  const [isClosing, setIsClosing] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const touchStartY = useRef(0)

  if (!isOpen || !loan) return null

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

  const activeLoan = loanDetails || loan
  const category = activeLoan.categoryId || {}
  const color = category.color || '#3b82f6'

  const currentBalance = Number(activeLoan.currentBalance ?? activeLoan.startingBalance ?? 0)
  const totalAmount = Number(activeLoan.totalAmount ?? activeLoan.startingBalance ?? 0)
  const totalPaid = Number(activeLoan.totalPaid ?? (totalAmount - currentBalance))
  const progressPercent = activeLoan.progressPercent ?? (totalAmount > 0 ? Math.min(100, Math.round((totalPaid / totalAmount) * 100)) : 0)
  const expectedPayment = Number(activeLoan.expectedPayment || 0)
  const isPaidOff = currentBalance <= 0
  const payments = activeLoan.payments || []
  const timeline = activeLoan.timeline || []

  // Dynamic backdrop opacity reacting to user touch drag
  const backdropOpacity = isClosing
    ? 0
    : isDragging && dragOffset > 0
    ? Math.max(0.05, 0.5 * (1 - dragOffset / 350))
    : 0.5

  return (
    <>
      {/* Dimmed Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-slate-950 backdrop-blur-xs transition-opacity duration-250 ease-out"
        style={{ opacity: backdropOpacity }}
        onClick={handleDismiss}
        aria-hidden="true"
      />

      {/* Sheet Container: Bottom Sheet on Mobile (<sm), Slide-over on Desktop (sm+) */}
      <aside
        className={`fixed z-50 bg-white dark:bg-slate-900 shadow-2xl flex flex-col
          inset-x-0 bottom-0 h-[88vh] rounded-t-3xl border-t border-slate-200 dark:border-slate-800
          sm:inset-y-0 sm:right-0 sm:left-auto sm:h-full sm:w-full sm:max-w-lg sm:rounded-none sm:border-t-0 sm:border-l ${
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

        {/* Top Bar: Title & Close Button */}
        <div
          className="flex items-center justify-between px-6 pt-2 pb-2 sm:pt-6 border-b border-slate-100 dark:border-slate-800/80 shrink-0 touch-none sm:touch-auto"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Loan Trajectory & Amortization
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                isPaidOff
                  ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400'
                  : 'bg-sky-100 dark:bg-sky-950/70 text-sky-700 dark:text-sky-400'
              }`}
            >
              {isPaidOff ? 'Paid Off 🎉' : `${progressPercent}% Amortized`}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {onEditLoan && (
              <button
                type="button"
                onClick={() => {
                  handleDismiss()
                  onEditLoan(activeLoan)
                }}
                className="p-1.5 text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                title="Edit loan parameters"
              >
                <PencilSquareIcon className="w-4 h-4" />
              </button>
            )}

            {onDeleteLoan && (
              <button
                type="button"
                onClick={() => {
                  handleDismiss()
                  onDeleteLoan(activeLoan)
                }}
                className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                title="Delete loan"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={handleDismiss}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              aria-label="Close sheet"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Loan Title & Category Badge */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <span
                className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs"
                style={{
                  backgroundColor: `${color}18`,
                  color: color,
                }}
              >
                <CreditCardIcon className="w-6 h-6" />
              </span>

              <div className="min-w-0">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white truncate">
                  {activeLoan.name}
                </h3>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  <span>Category: {category.name || 'Debt'}</span>
                  {category.sectionId?.name && (
                    <>
                      <span>·</span>
                      <span className="text-sky-600 dark:text-sky-400 font-medium">
                        {category.sectionId.name}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Big Progress KPI Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-sky-50/30 dark:from-slate-800/50 dark:to-sky-950/20 border border-slate-200/80 dark:border-slate-800 space-y-4">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">
                  Remaining Debt
                </span>
                <div className="text-3xl font-black text-slate-900 dark:text-white mt-0.5 tracking-tight">
                  ${currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">
                  Total Loan
                </span>
                <div className="text-lg font-semibold text-slate-600 dark:text-slate-300 mt-0.5">
                  ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="space-y-1.5">
              <div className="h-3 w-full bg-slate-200/80 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-sky-500 transition-all duration-700 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold">
                <span className="text-sky-600 dark:text-sky-400">{progressPercent}% Paid Off</span>
                <span>${totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })} Amortized</span>
              </div>
            </div>

            {/* Installment Badge info */}
            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">
                Scheduled Installment:
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                ${expectedPayment.toLocaleString('en-US')} / {formatFrequency(activeLoan.paymentFrequency)}
              </span>
            </div>

            {/* Contract Maturity Date */}
            {activeLoan.endDate && (
              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">
                  Contract Maturity Date:
                </span>
                <span className="font-bold text-sky-600 dark:text-sky-400">
                  {new Date(activeLoan.endDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
            )}
          </div>

          {/* Action: Log a Payment directly to this loan */}
          {onAddPayment && (
            <button
              type="button"
              onClick={() => {
                handleDismiss()
                onAddPayment(category)
              }}
              className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 active:scale-98 transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <PlusIcon className="w-4 h-4" />
              <span>Log Payment to {activeLoan.name}</span>
            </button>
          )}

          {/* Burn-down Payoff Chart */}
          <PayoffChart
            timeline={timeline}
            startingBalance={Number(activeLoan.startingBalance || totalAmount)}
            currentBalance={currentBalance}
            loanName={activeLoan.name}
          />

          {/* Payment History List */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Recorded Payments Log
              </h4>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {payments.length} payments
              </span>
            </div>

            {payments.length === 0 ? (
              <div className="p-8 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-1.5">
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  No payments logged in {category.name || 'this category'} yet.
                </p>
                <p className="text-[11px] text-slate-400">
                  When you record transactions in this category, each payment will appear here and reduce your remaining debt.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
                {payments.map((tx) => (
                  <div
                    key={tx.id || tx._id}
                    className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition group"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">
                        {tx.description || 'Loan Payment'}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {new Date(tx.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
                        -${Number(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>

                      {onDeleteTransaction && (
                        <button
                          type="button"
                          onClick={() => setDeleteTargetTx(tx)}
                          className="p-1 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded transition cursor-pointer"
                          title="Delete payment movement"
                        >
                          <TrashIcon className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Delete Payment Confirm Dialog */}
      {deleteTargetTx && (
        <ConfirmDialog
          title="Delete Payment Record?"
          message={`Are you sure you want to delete this payment of $${Number(deleteTargetTx.amount).toFixed(2)}? Your remaining debt balance will increase accordingly.`}
          confirmLabel="Delete Payment"
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

