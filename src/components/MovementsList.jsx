export default function MovementsList({ movements }) {
  return (
    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6">
      <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4">
        Movimientos del mes
      </h2>

      <ul className="flex flex-col divide-y divide-slate-200 dark:divide-slate-800">
        {movements.map((mov) => (
          <MovementItem key={mov.id} {...mov} />
        ))}
      </ul>
    </section>
  )
}

function MovementItem({ date, type, category, amount }) {
  const typeColor =
    type === 'Ingreso'
      ? 'text-emerald-600 dark:text-emerald-400'
      : type === 'Gasto'
      ? 'text-rose-600 dark:text-rose-400'
      : 'text-sky-600 dark:text-sky-400'

  return (
    <li className="flex justify-between items-center py-3">
      <div className="flex flex-col">
        <span className="text-sm text-slate-500 dark:text-slate-400">{date}</span>
        <span className="font-medium text-slate-800 dark:text-slate-100">{category}</span>
      </div>
      <span className={`font-semibold ${typeColor}`}>
        ${amount.toLocaleString('es-MX')}
      </span>
    </li>
  )
}
