import { useState } from 'react'
import Modal from './ui/Modal'
import CurrencyInput from './ui/CurrencyInput'
import { HEROICON_MAP } from '../utils/heroicons'
import { updateCategoryPlannedAmount } from '../services/categoriesService'

export default function SetTargetModal({ category, onClose, onTargetSaved }) {
  const isIncome = category?.type === 'income'
  const [amount, setAmount] = useState(() =>
    category?.budget && category.budget > 0 ? String(category.budget) : ''
  )
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  if (!category) return null

  const IconComponent =
    typeof category.icon === 'function'
      ? category.icon
      : HEROICON_MAP[category.icon] || HEROICON_MAP.TagIcon

  async function handleSubmit(e) {
    e.preventDefault()
    const parsed = parseFloat(amount)
    if (isNaN(parsed) || parsed < 0) {
      setError('Please enter a valid amount (0 or greater).')
      return
    }

    setIsSaving(true)
    try {
      await updateCategoryPlannedAmount(category.id, parsed)
      if (onTargetSaved) onTargetSaved(parsed)
      onClose()
    } catch (err) {
      console.error('Failed to update target:', err)
      setError('Could not save target. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const modalTitle = isIncome ? 'Set Monthly Expected' : 'Set Monthly Budget'

  return (
    <Modal title={modalTitle} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Category overview chip */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              backgroundColor: category.color ? `${category.color}20` : 'rgba(59, 130, 246, 0.1)',
              color: category.color || '#3b82f6',
            }}
          >
            {IconComponent && <IconComponent className="w-5 h-5" />}
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white text-sm">
              {category.name}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
              {isIncome ? 'Income category' : 'Expense category'}
            </p>
          </div>
        </div>

        <CurrencyInput
          label={isIncome ? 'Monthly Expected Amount' : 'Monthly Budget Limit'}
          value={amount}
          onChange={(val) => {
            setAmount(String(val))
            setError('')
          }}
          helperText={
            isIncome
              ? 'Total amount you project to receive from this category during the month (e.g. 66,000 for two paychecks of 33k).'
              : 'The maximum spending limit you plan for this category during the month.'
          }
          error={error}
          autoFocus
          size="hero"
        />

        <div className="flex justify-end gap-3 mt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-50 transition"
          >
            {isSaving ? 'Saving...' : 'Save Plan'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

