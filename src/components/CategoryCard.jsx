import { useEffect, useState } from 'react'

export default function CategoryCard({ name, icon: Icon, budget, spent, color }) {
  const radius = 42
  const stroke = 8
  const normalizedRadius = radius - stroke * 2
  const circumference = normalizedRadius * 2 * Math.PI

  const percent = Math.min((spent / budget) * 100, 100)
  const strokeDashoffset =
    circumference - (percent / 100) * circumference

  const [animatedOffset, setAnimatedOffset] = useState(circumference)

  useEffect(() => {
    setAnimatedOffset(strokeDashoffset)
  }, [strokeDashoffset])

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6 flex flex-col items-center gap-3 hover:shadow-md dark:hover:border-slate-700 transition-shadow">
      <div className="relative w-28 h-28">
        <svg height="112" width="112" className="rotate-[-90deg]">
          {/* Fondo */}
          <circle
            className="text-slate-200 dark:text-slate-800"
            stroke="currentColor"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx="56"
            cy="56"
          />
          {/* Progreso */}
          <circle
            stroke={color}
            fill="transparent"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={animatedOffset}
            r={normalizedRadius}
            cx="56"
            cy="56"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Porcentaje */}
        <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-slate-700 dark:text-slate-200">
          {Math.round(percent)}%
        </div>
      </div>

      <div className="text-center">
        {Icon && (
          <Icon className="w-5 h-5 mx-auto mb-1 text-slate-400 dark:text-slate-500" />
        )}
        <p className="font-medium text-slate-800 dark:text-slate-100">{name}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          ${spent.toLocaleString('es-MX')} / ${budget.toLocaleString('es-MX')}
        </p>
      </div>
    </div>
  )
}
