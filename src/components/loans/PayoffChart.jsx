import { useState } from 'react'

export default function PayoffChart({ timeline = [], startingBalance = 0, currentBalance = 0, loanName = '' }) {
  const [hoveredPoint, setHoveredPoint] = useState(null)

  if (!timeline || timeline.length === 0) {
    return (
      <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
          No payment movements recorded yet for this credit.
        </p>
        <p className="text-[11px] text-slate-400 mt-1">
          As you log payments, this burn-down trajectory curve will dynamically visualize your progress towards zero balance.
        </p>
      </div>
    )
  }

  // Build timeline data points: [initial point, ...payments]
  const initialPoint = {
    date: timeline[0]?.date ? new Date(new Date(timeline[0].date).getTime() - 86400000).toISOString() : new Date().toISOString(),
    amount: 0,
    remainingBalanceAfter: startingBalance,
    description: 'Starting Balance',
  }

  const allPoints = [initialPoint, ...timeline]

  // Chart Dimensions
  const width = 600
  const height = 180
  const paddingX = 40
  const paddingY = 25

  const maxVal = Math.max(startingBalance, ...allPoints.map((p) => p.remainingBalanceAfter), 1)
  const minVal = 0

  const getX = (index) => {
    if (allPoints.length === 1) return width / 2
    return paddingX + (index / (allPoints.length - 1)) * (width - paddingX * 2)
  }

  const getY = (val) => {
    return height - paddingY - ((val - minVal) / (maxVal - minVal)) * (height - paddingY * 2)
  }

  // Build path
  const points = allPoints.map((p, idx) => ({
    x: getX(idx),
    y: getY(p.remainingBalanceAfter),
    data: p,
  }))

  const linePath = points.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`
  }, '')

  const firstPt = points[0]
  const lastPt = points[points.length - 1]
  const areaPath = `${linePath} L ${lastPt.x} ${height - paddingY} L ${firstPt.x} ${height - paddingY} Z`

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
        <span>Balance Payoff Trajectory</span>
        <span className="text-emerald-600 dark:text-emerald-400 font-bold">
          ${currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })} remaining
        </span>
      </div>

      <div className="relative w-full bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl p-2 border border-slate-200/60 dark:border-slate-800">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible select-none"
        >
          <defs>
            <linearGradient id="payoffGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Reference baseline */}
          <line
            x1={paddingX}
            y1={height - paddingY}
            x2={width - paddingX}
            y2={height - paddingY}
            stroke="currentColor"
            strokeDasharray="3 3"
            className="text-slate-200 dark:text-slate-700"
          />

          {/* Area under curve */}
          <path d={areaPath} fill="url(#payoffGradient)" />

          {/* Trajectory stroke */}
          <path
            d={linePath}
            fill="none"
            stroke="#0ea5e9"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Interactive dots */}
          {points.map((pt, idx) => (
            <circle
              key={idx}
              cx={pt.x}
              cy={pt.y}
              r={hoveredPoint === idx ? 6 : 4}
              className="fill-white dark:fill-slate-900 stroke-sky-500 transition-all cursor-pointer"
              strokeWidth="2.5"
              onMouseEnter={() => setHoveredPoint(idx)}
              onMouseLeave={() => setHoveredPoint(null)}
            />
          ))}
        </svg>

        {/* Hover Tooltip display */}
        {hoveredPoint !== null && points[hoveredPoint] && (
          <div className="absolute top-3 left-4 bg-white dark:bg-slate-900 shadow-md border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs z-10 pointer-events-none">
            <div className="font-bold text-slate-900 dark:text-white">
              ${points[hoveredPoint].data.remainingBalanceAfter.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-slate-400">
              {new Date(points[hoveredPoint].data.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
              {points[hoveredPoint].data.amount > 0 && ` · Paid $${points[hoveredPoint].data.amount.toLocaleString('en-US')}`}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

