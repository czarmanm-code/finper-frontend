import { useState, useEffect, useCallback, useMemo } from 'react'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import SetTargetModal from '../components/SetTargetModal'
import { QuickTransactionModal } from '../components/QuickTransactionModal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import {
  BanknotesIcon,
  TicketIcon,
  ScaleIcon,
  SparklesIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import { getCategories, updateCategoryPlannedAmount } from '../services/categoriesService'
import { getTransactions, deleteTransaction } from '../services/transactionsService'
import { HEROICON_MAP } from '../utils/heroicons'
import MonthSelector from '../components/MonthSelector'
import CategoryDetailSheet from '../components/CategoryDetailSheet'
import { useDateFilter } from '../context/DateContext'

export default function Budget() {
  const { monthLabel, isTransactionInSelectedMonth } = useDateFilter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [categories, setCategories] = useState([])
  const [transactions, setTransactions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all') // 'all' | 'income' | 'expense'
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('custom') // 'custom' | 'budget-desc' | 'spent-desc' | 'alerts' | 'name'
  const [editingCategory, setEditingCategory] = useState(null)
  const [selectedCategoryForDetail, setSelectedCategoryForDetail] = useState(null)
  const [defaultCategoryForNewTx, setDefaultCategoryForNewTx] = useState(null)
  const [editingTransaction, setEditingTransaction] = useState(null)
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false)
  const [clearTargetConfirm, setClearTargetConfirm] = useState(null)

  // Fetch live categories and movements directly from MongoDB API
  const loadBudgetData = useCallback(async () => {
    try {
      const [fetchedCats, fetchedTxs] = await Promise.all([
        getCategories(),
        getTransactions(),
      ])
      setCategories(fetchedCats)
      setTransactions(fetchedTxs)
    } catch (err) {
      console.error('Failed to load budget data:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadBudgetData()
  }, [loadBudgetData])

  // Aggregate current month transactions per category with resilient matching
  const actualPerCategory = useMemo(() => {
    const map = {}
    const catMap = new Map()
    categories.forEach((c) => {
      if (c.serverId) catMap.set(String(c.serverId), c)
      if (c.id) catMap.set(String(c.id), c)
      if (c._id) catMap.set(String(c._id), c)
      if (c.name) catMap.set(c.name.trim().toLowerCase(), c)
    })

    transactions
      .filter((tx) => isTransactionInSelectedMonth(tx.date))
      .forEach((tx) => {
        const rawCatId = typeof tx.categoryId === 'object' ? (tx.categoryId?.id || tx.categoryId?._id) : tx.categoryId
        const catKey = rawCatId ? String(rawCatId) : null
        const catName = (tx.categoryName || tx.category || '').trim().toLowerCase()
        const matchedCat = (catKey && catMap.get(catKey)) || (catName && catMap.get(catName))

        const primaryId = matchedCat ? (matchedCat.serverId || matchedCat.id || String(matchedCat._id)) : catKey
        if (primaryId) {
          map[primaryId] = (map[primaryId] || 0) + (Number(tx.amount) || 0)
        }
      })
    return map
  }, [transactions, categories, isTransactionInSelectedMonth])

  // Transactions filtered for current selected month
  const currentMonthTransactions = useMemo(() => {
    return transactions.filter((tx) => isTransactionInSelectedMonth(tx.date))
  }, [transactions, isTransactionInSelectedMonth])

  // Map category metrics
  const budgetRows = useMemo(() => {
    return categories.map((cat) => {
      const id = cat.serverId || cat.id || String(cat._id)
      const planned = Number(cat.plannedAmount) || 0
      const actual = actualPerCategory[id] || 0
      const isIncome = cat.type === 'income'

      let percent = 0
      if (planned > 0) {
        percent = Math.min((actual / planned) * 100, 100)
      } else if (actual > 0) {
        percent = 100
      }

      const diff = isIncome ? planned - actual : planned - actual
      const isOverBudget = !isIncome && planned > 0 && actual > planned

      return {
        id,
        name: cat.name,
        type: cat.type,
        icon: cat.icon || 'TagIcon',
        color: cat.color || '#3b82f6',
        planned,
        actual,
        percent,
        diff,
        isOverBudget,
        hasBudget: planned > 0,
      }
    })
  }, [categories, actualPerCategory])

  // Filtered & Sorted rows
  const filteredRows = useMemo(() => {
    const list = budgetRows.filter((row) => {
      if (activeTab === 'income' && row.type !== 'income') return false
      if (activeTab === 'expense' && row.type !== 'expense') return false
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        return row.name.toLowerCase().includes(query)
      }
      return true
    })

    if (sortBy === 'budget-desc') {
      return [...list].sort((a, b) => b.planned - a.planned)
    }
    if (sortBy === 'spent-desc') {
      return [...list].sort((a, b) => b.actual - a.actual)
    }
    if (sortBy === 'alerts') {
      return [...list].sort((a, b) => {
        if (a.isOverBudget && !b.isOverBudget) return -1
        if (!a.isOverBudget && b.isOverBudget) return 1
        return b.percent - a.percent
      })
    }
    if (sortBy === 'name') {
      return [...list].sort((a, b) => a.name.localeCompare(b.name))
    }

    // Default 'custom': preserves the inherited section & category drag order
    return list
  }, [budgetRows, activeTab, searchQuery, sortBy])

  // Helper to determine if a budget row is savings/investment
  const isSavingsRow = useCallback(
    (row) => {
      const lower = (row.name || '').toLowerCase()
      return (
        lower.includes('saving') ||
        lower.includes('ahorro') ||
        lower.includes('invest') ||
        lower.includes('invers') ||
        lower.includes('emergency fund') ||
        lower.includes('fondo de emergencia')
      )
    },
    []
  )

  // 1. Total Planned & Actual Income
  const totalPlannedIncome = useMemo(() => {
    return budgetRows.filter((r) => r.type === 'income').reduce((sum, r) => sum + r.planned, 0)
  }, [budgetRows])

  const totalActualIncome = useMemo(() => {
    return budgetRows.filter((r) => r.type === 'income').reduce((sum, r) => sum + r.actual, 0)
  }, [budgetRows])

  // 2. Total Planned & Actual Living Expenses (excluding savings/investments)
  const totalPlannedExpenses = useMemo(() => {
    return budgetRows
      .filter((r) => r.type === 'expense' && !isSavingsRow(r))
      .reduce((sum, r) => sum + r.planned, 0)
  }, [budgetRows, isSavingsRow])

  const totalActualExpenses = useMemo(() => {
    return budgetRows
      .filter((r) => r.type === 'expense' && !isSavingsRow(r))
      .reduce((sum, r) => sum + r.actual, 0)
  }, [budgetRows, isSavingsRow])

  // 3. Dedicated Planned & Actual Savings & Investments
  const totalPlannedSavings = useMemo(() => {
    return budgetRows
      .filter((r) => isSavingsRow(r))
      .reduce((sum, r) => sum + r.planned, 0)
  }, [budgetRows, isSavingsRow])

  const totalActualSavings = useMemo(() => {
    return budgetRows
      .filter((r) => isSavingsRow(r))
      .reduce((sum, r) => sum + r.actual, 0)
  }, [budgetRows, isSavingsRow])

  // 4. Net Unallocated Surplus (Income minus Expenses minus Dedicated Savings)
  const totalPlannedBudgeted = totalPlannedExpenses + totalPlannedSavings
  const plannedUnallocated = totalPlannedIncome - totalPlannedBudgeted
  const actualNetBalance = totalActualIncome - totalActualExpenses - totalActualSavings
  const isBalanced = plannedUnallocated === 0
  const isDeficit = plannedUnallocated < 0
  const isSurplus = plannedUnallocated > 0

  const currentMonthName = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(new Date())

  // Handle clearing a category's budget target
  async function handleConfirmClearTarget() {
    if (!clearTargetConfirm) return
    await updateCategoryPlannedAmount(clearTargetConfirm.id, 0)
    setClearTargetConfirm(null)
    await loadBudgetData()
  }

  // Quick keyboard shortcut: 'T' to add transaction
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
        return
      }
      if (e.key === 't' || e.key === 'T') {
        e.preventDefault()
        setIsTransactionModalOpen(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          onAddTransaction={() => setIsTransactionModalOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 flex flex-col gap-6 lg:gap-8">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Monthly Budget Plan
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800">
                  {monthLabel}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Plan expected income and manage category spending targets
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <MonthSelector className="w-full sm:w-auto" />
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Planned Income Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Expected Income
                </span>
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                  <BanknotesIcon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  ${totalPlannedIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
                  <span>Actual Received:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    ${totalActualIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-3 overflow-hidden">
                <div
                  className="bg-emerald-500 h-1.5 rounded-full transition-all duration-700"
                  style={{
                    width: totalPlannedIncome > 0 ? `${Math.min((totalActualIncome / totalPlannedIncome) * 100, 100)}%` : '0%',
                  }}
                />
              </div>
            </div>

            {/* Budgeted Expenses Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Budgeted Expenses
                </span>
                <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
                  <TicketIcon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  ${totalPlannedExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
                  <span>Actual Spent:</span>
                  <span className="font-semibold text-rose-600 dark:text-rose-400">
                    ${totalActualExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-3 overflow-hidden">
                <div
                  className="bg-rose-500 h-1.5 rounded-full transition-all duration-700"
                  style={{
                    width: totalPlannedExpenses > 0 ? `${Math.min((totalActualExpenses / totalPlannedExpenses) * 100, 100)}%` : '0%',
                  }}
                />
              </div>
            </div>

            {/* Dedicated Planned Savings Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Target Savings
                </span>
                <div className="p-2 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400">
                  <SparklesIcon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-bold text-sky-600 dark:text-sky-400">
                  ${totalPlannedSavings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
                  <span>Actual Saved:</span>
                  <span className="font-semibold text-sky-600 dark:text-sky-400">
                    ${totalActualSavings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-3 overflow-hidden">
                <div
                  className="bg-sky-500 h-1.5 rounded-full transition-all duration-700"
                  style={{
                    width: totalPlannedSavings > 0 ? `${Math.min((totalActualSavings / totalPlannedSavings) * 100, 100)}%` : '0%',
                  }}
                />
              </div>
            </div>

            {/* Budget Balance / Allocation Card */}
            <div
              className={`border rounded-2xl p-5 shadow-sm flex flex-col justify-between transition-colors ${
                isDeficit
                  ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20'
                  : isSurplus
                  ? 'border-emerald-300 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/20'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Budget Balance
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isDeficit
                        ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-400'
                        : isSurplus
                        ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400'
                        : 'bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-400'
                    }`}
                  >
                    {isDeficit ? 'Deficit' : isSurplus ? 'Surplus' : 'Balanced'}
                  </span>
                </div>

                <div
                  className={`p-2 rounded-lg ${
                    isDeficit
                      ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400'
                      : isSurplus
                      ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400'
                      : 'bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400'
                  }`}
                >
                  {isDeficit ? (
                    <ExclamationTriangleIcon className="w-5 h-5" />
                  ) : isSurplus ? (
                    <ScaleIcon className="w-5 h-5" />
                  ) : (
                    <CheckCircleIcon className="w-5 h-5" />
                  )}
                </div>
              </div>

              <div className="mt-2">
                <div
                  className={`text-2xl font-bold tracking-tight ${
                    isDeficit
                      ? 'text-rose-600 dark:text-rose-400'
                      : isSurplus
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-indigo-600 dark:text-indigo-400'
                  }`}
                >
                  {isDeficit ? '-' : isSurplus ? '+' : ''}$
                  {Math.abs(plannedUnallocated).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>

                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
                  <span>Planned: Income vs Budget:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    ${totalPlannedIncome.toLocaleString('en-US', { maximumFractionDigits: 0 })} vs $
                    {totalPlannedBudgeted.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>

              <div className="text-[11px] font-medium mt-3">
                {isDeficit ? (
                  <span className="text-rose-600 dark:text-rose-400">
                    Over-budgeted by ${Math.abs(plannedUnallocated).toLocaleString('en-US', { maximumFractionDigits: 0 })} · Adjust targets
                  </span>
                ) : isSurplus ? (
                  <span className="text-emerald-600 dark:text-emerald-400">
                    ${plannedUnallocated.toLocaleString('en-US', { maximumFractionDigits: 0 })} available to allocate to savings or expenses
                  </span>
                ) : (
                  <span className="text-indigo-600 dark:text-indigo-400">
                    Zero-based balanced · All income is budgeted
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Filter Bar & Tabs */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                  activeTab === 'all'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                All Categories ({budgetRows.length})
              </button>
              <button
                onClick={() => setActiveTab('income')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                  activeTab === 'income'
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Income Sources ({budgetRows.filter((r) => r.type === 'income').length})
              </button>
              <button
                onClick={() => setActiveTab('expense')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                  activeTab === 'expense'
                    ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Expense Budgets ({budgetRows.filter((r) => r.type === 'expense').length})
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <span className="hidden md:inline font-medium">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full sm:w-auto px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                  title="Sort budget categories"
                >
                  <option value="custom">Categories Order (Default)</option>
                  <option value="alerts">Over Budget First</option>
                  <option value="budget-desc">Highest Budget Limit</option>
                  <option value="spent-desc">Most Spent</option>
                  <option value="name">Name (A-Z)</option>
                </select>
              </div>

              <div className="relative w-full sm:w-56">
                <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
          </div>

          {/* Budget CRUD Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="p-12 text-center text-sm text-slate-500">
                Loading budget plan...
              </div>
            ) : filteredRows.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center gap-2">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  No categories found matching your filter.
                </p>
                <p className="text-xs text-slate-400">
                  Try adjusting your search query or add categories in the Categories section.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="py-3.5 px-4 sm:px-6">Category</th>
                      <th className="py-3.5 px-4">Planned Target</th>
                      <th className="py-3.5 px-4">Actual (Received / Spent)</th>
                      <th className="py-3.5 px-4">Remaining / Status</th>
                      <th className="py-3.5 px-4 w-40">Progress</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredRows.map((row) => {
                      const IconComponent = HEROICON_MAP[row.icon] || HEROICON_MAP.TagIcon
                      const isIncome = row.type === 'income'

                      return (
                        <tr
                          key={row.id}
                          className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition group"
                        >
                          {/* Category Column */}
                          <td
                            className="py-3.5 px-4 sm:px-6 cursor-pointer"
                            onClick={() => setSelectedCategoryForDetail(row)}
                            title={`Inspect ${row.name} transactions`}
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105"
                                style={{
                                  backgroundColor: `${row.color}18`,
                                  color: row.color,
                                }}
                              >
                                <IconComponent className="w-4.5 h-4.5" />
                              </span>
                              <div>
                                <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                                  {row.name}
                                </p>
                                <span className="text-[11px] capitalize text-slate-400">
                                  {isIncome ? 'Expected Inflow' : 'Spending Limit'}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Planned Target (Editable) */}
                          <td className="py-3.5 px-4">
                            {row.hasBudget ? (
                              <button
                                onClick={() =>
                                  setEditingCategory({
                                    id: row.id,
                                    name: row.name,
                                    type: row.type,
                                    budget: row.planned,
                                    color: row.color,
                                    icon: IconComponent,
                                  })
                                }
                                className="font-semibold text-slate-900 dark:text-white hover:text-sky-600 dark:hover:text-sky-400 inline-flex items-center gap-1.5 transition text-left"
                                title="Click to edit target"
                              >
                                <span>${row.planned.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                <PencilSquareIcon className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-slate-400" />
                              </button>
                            ) : (
                              <button
                                onClick={() =>
                                  setEditingCategory({
                                    id: row.id,
                                    name: row.name,
                                    type: row.type,
                                    budget: 0,
                                    color: row.color,
                                    icon: IconComponent,
                                  })
                                }
                                className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline"
                              >
                                <span>+ Set {isIncome ? 'Target' : 'Budget'}</span>
                              </button>
                            )}
                          </td>

                          {/* Actual Spent / Received */}
                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-slate-700 dark:text-slate-200">
                              ${row.actual.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </td>

                          {/* Remaining / Status */}
                          <td className="py-3.5 px-4">
                            {row.hasBudget ? (
                              isIncome ? (
                                row.diff <= 0 ? (
                                  <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                    <CheckCircleIcon className="w-3.5 h-3.5" />
                                    <span>Goal Achieved</span>
                                  </span>
                                ) : (
                                  <span className="text-xs text-slate-500 dark:text-slate-400">
                                    ${row.diff.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} pending
                                  </span>
                                )
                              ) : row.isOverBudget ? (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-900">
                                  <ExclamationTriangleIcon className="w-3.5 h-3.5" />
                                  <span>${Math.abs(row.diff).toLocaleString('en-US')} over budget</span>
                                </span>
                              ) : (
                                <span className="text-xs text-slate-600 dark:text-slate-300">
                                  ${row.diff.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} remaining
                                </span>
                              )
                            ) : (
                              <span className="text-xs text-slate-400">
                                No limit set
                              </span>
                            )}
                          </td>

                          {/* Progress Bar */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                                <div
                                  className="h-2 rounded-full transition-all duration-700"
                                  style={{
                                    width: `${row.percent}%`,
                                    backgroundColor: row.isOverBudget ? '#f43f5e' : row.color,
                                  }}
                                />
                              </div>
                              <span className="text-xs font-medium text-slate-500 w-9 text-right">
                                {Math.round(row.percent)}%
                              </span>
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() =>
                                  setEditingCategory({
                                    id: row.id,
                                    name: row.name,
                                    type: row.type,
                                    budget: row.planned,
                                    color: row.color,
                                    icon: IconComponent,
                                  })
                                }
                                className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                                title="Edit target / budget"
                              >
                                <PencilSquareIcon className="w-4 h-4" />
                              </button>

                              {row.hasBudget && (
                                <button
                                  onClick={() => setClearTargetConfirm(row)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                                  title="Reset target to zero"
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>

        {/* Floating Action Button for mobile thumb accessibility */}
        <button
          type="button"
          onClick={() => setIsTransactionModalOpen(true)}
          className="fixed bottom-8 right-8 z-30 sm:hidden w-14 h-14 rounded-full text-white bg-sky-600 hover:bg-sky-700 active:scale-95 shadow-2xl shadow-sky-600/40 ring-4 ring-white dark:ring-slate-900 flex items-center justify-center cursor-pointer transition-all"
          style={{
            bottom: 'max(2rem, calc(1rem + env(safe-area-inset-bottom)))',
            right: 'max(2rem, calc(1.25rem + env(safe-area-inset-right)))',
          }}
          aria-label="Add Movement"
          title="Add Movement"
        >
          <PlusIcon className="w-7 h-7" />
        </button>

        {/* Edit Target / Budget Modal */}
        {editingCategory && (
          <SetTargetModal
            category={editingCategory}
            onClose={() => setEditingCategory(null)}
            onTargetSaved={loadBudgetData}
          />
        )}

        {/* Quick Transaction Modal */}
        {(isTransactionModalOpen || editingTransaction) && (
          <QuickTransactionModal
            isOpen={isTransactionModalOpen || Boolean(editingTransaction)}
            transaction={editingTransaction}
            defaultCategoryId={defaultCategoryForNewTx}
            onClose={() => {
              setIsTransactionModalOpen(false)
              setEditingTransaction(null)
              setDefaultCategoryForNewTx(null)
            }}
            onCreated={loadBudgetData}
          />
        )}

        {/* Category Drill-down Detail Sheet */}
        <CategoryDetailSheet
          isOpen={Boolean(selectedCategoryForDetail)}
          onClose={() => setSelectedCategoryForDetail(null)}
          item={selectedCategoryForDetail}
          type="category"
          monthLabel={monthLabel}
          transactions={currentMonthTransactions}
          onEditTransaction={(tx) => {
            setSelectedCategoryForDetail(null)
            setEditingTransaction(tx)
          }}
          onDeleteTransaction={async (tx) => {
            await deleteTransaction(tx.id || tx.serverId)
            await loadBudgetData()
          }}
          onAddTransaction={(cat) => {
            setSelectedCategoryForDetail(null)
            setDefaultCategoryForNewTx(cat.id || cat.serverId)
            setIsTransactionModalOpen(true)
          }}
          onEditTarget={(cat) => {
            setSelectedCategoryForDetail(null)
            setEditingCategory(cat)
          }}
        />

        {/* Clear Target Confirmation Dialog */}
        {clearTargetConfirm && (
          <ConfirmDialog
            title={`Clear ${clearTargetConfirm.type === 'income' ? 'Expected Target' : 'Budget'}?`}
            message={`Are you sure you want to remove the monthly ${
              clearTargetConfirm.type === 'income' ? 'expected target' : 'budget limit'
            } for "${clearTargetConfirm.name}"? Transactions logged in this category will not be lost.`}
            confirmLabel="Clear Target"
            danger
            onConfirm={handleConfirmClearTarget}
            onCancel={() => setClearTargetConfirm(null)}
          />
        )}
      </div>
    </div>
  )
}

