import { useState, useEffect, useMemo } from 'react'
import {
  XMarkIcon,
  CalendarDaysIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'
import CurrencyInput from '../ui/CurrencyInput'
import { usePrivacy } from '../../context/PrivacyContext'

export default function InvestmentRecordModal({
  isOpen,
  onClose,
  investment = null, // The parent investment object
  record = null,     // Existing record if editing, null if creating
  onSave,
}) {
  const { mask } = usePrivacy()
  const isEditing = Boolean(record)

  // Default date to today's date (YYYY-MM-DD)
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], [])

  const [date, setDate] = useState(todayStr)
  const [balance, setBalance] = useState('')
  const [contributions, setContributions] = useState('')
  const [withdrawals, setWithdrawals] = useState('')
  const [manualReturn, setManualReturn] = useState('')
  const [isManualOverride, setIsManualOverride] = useState(false)
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Determine the baseline balance before this cutoff:
  // If record exists, get balance prior to this record, else investment's current balance
  const previousBalance = useMemo(() => {
    if (!investment) return 0
    const records = investment.records || []
    if (isEditing && record) {
      const idx = records.findIndex((r) => (r.id || r._id) === (record.id || record._id))
      if (idx > 0) {
        return Number(records[idx - 1].balance) || 0
      }
      return Number(investment.initialBalance) || 0
    }
    // New record: take latest record balance, or initialBalance
    if (records.length > 0) {
      return Number(records[records.length - 1].balance) || 0
    }
    return Number(investment.initialBalance) || 0
  }, [investment, isEditing, record])

  useEffect(() => {
    if (record) {
      const recDate = record.date ? new Date(record.date).toISOString().split('T')[0] : todayStr
      setDate(recDate)
      setBalance(record.balance !== undefined ? String(record.balance) : '')
      setContributions(record.contributions ? String(record.contributions) : '')
      setWithdrawals(record.withdrawals ? String(record.withdrawals) : '')
      setNotes(record.notes || '')
      if (record.returnAmount !== undefined && record.returnAmount !== null) {
        setManualReturn(String(record.returnAmount))
        setIsManualOverride(true)
      } else {
        setManualReturn('')
        setIsManualOverride(false)
      }
    } else {
      setDate(todayStr)
      setBalance('')
      setContributions('')
      setWithdrawals('')
      setManualReturn('')
      setIsManualOverride(false)
      setNotes('')
    }
    setError('')
  }, [record, isOpen, todayStr])

  // Calculated auto return
  const computedReturn = useMemo(() => {
    const numBalance = Number(balance) || 0
    const numDeposits = Number(contributions) || 0
    const numWithdrawals = Number(withdrawals) || 0
    const netDeposit = numDeposits - numWithdrawals

    // Return = Current Balance - (Previous Balance + Net Deposit)
    const yieldAmount = numBalance - (previousBalance + netDeposit)
    const base = previousBalance + numDeposits
    const rate = base > 0 ? (yieldAmount / base) * 100 : 0

    return {
      amount: Math.round(yieldAmount * 100) / 100,
      rate: Math.round(rate * 100) / 100,
    }
  }, [balance, contributions, withdrawals, previousBalance])

  if (!isOpen || !investment) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!date) {
      setError('Please select a cutoff date.')
      return
    }

    const numBalance = Number(balance)
    if (isNaN(numBalance) || numBalance < 0) {
      setError('Please provide a valid closing balance (0 or greater).')
      return
    }

    const numContrib = contributions ? Number(contributions) : 0
    const numWithd = withdrawals ? Number(withdrawals) : 0

    if (isNaN(numContrib) || numContrib < 0) {
      setError('Contributions cannot be negative.')
      return
    }

    if (isNaN(numWithd) || numWithd < 0) {
      setError('Withdrawals cannot be negative.')
      return
    }

    let finalReturn = undefined
    if (isManualOverride && manualReturn !== '') {
      const numManual = Number(manualReturn)
      if (isNaN(numManual)) {
        setError('Please enter a valid number for the return amount (can be positive or negative).')
        return
      }
      finalReturn = numManual
    }

    try {
      setIsSubmitting(true)
      await onSave({
        date: new Date(date).toISOString(),
        balance: numBalance,
        contributions: numContrib,
        withdrawals: numWithd,
        returnAmount: finalReturn,
        notes: notes.trim(),
      })
      onClose()
    } catch (err) {
      console.error('Failed to log record:', err)
      setError(err.message || 'Failed to save monthly cutoff record.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isGain = (isManualOverride && manualReturn !== '' ? Number(manualReturn) : computedReturn.amount) >= 0

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-sheet-backdrop">
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
              <CalendarDaysIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isEditing ? 'Edit Monthly Cutoff' : 'Log Monthly Cutoff'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {investment.name} • Previous balance: {mask(previousBalance)}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Cutoff Date *
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Usually the end of the month (e.g. 30th/31st) or 1st of the following month.
            </p>
          </div>

          {/* Closing Balance Input */}
          <div>
            <CurrencyInput
              label="Closing Balance at Cutoff *"
              value={balance}
              onChange={(val) => setBalance(val)}
              helperText="The official ending balance in your account or broker statement"
              size="compact"
            />
          </div>

          {/* Contributions & Withdrawals */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <CurrencyInput
                label="Deposits / Contributions"
                value={contributions}
                onChange={(val) => setContributions(val)}
                helperText="New money added during period"
                size="compact"
              />
            </div>
            <div>
              <CurrencyInput
                label="Withdrawals"
                value={withdrawals}
                onChange={(val) => setWithdrawals(val)}
                helperText="Money withdrawn during period"
                size="compact"
              />
            </div>
          </div>

          {/* Computed Return Preview & Override */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Calculated Return / Yield
              </span>
              <button
                type="button"
                onClick={() => setIsManualOverride(!isManualOverride)}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                {isManualOverride ? 'Use Automatic Formula' : 'Manual Override'}
              </button>
            </div>

            {!isManualOverride ? (
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      isGain
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                        : 'bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {isGain ? (
                      <ArrowTrendingUpIcon className="w-4 h-4" />
                    ) : (
                      <ArrowTrendingDownIcon className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div
                      className={`text-sm font-black ${
                        isGain ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {computedReturn.amount >= 0 ? '+' : ''}
                      {mask(computedReturn.amount)}
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Balance - (Prev. {mask(previousBalance)} + Net flow)
                    </p>
                  </div>
                </div>

                <div
                  className={`px-2.5 py-1 rounded-full text-xs font-black ${
                    isGain
                      ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400'
                      : 'bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {computedReturn.rate >= 0 ? '+' : ''}
                  {computedReturn.rate}%
                </div>
              </div>
            ) : (
              <div className="pt-1">
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Manual Return Amount ($) — Use negative for losses (e.g. -500)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={manualReturn}
                  onChange={(e) => setManualReturn(e.target.value)}
                  placeholder="e.g. 845.50 or -350.00"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Monthly interest credited, S&P 500 dip..."
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Submit Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-sm transition cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : isEditing ? 'Update Cutoff' : 'Save Cutoff'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

