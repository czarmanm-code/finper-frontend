import { db, getDbInstance } from './db.js'
import { saveLocalStoredTransactions, saveLocalSyncQueue } from './transactionsLocalStorage.js'

/**
 * Resets/clears all recorded transactions and pending sync queues
 * for test and development purposes.
 */
export async function resetMonthData() {
  // 1. Clear transactions and syncQueue in localStorage
  saveLocalStoredTransactions([])
  saveLocalSyncQueue([])

  // 2. Clear IndexedDB transactions and syncQueue tables
  try {
    const database = await getDbInstance()
    await database.transactions.clear()
    await database.syncQueue.clear()
  } catch (err) {
    console.warn('[ResetData] Error clearing IndexedDB:', err)
  }

  return true
}

