import Dexie from 'dexie'

/**
 * Offline-first database powered by Dexie (IndexedDB).
 * Stores local transactions, categories, saving goals, and an outbox queue for sync.
 */
export class FinperDatabase extends Dexie {
  constructor() {
    super('finper_offline_db')

    this.version(1).stores({
      // Local cached transactions
      transactions: '++id, localId, serverId, amount, type, categoryId, date, syncStatus, createdAt',
      // Outbox queue for offline mutations waiting to be sent to backend
      syncQueue: '++id, action, entity, endpoint, method, createdAt, retryCount',
      // Local cached categories
      categories: '++id, serverId, name, type, syncStatus',
      // Local cached saving goals
      savingGoals: '++id, serverId, name, targetAmount, syncStatus',
    })
  }
}

export const db = new FinperDatabase()

/**
 * Ensures the database connection is open and recovers from closing/blocked states.
 */
export async function getDbInstance() {
  if (!db.isOpen()) {
    await db.open()
  }
  return db
}

/**
 * Generates a unique client-side identifier for offline records.
 */
export function generateLocalId(prefix = 'tx') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}
