import { useNetworkSync } from '../hooks/useNetworkSync'

/**
 * Clean status indicator for offline reconnection.
 */
export function SyncStatusBar() {
  const { isOnline } = useNetworkSync()

  if (isOnline) {
    return null
  }

  return (
    <div className="px-3 py-1.5 rounded-full flex items-center gap-2 text-xs font-medium border shadow-sm bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
      </span>
      <span>Offline</span>
    </div>
  )
}
