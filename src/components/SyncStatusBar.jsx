import { useNetworkSync } from '../hooks/useNetworkSync'
import {
  WifiIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'

/**
 * Visual status pill indicating network connection state and pending synchronization count.
 */
export function SyncStatusBar() {
  const { isOnline, isSyncing, pendingCount, triggerSync } = useNetworkSync()

  if (isOnline && pendingCount === 0 && !isSyncing) {
    return null
  }

  return (
    <div
      className={`px-3 py-1.5 rounded-full flex items-center gap-2 text-xs font-medium border shadow-sm transition-colors ${
        !isOnline
          ? 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
          : isSyncing
          ? 'bg-sky-50 text-sky-800 border-sky-300 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800'
          : 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
      }`}
    >
      {!isOnline ? (
        <>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          <span>Offline mode ({pendingCount} pending)</span>
        </>
      ) : isSyncing ? (
        <>
          <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />
          <span>Syncing {pendingCount} records...</span>
        </>
      ) : (
        <>
          <WifiIcon className="w-3.5 h-3.5" />
          <span>{pendingCount} records queued</span>
          <button
            onClick={triggerSync}
            className="ml-1 underline font-semibold hover:opacity-80"
          >
            Sync now
          </button>
        </>
      )}
    </div>
  )
}

