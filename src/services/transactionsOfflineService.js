import { db, getDbInstance, generateLocalId } from './db.js'
import { apiRequest } from './api.js'
import {
  getLocalStoredTransactions,
  saveLocalStoredTransactions,
  getLocalSyncQueue,
  saveLocalSyncQueue,
} from './transactionsLocalStorage.js'

/**
 * Creates a transaction using an Offline-First approach:
 * 1. Guarantees persistence across BOTH IndexedDB and localStorage.
 * 2. If online and has auth credentials, attempts immediate push to backend.
 * 3. Returns immediately with the saved record so UI updates instantly.
 */
export async function createTransactionOfflineFirst(transactionData) {
  const localId = generateLocalId('tx')
  const now = new Date().toISOString()

  const record = {
    localId,
    serverId: null,
    amount: Number(transactionData.amount),
    type: transactionData.type, // 'income' | 'expense'
    categoryId: transactionData.categoryId,
    date: transactionData.date || now,
    description: transactionData.description || '',
    receiptUrl: transactionData.receiptUrl || null,
    syncStatus: 'pending', // 'pending' | 'synced'
    createdAt: now,
  }

  // 1. ALWAYS persist to localStorage immediately (synchronous & reliable fallback)
  const existingLocal = getLocalStoredTransactions()
  existingLocal.unshift(record)
  saveLocalStoredTransactions(existingLocal)

  // 2. Also save to IndexedDB (asynchronous)
  let localDbId = null
  try {
    const database = await getDbInstance()
    localDbId = await database.transactions.add(record)
  } catch (idbErr) {
    console.warn('[OfflineFirst] IndexedDB save failed, using localId fallback:', idbErr)
  }

  // Check if we are online and authenticated with the backend
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('finper_auth_token') : null
  const canAttemptServer = navigator.onLine && Boolean(token)

  // 3. If not connected to server, enqueue into sync queues
  if (!canAttemptServer) {
    // Add to localStorage queue
    const localQueue = getLocalSyncQueue()
    localQueue.push({
      action: 'CREATE_TRANSACTION',
      entity: 'transactions',
      localId,
      endpoint: '/transactions',
      method: 'POST',
      payload: {
        amount: record.amount,
        type: record.type,
        categoryId: record.categoryId,
        date: record.date,
        description: record.description,
        receiptUrl: record.receiptUrl,
      },
      createdAt: now,
      retryCount: 0,
    })
    saveLocalSyncQueue(localQueue)

    // Add to IndexedDB queue if available
    try {
      const database = await getDbInstance()
      await database.syncQueue.add({
        action: 'CREATE_TRANSACTION',
        entity: 'transactions',
        localDbId,
        localId,
        endpoint: '/transactions',
        method: 'POST',
        payload: {
          amount: record.amount,
          type: record.type,
          categoryId: record.categoryId,
          date: record.date,
          description: record.description,
          receiptUrl: record.receiptUrl,
        },
        createdAt: now,
        retryCount: 0,
      })
    } catch {
      // Ignore
    }

    return { ...record, id: localDbId || localId, isOffline: true }
  }

  // 4. Online & authenticated: attempt server push
  try {
    const serverResult = await apiRequest('/transactions', {
      method: 'POST',
      body: JSON.stringify({
        amount: record.amount,
        type: record.type,
        categoryId: record.categoryId,
        date: record.date,
        description: record.description,
        receiptUrl: record.receiptUrl,
      }),
    })

    const sId = serverResult?.id || serverResult?._id
    if (sId) {
      // Update in localStorage
      const updatedLocal = getLocalStoredTransactions().map((t) =>
        t.localId === localId ? { ...t, serverId: sId, syncStatus: 'synced' } : t
      )
      saveLocalStoredTransactions(updatedLocal)

      // Update in IndexedDB
      if (localDbId) {
        try {
          const database = await getDbInstance()
          await database.transactions.update(localDbId, {
            serverId: sId,
            syncStatus: 'synced',
          })
        } catch {
          // Ignore
        }
      }
    }

    return { ...record, id: localDbId || localId, serverId: sId, syncStatus: 'synced' }
  } catch (err) {
    console.warn('[OfflineFirst] Network call failed, queuing transaction for sync:', err.message)
    return { ...record, id: localDbId || localId, isOffline: true }
  }
}

/**
 * Retrieve all local transactions from both IndexedDB and localStorage (merged & deduplicated).
 */
export async function getLocalTransactions() {
  const localMap = new Map()

  // 1. Read from localStorage
  const lsTxs = getLocalStoredTransactions()
  lsTxs.forEach((t) => {
    const key = t.serverId || t.localId || String(t.id)
    localMap.set(key, t)
  })

  // 2. Read from IndexedDB
  try {
    const database = await getDbInstance()
    const idbTxs = await database.transactions.orderBy('date').reverse().toArray()
    idbTxs.forEach((t) => {
      const key = t.serverId || t.localId || String(t.id)
      if (!localMap.has(key)) {
        localMap.set(key, t)
      }
    })
  } catch (err) {
    console.warn('[OfflineFirst] Could not read IndexedDB transactions:', err)
  }

  const combined = Array.from(localMap.values())
  combined.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
  return combined
}

/**
 * Process all pending sync queue items.
 */
