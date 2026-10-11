import { db, getDbInstance } from './db.js'
import { apiRequest } from './api.js'
import { getLocalTransactions } from './transactionsOfflineService.js'

/**
 * Loads transactions with Offline-First priority:
 * 1. Reads local transactions (from both IndexedDB and localStorage).
 * 2. If online and authenticated, attempts to fetch latest transactions from GET /api/transactions.
 * 3. Syncs fresh server transactions into local storage and returns full list.
 */
export async function getTransactionsOfflineFirst() {
  let localTxs = await getLocalTransactions()

  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('finper_auth_token') : null

  if (typeof navigator !== 'undefined' && navigator.onLine && token) {
    try {
      const response = await apiRequest('/transactions?limit=100')
      const serverTxs = response?.data || response

      if (Array.isArray(serverTxs)) {
        const database = await getDbInstance()
        for (const sTx of serverTxs) {
          const sId = sTx.id || sTx._id
          const exists = await database.transactions.where('serverId').equals(sId).first()
          if (!exists) {
            await database.transactions.add({
              localId: `tx_srv_${sId}`,
              serverId: sId,
              amount: sTx.amount,
              type: sTx.type,
              categoryId: sTx.categoryId?._id || sTx.categoryId?.id || sTx.categoryId,
              categoryName: sTx.categoryId?.name,
              categoryIcon: sTx.categoryId?.icon,
              categoryColor: sTx.categoryId?.color,
              date: sTx.date,
              description: sTx.description,
              receiptUrl: sTx.receiptUrl,
              syncStatus: 'synced',
              createdAt: sTx.createdAt || sTx.date,
            })
          }
        }
        localTxs = await getLocalTransactions()
      }
    } catch {
      // Quietly fall back to local transactions
    }
  }

  return localTxs
}
