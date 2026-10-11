import { Bars3Icon, WalletIcon } from '@heroicons/react/24/outline'
import ThemeToggle from './ThemeToggle'
import { SyncStatusBar } from './SyncStatusBar'

export default function Header({ onMenuClick }) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur px-4 py-3">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition lg:hidden"
          aria-label="Open menu"
        >
          <Bars3Icon className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800/80 flex items-center justify-center text-sky-600 dark:text-sky-400 shadow-2xs">
            <WalletIcon className="w-5 h-5" />
          </div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">PerFin</h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <SyncStatusBar />
        <ThemeToggle />
      </div>
    </header>
  )
}
