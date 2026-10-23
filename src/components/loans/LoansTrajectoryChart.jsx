import { useState, useMemo } from 'react'
import {
  SparklesIcon,
  ArrowTrendingDownIcon,
  CalendarDaysIcon,
  TrophyIcon,
  CheckCircleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline'
import {
  toMonthlyEquivalent,
  formatFrequency,
  getLoanPayoffEstimate,
  getPortfolioPayoffEstimate,
} from '../../utils/loanUtils'

export default function LoansTrajectoryChart({
  loans = [],
  selectedLoanId = null,
  onSelectLoan = null,
}) {
  const [activeTab, setActiveTab] = useState(selectedLoanId || 'all')
  const [hoveredPoint, setHoveredPoint] = useState(null)

  // Filter active loans
  const activeLoans = useMemo(
    () => loans.filter((l) => l.status !== 'archived'),
    [loans]
  )

  // Determine current subject (either consolidated or specific loan)
  const currentLoan = useMemo(() => {
    if (activeTab === 'all') return null
    return activeLoans.find((l) => (l.id || l._id) === activeTab) || null
  }, [activeTab, activeLoans])

  // Compute realistic payoff estimate (contractual endDate priority with linear fallback)
  const estimate = useMemo(() => {
    if (currentLoan) {
      return getLoanPayoffEstimate(currentLoan)
    }
    return getPortfolioPayoffEstimate(activeLoans)
  }, [currentLoan, activeLoans])

  // Compute metrics for the active view
  const metrics = useMemo(() => {
    if (currentLoan) {
      const balance = Number(currentLoan.currentBalance) || 0
      const totalAmt = Number(currentLoan.totalAmount) || Number(currentLoan.startingBalance) || balance
      const paid = Number(currentLoan.totalPaid) || 0
      const monthlyPayment = toMonthlyEquivalent(currentLoan.expectedPayment, currentLoan.paymentFrequency)
      const progress = totalAmt > 0 ? Math.min(100, Math.round((paid / totalAmt) * 100)) : 0

      return {
        name: currentLoan.name,
        currentBalance: balance,
        totalAmount: totalAmt,
        totalPaid: paid,
        monthlyCommitment: monthlyPayment,
        monthsLeft: estimate.monthsRemaining,
        targetDateStr: estimate.targetDateStr,
        isContractual: estimate.isContractual,
        progress,
        isConsolidated: false,
      }
    }

    // Consolidated Portfolio
    const totalBalance = activeLoans.reduce((sum, l) => sum + (Number(l.currentBalance) || 0), 0)
    const totalAmt = activeLoans.reduce(
      (sum, l) => sum + (Number(l.totalAmount) || Number(l.startingBalance) || 0),
      0
    )
    const totalPaid = activeLoans.reduce((sum, l) => sum + (Number(l.totalPaid) || 0), 0)
    const totalMonthly = activeLoans.reduce((sum, l) => {
      return sum + toMonthlyEquivalent(l.expectedPayment, l.paymentFrequency)
    }, 0)
    const progress = totalAmt > 0 ? Math.min(100, Math.round((totalPaid / totalAmt) * 100)) : 0

    return {
      name: 'Consolidated Debt Portfolio',
      currentBalance: totalBalance,
      totalAmount: totalAmt,
      totalPaid,
      monthlyCommitment: totalMonthly,
      monthsLeft: estimate.monthsRemaining,
      targetDateStr: estimate.targetDateStr,
      isContractual: estimate.isContractual,
      progress,
      isConsolidated: true,
    }
  }, [currentLoan, activeLoans, estimate])

  // Generate chart trajectory points (Historical + Projected Runway)
  const chartData = useMemo(() => {
    const points = []
    const now = new Date()
    const { currentBalance, totalAmount, monthsLeft, targetDateStr } = metrics

    if (currentBalance <= 0) {
      return {
        points: [
          { label: 'Start', balance: totalAmount, type: 'past', dateStr: 'Start' },
          { label: 'Today', balance: 0, type: 'today', dateStr: 'Today' },
        ],
        maxVal: Math.max(totalAmount, 100),
      }
    }

    // Point 1: Origin/Start
    points.push({
      label: 'Acquired',
      balance: totalAmount,
      type: 'past',
      dateStr: 'Origination',
    })

    // Point 2: Today (Current state)
    points.push({
      label: 'Today',
      balance: currentBalance,
      type: 'today',
      dateStr: now.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    })

    // Future Projected Points down to 0 at the contractual/estimated target
    const projectionSteps = Math.min(Math.max(monthsLeft, 1), 6)
    for (let i = 1; i <= projectionSteps; i++) {
      const stepMonths = Math.round((i / projectionSteps) * monthsLeft)
      const stepDate = new Date(now.getFullYear(), now.getMonth() + stepMonths, 1)
      const isFinish = i === projectionSteps
      const fraction = i / projectionSteps
      const projectedBal = isFinish ? 0 : Math.max(0, Math.round(currentBalance * (1 - fraction)))

      points.push({
        label: isFinish ? 'Debt Free' : `+${stepMonths}m`,
        balance: projectedBal,
        type: isFinish ? 'finish' : 'projected',
        dateStr: isFinish
          ? targetDateStr
          : stepDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      })
    }

    const maxVal = Math.max(totalAmount, currentBalance, 100)
    return { points, maxVal }
  }, [metrics])

  // SVG Geometry Dimensions
  const svgWidth = 840
  const svgHeight = 220
  const padLeft = 60
  const padRight = 70
  const padTop = 30
  const padBottom = 40

  const chartPoints = useMemo(() => {
    const { points, maxVal } = chartData
    if (points.length === 0) return []

    const xSpan = svgWidth - padLeft - padRight
    const ySpan = svgHeight - padTop - padBottom

    return points.map((p, idx) => {
      const x = padLeft + (idx / (points.length - 1)) * xSpan
      const y = svgHeight - padBottom - (p.balance / maxVal) * ySpan
      return { ...p, x, y }
    })
  }, [chartData])

  // SVG Paths
  const paths = useMemo(() => {
    if (chartPoints.length < 2) return { historicalLine: '', projectedLine: '', areaPath: '' }

    const todayIdx = chartPoints.findIndex((p) => p.type === 'today')
    const splitIdx = todayIdx >= 0 ? todayIdx : 1

    // Historical path (0 to splitIdx)
    const histPts = chartPoints.slice(0, splitIdx + 1)
    const historicalLine = histPts.reduce((acc, pt, i) => {
      return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`
    }, '')

    // Projected path (splitIdx to end)
    const projPts = chartPoints.slice(splitIdx)
    const projectedLine = projPts.reduce((acc, pt, i) => {
      return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`
    }, '')

    // Full area polygon under the entire curve
    const allLine = chartPoints.reduce((acc, pt, i) => {
      return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`
    }, '')
    const firstX = chartPoints[0].x
    const lastX = chartPoints[chartPoints.length - 1].x
    const floorY = svgHeight - padBottom
    const areaPath = `${allLine} L ${lastX} ${floorY} L ${firstX} ${floorY} Z`

    return { historicalLine, projectedLine, areaPath }
  }, [chartPoints])

  if (activeLoans.length === 0) {
    return (
      <div className="w-full rounded-3xl p-8 border border-dashed border-slate-300 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 text-center">
        <div className="w-14 h-14 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 mx-auto flex items-center justify-center mb-3 border border-sky-200 dark:border-sky-800">
          <ArrowTrendingDownIcon className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
          No active credits tracked yet
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
          Add your auto loan, mortgage, or personal credit above. Your interactive burn-down trajectory
          chart and debt-free target milestone will appear here automatically.
        </p>
      </div>
    )
  }

  const todayPoint = chartPoints.find((p) => p.type === 'today')
  const finishPoint = chartPoints.find((p) => p.type === 'finish')

  return (
    <div className="w-full rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/95 shadow-sm overflow-hidden transition-all">
      {/* Header Bar with View Switcher Tabs */}
      <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800/80 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
              <ArrowTrendingDownIcon className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Payoff & Amortization Trajectory
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Dynamic burn-down countdown projecting your path to zero liability
          </p>
        </div>

        {/* Tab Pills for Desktop Web Switching */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => {
              setActiveTab('all')
              if (onSelectLoan) onSelectLoan(null)
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              activeTab === 'all'
                ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All Credits ({activeLoans.length})
          </button>

          {activeLoans.map((l) => {
            const loanId = l.id || l._id
            const isSelected = activeTab === loanId
            return (
              <button
                key={loanId}
                type="button"
                onClick={() => {
                  setActiveTab(loanId)
                  if (onSelectLoan) onSelectLoan(l)
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>{l.name}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Trajectory KPIs Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-5 sm:p-6 bg-slate-50/60 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800/60">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
            Current Balance
          </span>
          <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            ${metrics.currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[11px] text-slate-400 block mt-0.5">
            of ${metrics.totalAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })} initial
          </span>
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
            Total Amortized
          </span>
          <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
            ${metrics.totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 font-medium block mt-0.5">
            {metrics.progress}% paid off
          </span>
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
            Estimated Debt-Free
          </span>
          <span className="text-xl sm:text-2xl font-black text-sky-600 dark:text-sky-400 flex items-center gap-1.5">
            <TrophyIcon className="w-5 h-5 text-amber-500 shrink-0" />
            <span>{metrics.targetDateStr}</span>
          </span>
          <span className="text-[11px] text-slate-400 block mt-0.5">
            {metrics.monthsLeft > 0
              ? `${metrics.isContractual ? 'Contractual maturity' : 'Estimated'} (~${metrics.monthsLeft} installments)`
              : 'Fully Amortized!'}
          </span>
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
            Installment Rate
          </span>
          <span className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-200">
            ${metrics.monthlyCommitment.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            <span className="text-xs text-slate-400 font-normal">/mo</span>
          </span>
          <span className="text-[11px] text-slate-400 block mt-0.5">
            {currentLoan ? formatFrequency(currentLoan.paymentFrequency) : 'aggregate monthly'}
          </span>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div className="p-4 sm:p-6 relative select-none">
        <div className="relative w-full overflow-hidden">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto overflow-visible"
          >
            <defs>
              {/* Gradient for area fill */}
              <linearGradient id="trajectoryAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.25" />
                <stop offset="70%" stopColor="#0ea5e9" stopOpacity="0.05" />
                <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.0" />
              </linearGradient>

              {/* Glowing filter */}
              <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Horizontal Gridlines */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
              const yVal = svgHeight - padBottom - pct * (svgHeight - padTop - padBottom)
              const amount = Math.round(pct * chartData.maxVal)
              return (
                <g key={pct}>
                  <line
                    x1={padLeft}
                    y1={yVal}
                    x2={svgWidth - padRight}
                    y2={yVal}
                    stroke="currentColor"
                    strokeDasharray={pct === 0 ? 'none' : '3 4'}
                    className="text-slate-200 dark:text-slate-800/80"
                    strokeWidth="1"
                  />
                  <text
                    x={padLeft - 8}
                    y={yVal + 3}
                    textAnchor="end"
                    className="text-[9px] fill-slate-400 font-medium"
                  >
                    ${amount >= 1000 ? `${Math.round(amount / 1000)}k` : amount}
                  </text>
                </g>
              )
            })}

            {/* Area Fill */}
            {paths.areaPath && (
              <path d={paths.areaPath} fill="url(#trajectoryAreaGrad)" />
            )}

            {/* Historical Solid Trajectory Line */}
            {paths.historicalLine && (
              <path
                d={paths.historicalLine}
                fill="none"
                stroke="#0284c7"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Projected Future Trajectory Line (Dashed Glow) */}
            {paths.projectedLine && (
              <path
                d={paths.projectedLine}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2.5"
                strokeDasharray="6 6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Milestone Points */}
            {chartPoints.map((pt, idx) => {
              const isToday = pt.type === 'today'
              const isFinish = pt.type === 'finish'

              return (
                <g
                  key={idx}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredPoint(pt)}
                  onMouseLeave={() => setHoveredPoint(null)}
                >
                  {/* Invisible hit target for smooth hovering */}
                  <circle cx={pt.x} cy={pt.y} r="18" fill="transparent" />

                  {isToday ? (
                    <g>
                      {/* Pulse ring for Today */}
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="10"
                        fill="#0ea5e9"
                        fillOpacity="0.25"
                        className="animate-ping"
                      />
                      <circle cx={pt.x} cy={pt.y} r="6" fill="#0284c7" />
                      <circle cx={pt.x} cy={pt.y} r="2.5" fill="#ffffff" />
                      <text
                        x={pt.x}
                        y={pt.y - 12}
                        textAnchor="middle"
                        className="text-[10px] font-extrabold fill-sky-600 dark:fill-sky-400"
                      >
                        You are here (${pt.balance >= 1000 ? `${Math.round(pt.balance / 1000)}k` : pt.balance})
                      </text>
                    </g>
                  ) : isFinish ? (
                    <g>
                      <circle cx={pt.x} cy={pt.y} r="6" fill="#10b981" />
                      <circle cx={pt.x} cy={pt.y} r="2.5" fill="#ffffff" />
                      <text
                        x={pt.x}
                        y={pt.y - 12}
                        textAnchor="middle"
                        className="text-[10px] font-extrabold fill-emerald-600 dark:fill-emerald-400"
                      >
                        Debt Free 🎉
                      </text>
                    </g>
                  ) : (
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="4"
                      className="fill-slate-400 hover:fill-sky-500 transition-colors"
                    />
                  )}

                  {/* Date label under x axis */}
                  <text
                    x={pt.x}
                    y={svgHeight - 14}
                    textAnchor="middle"
                    className="text-[10px] fill-slate-400 font-medium"
                  >
                    {pt.dateStr}
                  </text>
                </g>
              )
            })}
          </svg>

          {/* Interactive Tooltip on Hover */}
          {hoveredPoint && (
            <div
              className="absolute pointer-events-none -translate-x-1/2 -translate-y-full mb-3 px-3.5 py-2 rounded-xl bg-slate-900/95 text-white dark:bg-white dark:text-slate-900 text-xs shadow-xl border border-slate-700 dark:border-slate-200 z-20 backdrop-blur-xs flex flex-col gap-0.5"
              style={{
                left: `${(hoveredPoint.x / svgWidth) * 100}%`,
                top: `${(hoveredPoint.y / svgHeight) * 100}%`,
              }}
            >
              <div className="font-bold text-[11px] flex items-center gap-1.5 opacity-90">
                <span>{hoveredPoint.label}</span>
                <span className="opacity-60">•</span>
                <span>{hoveredPoint.dateStr}</span>
              </div>
              <div className="text-sm font-black text-sky-400 dark:text-sky-600">
                ${hoveredPoint.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] opacity-75">
                {hoveredPoint.type === 'today'
                  ? 'Current remaining liability'
                  : hoveredPoint.type === 'finish'
                  ? 'Target freedom milestone'
                  : 'Amortization trajectory checkpoint'}
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 flex-wrap gap-3">
          <div className="flex items-center gap-4 flex-wrap text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-1 bg-sky-600 rounded-full inline-block" />
              <span>Historical Amortization</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-0.5 border-t-2 border-dashed border-sky-400 inline-block" />
              <span>Projected Runway to $0</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              <span>Debt-Free Milestone ({metrics.targetDateStr})</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <SparklesIcon className="w-3.5 h-3.5 text-amber-500" />
            <span>Regular payments keep your burn-down trajectory on schedule</span>
          </div>
        </div>
      </div>
    </div>
  )
}

