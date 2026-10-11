import { useState } from 'react'
import Modal from '../ui/Modal'
import IconPicker from './IconPicker'
import { COLOR_PALETTE, DEFAULT_COLOR } from '../../utils/colors'
import { DEFAULT_CATEGORY_ICON } from '../../utils/heroicons'

export default function CategoryFormModal({
  category,
  sections,
  defaultSectionId,
  isNameTaken,
  onSave,
  onClose,
}) {
  const isEditing = Boolean(category)
  const [name, setName] = useState(category?.name ?? '')
  const [icon, setIcon] = useState(category?.icon ?? DEFAULT_CATEGORY_ICON)
  const [color, setColor] = useState(category?.color ?? DEFAULT_COLOR)
  const [sectionId, setSectionId] = useState(category?.sectionId ?? defaultSectionId ?? sections[0]?.id ?? '')
  const [plannedAmount, setPlannedAmount] = useState(
    category?.plannedAmount !== undefined && category?.plannedAmount > 0 ? String(category.plannedAmount) : ''
  )
  const [error, setError] = useState('')

  const currentSection = sections.find((s) => s.id === sectionId)
  const isIncome =
    currentSection?.name?.toLowerCase().includes('income') ||
    currentSection?.name?.toLowerCase().includes('salary') ||
    currentSection?.name?.toLowerCase().includes('ingreso') ||
    category?.type === 'income'

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Category name is required.')
      return
    }
    if (!sectionId) {
      setError('Please select a section.')
      return
    }
    if (isNameTaken(sectionId, trimmed, category?.id)) {
      setError('A category with this name already exists in that section.')
      return
    }
    onSave({
      name: trimmed,
      icon,
      color,
      sectionId,
      plannedAmount: plannedAmount ? Math.max(0, parseFloat(plannedAmount) || 0) : 0,
    })
  }

  return (
    <Modal title={isEditing ? 'Edit category' : 'New category'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setError('')
            }}
            placeholder="e.g. Groceries, Travel"
            autoFocus
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Section
          </label>
          <select
            value={sectionId}
            onChange={(e) => {
              setSectionId(e.target.value)
              setError('')
            }}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          {error && <p className="text-sm text-rose-500 mt-1">{error}</p>}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              {isIncome ? 'Monthly Expected ($)' : 'Monthly Budget ($)'}
            </label>
            <span className="text-xs text-slate-400">Optional</span>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">$</span>
            <input
              type="number"
              step="any"
              min="0"
              value={plannedAmount}
              onChange={(e) => setPlannedAmount(e.target.value)}
              placeholder={isIncome ? 'e.g. 66000' : 'e.g. 8000'}
              className="w-full pl-7 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isIncome
              ? 'Estimated monthly income (e.g. 66,000 for bi-weekly paychecks of 33k).'
              : 'Maximum planned spending limit for this category for the month.'}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Color
          </label>
          <div className="flex flex-wrap gap-2">
            {COLOR_PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                style={{ backgroundColor: c }}
                className={`w-7 h-7 rounded-full transition ring-offset-2 ring-offset-white dark:ring-offset-slate-900 ${
                  color === c ? 'ring-2 ring-slate-900 dark:ring-white' : ''
                }`}
                aria-label={c}
              />
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Icon
          </label>
          <IconPicker value={icon} onChange={setIcon} />
        </div>

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
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 shadow-sm transition"
          >
            {isEditing ? 'Save changes' : 'Create category'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
