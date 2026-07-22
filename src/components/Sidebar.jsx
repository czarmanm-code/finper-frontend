import {
  HomeIcon,
  PlusCircleIcon,
  ClockIcon,
  WalletIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import ThemeToggle from './ThemeToggle'

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-slate-950/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-64 flex flex-col gap-8 p-6
          bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800
          transform transition-transform duration-300 ease-in-out
          lg:static lg:translate-x-0 lg:flex-shrink-0
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              FinPer
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Finanzas Personales
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 lg:hidden"
            aria-label="Cerrar menú"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          <MenuItem label="Dashboard" icon={HomeIcon} active />
          <MenuItem label="Agregar movimiento" icon={PlusCircleIcon} />
          <MenuItem label="Historial" icon={ClockIcon} />
          <MenuItem label="Presupuesto" icon={WalletIcon} />
        </nav>

        <div className="hidden lg:flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-4">
          <span className="text-sm text-slate-500 dark:text-slate-400">Tema</span>
          <ThemeToggle />
        </div>
      </aside>
    </>
  )
}

function MenuItem({ label, icon: Icon, active }) {
  return (
    <div
      className={`
        flex items-center gap-3 px-4 py-2.5 rounded-lg cursor-pointer transition text-sm font-medium
        ${
          active
            ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
        }
      `}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      <span>{label}</span>
    </div>
  )
}
