import { HEROICON_MAP } from '../utils/heroicons'

export default function MovementsList({ movements }) {
  return (
    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Recent Movements
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Your latest logged transactions
          </p>
        </div>
      </div>

      <ul className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
        {movements.map((mov) => (
          <MovementItem key={mov.id} {...mov} />
        ))}
      </ul>
    </section>
  )
}

function MovementItem({ date, type, category, amount, icon, color = '#3b82f6', description }) {
  const isIncome = type === 'income' || type === 'Income' || type === 'Ingreso'

  const IconComponent = HEROICON_MAP[icon] || (isIncome ? HEROICON_MAP.BanknotesIcon : HEROICON_MAP.TagIcon)

  return (
    <li className="flex justify-between items-center py-3.5 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 px-2 rounded-xl transition">
      <div className="flex items-center gap-3.5">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shadow-xs transition"
          style={{
            backgroundColor: `${color}18`, // 10% opacity tint
            color: color,
          }}
        >
          {IconComponent && <IconComponent className="w-5 h-5" />}
        </div>

        <div className="flex flex-col">
          <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
            {category}
          </span>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>{date}</span>
            {description && (
              <>
                <span>•</span>
                <span className="truncate max-w-[200px] sm:max-w-xs">{description}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <span
        className={`font-bold text-sm tracking-tight ${
          isIncome
            ? 'text-emerald-600 dark:text-emerald-400'
            : 'text-rose-600 dark:text-rose-400'
        }`}
      >
        {isIncome ? '+' : '-'}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
    </li>
  )
}
