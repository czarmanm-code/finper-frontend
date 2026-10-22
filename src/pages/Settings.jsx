import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import ThemeToggle from '../components/ThemeToggle'
import { useAuth } from '../context/AuthContext'
import { useDateFilter } from '../context/DateContext'
import { resetMonthData } from '../services/transactionsService'
import {
  UserCircleIcon,
  ShieldCheckIcon,
  SwatchIcon,
  ExclamationTriangleIcon,
  TrashIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'

export default function Settings() {
  const { user, isAdmin } = useAuth()
  const { monthLabel } = useDateFilter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const handleResetMonth = async () => {
    try {
      setIsResetting(true)
      setErrorMessage('')
      await resetMonthData()
      setIsResetConfirmOpen(false)
      setSuccessMessage(`All movements for ${monthLabel} were successfully cleared.`)
      setTimeout(() => setSuccessMessage(''), 5000)
    } catch (err) {
      console.error('Failed to reset month data:', err)
      setErrorMessage(err.message || 'Failed to clear month data. Please try again.')
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col lg:flex-row text-slate-900 dark:text-slate-100 antialiased">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-4xl w-full mx-auto space-y-6">
          {/* Header Title */}
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Settings & Preferences
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Manage your personal profile, app appearance, and data maintenance tools
            </p>
          </div>

          {/* Feedback Alerts */}
          {successMessage && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3 text-emerald-800 dark:text-emerald-300 text-sm">
              <CheckCircleIcon className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center gap-3 text-rose-800 dark:text-rose-300 text-sm">
              <ExclamationTriangleIcon className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section 1: User Profile Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
                <UserCircleIcon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Account Profile
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Your authenticated session information
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Full Name
                </span>
                <div className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                  {user?.name || 'User'}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Email Address
                </span>
                <div className="text-sm font-bold text-slate-900 dark:text-white mt-1 truncate">
                  {user?.email || 'N/A'}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 sm:col-span-2 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Role & Permissions
                  </span>
                  <div className="text-sm font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
                    <ShieldCheckIcon className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    <span className="capitalize">{user?.role || 'User'}</span>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800">
                  {isAdmin ? 'Full Administrator' : 'Standard Access'}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: App Preferences */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
                <SwatchIcon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Appearance
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Customize interface visual theme
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  Color Theme
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Switch between Light and Dark visual palette
                </div>
              </div>

              <ThemeToggle />
            </div>
          </div>

          {/* Section 3: Danger Zone */}
          <div className="bg-white dark:bg-slate-900 border-2 border-rose-200/80 dark:border-rose-900/40 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-rose-100 dark:border-rose-950/60">
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                <ExclamationTriangleIcon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-rose-600 dark:text-rose-400">
                  Danger Zone
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Destructive and maintenance operations
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40">
              <div className="space-y-1">
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  Clear Month Transactions ({monthLabel})
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-lg leading-relaxed">
                  Permanently deletes all logged transaction movements for the currently selected month. Budget limits, category structures, and user configurations are preserved.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(true)}
                disabled={isResetting}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 disabled:opacity-50 rounded-xl shadow-xs transition cursor-pointer shrink-0"
              >
                <TrashIcon className="w-4 h-4" />
                <span>Clear Month Data</span>
              </button>
            </div>
          </div>
        </main>

        {/* Challenge Confirmation Dialog */}
        {isResetConfirmOpen && (
          <ConfirmDialog
            title="Clear Current Month Transactions?"
            message={`Are you sure you want to permanently delete all movements logged in ${monthLabel}? Your budget targets and categories will remain untouched.`}
            confirmLabel="Clear Data"
            danger
            typeToConfirm="RESET"
            onConfirm={handleResetMonth}
            onCancel={() => setIsResetConfirmOpen(false)}
          />
        )}
      </div>
    </div>
  )
}

