import { useState, useEffect, useMemo } from 'react'
import {
  XMarkIcon,
  ArrowTrendingUpIcon,
  SparklesIcon,
  LinkIcon,
} from '@heroicons/react/24/outline'
import CurrencyInput from '../ui/CurrencyInput'
import { INVESTMENT_TYPES, getDefaultAnnualRate } from '../../utils/investmentUtils'
import { usePrivacy } from '../../context/PrivacyContext'

const COLOR_PRESETS = [
  '#10b981', // emerald
  '#0284c7', // sky
  '#8b5cf6', // purple
  '#f59e0b', // amber
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#64748b', // slate
]

export default function InvestmentModal({
  isOpen,
  onClose,
  investment = null, // null for create, object for edit
  categories = [],
  onSave,
}) {
  const { mask } = usePrivacy()
  const isEditing = Boolean(investment)

  const [name, setName] = useState('')
  const [institution, setInstitution] = useState('')
  const [type, setType] = useState('fixed_income')
  const [categoryId, setCategoryId] = useState('')
  const [initialBalance, setInitialBalance] = useState('')
  const [estimatedAnnualRate, setEstimatedAnnualRate] = useState('')
  const [color, setColor] = useState('#10b981')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState('active')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [manuallyChangedCategory, setManuallyChangedCategory] = useState(false)

  // Group categories into Savings/Investment and Other
  const { savingsCategories, otherCategories } = useMemo(() => {
    const isSavingsTerm = (term = '') => {
      const lower = term.toLowerCase()
      return (
        lower.includes('saving') ||
        lower.includes('ahorro') ||
        lower.includes('invest') ||
        lower.includes('invers') ||
        lower.includes('retiro') ||
        lower.includes('retirement') ||
        lower.includes('emergency fund') ||
        lower.includes('fondo de emergencia') ||
        lower.includes('cetes') ||
        lower.includes('cajita') ||
        lower.includes('gbm')
      )
    }

    const savings = []
    const others = []

    categories.forEach((c) => {
      if (isSavingsTerm(c.name) || isSavingsTerm(c.sectionName) || c.isSavings) {
        savings.push(c)
      } else {
        others.push(c)
      }
    })

    return { savingsCategories: savings, otherCategories: others }
  }, [categories])

  const selectedCategory = useMemo(() => {
    if (!categoryId) return null
    return categories.find((c) => (c.id || c.serverId || c._id) === categoryId) || null
  }, [categoryId, categories])

  const handleNameChange = (e) => {
    const newName = e.target.value
    setName(newName)

    // Auto-detect matching category by name if creating and not yet manually chosen
    if (!isEditing && !manuallyChangedCategory && newName.trim().length >= 3) {
      const lower = newName.trim().toLowerCase()
      const match = categories.find((c) => {
        const cLower = (c.name || '').toLowerCase()
        return cLower.includes(lower) || lower.includes(cLower)
      })
      if (match) {
        setCategoryId(match.id || match.serverId || match._id)
      }
    }
  }

  useEffect(() => {
    if (investment) {
      setName(investment.name || '')
      setInstitution(investment.institution || '')
      setType(investment.type || 'fixed_income')
      setCategoryId(
        typeof investment.categoryId === 'object'
          ? investment.categoryId?.id || investment.categoryId?._id || ''
          : investment.categoryId || ''
      )
      setInitialBalance(
        investment.initialBalance !== undefined ? String(investment.initialBalance) : ''
      )
      setEstimatedAnnualRate(
        investment.estimatedAnnualRate !== undefined && investment.estimatedAnnualRate !== null
          ? String(investment.estimatedAnnualRate)
          : ''
      )
      setColor(investment.color || '#10b981')
      setNotes(investment.notes || '')
      setStatus(investment.status || 'active')
      setManuallyChangedCategory(Boolean(investment.categoryId))
    } else {
      setName('')
      setInstitution('')
      setType('fixed_income')
      setCategoryId('')
      setInitialBalance('')
      setEstimatedAnnualRate('')
      setColor('#10b981')
      setNotes('')
      setStatus('active')
      setManuallyChangedCategory(false)
    }
    setError('')
  }, [investment, isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Please provide a name for this investment account (e.g., CETES 28D, GBM+ SIC).')
      return
    }

    const numInitial = initialBalance !== '' ? Number(initialBalance) : 0
    if (isNaN(numInitial) || numInitial < 0) {
      setError('Please enter a valid starting balance (0 or greater).')
      return
    }

    const numRate =
      estimatedAnnualRate !== '' && !isNaN(Number(estimatedAnnualRate))
        ? Math.max(0, Number(estimatedAnnualRate))
        : null

    try {
      setIsSubmitting(true)
      await onSave({
        name: name.trim(),
        institution: institution.trim(),
        type,
        categoryId: categoryId || null,
        initialBalance: numInitial,
        estimatedAnnualRate: numRate,
        color,
        notes: notes.trim(),
        status,
      })
      onClose()
    } catch (err) {
      console.error('Failed to save investment:', err)
      setError(err.message || 'Failed to save investment. Please verify your entries.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-sheet-backdrop">
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
              <ArrowTrendingUpIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isEditing ? 'Edit Investment Account' : 'New Investment Account'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isEditing
                  ? 'Update instrument details and category linkage'
                  : 'Track savings, government bonds, or compounding portfolios'}
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

          {/* Account Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Instrument / Account Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={handleNameChange}
              placeholder="e.g. CETES Directo, GBM+ Trading, Nu Cajitas"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Institution & Asset Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Institution / Broker
              </label>
              <input
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="e.g. Banxico, GBM, Nu, Sura"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Asset Class *
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                {INVESTMENT_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Initial / Starting Balance */}
          <div>
            <CurrencyInput
              label={isEditing ? 'Baseline Starting Balance' : 'Initial Starting Balance'}
              value={initialBalance}
              onChange={(val) => setInitialBalance(val)}
              helperText="Baseline amount before your monthly records take effect"
              size="compact"
            />
          </div>

          {/* Estimated Annual Yield (APR) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Estimated Annual Yield (APR %)
              </label>
              {estimatedAnnualRate === '' && (
                <span className="text-[11px] font-medium text-slate-400">
                  Benchmark: {getDefaultAnnualRate(type)}% APR
                </span>
              )}
            </div>

            <div className="flex items-stretch h-11 w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shadow-2xs focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500">
              <input
                type="text"
                inputMode="decimal"
                value={estimatedAnnualRate}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9.]/g, '')
                  const parts = raw.split('.')
                  const clean = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : raw
                  setEstimatedAnnualRate(clean)
                }}
                placeholder={String(getDefaultAnnualRate(type))}
                className="flex-1 min-w-0 bg-transparent px-3.5 py-2 text-sm sm:text-base font-bold text-slate-900 dark:text-white text-right focus:outline-none"
              />
              <div className="flex items-center justify-center px-3.5 bg-slate-100 dark:bg-slate-700/60 border-l border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold text-sm select-none">
                %
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-tight">
              Target annual percentage yield (e.g. 10.25 for CETES 28D, 13.5 for Nu Cajitas). Saved as the default rate for your growth runway.
            </p>
          </div>

          {/* Linked Budget Category */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Linked Budget Category (Optional)
              </label>
              {selectedCategory && (
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <LinkIcon className="w-3 h-3" />
                  Planned: {mask(selectedCategory.plannedAmount)}/mo
                </span>
              )}
            </div>

            <select
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value)
                setManuallyChangedCategory(true)
              }}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="">None (Independent account without monthly budget link)</option>
              {savingsCategories.length > 0 && (
                <optgroup label="Savings & Investments (Recommended)">
                  {savingsCategories.map((c) => {
                    const id = c.id || c.serverId || c._id
                    const planned = Number(c.plannedAmount) || 0
                    return (
                      <option key={id} value={id}>
                        ⭐ {c.name} {planned > 0 ? `(${mask(planned)}/mo)` : ''}
                      </option>
                    )
                  })}
                </optgroup>
              )}
              {otherCategories.length > 0 && (
                <optgroup label="Other Budget Categories">
                  {otherCategories.map((c) => {
                    const id = c.id || c.serverId || c._id
                    return (
                      <option key={id} value={id}>
                        {c.name} {c.sectionName ? `(${c.sectionName})` : ''}
                      </option>
                    )
                  })}
                </optgroup>
              )}
            </select>

            <p className="text-[11px] text-slate-400 leading-tight">
              Auto-detects matching savings categories. When linked, monthly planned deposits automatically populate your Wealth Runway.
            </p>
          </div>

          {/* Color Tag */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Accent Color
            </label>
            <div className="flex items-center gap-3">
              {COLOR_PRESETS.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => setColor(hex)}
                  style={{ backgroundColor: hex }}
                  className={`w-7 h-7 rounded-full transition-transform cursor-pointer ${
                    color === hex ? 'ring-2 ring-offset-2 ring-emerald-500 scale-110' : 'hover:scale-105'
                  }`}
                  aria-label={`Color ${hex}`}
                />
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Notes & Strategy (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. 28-day rollover rate, 100% S&P 500 ETF, liquid emergency cushion..."
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          {/* Status (when editing) */}
          {isEditing && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Account Status
              </label>
              <div className="flex items-center gap-4">
                <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value="active"
                    checked={status === 'active'}
                    onChange={() => setStatus('active')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Active</span>
                </label>
                <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value="archived"
                    checked={status === 'archived'}
                    onChange={() => setStatus('archived')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Archived / Closed</span>
                </label>
              </div>
            </div>
          )}

          {/* Submit Buttons */}
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
              {isSubmitting ? 'Saving...' : isEditing ? 'Update Account' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

