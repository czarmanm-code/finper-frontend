import { useState, useMemo, useEffect } from 'react'
import {
  SparklesIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarDaysIcon,
  InformationCircleIcon,
  AdjustmentsHorizontalIcon,
  LinkIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'
import { usePrivacy } from '../../context/PrivacyContext'
import {
  formatMonthKey,
  getDefaultAnnualRate,
  getInvestmentAnnualRate,
  calculateInvestmentProjection,
} from '../../utils/investmentUtils'

const HORIZON_OPTIONS = [
  { label: '6M', months: 6 },
  { label: '1Y', months: 12 },
  { label: '2Y', months: 24 },
  { label: '3Y', months: 36 },
  { label: '5Y', months: 60 },
]

export default function InvestmentsTrajectoryChart({
  investments = [],
  categories = [],
  selectedInvestmentId = null,
  onSelectInvestment = null,
  onLogRecord = null,
}) {
  const { mask } = usePrivacy()
  const [activeTab, setActiveTab] = useState(selectedInvestmentId || 'all')
  const [hoveredPoint, setHoveredPoint] = useState(null)

  useEffect(() => {
    if (selectedInvestmentId && selectedInvestmentId !== activeTab) {
      setActiveTab(selectedInvestmentId)
      setCustomContribution(null)
      setCustomRate(null)
    }
  }, [selectedInvestmentId])

  // Projection / What-If Runway State
  const [showProjection, setShowProjection] = useState(true)
  const [horizonMonths, setHorizonMonths] = useState(12)
  const [customContribution, setCustomContribution] = useState(null)
  const [customRate, setCustomRate] = useState(null)
  const [isCustomizing, setIsCustomizing] = useState(false)

  const activeInvestments = useMemo(
    () => investments.filter((inv) => inv.status !== 'archived'),
    [investments]
  )

  const currentInvestment = useMemo(() => {
    if (activeTab === 'all') return null
    return activeInvestments.find((inv) => (inv.id || inv._id) === activeTab) || null
  }, [activeTab, activeInvestments])

  // Aggregate metrics for active selection
  const metrics = useMemo(() => {
    if (currentInvestment) {
      const currentBalance = Number(currentInvestment.currentBalance) || Number(currentInvestment.initialBalance) || 0
      const totalInvested = Number(currentInvestment.totalInvested) || Number(currentInvestment.initialBalance) || 0
      const totalGainLoss = Number(currentInvestment.totalGainLoss) || (currentBalance - totalInvested)
      const totalReturnPercent = totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0
      const lastReturnAmount = Number(currentInvestment.lastReturnAmount) || 0
      const lastReturnRate = Number(currentInvestment.lastReturnRate) || 0

      return {
        name: currentInvestment.name,
        institution: currentInvestment.institution,
        type: currentInvestment.type,
        currentBalance,
        totalInvested,
        totalGainLoss,
        totalReturnPercent: Math.round(totalReturnPercent * 100) / 100,
        lastReturnAmount,
        lastReturnRate,
        isConsolidated: false,
      }
    }

    // Consolidated Portfolio
    const totalBalance = activeInvestments.reduce(
      (sum, inv) => sum + (Number(inv.currentBalance) || Number(inv.initialBalance) || 0),
      0
    )
    const totalInvested = activeInvestments.reduce(
      (sum, inv) => sum + (Number(inv.totalInvested) || Number(inv.initialBalance) || 0),
      0
    )
    const totalGainLoss = totalBalance - totalInvested
    const totalReturnPercent = totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0
    const lastReturnAmount = activeInvestments.reduce(
      (sum, inv) => sum + (Number(inv.lastReturnAmount) || 0),
      0
    )
    const lastReturnRate = totalInvested > 0 ? (lastReturnAmount / totalInvested) * 100 : 0

    return {
      name: 'Total Investment Portfolio',
      institution: 'Consolidated Accounts',
      type: 'mixed',
      currentBalance: totalBalance,
      totalInvested,
      totalGainLoss,
      totalReturnPercent: Math.round(totalReturnPercent * 100) / 100,
      lastReturnAmount,
      lastReturnRate: Math.round(lastReturnRate * 100) / 100,
      isConsolidated: true,
    }
  }, [currentInvestment, activeInvestments])

  // Budget Linkage: detect planned monthly savings from Budget categories
  const linkedCategory = useMemo(() => {
    if (!currentInvestment) return null
    const catId =
      typeof currentInvestment.categoryId === 'object'
        ? currentInvestment.categoryId?.id || currentInvestment.categoryId?._id
        : currentInvestment.categoryId
    if (!catId) return null
    return (
      categories.find((c) => (c.id || c.serverId || c._id) === catId) || null
    )
  }, [currentInvestment, categories])

  const defaultMonthlyContribution = useMemo(() => {
    if (currentInvestment) {
      return linkedCategory ? Number(linkedCategory.plannedAmount) || 0 : 0
    }
    // All Portfolio: sum of all categories linked to active investments
    return activeInvestments.reduce((sum, inv) => {
      const catId =
        typeof inv.categoryId === 'object'
          ? inv.categoryId?.id || inv.categoryId?._id
          : inv.categoryId
      const cat = categories.find((c) => (c.id || c.serverId || c._id) === catId)
      return sum + (Number(cat?.plannedAmount) || 0)
    }, 0)
  }, [currentInvestment, linkedCategory, activeInvestments, categories])

  const defaultAnnualRate = useMemo(() => {
    if (currentInvestment) {
      return getInvestmentAnnualRate(currentInvestment)
    }
    // Consolidated: weighted average APR across active accounts based on current balance
    const totalBal = activeInvestments.reduce(
      (sum, inv) => sum + (Number(inv.currentBalance) || Number(inv.initialBalance) || 0),
      0
    )
    if (totalBal > 0) {
      const weightedSum = activeInvestments.reduce((sum, inv) => {
        const bal = Number(inv.currentBalance) || Number(inv.initialBalance) || 0
        const rate = getInvestmentAnnualRate(inv)
        return sum + bal * rate
      }, 0)
      return Math.round((weightedSum / totalBal) * 100) / 100
    }
    return 10.0 // Default 10% for consolidated diversified portfolio
  }, [currentInvestment, activeInvestments])

  // Effective values for projection
  const effectiveContribution =
    customContribution !== null ? customContribution : defaultMonthlyContribution
  const effectiveRate = customRate !== null ? customRate : defaultAnnualRate

  // Formatting helpers for numeric inputs
  const formatRate = (val) => {
    if (val === null || val === undefined || val === '') return ''
    const num = Number(val)
    if (isNaN(num)) return ''
    if (Math.round(num) === num) return String(num)
    return String(parseFloat(num.toFixed(2)))
  }

  const formatDepositDisplay = (val) => {
    if (val === null || val === undefined || val === '') return '0.00'
    const num = Number(val)
    if (isNaN(num) || num === 0) return '0.00'
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  // Input formatting state for currency & rate inputs
  const [depositText, setDepositText] = useState('')
  const [isDepositFocused, setIsDepositFocused] = useState(false)
  const [rateText, setRateText] = useState('')
  const [isRateFocused, setIsRateFocused] = useState(false)

  // Synchronize depositText with effectiveContribution
  useEffect(() => {
    if (!isDepositFocused) {
      setDepositText(formatDepositDisplay(effectiveContribution))
    }
  }, [effectiveContribution, isDepositFocused])

  // Synchronize rateText with effectiveRate
  useEffect(() => {
    if (!isRateFocused) {
      setRateText(formatRate(effectiveRate))
    }
  }, [effectiveRate, isRateFocused])

  const handleDepositChange = (e) => {
    const raw = e.target.value.replace(/[^0-9.]/g, '')
    const parts = raw.split('.')
    const clean = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : raw
    setDepositText(clean)
    const num = parseFloat(clean)
    setCustomContribution(isNaN(num) ? 0 : num)
  }

  const handleDepositFocus = (e) => {
    setIsDepositFocused(true)
    if (effectiveContribution > 0) {
      setDepositText(String(effectiveContribution))
    } else {
      setDepositText('')
    }
    e.target.select()
  }

  const handleDepositBlur = () => {
    setIsDepositFocused(false)
    const num = parseFloat(depositText.replace(/[^0-9.]/g, ''))
    const finalVal = isNaN(num) ? 0 : Math.round(num * 100) / 100
    setCustomContribution(finalVal)
    setDepositText(formatDepositDisplay(finalVal))
  }

  const handleRateChange = (e) => {
    const raw = e.target.value.replace(/[^0-9.]/g, '')
    const parts = raw.split('.')
    const clean = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : raw
    setRateText(clean)
    const num = parseFloat(clean)
    setCustomRate(isNaN(num) ? 0 : Math.min(100, Math.max(0, num)))
  }

  const handleRateFocus = (e) => {
    setIsRateFocused(true)
    if (effectiveRate > 0) {
      setRateText(formatRate(effectiveRate))
    } else {
      setRateText('')
    }
    e.target.select()
  }

  const handleRateBlur = () => {
    setIsRateFocused(false)
    const num = parseFloat(rateText.replace(/[^0-9.]/g, ''))
    const finalRate = isNaN(num) ? 0 : Math.min(100, Math.max(0, Math.round(num * 100) / 100))
    setCustomRate(finalRate)
    setRateText(formatRate(finalRate))
  }

  // Extract historical points
  const historicalPoints = useMemo(() => {
    if (currentInvestment) {
      const rawTimeline = currentInvestment.timeline || []
      if (rawTimeline.length === 0) {
        return [
          {
            date: new Date().toISOString(),
            label: 'Initial',
            balance: Number(currentInvestment.initialBalance) || 0,
            returnAmount: 0,
            returnRate: 0,
            isProjected: false,
          },
        ]
      }
      return rawTimeline.map((pt) => ({
        date: pt.date,
        label: pt.monthKey ? formatMonthKey(pt.monthKey) : 'Point',
        balance: Number(pt.balance) || 0,
        returnAmount: Number(pt.returnAmount) || 0,
        returnRate: Number(pt.returnRate) || 0,
        isProjected: false,
      }))
    }

    // Consolidated: gather all unique cutoff monthKeys
    const monthKeyMap = new Map()

    activeInvestments.forEach((inv) => {
      const records = inv.records || []
      records.forEach((rec) => {
        const mKey = rec.monthKey || rec.date?.substring(0, 7)
        if (!mKey) return
        if (!monthKeyMap.has(mKey)) {
          monthKeyMap.set(mKey, {
            monthKey: mKey,
            date: rec.date,
            balance: 0,
            returnAmount: 0,
          })
        }
      })
    })

    if (monthKeyMap.size === 0) {
      const totalInitial = activeInvestments.reduce(
        (sum, inv) => sum + (Number(inv.initialBalance) || 0),
        0
      )
      return [
        {
          date: new Date().toISOString(),
          label: 'Initial',
          balance: totalInitial,
          returnAmount: 0,
          returnRate: 0,
          isProjected: false,
        },
      ]
    }

    const sortedKeys = Array.from(monthKeyMap.keys()).sort()

    return sortedKeys.map((mKey) => {
      let monthTotalBalance = 0
      let monthTotalReturn = 0

      activeInvestments.forEach((inv) => {
        const records = (inv.records || []).slice().sort((a, b) => new Date(a.date) - new Date(b.date))
        const matchingRecs = records.filter(
          (r) => (r.monthKey || r.date?.substring(0, 7)) <= mKey
        )
        if (matchingRecs.length > 0) {
          const latestForMonth = matchingRecs[matchingRecs.length - 1]
          monthTotalBalance += Number(latestForMonth.balance) || 0
          if ((latestForMonth.monthKey || latestForMonth.date?.substring(0, 7)) === mKey) {
            monthTotalReturn += Number(latestForMonth.returnAmount) || 0
          }
        } else {
          monthTotalBalance += Number(inv.initialBalance) || 0
        }
      })

      return {
        date: monthKeyMap.get(mKey).date,
        label: formatMonthKey(mKey),
        balance: monthTotalBalance,
        returnAmount: monthTotalReturn,
        isProjected: false,
      }
    })
  }, [currentInvestment, activeInvestments])

  // Compute Future Projection Points
  const projectedPoints = useMemo(() => {
    if (!showProjection || horizonMonths <= 0) return []
    return calculateInvestmentProjection({
      startingBalance: metrics.currentBalance,
      monthlyContribution: effectiveContribution,
      annualRatePercent: effectiveRate,
      horizonMonths,
      fromDate: new Date(),
    })
  }, [showProjection, horizonMonths, metrics.currentBalance, effectiveContribution, effectiveRate])

  // Final point of projection for summary banner
  const finalProjectedPoint = useMemo(() => {
    if (!showProjection || projectedPoints.length === 0) return null
    return projectedPoints[projectedPoints.length - 1]
  }, [showProjection, projectedPoints])

  // Combined points for coordinate mapping
  const allPoints = useMemo(() => {
    if (!showProjection || projectedPoints.length === 0) return historicalPoints
    return [...historicalPoints, ...projectedPoints]
  }, [historicalPoints, projectedPoints, showProjection])

  // SVG Chart Dimensions
  const width = 800
  const height = 270
  const padLeft = 70
  const padRight = 35
  const padTop = 30
  const padBottom = 45

  const chartBounds = useMemo(() => {
    if (allPoints.length === 0) return { min: 0, max: 100 }
    const balances = allPoints.map((p) => p.balance)
    let min = Math.min(...balances)
    let max = Math.max(...balances)
    if (min === max) {
      min = Math.max(0, min * 0.9)
      max = max * 1.1 || 1000
    } else {
      const buffer = (max - min) * 0.12
      min = Math.max(0, min - buffer)
      max = max + buffer
    }
    return { min, max }
  }, [allPoints])

  // Map coordinates
  const pointsWithCoords = useMemo(() => {
    if (allPoints.length === 0) return []
    const innerW = width - padLeft - padRight
    const innerH = height - padTop - padBottom
    const range = chartBounds.max - chartBounds.min || 1

    return allPoints.map((pt, idx) => {
      const x =
        allPoints.length === 1
          ? padLeft + innerW / 2
          : padLeft + (idx / (allPoints.length - 1)) * innerW
      const y =
        padTop + innerH - ((pt.balance - chartBounds.min) / range) * innerH
      return { ...pt, x, y }
    })
  }, [allPoints, chartBounds, width, height, padLeft, padRight, padTop, padBottom])

  // Split into historical coords and projected coords (starting from last historical)
  const historicalCoords = useMemo(() => {
    return pointsWithCoords.filter((p) => !p.isProjected)
  }, [pointsWithCoords])

  const projectedCoords = useMemo(() => {
    if (!showProjection || projectedPoints.length === 0) return []
    const lastHist = historicalCoords[historicalCoords.length - 1]
    const proj = pointsWithCoords.filter((p) => p.isProjected)
    return lastHist ? [lastHist, ...proj] : proj
  }, [showProjection, projectedPoints, historicalCoords, pointsWithCoords])

  // Generate SVG paths
  const historicalPath = useMemo(() => {
    if (historicalCoords.length === 0) return ''
    if (historicalCoords.length === 1) {
      return `M ${padLeft} ${historicalCoords[0].y} L ${historicalCoords[0].x} ${historicalCoords[0].y}`
    }
    let d = `M ${historicalCoords[0].x} ${historicalCoords[0].y}`
    for (let i = 1; i < historicalCoords.length; i++) {
      const prev = historicalCoords[i - 1]
      const curr = historicalCoords[i]
      const midX = (prev.x + curr.x) / 2
      d += ` C ${midX} ${prev.y}, ${midX} ${curr.y}, ${curr.x} ${curr.y}`
    }
    return d
  }, [historicalCoords, padLeft])

  const projectedPath = useMemo(() => {
    if (projectedCoords.length < 2) return ''
    let d = `M ${projectedCoords[0].x} ${projectedCoords[0].y}`
    for (let i = 1; i < projectedCoords.length; i++) {
      const prev = projectedCoords[i - 1]
      const curr = projectedCoords[i]
      const midX = (prev.x + curr.x) / 2
      d += ` C ${midX} ${prev.y}, ${midX} ${curr.y}, ${curr.x} ${curr.y}`
    }
    return d
  }, [projectedCoords])

  // Historical Area Fill
  const historicalArea = useMemo(() => {
    if (!historicalPath || historicalCoords.length === 0) return ''
    const first = historicalCoords[0]
    const last = historicalCoords[historicalCoords.length - 1]
    return `${historicalPath} L ${last.x} ${height - padBottom} L ${first.x} ${height - padBottom} Z`
  }, [historicalPath, historicalCoords, height, padBottom])

  // Projected Area Fill
  const projectedArea = useMemo(() => {
    if (!projectedPath || projectedCoords.length < 2) return ''
    const first = projectedCoords[0]
    const last = projectedCoords[projectedCoords.length - 1]
    return `${projectedPath} L ${last.x} ${height - padBottom} L ${first.x} ${height - padBottom} Z`
  }, [projectedPath, projectedCoords, height, padBottom])

  const isNetPositive = metrics.totalGainLoss >= 0

  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col gap-6">
      {/* 1. Top Header Bar & Instrument Switching Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
              <SparklesIcon className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Wealth Trajectory & Runway
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Historical portfolio performance and forward compound growth forecast
          </p>
        </div>

        {/* View Switcher Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => {
              setActiveTab('all')
              setCustomContribution(null)
              setCustomRate(null)
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'all'
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All Portfolio
          </button>
          {activeInvestments.map((inv) => {
            const id = inv.id || inv._id
            const isSelected = activeTab === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setActiveTab(id)
                  setCustomContribution(null)
                  setCustomRate(null)
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {inv.name}
              </button>
            )
          })}
        </div>
      </div>

      {/* 2. Primary KPI Ribbon for Selected Instrument / Portfolio */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Current Valuation
          </span>
          <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {mask(metrics.currentBalance)}
          </span>
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            All-Time Net Return
          </span>
          <div className="flex items-center gap-2">
            <span
              className={`text-xl sm:text-2xl font-black ${
                isNetPositive
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {metrics.totalGainLoss >= 0 ? '+' : ''}
              {mask(metrics.totalGainLoss)}
            </span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                isNetPositive
                  ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
                  : 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300'
              }`}
            >
              {metrics.totalReturnPercent >= 0 ? '+' : ''}
              {metrics.totalReturnPercent}%
            </span>
          </div>
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Net Invested Principal
          </span>
          <span className="text-xl sm:text-2xl font-bold text-slate-700 dark:text-slate-300">
            {mask(metrics.totalInvested)}
          </span>
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Latest Period Return
          </span>
          <div className="flex items-center gap-1.5">
            <span
              className={`text-xl sm:text-2xl font-bold ${
                metrics.lastReturnAmount >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {metrics.lastReturnAmount >= 0 ? '+' : ''}
              {mask(metrics.lastReturnAmount)}
            </span>
            {metrics.lastReturnRate !== 0 && (
              <span className="text-xs font-semibold text-slate-400">
                ({metrics.lastReturnRate >= 0 ? '+' : ''}{metrics.lastReturnRate}%)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 3. Projection Runway & What-If Simulator Panel */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-50 via-emerald-50/20 to-teal-50/20 dark:from-slate-800/50 dark:via-slate-800/30 dark:to-emerald-950/20 border border-slate-200/90 dark:border-slate-700/80 flex flex-col gap-4">
        {/* Top bar of simulator */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>Projection Runway</span>
            </span>
            {defaultMonthlyContribution > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700">
                <LinkIcon className="w-3 h-3" />
                Budget: {mask(defaultMonthlyContribution)}/mo
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* Horizon Period Pills */}
            <div className="flex items-center bg-white dark:bg-slate-800 rounded-xl p-0.5 border border-slate-200 dark:border-slate-700 shadow-2xs">
              {HORIZON_OPTIONS.map((opt) => (
                <button
                  key={opt.months}
                  type="button"
                  onClick={() => setHorizonMonths(opt.months)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                    horizonMonths === opt.months
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* What-If Customizer Toggle */}
            <button
              type="button"
              onClick={() => setIsCustomizing(!isCustomizing)}
              className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-xl border transition cursor-pointer ${
                isCustomizing
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
              }`}
            >
              <AdjustmentsHorizontalIcon className="w-3.5 h-3.5" />
              <span>{isCustomizing ? 'Done' : 'What-If Parameters'}</span>
            </button>
          </div>
        </div>

        {/* Collapsible Symmetric Parameter Inputs */}
        {isCustomizing && (
          <div className="pt-3 border-t border-slate-200 dark:border-slate-700/80 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Field 1: Monthly Savings Contribution ($ Prefix) */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between min-h-[20px]">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Monthly Savings Contribution
                </label>
                {customContribution !== null ? (
                  <button
                    type="button"
                    onClick={() => {
                      setCustomContribution(null)
                      setIsDepositFocused(false)
                    }}
                    className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowPathIcon className="w-3 h-3" />
                    Reset ({mask(defaultMonthlyContribution)}/mo)
                  </button>
                ) : defaultMonthlyContribution > 0 ? (
                  <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                    Budget Linked
                  </span>
                ) : null}
              </div>

              {/* Symmetric Input Group with Left Currency Addon */}
              <div className="flex items-stretch h-12 w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shadow-2xs transition-all focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500">
                <div className="flex items-center justify-center px-4 bg-slate-100 dark:bg-slate-700/60 border-r border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-black text-base select-none">
                  $
                </div>
                <input
                  type="text"
                  inputMode="decimal"
                  value={depositText}
                  onChange={handleDepositChange}
                  onFocus={handleDepositFocus}
                  onBlur={handleDepositBlur}
                  placeholder="0.00"
                  className="flex-1 min-w-0 bg-transparent px-4 py-2.5 text-base sm:text-lg font-bold text-slate-900 dark:text-white text-right focus:outline-none"
                />
              </div>

              <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-tight min-h-[16px]">
                {linkedCategory
                  ? `Pre-filled from linked budget category "${linkedCategory.name}"`
                  : defaultMonthlyContribution > 0
                  ? 'Consolidated sum of linked budget categories'
                  : 'Enter simulated monthly savings deposit'}
              </p>
            </div>

            {/* Field 2: Estimated Annual Yield (% Suffix) */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between min-h-[20px]">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Estimated Annual Yield (APR)
                </label>
                {customRate !== null ? (
                  <button
                    type="button"
                    onClick={() => {
                      setCustomRate(null)
                      setIsRateFocused(false)
                    }}
                    className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowPathIcon className="w-3 h-3" />
                    Reset ({formatRate(defaultAnnualRate)}%)
                  </button>
                ) : (
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                    Class Benchmark
                  </span>
                )}
              </div>

              {/* Symmetric Input Group with Right Percentage Addon */}
              <div className="flex items-stretch h-12 w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shadow-2xs transition-all focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500">
                <input
                  type="text"
                  inputMode="decimal"
                  value={rateText}
                  onChange={handleRateChange}
                  onFocus={handleRateFocus}
                  onBlur={handleRateBlur}
                  placeholder="10"
                  className="flex-1 min-w-0 bg-transparent px-4 py-2.5 text-base sm:text-lg font-bold text-slate-900 dark:text-white text-right focus:outline-none"
                />
                <div className="flex items-center justify-center px-4 bg-slate-100 dark:bg-slate-700/60 border-l border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-black text-base select-none">
                  %
                </div>
              </div>

              <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-tight min-h-[16px]">
                {currentInvestment
                  ? currentInvestment.estimatedAnnualRate !== undefined && currentInvestment.estimatedAnnualRate !== null
                    ? `Saved custom target rate for ${currentInvestment.name} (${formatRate(defaultAnnualRate)}% APR)`
                    : `Default benchmark for ${formatInvestmentType(currentInvestment.type)} (${formatRate(defaultAnnualRate)}% APR)`
                  : `Portfolio weighted average APR (${formatRate(defaultAnnualRate)}%)`}
              </p>
            </div>
          </div>
        )}

        {/* Forecast Outcome Banner with Transparent Financial Formula Breakdown */}
        {finalProjectedPoint && (
          <div className="pt-3 border-t border-slate-200/80 dark:border-slate-700/80 flex flex-col gap-3">
            {/* Header info */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-slate-600 dark:text-slate-300">
                Projection Horizon:{' '}
                <strong className="text-slate-900 dark:text-white font-bold">
                  {horizonMonths} Months ({finalProjectedPoint.label})
                </strong>
                {' • '}
                <span className="text-slate-500 dark:text-slate-400">
                  Target:{' '}
                  <strong className="text-slate-700 dark:text-slate-200 font-bold">
                    {metrics.name}
                  </strong>
                </span>
              </span>

              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200/80 dark:border-emerald-800/80">
                Simulation @ {formatRate(effectiveRate)}% APR
              </span>
            </div>

            {/* 4-Column Financial Breakdown Card */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-3.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 backdrop-blur-xs">
              {/* 1. Starting Baseline */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                  1. Current Baseline
                </span>
                <div className="text-base sm:text-lg font-bold text-slate-700 dark:text-slate-200">
                  {mask(metrics.currentBalance)}
                </div>
                <span className="text-[10px] text-slate-400">Starting capital</span>
              </div>

              {/* 2. Planned Contributions */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                  2. Planned Contributions
                </span>
                <div className="text-base sm:text-lg font-bold text-slate-700 dark:text-slate-200">
                  +{mask(finalProjectedPoint.totalDeposited)}
                </div>
                <span className="text-[10px] text-slate-400">
                  {mask(effectiveContribution)}/mo × {horizonMonths}m
                </span>
              </div>

              {/* 3. Compounded Interest */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-0.5">
                  3. Compounded Yield
                </span>
                <div className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400">
                  +{mask(finalProjectedPoint.totalInterest)}
                </div>
                <span className="text-[10px] text-slate-400">
                  Compound growth
                </span>
              </div>

              {/* 4. Projected Valuation */}
              <div className="bg-emerald-50/70 dark:bg-emerald-950/40 p-2.5 -m-1.5 rounded-xl border border-emerald-200/80 dark:border-emerald-800/60 flex flex-col justify-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 block mb-0.5">
                  = Projected Valuation
                </span>
                <div className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                  {mask(finalProjectedPoint.balance)}
                </div>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">
                  {finalProjectedPoint.label}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Trajectory Canvas & Curve */}
      <div className="relative w-full overflow-hidden">
        {/* Legend */}
        <div className="flex items-center justify-end gap-4 mb-2 text-xs font-semibold">
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
            <span className="w-3.5 h-0.5 bg-emerald-500 rounded-full" />
            <span>Historical Record</span>
          </div>
          {showProjection && (
            <div className="flex items-center gap-1.5 text-sky-600 dark:text-sky-400">
              <span className="w-4 h-0.5 border-b-2 border-dashed border-sky-500" />
              <span>Projected Runway</span>
            </div>
          )}
        </div>

        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible select-none"
        >
          <defs>
            <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>

            <linearGradient id="projectedGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Gridlines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
            const y = padTop + (height - padTop - padBottom) * pct
            const val = chartBounds.max - pct * (chartBounds.max - chartBounds.min)
            return (
              <g key={idx}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke="currentColor"
                  strokeOpacity="0.08"
                  strokeDasharray="4 4"
                  className="text-slate-500"
                />
                <text
                  x={padLeft - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="text-[10px] font-medium fill-slate-400 dark:fill-slate-500"
                >
                  {mask(Math.round(val))}
                </text>
              </g>
            )
          })}

          {/* Historical Area Fill */}
          {historicalArea && (
            <path d={historicalArea} fill="url(#curveGradient)" />
          )}

          {/* Projected Area Fill */}
          {projectedArea && (
            <path d={projectedArea} fill="url(#projectedGradient)" />
          )}

          {/* Historical Curve Line */}
          {historicalPath && (
            <path
              d={historicalPath}
              fill="none"
              stroke="#10b981"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Projected Curve Line (Dashed) */}
          {projectedPath && (
            <path
              d={projectedPath}
              fill="none"
              stroke="#0284c7"
              strokeWidth="2.5"
              strokeDasharray="5 5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Data Points */}
          {pointsWithCoords.map((pt, idx) => {
            const isHovered = hoveredPoint === idx
            const isProj = pt.isProjected

            const total = pointsWithCoords.length
            const showLabel =
              total <= 8 ||
              idx === 0 ||
              idx === total - 1 ||
              (!isProj && idx === historicalCoords.length - 1) ||
              idx % Math.ceil(total / 6) === 0

            return (
              <g key={idx} className="cursor-pointer">
                {/* Date label at bottom */}
                {showLabel && (
                  <text
                    x={pt.x}
                    y={height - padBottom + 18}
                    textAnchor="middle"
                    className={`text-[9.5px] font-medium ${
                      isProj
                        ? 'fill-sky-500 dark:fill-sky-400 font-bold'
                        : 'fill-slate-400 dark:fill-slate-500'
                    }`}
                  >
                    {pt.label}
                  </text>
                )}

                {/* Outer halo on hover */}
                {isHovered && (
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="12"
                    fill={isProj ? '#0284c7' : '#10b981'}
                    fillOpacity="0.2"
                  />
                )}

                {/* Point dot */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? '6' : isProj ? '4' : '4.5'}
                  fill={isProj ? '#0284c7' : '#ffffff'}
                  stroke={isProj ? '#38bdf8' : '#10b981'}
                  strokeWidth="2.5"
                  onMouseEnter={() => setHoveredPoint(idx)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              </g>
            )
          })}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredPoint !== null && pointsWithCoords[hoveredPoint] && (
          <div
            className="pointer-events-none absolute z-20 px-3.5 py-2.5 rounded-xl bg-slate-900/95 dark:bg-slate-800/95 text-white text-xs shadow-xl border border-slate-700 backdrop-blur-xs transform -translate-x-1/2 -translate-y-full min-w-[170px]"
            style={{
              left: `${(pointsWithCoords[hoveredPoint].x / width) * 100}%`,
              top: `${(pointsWithCoords[hoveredPoint].y / height) * 100}%`,
              marginTop: '-12px',
            }}
          >
            <div className="flex items-center justify-between gap-2 border-b border-slate-700 pb-1 mb-1.5">
              <span className="font-bold">{pointsWithCoords[hoveredPoint].label}</span>
              {pointsWithCoords[hoveredPoint].isProjected ? (
                <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">
                  Projected
                </span>
              ) : (
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                  Recorded
                </span>
              )}
            </div>

            <div className="space-y-1">
              <div>
                <span className="text-[10px] text-slate-400 block">Valuation</span>
                <span className="text-base font-black text-white">
                  {mask(pointsWithCoords[hoveredPoint].balance)}
                </span>
              </div>

              {pointsWithCoords[hoveredPoint].isProjected ? (
                <div className="pt-1 border-t border-slate-800 space-y-0.5 text-[11px]">
                  <div className="flex justify-between text-slate-300">
                    <span>Deposits:</span>
                    <strong className="text-white">
                      +{mask(pointsWithCoords[hoveredPoint].totalDeposited)}
                    </strong>
                  </div>
                  <div className="flex justify-between text-emerald-400">
                    <span>Compounded Yield:</span>
                    <strong className="font-black">
                      +{mask(pointsWithCoords[hoveredPoint].totalInterest)}
                    </strong>
                  </div>
                </div>
              ) : (
                pointsWithCoords[hoveredPoint].returnAmount !== 0 && (
                  <div className="text-[11px] text-slate-300">
                    Period yield:{' '}
                    <span
                      className={
                        pointsWithCoords[hoveredPoint].returnAmount >= 0
                          ? 'text-emerald-400 font-bold'
                          : 'text-rose-400 font-bold'
                      }
                    >
                      {pointsWithCoords[hoveredPoint].returnAmount >= 0 ? '+' : ''}
                      {mask(pointsWithCoords[hoveredPoint].returnAmount)}
                    </span>
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
