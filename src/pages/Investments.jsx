import { useState, useEffect, useCallback, useMemo } from 'react'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import InvestmentModal from '../components/investments/InvestmentModal'
import InvestmentRecordModal from '../components/investments/InvestmentRecordModal'
import InvestmentDetailSheet from '../components/investments/InvestmentDetailSheet'
import InvestmentsTrajectoryChart from '../components/investments/InvestmentsTrajectoryChart'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import {
  getInvestments,
  getInvestmentById,
  createInvestment,
  updateInvestment,
  deleteInvestment,
  addOrUpdateInvestmentRecord,
  deleteInvestmentRecord,
} from '../services/investmentsService'
import { getCategories } from '../services/categoriesService'
import { formatInvestmentType } from '../utils/investmentUtils'
import { usePrivacy } from '../context/PrivacyContext'
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  PlusIcon,
  SparklesIcon,
  CalendarDaysIcon,
  BanknotesIcon,
  ShieldCheckIcon,
  RocketLaunchIcon,
  LinkIcon,
} from '@heroicons/react/24/outline'

export default function Investments() {
  const { mask } = usePrivacy()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [investments, setInvestments] = useState([])
  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // Modals state
  const [isInvestmentModalOpen, setIsInvestmentModalOpen] = useState(false)
  const [editingInvestment, setEditingInvestment] = useState(null)
  const [deleteTargetInvestment, setDeleteTargetInvestment] = useState(null)

  // Record logging modal state
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false)
  const [targetInvestmentForRecord, setTargetInvestmentForRecord] = useState(null)
  const [editingRecord, setEditingRecord] = useState(null)

  // Detail Sheet state
  const [selectedInvestmentForDetail, setSelectedInvestmentForDetail] = useState(null)

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)
      const [fetchedInvestments, fetchedCats] = await Promise.all([
        getInvestments(),
        getCategories(),
      ])
      setInvestments(fetchedInvestments)
      setCategories(fetchedCats)

      // If detail sheet is open, refresh it as well
      if (selectedInvestmentForDetail) {
        const id = selectedInvestmentForDetail.id || selectedInvestmentForDetail._id
        const refreshed = await getInvestmentById(id)
        setSelectedInvestmentForDetail(refreshed)
      }
    } catch (err) {
      console.error('Failed to load investments data:', err)
    } finally {
      setIsLoading(false)
    }
  }, [selectedInvestmentForDetail])

  useEffect(() => {
    loadData()
  }, [])

  // Open detail sheet and load full records
  const handleInspectInvestment = async (inv) => {
    setSelectedInvestmentForDetail(inv)
    try {
      const full = await getInvestmentById(inv.id || inv._id)
      setSelectedInvestmentForDetail(full)
    } catch (err) {
      console.error('Failed to fetch full investment details:', err)
    }
  }

  // Save Investment (create or update)
  const handleSaveInvestment = async (formData) => {
    if (editingInvestment) {
      await updateInvestment(editingInvestment.id || editingInvestment._id, formData)
    } else {
      await createInvestment(formData)
    }
    await loadData()
    setEditingInvestment(null)
    setIsInvestmentModalOpen(false)
  }

  // Confirm delete investment
  const handleConfirmDeleteInvestment = async () => {
    if (!deleteTargetInvestment) return
    try {
      await deleteInvestment(deleteTargetInvestment.id || deleteTargetInvestment._id)
      setDeleteTargetInvestment(null)
      if (
        selectedInvestmentForDetail &&
        (selectedInvestmentForDetail.id || selectedInvestmentForDetail._id) ===
          (deleteTargetInvestment.id || deleteTargetInvestment._id)
      ) {
        setSelectedInvestmentForDetail(null)
      }
      await loadData()
    } catch (err) {
      console.error('Failed to delete investment:', err)
    }
  }

  // Open record modal to log monthly snapshot
  const handleOpenAddRecord = (inv) => {
    setTargetInvestmentForRecord(inv)
    setEditingRecord(null)
    setIsRecordModalOpen(true)
  }

  // Open record modal to edit existing snapshot
  const handleOpenEditRecord = (inv, record) => {
    setTargetInvestmentForRecord(inv)
    setEditingRecord(record)
    setIsRecordModalOpen(true)
  }

  // Save monthly record snapshot
  const handleSaveRecord = async (recordData) => {
    if (!targetInvestmentForRecord) return
    const invId = targetInvestmentForRecord.id || targetInvestmentForRecord._id
    await addOrUpdateInvestmentRecord(invId, recordData)
    // Refresh
    const updated = await getInvestmentById(invId)
    setSelectedInvestmentForDetail(updated)
    await loadData()
    setIsRecordModalOpen(false)
    setEditingRecord(null)
  }

  // Delete monthly record snapshot
  const handleDeleteRecord = async (inv, record) => {
    const invId = inv.id || inv._id
    const recId = record.id || record._id
    await deleteInvestmentRecord(invId, recId)
    const updated = await getInvestmentById(invId)
    setSelectedInvestmentForDetail(updated)
    await loadData()
  }

  // Aggregated Portfolio KPIs
  const activeInvestments = useMemo(
    () => investments.filter((inv) => inv.status !== 'archived'),
    [investments]
  )

  const totalPortfolioValue = useMemo(() => {
    return activeInvestments.reduce((sum, inv) => sum + (Number(inv.currentBalance) || 0), 0)
  }, [activeInvestments])

  const totalInvestedCapital = useMemo(() => {
    return activeInvestments.reduce(
      (sum, inv) => sum + (Number(inv.totalInvested) || Number(inv.initialBalance) || 0),
      0
    )
  }, [activeInvestments])

  const totalNetGainLoss = totalPortfolioValue - totalInvestedCapital
  const overallReturnPercent =
    totalInvestedCapital > 0 ? (totalNetGainLoss / totalInvestedCapital) * 100 : 0

  const latestMonthYield = useMemo(() => {
    return activeInvestments.reduce(
      (sum, inv) => sum + (Number(inv.lastReturnAmount) || 0),
      0
    )
  }, [activeInvestments])

  const isNetPositive = totalNetGainLoss >= 0

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased transition-colors">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 flex flex-col gap-6 lg:gap-8 max-w-7xl w-full mx-auto">
          {/* Page Title & Top Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Savings & Investments
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  Live Portfolio
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Compound growth engine, monthly yield tracking, and long-term wealth building
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setEditingInvestment(null)
                  setIsInvestmentModalOpen(true)
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-sm transition cursor-pointer"
              >
                <PlusIcon className="w-4 h-4" />
                <span>New Investment Account</span>
              </button>
            </div>
          </div>

          {/* Portfolio Hero Banner */}
          <div className="w-full rounded-3xl p-6 sm:p-8 border border-emerald-200/80 dark:border-emerald-900/50 bg-gradient-to-br from-white via-emerald-50/30 to-teal-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/20 shadow-xs relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/80 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold">
                  <SparklesIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Total Capital Valuation</span>
                </div>
                <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                  {mask(totalPortfolioValue)}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Across {activeInvestments.length} active instrument
                  {activeInvestments.length === 1 ? '' : 's'}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4 shrink-0">
                <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 backdrop-blur-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    All-Time Net Return
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className={`text-base sm:text-lg font-black ${
                        isNetPositive
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {totalNetGainLoss >= 0 ? '+' : ''}
                      {mask(totalNetGainLoss)}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-bold ${
                      isNetPositive
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {overallReturnPercent >= 0 ? '+' : ''}
                    {Math.round(overallReturnPercent * 100) / 100}%
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 backdrop-blur-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Invested Principal
                  </span>
                  <div className="text-base sm:text-lg font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                    {mask(totalInvestedCapital)}
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">Deposits net of withdrawals</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 backdrop-blur-xs col-span-2 sm:col-span-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Latest Period Return
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className={`text-base sm:text-lg font-black ${
                        latestMonthYield >= 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {latestMonthYield >= 0 ? '+' : ''}
                      {mask(latestMonthYield)}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">Last recorded cutoff</span>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Trajectory Growth Curve & What-If Runway */}
          {activeInvestments.length > 0 && (
            <InvestmentsTrajectoryChart
              investments={activeInvestments}
              categories={categories}
              onLogRecord={handleOpenAddRecord}
            />
          )}

          {/* Instruments Grid Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Investment Instruments & Accounts
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Select any account to inspect monthly cutoffs, yields, or log new snapshots
                </p>
              </div>
            </div>

            {activeInvestments.length === 0 ? (
              <div className="p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-200 dark:border-emerald-800">
                  <ArrowTrendingUpIcon className="w-8 h-8" />
                </div>
                <div className="max-w-md mx-auto space-y-1">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Start tracking your investments
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Add your CETES, GBM+, Nu Cajitas, or Afores to log monthly closing balances and watch your wealth grow over time.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingInvestment(null)
                    setIsInvestmentModalOpen(true)
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-sm transition cursor-pointer"
                >
                  <PlusIcon className="w-4 h-4" />
                  <span>Add First Account</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeInvestments.map((inv) => {
                  const id = inv.id || inv._id
                  const bal = Number(inv.currentBalance) || Number(inv.initialBalance) || 0
                  const invested = Number(inv.totalInvested) || Number(inv.initialBalance) || 0
                  const gainLoss = Number(inv.totalGainLoss) || (bal - invested)
                  const retPct = Number(inv.totalReturnPercent) || (invested > 0 ? (gainLoss / invested) * 100 : 0)
                  const lastAmt = Number(inv.lastReturnAmount) || 0
                  const isGain = gainLoss >= 0
                  const catId =
                    typeof inv.categoryId === 'object'
                      ? inv.categoryId?.id || inv.categoryId?._id
                      : inv.categoryId
                  const linkedCat = categories.find((c) => (c.id || c.serverId || c._id) === catId)

                  return (
                    <div
                      key={id}
                      onClick={() => handleInspectInvestment(inv)}
                      className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700/80 transition-all cursor-pointer flex flex-col justify-between gap-4 group"
                    >
                      {/* Top Row: Icon, Name, Type */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-black shadow-xs shrink-0 group-hover:scale-105 transition-transform"
                            style={{ backgroundColor: inv.color || '#10b981' }}
                          >
                            <ArrowTrendingUpIcon className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                              {inv.name}
                            </h3>
                            <div className="flex flex-wrap items-center gap-2 mt-0.5">
                              {inv.institution && (
                                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
                                  {inv.institution}
                                </span>
                              )}
                              {linkedCat ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200/80 dark:border-emerald-800/80">
                                  <LinkIcon className="w-2.5 h-2.5" />
                                  Budget: {mask(linkedCat.plannedAmount)}/mo
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200/80 dark:border-slate-700/80">
                                  No budget link
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {formatInvestmentType(inv.type)}
                          </span>
                          {inv.estimatedAnnualRate !== undefined && inv.estimatedAnnualRate !== null && (
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                              {inv.estimatedAnnualRate}% APR
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Middle: Current Valuation & Returns */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Current Valuation
                        </span>
                        <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                          {mask(bal)}
                        </div>
                        <div className="flex items-center gap-2 pt-1 text-xs">
                          <span
                            className={`font-black ${
                              isGain
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {gainLoss >= 0 ? '+' : ''}
                            {mask(gainLoss)}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                              isGain
                                ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400'
                                : 'bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {retPct >= 0 ? '+' : ''}
                            {Math.round(retPct * 10) / 10}%
                          </span>
                        </div>
                      </div>

                      {/* Bottom Footer: Latest Cutoff Return + Quick Button */}
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {lastAmt !== 0 ? (
                            <span>
                              Last return:{' '}
                              <strong
                                className={
                                  lastAmt >= 0
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-rose-600 dark:text-rose-400'
                                }
                              >
                                {lastAmt >= 0 ? '+' : ''}
                                {mask(lastAmt)}
                              </strong>
                            </span>
                          ) : (
                            <span className="text-slate-400">
                              {(inv.records || []).length} cutoff
                              {(inv.records || []).length === 1 ? '' : 's'} logged
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleOpenAddRecord(inv)
                          }}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition cursor-pointer"
                        >
                          + Log Cutoff
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Account Create/Edit Modal */}
      <InvestmentModal
        isOpen={isInvestmentModalOpen}
        onClose={() => {
          setIsInvestmentModalOpen(false)
          setEditingInvestment(null)
        }}
        investment={editingInvestment}
        categories={categories}
        onSave={handleSaveInvestment}
      />

      {/* Monthly Cutoff Record Modal */}
      <InvestmentRecordModal
        isOpen={isRecordModalOpen}
        onClose={() => {
          setIsRecordModalOpen(false)
          setTargetInvestmentForRecord(null)
          setEditingRecord(null)
        }}
        investment={targetInvestmentForRecord}
        record={editingRecord}
        onSave={handleSaveRecord}
      />

      {/* Detail Slide-Over / Bottom Sheet */}
      <InvestmentDetailSheet
        isOpen={Boolean(selectedInvestmentForDetail)}
        onClose={() => setSelectedInvestmentForDetail(null)}
        investment={selectedInvestmentForDetail}
        categories={categories}
        onEditInvestment={(inv) => {
          setSelectedInvestmentForDetail(null)
          setEditingInvestment(inv)
          setIsInvestmentModalOpen(true)
        }}
        onDeleteInvestment={(inv) => {
          setDeleteTargetInvestment(inv)
        }}
        onAddRecord={(inv) => {
          setSelectedInvestmentForDetail(null)
          handleOpenAddRecord(inv)
        }}
        onEditRecord={(inv, rec) => {
          setSelectedInvestmentForDetail(null)
          handleOpenEditRecord(inv, rec)
        }}
        onDeleteRecord={handleDeleteRecord}
      />

      {/* Confirm Account Delete Dialog */}
      {deleteTargetInvestment && (
        <ConfirmDialog
          title={`Delete "${deleteTargetInvestment.name}"?`}
          message="Are you sure you want to delete this investment account? All monthly cutoff history and return records will be permanently removed."
          confirmLabel="Delete Account"
          danger
          typeToConfirm="DELETE"
          onConfirm={handleConfirmDeleteInvestment}
          onCancel={() => setDeleteTargetInvestment(null)}
        />
      )}
    </div>
  )
}
