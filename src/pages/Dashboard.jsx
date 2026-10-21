import { useState, useEffect, useCallback } from 'react'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import BudgetSummary from '../components/BudgetSummary'
import CategoriesOverview from '../components/CategoriesOverview'
import MovementsList from '../components/MovementsList'
import { QuickTransactionModal } from '../components/QuickTransactionModal'
import { DashboardEmptyState } from '../components/DashboardEmptyState'
import SetTargetModal from '../components/SetTargetModal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { PlusIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { getCategoriesOfflineFirst } from '../services/categoriesOfflineService'
import { getTransactionsOfflineFirst } from '../services/dashboardDataService'
import { resetMonthData } from '../services/resetDataService'
import { getAll as getLocalStorageSections } from '../services/sectionsRepository'
import { HEROICON_MAP } from '../utils/heroicons'
import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const { isAdmin } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState(null)
  const [targetModalCategory, setTargetModalCategory] = useState(null)
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false)
  const [categories, setCategories] = useState([])
  const [movements, setMovements] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const loadDashboardData = useCallback(async () => {
    try {
      const [fetchedCats, fetchedTxs] = await Promise.all([
        getCategoriesOfflineFirst(),
        getTransactionsOfflineFirst(),
      ])

      // Map categories for quick lookups
      const categoryMap = new Map()
      fetchedCats.forEach((c) => {
        const key = c.serverId || c.id || String(c._id)
        categoryMap.set(key, c)
      })

      // Aggregate spend/income per category
      const catSpendMap = {}
      fetchedTxs.forEach((tx) => {
        const catKey = tx.categoryId
        if (!catSpendMap[catKey]) catSpendMap[catKey] = 0
        catSpendMap[catKey] += Number(tx.amount) || 0
      })

      // Overview categories with lively badges and colors, filtered to active or planned
      const overviewCategories = fetchedCats
        .map((cat) => {
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
        .filter((cat) => cat.spent > 0 || cat.budget > 0)

      // Map recent movements with vibrant category icons and colors
      const mappedMovements = fetchedTxs.slice(0, 10).map((tx) => {
        const cat = categoryMap.get(tx.categoryId)
        const dateStr = tx.date ? new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Today'
        return {
          id: tx.localId || tx.serverId || tx.id,
          localId: tx.localId,
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

      setCategories(overviewCategories)
      setMovements(mappedMovements)
    } catch (err) {
      console.error('Failed to load dashboard data:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  const handleResetData = async () => {
    await resetMonthData()
    setIsResetConfirmOpen(false)
    await loadDashboardData()
  }

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

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 flex flex-col gap-6 lg:gap-8">
          {/* Dashboard Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Financial Overview
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800">
                  {currentMonthName}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Manage and track your cashflow in real time
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              {isAdmin && movements.length > 0 && (
                <button
                  onClick={() => setIsResetConfirmOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xs transition"
                  title="Reset test data for this month (admin test tool)"
                >
                  <ArrowPathIcon className="w-3.5 h-3.5" />
                  <span>Reset Month</span>
                </button>
              )}

              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm transition"
              >
                <PlusIcon className="w-4 h-4" />
                <span>Add Transaction</span>
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-sm text-slate-500">
              Loading your finances...
            </div>
          ) : movements.length === 0 ? (
            <DashboardEmptyState onAddTransaction={() => setIsModalOpen(true)} />
          ) : (
            <>
              <BudgetSummary
                month={currentMonthName}
                income={totalIncome}
                expenses={totalLivingExpenses}
                savings={totalSavings}
              />

              {categories.length > 0 && (
                <CategoriesOverview
                  categories={categories}
                  onSetTarget={(cat) => setTargetModalCategory(cat)}
                />
              )}

              <MovementsList
                movements={movements}
                onEditTransaction={(mov) => setEditingTransaction(mov)}
              />
            </>
          )}
        </main>

        {(isModalOpen || editingTransaction) && (
          <QuickTransactionModal
            isOpen={isModalOpen || Boolean(editingTransaction)}
            transaction={editingTransaction}
            onClose={() => {
              setIsModalOpen(false)
              setEditingTransaction(null)
            }}
            onCreated={loadDashboardData}
          />
        )}

        {targetModalCategory && (
          <SetTargetModal
            category={targetModalCategory}
            onClose={() => setTargetModalCategory(null)}
            onTargetSaved={loadDashboardData}
          />
        )}

        {isResetConfirmOpen && (
          <ConfirmDialog
            title="Reset Month Data"
            message="Are you sure you want to reset all transactions for this testing session? This will clear all recorded movements and return the dashboard to a clean slate."
            confirmLabel="Reset Everything"
            danger
            onConfirm={handleResetData}
            onCancel={() => setIsResetConfirmOpen(false)}
          />
        )}
      </div>
    </div>
  )
}
