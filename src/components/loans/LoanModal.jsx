import { useState, useEffect, useRef } from 'react'
import { XMarkIcon, CreditCardIcon, ChevronUpDownIcon, CheckIcon } from '@heroicons/react/24/outline'
import CurrencyInput from '../ui/CurrencyInput'
import { LOAN_FREQUENCIES } from '../../utils/loanUtils'

export default function LoanModal({
  isOpen,
  onClose,
  loan = null, // null for create, object for edit
  categories = [],
  onSave,
}) {
  const isEditing = Boolean(loan)

  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [startingBalance, setStartingBalance] = useState('')
  const [totalAmount, setTotalAmount] = useState('')
  const [expectedPayment, setExpectedPayment] = useState('')
  const [paymentFrequency, setPaymentFrequency] = useState('monthly')
  const [endDate, setEndDate] = useState('')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState('active')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [isMoreOpen, setIsMoreOpen] = useState(false)
  const moreMenuRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target)) {
        setIsMoreOpen(false)
      }
    }
    if (isMoreOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMoreOpen])

  useEffect(() => {
    if (loan) {
      setName(loan.name || '')
      setCategoryId(
        typeof loan.categoryId === 'object'
          ? loan.categoryId?.id || loan.categoryId?._id || ''
          : loan.categoryId || ''
      )
      setStartingBalance(loan.startingBalance !== undefined ? String(loan.startingBalance) : '')
      setTotalAmount(loan.totalAmount !== undefined ? String(loan.totalAmount) : '')
      setExpectedPayment(loan.expectedPayment !== undefined ? String(loan.expectedPayment) : '')
      setPaymentFrequency(loan.paymentFrequency || 'monthly')
      setEndDate(loan.endDate ? new Date(loan.endDate).toISOString().split('T')[0] : '')
      setNotes(loan.notes || '')
      setStatus(loan.status || 'active')
    } else {
      setName('')
      // Default to first expense category if available
      const firstExp = categories.find((c) => c.type === 'expense')
      setCategoryId(firstExp ? String(firstExp.id || firstExp.serverId || firstExp._id) : '')
      setStartingBalance('')
      setTotalAmount('')
      setExpectedPayment('')
      setPaymentFrequency('monthly')
      setEndDate('')
      setNotes('')
      setStatus('active')
    }
    setError('')
  }, [loan, isOpen, categories])

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Please provide a name for this loan (e.g., Auto Loan - Mazda).')
      return
    }

    if (!categoryId) {
      setError('Please select an expense category linked to this loan.')
      return
    }

    const numStarting = Number(startingBalance)
    if (isNaN(numStarting) || numStarting < 0) {
      setError('Please enter a valid starting balance (e.g., current debt balance).')
      return
    }

    const numTotal = totalAmount ? Number(totalAmount) : numStarting
    if (isNaN(numTotal) || numTotal < numStarting) {
      setError('Original total loan amount cannot be less than the starting balance.')
      return
    }

    const numPayment = Number(expectedPayment)
    if (isNaN(numPayment) || numPayment < 0) {
      setError('Please enter a valid expected installment payment.')
      return
    }

    try {
      setIsSubmitting(true)
      await onSave({
        name: name.trim(),
        categoryId,
        startingBalance: numStarting,
        totalAmount: numTotal,
        expectedPayment: numPayment,
        paymentFrequency,
        endDate: endDate ? new Date(endDate).toISOString() : null,
        notes: notes.trim(),
        status,
      })
      onClose()
    } catch (err) {
      console.error('Failed to save loan:', err)
      setError(err.message || 'Failed to save loan. Please check your inputs.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Filter only expense categories
  const expenseCategories = categories.filter((c) => c.type === 'expense')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-sheet-backdrop">
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-200 dark:border-sky-800/80">
              <CreditCardIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isEditing ? 'Edit Loan Details' : 'Track New Loan / Credit'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isEditing
                  ? 'Update credit parameters or current installment'
                  : 'Track an ongoing or new auto, mortgage, or personal credit'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Loan Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Loan Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Mazda 3 Auto Loan, Mortgage, Personal Loan"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Linked Category */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Linked Expense Category *
              </label>
              <span className="text-[10px] text-slate-400">Payments log under this category</span>
            </div>
            <select
              required
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
            >
              <option value="" disabled>Select category...</option>
              {expenseCategories.map((c) => (
                <option key={c.id || c.serverId || c._id} value={c.id || c.serverId || c._id}>
                  {c.name} {c.sectionName ? `(${c.sectionName})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Balances Grid: Current Owed vs Original Total */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <CurrencyInput
                label="Current Debt Balance *"
                value={startingBalance}
                onChange={(val) => setStartingBalance(val)}
                helperText="What you currently owe today"
                size="compact"
              />
            </div>

            <div>
              <CurrencyInput
                label="Original Total (Optional)"
                value={totalAmount}
                onChange={(val) => setTotalAmount(val)}
                helperText="Initial debt when first acquired"
                size="compact"
              />
            </div>
          </div>

          {/* Payment Terms Grid: Installment & Frequency */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <CurrencyInput
                label="Expected Installment *"
                value={expectedPayment}
                onChange={(val) => setExpectedPayment(val)}
                helperText="Editable anytime if cuota changes"
                size="compact"
              />
            </div>

            <div className="flex flex-col">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Payment Frequency *
              </label>
              {(() => {
                const activeFrequency =
                  LOAN_FREQUENCIES.find((f) => f.value === paymentFrequency) || LOAN_FREQUENCIES[0]

                return (
                  <div className="relative" ref={moreMenuRef}>
                    <button
                      type="button"
                      onClick={() => setIsMoreOpen((prev) => !prev)}
                      className="w-full h-[66px] px-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-100/70 dark:hover:bg-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition flex items-center justify-between cursor-pointer group text-left"
                    >
                      <div className="flex flex-col min-w-0 pr-2">
                        <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors truncate">
                          {activeFrequency.label}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {activeFrequency.sub}
                        </span>
                      </div>
                      <div className="shrink-0 w-8 h-8 rounded-xl bg-white dark:bg-slate-700 border border-slate-200/80 dark:border-slate-600 flex items-center justify-center text-slate-500 dark:text-slate-300 shadow-xs group-hover:border-sky-300 dark:group-hover:border-sky-500 transition-colors">
                        <ChevronUpDownIcon className="w-4 h-4" />
                      </div>
                    </button>

                    {isMoreOpen && (
                      <div className="absolute left-0 right-0 top-full mt-2 rounded-2xl bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 z-40 max-h-64 overflow-y-auto">
                        <div className="px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-700/60 mb-1">
                          Select Frequency
                        </div>
                        {LOAN_FREQUENCIES.map((opt) => {
                          const isSelected = paymentFrequency === opt.value
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => {
                                setPaymentFrequency(opt.value)
                                setIsMoreOpen(false)
                              }}
                              className={`w-full px-3.5 py-2.5 text-left flex items-center justify-between text-xs transition cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/60 ${
                                isSelected
                                  ? 'font-bold text-sky-600 dark:text-sky-400 bg-sky-50/50 dark:bg-sky-950/20'
                                  : 'text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              <div>
                                <div className="font-semibold text-sm">{opt.label}</div>
                                <div className="text-[11px] text-slate-400 font-normal">{opt.sub}</div>
                              </div>
                              {isSelected && (
                                <CheckIcon className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                              )}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })()}
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 text-center">
                {(LOAN_FREQUENCIES.find((f) => f.value === paymentFrequency) || LOAN_FREQUENCIES[0]).helper}
              </p>
            </div>
          </div>

          {/* Target Payoff Date (Optional) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Contract End Date (Optional)
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Target contractual date when the credit is scheduled to finish
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Personal Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Extra payments lower monthly installments; insurance renewal added in March."
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
            />
          </div>

          {isEditing && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
              >
                <option value="active">Active (En curso)</option>
                <option value="paid_off">Paid Off (Liquidado 🎉)</option>
                <option value="archived">Archived (Archivado)</option>
              </select>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 active:scale-95 disabled:opacity-50 rounded-xl shadow-sm transition cursor-pointer"
            >
              {isSubmitting ? 'Saving...' : isEditing ? 'Update Loan' : 'Start Tracking Loan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

