import { Bars3Icon, WalletIcon, PlusIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import { SyncStatusBar } from './SyncStatusBar'
import { usePrivacy } from '../context/PrivacyContext'

export default function Header({ onMenuClick, onAddTransaction }) {
  const { isPrivacyMode, togglePrivacyMode } = usePrivacy()

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

      <div className="flex items-center gap-2 sm:gap-3">
        <SyncStatusBar />

        {/* Privacy Mode Toggle */}
        <button
          type="button"
          onClick={togglePrivacyMode}
          className={`p-2 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
            isPrivacyMode
              ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/60'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title={isPrivacyMode ? 'Privacy Mode Active (Click to show amounts)' : 'Hide amounts (Click for privacy mode)'}
          aria-label={isPrivacyMode ? 'Show sensitive balances' : 'Hide sensitive balances'}
        >
          {isPrivacyMode ? (
            <EyeSlashIcon className="w-5 h-5" />
          ) : (
            <EyeIcon className="w-5 h-5" />
          )}
        </button>

        {onAddTransaction && (
          <button
            type="button"
            onClick={onAddTransaction}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 active:scale-95 rounded-lg shadow-sm transition cursor-pointer"
            title="Add a new transaction (Shortcut: Press T)"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Add Transaction</span>
            <kbd className="hidden md:inline-flex items-center justify-center text-[10px] font-semibold font-mono px-1.5 py-0.5 rounded bg-sky-700/70 text-sky-100 border border-sky-400/30 ml-1">
              T
            </kbd>
          </button>
        )}
      </div>
    </header>
  )
}
