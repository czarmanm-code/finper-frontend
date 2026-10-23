import { useState, useEffect, useCallback, useMemo } from 'react'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import LoanModal from '../components/loans/LoanModal'
import LoanDetailSheet from '../components/loans/LoanDetailSheet'
import LoansTrajectoryChart from '../components/loans/LoansTrajectoryChart'
import { QuickTransactionModal } from '../components/QuickTransactionModal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { getLoans, getLoanById, createLoan, updateLoan, deleteLoan } from '../services/loansService'
import { getCategories } from '../services/categoriesService'
import { deleteTransaction } from '../services/transactionsService'
import { formatFrequency, toMonthlyEquivalent } from '../utils/loanUtils'
import {
  CreditCardIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  CheckCircleIcon,
  SparklesIcon,
  BanknotesIcon,
  CalendarDaysIcon,
  ScaleIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline'

export default function Loans() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loans, setLoans] = useState([])
  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // Modals state
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false)
  const [editingLoan, setEditingLoan] = useState(null)
  const [selectedLoanForDetail, setSelectedLoanForDetail] = useState(null)
  const [selectedLoanDetails, setSelectedLoanDetails] = useState(null)
  const [deleteTargetLoan, setDeleteTargetLoan] = useState(null)

  // Quick transaction modal for logging payment
  const [isTxModalOpen, setIsTxModalOpen] = useState(false)
  const [targetCategoryForPayment, setTargetCategoryForPayment] = useState(null)

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)
      const [fetchedLoans, fetchedCats] = await Promise.all([
        getLoans(),
        getCategories(),
      ])
      setLoans(fetchedLoans)
      setCategories(fetchedCats)
    } catch (err) {
      console.error('Failed to load loans data:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Load detailed single loan with timeline when inspecting
  const handleInspectLoan = async (loan) => {
    setSelectedLoanForDetail(loan)
    setSelectedLoanDetails(loan)
    try {
      const details = await getLoanById(loan.id || loan._id)
      setSelectedLoanDetails(details)
    } catch (err) {
      console.error('Failed to fetch loan details:', err)
    }
  }

  // Handle Save (Create or Update)
  const handleSaveLoan = async (formData) => {
    if (editingLoan) {
      await updateLoan(editingLoan.id || editingLoan._id, formData)
    } else {
      await createLoan(formData)
    }
    await loadData()
    setEditingLoan(null)
    setIsLoanModalOpen(false)
  }

  // Handle Delete
  const handleConfirmDeleteLoan = async () => {
    if (!deleteTargetLoan) return
    try {
      await deleteLoan(deleteTargetLoan.id || deleteTargetLoan._id)
      setDeleteTargetLoan(null)
      await loadData()
      if (selectedLoanForDetail?.id === deleteTargetLoan.id) {
        setSelectedLoanForDetail(null)
        setSelectedLoanDetails(null)
      }
    } catch (err) {
      console.error('Failed to delete loan:', err)
    }
  }

  // Handle delete a payment transaction from within loan detail
  const handleDeletePaymentTx = async (tx) => {
    try {
      await deleteTransaction(tx.id || tx._id || tx.serverId)
      // Refresh current loan details and list
      if (selectedLoanForDetail) {
        const updatedDetails = await getLoanById(selectedLoanForDetail.id || selectedLoanForDetail._id)
        setSelectedLoanDetails(updatedDetails)
      }
      await loadData()
    } catch (err) {
      console.error('Failed to delete payment transaction:', err)
    }
  }

  // Aggregate Total Metrics
  const activeLoans = useMemo(() => loans.filter((l) => l.status !== 'archived'), [loans])

  const totalCurrentDebt = useMemo(() => {
    return activeLoans.reduce((sum, l) => sum + (Number(l.currentBalance) || 0), 0)
  }, [activeLoans])

  const totalOriginalDebt = useMemo(() => {
    return activeLoans.reduce((sum, l) => sum + (Number(l.totalAmount) || Number(l.startingBalance) || 0), 0)
  }, [activeLoans])

  const totalPaidDebt = useMemo(() => {
    return activeLoans.reduce((sum, l) => sum + (Number(l.totalPaid) || 0), 0)
  }, [activeLoans])

  const overallProgressPercent = totalOriginalDebt > 0
    ? Math.min(100, Math.round((totalPaidDebt / totalOriginalDebt) * 100))
    : 0

  const totalMonthlyCommitment = useMemo(() => {
    return activeLoans.reduce((sum, l) => {
      const payment = Number(l.expectedPayment) || 0
      // Normalize to monthly equivalent for aggregate overview
      const monthlyEquiv = toMonthlyEquivalent(payment, l.paymentFrequency)
      return sum + monthlyEquiv
    }, 0)
  }, [activeLoans])

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased transition-colors">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          onAddTransaction={() => setIsTxModalOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 flex flex-col gap-6 lg:gap-8 max-w-7xl w-full mx-auto">
          {/* Page Subheader */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Loans & Credit
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800">
                  {activeLoans.length} Active
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Track ongoing liabilities, celebrate amortization progress, and visualize your debt-free trajectory
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingLoan(null)
                setIsLoanModalOpen(true)
              }}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 active:scale-95 rounded-xl shadow-xs transition cursor-pointer"
            >
              <PlusIcon className="w-4 h-4" />
              <span>Track New Loan</span>
            </button>
          </div>

          {/* Hero Debt-Free Trajectory Banner */}
          <div className="w-full rounded-3xl p-5 sm:p-7 border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-white via-slate-50 to-sky-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-sky-950/20 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              {/* Left Column: Big Total Remaining Balance */}
              <div className="space-y-2.5 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Total Remaining Debt
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 dark:bg-sky-950/70 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-800 flex items-center gap-1.5">
                    <SparklesIcon className="w-3.5 h-3.5" />
                    <span>{overallProgressPercent}% Paid Off Overall</span>
                  </span>
                </div>

                <div className="flex items-baseline gap-3">
                  <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                    ${totalCurrentDebt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    across {activeLoans.length} tracked credits
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed">
                  You have already amortized{' '}
                  <strong className="text-emerald-600 dark:text-emerald-400 font-bold">
                    ${totalPaidDebt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </strong>{' '}
                  towards freedom from debt. Every monthly payment directly reduces your liabilities.
                </p>
              </div>

              {/* Right Column: Global Summary Pill */}
              <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xs flex flex-col gap-3 shrink-0 lg:w-80">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>Commitment Overview</span>
                  <span>{overallProgressPercent}% complete</span>
                </div>

                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Monthly Commitments</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      ${totalMonthlyCommitment.toLocaleString('en-US', { maximumFractionDigits: 0 })}/mo
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Original Liabilities</span>
                    <span className="font-bold text-slate-500 dark:text-slate-400">
                      ${totalOriginalDebt.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1 pt-1">
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-sky-500 h-2.5 rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${overallProgressPercent}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold">
                    <span>${totalPaidDebt.toLocaleString('en-US', { maximumFractionDigits: 0 })} Paid</span>
                    <span>${totalCurrentDebt.toLocaleString('en-US', { maximumFractionDigits: 0 })} Remaining</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Payoff & Amortization Trajectory Canvas */}
          <LoansTrajectoryChart
            loans={loans}
            onSelectLoan={(loan) => {
              if (loan) handleOpenDetail(loan)
            }}
          />

          {/* Loans Grid List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Tracked Credits & Loans
              </h2>
              <span className="text-xs text-slate-400">
                Tap any credit to view payoff chart and payments history
              </span>
            </div>

            {isLoading ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-sm text-slate-500">
                Loading loans and amortization data...
              </div>
            ) : activeLoans.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                  <CreditCardIcon className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  No active loans or credits yet
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                  Add an auto loan, mortgage, or credit. Link it to an expense category and watch your remaining debt drop with every payment.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setEditingLoan(null)
                    setIsLoanModalOpen(true)
                  }}
                  className="mt-2 px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition shadow-xs cursor-pointer"
                >
                  + Track Your First Loan
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeLoans.map((loan) => {
                  const category = loan.categoryId || {}
                  const color = category.color || '#3b82f6'
                  const progress = Number(loan.progressPercent || 0)
                  const isPaid = Number(loan.currentBalance) <= 0

                  return (
                    <div
                      key={loan.id || loan._id}
                      onClick={() => handleInspectLoan(loan)}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-sky-300 dark:hover:border-sky-700/60 rounded-3xl p-5 shadow-2xs hover:shadow-sm transition-all group flex flex-col justify-between cursor-pointer"
                    >
                      {/* Top Bar: Icon, Name, Category Pill, Edit Actions */}
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3 min-w-0">
                            <span
                              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
                              style={{
                                backgroundColor: `${color}18`,
                                color: color,
                              }}
                            >
                              <CreditCardIcon className="w-5 h-5" />
                            </span>

                            <div className="min-w-0">
                              <h3 className="text-base font-bold text-slate-900 dark:text-white truncate group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                                {loan.name}
                              </h3>
                              <span className="text-[11px] text-slate-400 truncate block">
                                {category.name || 'Debt Category'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setEditingLoan(loan)
                                setIsLoanModalOpen(true)
                              }}
                              className="p-1.5 text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                              title="Edit loan"
                            >
                              <PencilSquareIcon className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setDeleteTargetLoan(loan)
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                              title="Delete loan"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Balance Breakdown */}
                        <div className="pt-2">
                          <div className="flex items-baseline justify-between">
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                              Remaining Debt
                            </span>
                            <span className="text-xs text-slate-400">
                              Original: ${Number(loan.totalAmount || loan.startingBalance).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                            </span>
                          </div>
                          <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5 tracking-tight">
                            ${Number(loan.currentBalance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1 pt-1">
                          <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-sky-500 transition-all duration-700"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                            <span className="text-sky-600 dark:text-sky-400">{progress}% Amortized</span>
                            <span>${Number(loan.totalPaid).toLocaleString('en-US', { maximumFractionDigits: 0 })} Paid</span>
                          </div>
                        </div>
                      </div>

                      {/* Bottom Footer: Installment & Log Payment Button */}
                      <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">
                            Installment
                          </span>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            ${Number(loan.expectedPayment).toLocaleString('en-US')}{' '}
                            <span className="text-[10px] text-slate-400 font-normal">
                              /{formatFrequency(loan.paymentFrequency)}
                            </span>
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setTargetCategoryForPayment(category)
                            setIsTxModalOpen(true)
                          }}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100 dark:hover:bg-sky-900/60 border border-sky-200 dark:border-sky-800 transition cursor-pointer flex items-center gap-1"
                        >
                          <PlusIcon className="w-3.5 h-3.5" />
                          <span>Log Payment</span>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </main>

        {/* Loan Creation / Edit Modal */}
        <LoanModal
          isOpen={isLoanModalOpen}
          onClose={() => {
            setIsLoanModalOpen(false)
            setEditingLoan(null)
          }}
          loan={editingLoan}
          categories={categories}
          onSave={handleSaveLoan}
        />

        {/* Detailed Inspection Sheet with Chart & Payment History */}
        <LoanDetailSheet
          isOpen={Boolean(selectedLoanForDetail)}
          onClose={() => {
            setSelectedLoanForDetail(null)
            setSelectedLoanDetails(null)
          }}
          loan={selectedLoanForDetail}
          loanDetails={selectedLoanDetails}
          onEditLoan={(loan) => {
            setSelectedLoanForDetail(null)
            setEditingLoan(loan)
            setIsLoanModalOpen(true)
          }}
          onDeleteLoan={(loan) => {
            setSelectedLoanForDetail(null)
            setDeleteTargetLoan(loan)
          }}
          onAddPayment={(category) => {
            setSelectedLoanForDetail(null)
            setTargetCategoryForPayment(category)
            setIsTxModalOpen(true)
          }}
          onDeleteTransaction={handleDeletePaymentTx}
        />

        {/* Quick Transaction Modal pre-scoped to loan's category */}
        {isTxModalOpen && (
          <QuickTransactionModal
            isOpen={isTxModalOpen}
            defaultCategoryId={
              targetCategoryForPayment
                ? targetCategoryForPayment.id || targetCategoryForPayment.serverId || targetCategoryForPayment._id
                : null
            }
            onClose={() => {
              setIsTxModalOpen(false)
              setTargetCategoryForPayment(null)
            }}
            onCreated={async () => {
              await loadData()
              if (selectedLoanForDetail) {
                const updated = await getLoanById(selectedLoanForDetail.id || selectedLoanForDetail._id)
                setSelectedLoanDetails(updated)
              }
            }}
          />
        )}

        {/* Delete Loan Confirmation Dialog */}
        {deleteTargetLoan && (
          <ConfirmDialog
            title={`Delete "${deleteTargetLoan.name}"?`}
            message="Are you sure you want to stop tracking this loan? Recorded transaction history in your category will remain intact, but this credit balance tracker will be permanently deleted."
            confirmLabel="Delete Loan"
            danger
            typeToConfirm="DELETE"
            onConfirm={handleConfirmDeleteLoan}
            onCancel={() => setDeleteTargetLoan(null)}
          />
        )}
      </div>
    </div>
  )
}