export async function syncPendingQueue() {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('finper_auth_token') : null
  if (!token) {
    return { syncedCount: 0, failedCount: 0 }
  }

  let syncedCount = 0
  let failedCount = 0

  const localQueue = getLocalSyncQueue()
  const remainingLocalQueue = []

  for (const item of localQueue) {
    try {
      const serverResult = await apiRequest(item.endpoint, {
        method: item.method,
        body: JSON.stringify(item.payload),
      })

      const sId = serverResult?.id || serverResult?._id
      if (sId && item.localId) {
        const updated = getLocalStoredTransactions().map((t) =>
          t.localId === item.localId ? { ...t, serverId: sId, syncStatus: 'synced' } : t
        )
        saveLocalStoredTransactions(updated)
      }
      syncedCount++
    } catch {
      failedCount++
      remainingLocalQueue.push(item)
    }
  }

  saveLocalSyncQueue(remainingLocalQueue)
  return { syncedCount, failedCount }
}

/**
 * Updates an existing transaction across localStorage, IndexedDB, and server API.
 */
export async function updateTransactionOfflineFirst(transactionId, updates) {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('finper_auth_token') : null
  const canAttemptServer = navigator.onLine && Boolean(token)

  // 1. Update in localStorage
  let matchedServerId = null
  const existingLocal = getLocalStoredTransactions().map((t) => {
    if (t.serverId === transactionId || t.localId === transactionId || String(t.id) === String(transactionId)) {
      matchedServerId = t.serverId
      return {
        ...t,
        ...updates,
        amount: updates.amount !== undefined ? Number(updates.amount) : t.amount,
        syncStatus: canAttemptServer && (matchedServerId || transactionId) ? 'synced' : 'pending',
      }
    }
    return t
  })
  saveLocalStoredTransactions(existingLocal)

  // 2. Update in IndexedDB
  try {
    const database = await getDbInstance()
    const serverMatch = await database.transactions.where('serverId').equals(transactionId).first()
    if (serverMatch) {
      await database.transactions.update(serverMatch.id, {
        ...updates,
        amount: updates.amount !== undefined ? Number(updates.amount) : serverMatch.amount,
        syncStatus: canAttemptServer ? 'synced' : 'pending',
      })
    } else {
      const localMatch = await database.transactions.where('localId').equals(transactionId).first()
      if (localMatch) {
        await database.transactions.update(localMatch.id, {
          ...updates,
          amount: updates.amount !== undefined ? Number(updates.amount) : localMatch.amount,
        })
      } else {
        const idMatch = await database.transactions.get(Number(transactionId) || transactionId)
        if (idMatch) {
          await database.transactions.update(idMatch.id, {
            ...updates,
            amount: updates.amount !== undefined ? Number(updates.amount) : idMatch.amount,
          })
        }
      }
    }
  } catch (idbErr) {
    console.warn('[OfflineFirst] IndexedDB update error:', idbErr)
  }

  // 3. Attempt server PATCH if online
  const serverTargetId = matchedServerId || (typeof transactionId === 'string' && transactionId.length === 24 ? transactionId : null)
  if (canAttemptServer && serverTargetId) {
    try {
      await apiRequest(`/transactions/${serverTargetId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          amount: Number(updates.amount),
          type: updates.type,
          categoryId: updates.categoryId,
          date: updates.date,
          description: updates.description,
        }),
      })
    } catch (err) {
      console.warn('[OfflineFirst] Server update failed, queueing update:', err.message)
      const localQueue = getLocalSyncQueue()
      localQueue.push({
        action: 'UPDATE_TRANSACTION',
        entity: 'transactions',
        endpoint: `/transactions/${serverTargetId}`,
        method: 'PATCH',
        payload: updates,
        createdAt: new Date().toISOString(),
        retryCount: 0,
      })
      saveLocalSyncQueue(localQueue)
    }
  }

  return { id: transactionId, ...updates }
}

/**
 * Deletes a transaction across localStorage, IndexedDB, and server API.
 */
export async function deleteTransactionOfflineFirst(transactionId) {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('finper_auth_token') : null
  const canAttemptServer = navigator.onLine && Boolean(token)

  // 1. Remove from localStorage
  const existing = getLocalStoredTransactions()
  const target = existing.find(
    (t) => t.serverId === transactionId || t.localId === transactionId || String(t.id) === String(transactionId)
  )
  const filtered = existing.filter(
    (t) => t.serverId !== transactionId && t.localId !== transactionId && String(t.id) !== String(transactionId)
  )
  saveLocalStoredTransactions(filtered)

  // 2. Remove from IndexedDB
  try {
    const database = await getDbInstance()
    const match = await database.transactions
      .filter((t) => t.serverId === transactionId || t.localId === transactionId || String(t.id) === String(transactionId))
      .first()
    if (match) {
      await database.transactions.delete(match.id)
    }
  } catch (err) {
    console.warn('[OfflineFirst] IndexedDB delete error:', err)
  }

  // 3. Server delete if online
  const sId = target?.serverId || (typeof transactionId === 'string' && transactionId.length === 24 ? transactionId : null)
  if (canAttemptServer && sId) {
    try {
      await apiRequest(`/transactions/${sId}`, { method: 'DELETE' })
    } catch (err) {
      console.warn('[OfflineFirst] Server delete failed:', err.message)
    }
  }
}

