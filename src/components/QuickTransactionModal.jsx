import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Modal from './ui/Modal'
import ConfirmDialog from './ui/ConfirmDialog'
import CurrencyInput from './ui/CurrencyInput'
import {
  createTransactionOfflineFirst,
  updateTransactionOfflineFirst,
  deleteTransactionOfflineFirst,
} from '../services/transactionsOfflineService'
import { getCategoriesOfflineFirst } from '../services/categoriesOfflineService'
import { TrashIcon } from '@heroicons/react/24/outline'

export function QuickTransactionModal({
  isOpen,
  transaction = null,
  onClose,
  onCreated,
}) {
  if (!isOpen) return null

  const isEditing = Boolean(transaction)

  // Helper to format a date to YYYY-MM-DD
  const formatDateToYMD = (val) => {
    if (!val) {
      return new Date().toISOString().split('T')[0]
    }
    try {
      const d = new Date(val)
      if (isNaN(d.getTime())) {
        return new Date().toISOString().split('T')[0]
      }
      return d.toISOString().split('T')[0]
    } catch {
      return new Date().toISOString().split('T')[0]
    }
  }

  const [date, setDate] = useState(() => formatDateToYMD(transaction?.rawDate || transaction?.date))
  const [rawAmount, setRawAmount] = useState(() =>
    transaction?.amount ? String(transaction.amount) : ''
  )
  const [type, setType] = useState(() =>
    transaction?.type?.toLowerCase() === 'income' ? 'income' : 'expense'
  )
  const [description, setDescription] = useState(() => transaction?.description || '')
  const [categoryId, setCategoryId] = useState(() => transaction?.categoryId || '')
  const [categories, setCategories] = useState([])
  const [loadingCategories, setLoadingCategories] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Sync state whenever transaction prop or open state changes
  useEffect(() => {
    if (!isOpen) return

    if (transaction) {
      setType(transaction.type?.toLowerCase() === 'income' ? 'income' : 'expense')
      setRawAmount(transaction.amount ? String(transaction.amount) : '')
      setDescription(transaction.description || '')
      setCategoryId(transaction.categoryId || '')
      setDate(formatDateToYMD(transaction.rawDate || transaction.date))
    } else {
      setType('expense')
      setRawAmount('')
      setDescription('')
      setDate(formatDateToYMD(null))
      setFeedback(null)
    }
  }, [isOpen, transaction])

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
  }, [isOpen, type, categoryId])

  const numericAmount = parseFloat(rawAmount) || 0

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

    // Construct robust date with mid-day time to prevent timezone shift issues
    const selectedDateISO = new Date(`${date}T12:00:00`).toISOString()

    try {
      if (isEditing) {
        const targetId = transaction.localId || transaction.serverId || transaction.id
        await updateTransactionOfflineFirst(targetId, {
          amount: numericAmount,
          type,
          description: description.trim(),
          categoryId,
          date: selectedDateISO,
        })
        setFeedback('Transaction updated successfully.')
      } else {
        const result = await createTransactionOfflineFirst({
          amount: numericAmount,
          type,
          description: description.trim(),
          categoryId,
          date: selectedDateISO,
        })
        setFeedback(
          result.isOffline
            ? 'Transaction saved successfully (Offline mode).'
            : 'Transaction created and synced successfully.'
        )
      }

      if (onCreated) {
        onCreated()
      }

      setTimeout(() => {
        setIsSubmitting(false)
        onClose()
      }, 500)
    } catch (err) {
      setFeedback(`Error: ${err.message}`)
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!transaction) return
    setIsSubmitting(true)
    try {
      const targetId = transaction.localId || transaction.serverId || transaction.id
      await deleteTransactionOfflineFirst(targetId)
      setConfirmDelete(false)
      if (onCreated) {
        onCreated()
      }
      onClose()
    } catch (err) {
      console.error('Delete transaction error:', err)
      setFeedback(`Error deleting: ${err.message}`)
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Transaction' : 'Add Transaction'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {feedback && (
            <div className="p-3 text-xs rounded-lg bg-sky-50 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
              {feedback}
            </div>
          )}

          {/* Type Toggle */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`py-2 text-sm font-semibold rounded-lg border transition ${
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
                className={`py-2 text-sm font-semibold rounded-lg border transition ${
                  type === 'income'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                Income
              </button>
            </div>
          </div>

          {/* Category Picker */}
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

          {/* Amount Input */}
          <CurrencyInput
            label="Amount"
            value={rawAmount}
            onChange={(val) => setRawAmount(String(val))}
            size="hero"
          />

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Description (optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Groceries, Bi-weekly paycheck, Coffee"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Modal Action Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
            {isEditing ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
              >
                <TrashIcon className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !categoryId || !numericAmount}
                className="px-4 py-2 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-50 rounded-lg shadow-sm transition"
              >
                {isSubmitting
                  ? 'Saving...'
                  : isEditing
                  ? 'Save Changes'
                  : 'Save Transaction'}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {confirmDelete && (
        <ConfirmDialog
          title="Delete Transaction"
          message="Are you sure you want to delete this transaction? This action cannot be undone."
          confirmLabel="Delete"
          danger
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </>
  )
}
