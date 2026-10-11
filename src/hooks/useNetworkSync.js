import { useState, useEffect, useCallback } from 'react'
import { syncPendingQueue } from '../services/transactionsOfflineService.js'
import { db } from '../services/db.js'

/**
 * Hook to monitor online/offline status, pending sync queue items,
 * and automatically trigger background synchronization when network is restored.
 */
export function useNetworkSync() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )
  const [isSyncing, setIsSyncing] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [lastSyncResult, setLastSyncResult] = useState(null)

  const updatePendingCount = useCallback(async () => {
    try {
      const count = await db.syncQueue.count()
      setPendingCount(count)
    } catch {
      // Ignore errors if DB is closing
    }
  }, [])

  const triggerSync = useCallback(async () => {
    if (!navigator.onLine || isSyncing) return

    setIsSyncing(true)
    try {
      const result = await syncPendingQueue()
      setLastSyncResult({
        timestamp: new Date(),
        ...result,
      })
      await updatePendingCount()
    } catch (err) {
      console.error('[NetworkSync] Error during background synchronization:', err)
    } finally {
      setIsSyncing(false)
    }
  }, [isSyncing, updatePendingCount])

  useEffect(() => {
    updatePendingCount()

    function handleOnline() {
      setIsOnline(true)
      // When connection is restored, trigger auto sync
      triggerSync()
    }

    function handleOffline() {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Periodically update pending count
    const interval = setInterval(updatePendingCount, 5000)

    // If online on mount and there are pending items, attempt initial sync
    if (navigator.onLine) {
      triggerSync()
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(interval)
    }
  }, [triggerSync, updatePendingCount])

  return {
    isOnline,
    isSyncing,
    pendingCount,
    lastSyncResult,
    triggerSync,
  }
}

