import { db, getDbInstance } from './db.js'
import { saveLocalStoredTransactions, saveLocalSyncQueue } from './transactionsLocalStorage.js'
import { apiRequest } from './api.js'

/**
 * Resets/clears test transactions exclusively for the current authenticated user.
 * 1. Purges local cache and IndexedDB transactions for the current session.
 * 2. Calls backend POST /api/transactions/reset-month to delete only the current user's DB records.
 */
export async function resetMonthData() {
  // 1. Clear local device state
  saveLocalStoredTransactions([])
  saveLocalSyncQueue([])

  try {
    const database = await getDbInstance()
    await database.transactions.clear()
    await database.syncQueue.clear()
  } catch (err) {
    console.warn('[ResetData] Error clearing local IndexedDB:', err)
  }

  // 2. Call backend endpoint scoped strictly to the current user
  if (typeof navigator !== 'undefined' && navigator.onLine) {
    try {
      await apiRequest('/transactions/reset-month', {
        method: 'POST',
      })
    } catch (err) {
      console.warn('[ResetData] Server reset month notification failed:', err.message)
    }
  }

  return true
}
