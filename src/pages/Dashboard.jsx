import { useState, useEffect, useCallback } from 'react'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import BudgetSummary from '../components/BudgetSummary'
import CategoriesOverview from '../components/CategoriesOverview'
import MovementsList from '../components/MovementsList'
import { QuickTransactionModal } from '../components/QuickTransactionModal'
import { DashboardEmptyState } from '../components/DashboardEmptyState'
import SetTargetModal from '../components/SetTargetModal'
import CategoryDetailSheet from '../components/CategoryDetailSheet'
import { PlusIcon } from '@heroicons/react/24/outline'
import { getCategories } from '../services/categoriesService'
import { getTransactions, deleteTransaction } from '../services/transactionsService'
import { HEROICON_MAP } from '../utils/heroicons'
import { useDateFilter } from '../context/DateContext'
import MonthSelector from '../components/MonthSelector'

export default function Dashboard() {
  const { monthLabel, isTransactionInSelectedMonth, selectedDate } = useDateFilter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState(null)
  const [targetModalCategory, setTargetModalCategory] = useState(null)
  const [selectedCategoryForDetail, setSelectedCategoryForDetail] = useState(null)
  const [defaultCategoryForNewTx, setDefaultCategoryForNewTx] = useState(null)
  const [allMonthTransactions, setAllMonthTransactions] = useState([])
  const [categories, setCategories] = useState([])
  const [movements, setMovements] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const loadDashboardData = useCallback(async () => {
    try {
      const [fetchedCats, fetchedTxs] = await Promise.all([
        getCategories(),
        getTransactions(),
      ])

      // Map categories for quick lookups
      const categoryMap = new Map()
      fetchedCats.forEach((c) => {
        if (c.serverId) categoryMap.set(String(c.serverId), c)
        if (c.id) categoryMap.set(String(c.id), c)
        if (c._id) categoryMap.set(String(c._id), c)
        if (c.name) categoryMap.set(c.name.trim().toLowerCase(), c)
      })

      // Filter transactions strictly for the selected month
      const currentMonthTxs = fetchedTxs.filter((tx) => isTransactionInSelectedMonth(tx.date))

      // Aggregate spend/income per category with resilient matching for the selected month
      const catSpendMap = {}
      currentMonthTxs.forEach((tx) => {
        const rawCatId = typeof tx.categoryId === 'object' ? (tx.categoryId?.id || tx.categoryId?._id) : tx.categoryId
        const catKey = rawCatId ? String(rawCatId) : null
        const catName = (tx.categoryName || tx.category || '').trim().toLowerCase()
        const matchedCat = (catKey && categoryMap.get(catKey)) || (catName && categoryMap.get(catName))

        const primaryId = matchedCat ? (matchedCat.serverId || matchedCat.id || String(matchedCat._id)) : catKey
        if (primaryId) {
          catSpendMap[primaryId] = (catSpendMap[primaryId] || 0) + (Number(tx.amount) || 0)
        }
      })

      // Overview categories with lively badges and colors (budgets persist across months)
      const overviewCategories = fetchedCats.map((cat) => {
        const catId = cat.serverId || cat.id || String(cat._id)
        const iconComponent = HEROICON_MAP[cat.icon] || HEROICON_MAP.TagIcon
        const recordedAmount = catSpendMap[catId] || 0
        const plannedBudget = Number(cat.plannedAmount) || 0

        return {
          id: catId,
          name: cat.name,
          type: cat.type,
          icon: iconComponent,
          budget: plannedBudget,
          spent: recordedAmount,
          color: cat.color || '#3b82f6',
        }
      })

      const activeCategories = overviewCategories.filter((cat) => cat.spent > 0 || cat.budget > 0)
      const categoriesToShow = activeCategories.length > 0 ? activeCategories : overviewCategories

      // Map movements strictly for the selected month
      const mappedMovements = currentMonthTxs.slice(0, 15).map((tx) => {
        const cat = categoryMap.get(tx.categoryId)
        const dateStr = tx.date ? new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Today'
        return {
          id: tx.serverId || tx.id,
          serverId: tx.serverId,
          rawDate: tx.date,
          date: dateStr,
          type: tx.type === 'income' ? 'Income' : 'Expense',
          category: cat ? cat.name : tx.categoryName || 'General',
          categoryId: tx.categoryId,
          amount: Number(tx.amount) || 0,
          icon: cat?.icon || (tx.type === 'income' ? 'BanknotesIcon' : 'TagIcon'),
          color: cat?.color || (tx.type === 'income' ? '#10b981' : '#6366f1'),
          description: tx.description,
        }
      })

      setCategories(categoriesToShow)
      setMovements(mappedMovements)
      setAllMonthTransactions(currentMonthTxs)
    } catch (err) {
      console.error('Failed to load dashboard data:', err)
    } finally {
      setIsLoading(false)
    }
  }, [selectedDate, isTransactionInSelectedMonth])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  // Identify savings and investment categories
  const isSavingsMovement = useCallback((m) => {
    const catName = (m.category || '').toLowerCase()
    return (
      catName.includes('saving') ||
      catName.includes('ahorro') ||
      catName.includes('invest') ||
      catName.includes('invers') ||
      catName.includes('emergency fund') ||
      catName.includes('fondo de emergencia')
    )
  }, [])

  // Compute live budget summary metrics
  const totalIncome = movements
    .filter((m) => m.type === 'Income')
    .reduce((sum, m) => sum + m.amount, 0)

  const totalLivingExpenses = movements
    .filter((m) => m.type === 'Expense' && !isSavingsMovement(m))
    .reduce((sum, m) => sum + m.amount, 0)

  const totalSavings = movements
    .filter((m) => isSavingsMovement(m))
    .reduce((sum, m) => sum + m.amount, 0)

  const currentMonthName = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date())

  // Quick keyboard shortcut: 'T' to add transaction
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
        return
      }
      if (e.key === 't' || e.key === 'T') {
        e.preventDefault()
        setIsModalOpen(true)
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
          onAddTransaction={() => setIsModalOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 flex flex-col gap-6 lg:gap-8">
          {/* Dashboard Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Financial Overview
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800">
                  {monthLabel}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Manage and track your cashflow in real time
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <MonthSelector className="w-full sm:w-auto" />
            </div>
          </div>

          {isLoading ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-sm text-slate-500">
              Loading your finances...
            </div>
          ) : (
            <>
              <BudgetSummary
                month={monthLabel}
                income={totalIncome}
                expenses={totalLivingExpenses}
                savings={totalSavings}
              />

              {categories.length > 0 && (
                <CategoriesOverview
                  categories={categories}
                  onSetTarget={(cat) => setTargetModalCategory(cat)}
                  onSelectCategory={(cat) => setSelectedCategoryForDetail(cat)}
                />
              )}

              <MovementsList
                movements={movements}
                monthName={monthLabel}
                onEditTransaction={(mov) => setEditingTransaction(mov)}
              />
            </>
          )}
        </main>

        {/* Floating Action Button for mobile thumb accessibility */}
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="fixed bottom-8 right-8 z-30 sm:hidden w-14 h-14 rounded-full text-white bg-sky-600 hover:bg-sky-700 active:scale-95 shadow-2xl shadow-sky-600/40 ring-4 ring-white dark:ring-slate-900 flex items-center justify-center cursor-pointer transition-all"
          style={{
            bottom: 'max(2rem, calc(1rem + env(safe-area-inset-bottom)))',
            right: 'max(2rem, calc(1.25rem + env(safe-area-inset-right)))',
          }}
          aria-label="Add Transaction"
          title="Add Transaction"
        >
          <PlusIcon className="w-7 h-7" />
        </button>

        {(isModalOpen || editingTransaction) && (
          <QuickTransactionModal
            isOpen={isModalOpen || Boolean(editingTransaction)}
            transaction={editingTransaction}
            defaultCategoryId={defaultCategoryForNewTx}
            onClose={() => {
              setIsModalOpen(false)
              setEditingTransaction(null)
              setDefaultCategoryForNewTx(null)
            }}
            onCreated={loadDashboardData}
          />
        )}

        {/* Drill-down Detail Sheet for Categories */}
        <CategoryDetailSheet
          isOpen={Boolean(selectedCategoryForDetail)}
          onClose={() => setSelectedCategoryForDetail(null)}
          item={selectedCategoryForDetail}
          type="category"
          monthLabel={monthLabel}
          transactions={allMonthTransactions}
          onEditTransaction={(tx) => {
            setSelectedCategoryForDetail(null)
            setEditingTransaction(tx)
          }}
          onDeleteTransaction={async (tx) => {
            await deleteTransaction(tx.id || tx.serverId)
            await loadDashboardData()
          }}
          onAddTransaction={(cat) => {
            setSelectedCategoryForDetail(null)
            setDefaultCategoryForNewTx(cat.id || cat.serverId)
            setIsModalOpen(true)
          }}
          onEditTarget={(cat) => {
            setSelectedCategoryForDetail(null)
            setTargetModalCategory(cat)
          }}
        />

        {targetModalCategory && (
          <SetTargetModal
            category={targetModalCategory}
            onClose={() => setTargetModalCategory(null)}
            onTargetSaved={loadDashboardData}
          />
        )}
      </div>
    </div>
  )
}
