const STORAGE_KEY = 'finper-offline-transactions'
const SYNC_QUEUE_KEY = 'finper-offline-sync-queue'

function getLocalStoredTransactions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveLocalStoredTransactions(txs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(txs))
  } catch (err) {
    console.warn('[LocalStorage] Failed to save transactions:', err)
  }
}

function getLocalSyncQueue() {
  try {
    const raw = localStorage.getItem(SYNC_QUEUE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveLocalSyncQueue(queue) {
  try {
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue))
  } catch (err) {
    console.warn('[LocalStorage] Failed to save syncQueue:', err)
  }
}

export {
  getLocalStoredTransactions,
  saveLocalStoredTransactions,
  getLocalSyncQueue,
  saveLocalSyncQueue,
}

