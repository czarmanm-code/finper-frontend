import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Modal from './ui/Modal'
import { createTransactionOfflineFirst } from '../services/transactionsOfflineService'
import { getCategoriesOfflineFirst } from '../services/categoriesOfflineService'

export function QuickTransactionModal({ isOpen, onClose, onCreated }) {
  if (!isOpen) return null

  const [rawAmount, setRawAmount] = useState('')
  const [type, setType] = useState('expense')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [categories, setCategories] = useState([])
  const [loadingCategories, setLoadingCategories] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState(null)

  // Fetch categories whenever modal opens or transaction type changes
  useEffect(() => {
    if (!isOpen) return

    let isMounted = true
    setLoadingCategories(true)

    getCategoriesOfflineFirst(type)
      .then((cats) => {
        if (!isMounted) return
        setCategories(cats)
        if (cats.length > 0) {
          const currentValid = cats.some((c) => (c.serverId || c.id) === categoryId)
          if (!currentValid) {
            setCategoryId(cats[0].serverId || cats[0].id)
          }
        } else {
          setCategoryId('')
        }
      })
      .catch((err) => {
        console.error('Error fetching categories:', err)
      })
      .finally(() => {
        if (isMounted) setLoadingCategories(false)
      })

    return () => {
      isMounted = false
    }
  }, [isOpen, type])

  // Currency input handler with real-time numeric formatting
  const handleAmountChange = (e) => {
    const inputVal = e.target.value
    // Allow only digits and a single decimal point
    const cleaned = inputVal.replace(/[^0-9.]/g, '')

    // Prevent multiple decimals
    const parts = cleaned.split('.')
    if (parts.length > 2) return

    // Limit decimal places to 2
    if (parts[1] && parts[1].length > 2) return

    setRawAmount(cleaned)
  }

  // Format currency display with commas for whole number part
  const getFormattedDisplayValue = () => {
    if (!rawAmount) return ''
    const parts = rawAmount.split('.')
    const integerPart = parts[0] ? Number(parts[0]).toLocaleString('en-US') : '0'
    if (parts.length > 1) {
      return `${integerPart}.${parts[1]}`
    }
    return integerPart
  }

  const numericAmount = parseFloat(rawAmount)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!numericAmount || numericAmount <= 0) {
      setFeedback('Please enter a valid amount greater than 0.')
      return
    }
    if (!categoryId) {
      setFeedback('Please select a category.')
      return
    }

    setIsSubmitting(true)
    setFeedback(null)

    try {
      const result = await createTransactionOfflineFirst({
        amount: numericAmount,
        type,
        description,
        categoryId,
        date: new Date().toISOString(),
      })

      // Notify parent immediately so Dashboard updates without waiting for modal timeout
      if (onCreated) {
        onCreated(result)
      }

      setFeedback(
        result.isOffline
          ? 'Transaction saved successfully (Offline mode).'
          : 'Transaction created and synced successfully.'
      )

      setTimeout(() => {
        setRawAmount('')
        setDescription('')
        setFeedback(null)
        setIsSubmitting(false)
        onClose()
      }, 700)
    } catch (err) {
      setFeedback(`Error: ${err.message}`)
      setIsSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Transaction">
      <form onSubmit={handleSubmit} className="space-y-4">
        {feedback && (
          <div className="p-3 text-xs rounded-lg bg-sky-50 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
            {feedback}
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Type
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`py-2 text-sm font-medium rounded-lg border transition ${
                type === 'expense'
                  ? 'bg-rose-50 border-rose-500 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`py-2 text-sm font-medium rounded-lg border transition ${
                type === 'income'
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              Income
            </button>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Category <span className="text-rose-500">*</span>
            </label>
            <Link
              to="/categorias"
              onClick={onClose}
              className="text-xs text-sky-600 dark:text-sky-400 hover:underline"
            >
              Manage categories
            </Link>
          </div>
          {loadingCategories ? (
            <div className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-400">
              Loading categories...
            </div>
          ) : (
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              {categories.map((cat) => {
                const idVal = cat.serverId || cat.id
                return (
                  <option key={idVal} value={idVal}>
                    {cat.name}
                  </option>
                )
              })}
            </select>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Amount <span className="text-rose-500">*</span>
          </label>
          <div className="relative rounded-lg shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <span className="text-slate-500 dark:text-slate-400 text-sm font-semibold">$</span>
            </div>
            <input
              type="text"
              inputMode="decimal"
              required
              value={getFormattedDisplayValue()}
              onChange={handleAmountChange}
              placeholder="0.00"
              className="w-full pl-8 pr-3 py-2 text-sm font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Description
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Groceries, Coffee, Salary"
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !categoryId || !numericAmount}
            className="px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-50 rounded-lg transition"
          >
            {isSubmitting ? 'Saving...' : 'Save Transaction'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
