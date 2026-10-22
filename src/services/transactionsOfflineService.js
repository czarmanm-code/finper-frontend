export {
  getTransactions,
  getTransactions as getLocalTransactions,
  createTransaction,
  createTransaction as createTransactionOfflineFirst,
  updateTransaction,
  updateTransaction as updateTransactionOfflineFirst,
  deleteTransaction,
  deleteTransaction as deleteTransactionOfflineFirst,
  resetMonthData,
} from './transactionsService.js'

export async function syncPendingQueue() {
  return { syncedCount: 0, failedCount: 0 }
}
