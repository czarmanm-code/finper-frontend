import { NavLink } from 'react-router-dom'
import {
  HomeIcon,
  PlusCircleIcon,
  ClockIcon,
  WalletIcon,
  TagIcon,
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
          fixed inset-y-0 left-0 z-40 w-64 flex flex-col p-6
          bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800
          transform transition-transform duration-300 ease-in-out
          lg:static lg:h-screen lg:sticky lg:top-0 lg:translate-x-0 lg:flex-shrink-0
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Top: Brand Header */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-3">
            <img src="/pwa-icon.svg" alt="PerFin logo" className="w-10 h-10 drop-shadow-sm" />
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight leading-none">
                PerFin
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Personal Finance
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 lg:hidden"
            aria-label="Close menu"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Center: Navigation Menu (scrolls if small screen, but doesn't push theme out of view) */}
        <nav className="flex flex-col gap-1 flex-1 overflow-y-auto">
          <MenuItem to="/" label="Dashboard" icon={HomeIcon} onNavigate={onClose} />
          <MenuItem label="Add movement" icon={PlusCircleIcon} disabled />
          <MenuItem label="History" icon={ClockIcon} disabled />
          <MenuItem to="/categorias" label="Categories" icon={TagIcon} onNavigate={onClose} />
          <MenuItem to="/budget" label="Budget" icon={WalletIcon} onNavigate={onClose} />
        </nav>

        {/* Bottom: Theme toggle pinned at bottom */}
        <div className="pt-4 mt-auto border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Theme</span>
          <ThemeToggle />
        </div>
      </aside>
    </>
  )
}

function MenuItem({ to, label, icon: Icon, disabled, onNavigate }) {
  if (disabled) {
    return (
      <div
        className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-60"
        title="Coming soon"
      >
        <Icon className="w-5 h-5 flex-shrink-0" />
        <span>{label}</span>
      </div>
    )
  }

  return (
    <NavLink
      to={to}
      end={to === '/'}
      onClick={onNavigate}
      className={({ isActive }) => `
        flex items-center gap-3 px-4 py-2.5 rounded-lg transition text-sm font-medium
        ${
          isActive
            ? 'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
        }
      `}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      <span>{label}</span>
    </NavLink>
  )
}
