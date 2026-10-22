import { apiRequest } from './api.js'

/**
 * Directly retrieves transactions from the backend MongoDB API.
 */
export async function getTransactions(params = {}) {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('finper_auth_token') : null
  if (!token) {
    return []
  }

  try {
    const query = new URLSearchParams({ limit: '100', ...params }).toString()
    const response = await apiRequest(`/transactions?${query}`)
    const txs = response?.data || response
    if (Array.isArray(txs)) {
      return txs.map((t) => ({
        id: t.id || t._id,
        serverId: t.id || t._id,
        amount: Number(t.amount) || 0,
        type: t.type,
        categoryId: typeof t.categoryId === 'object' ? (t.categoryId?.id || t.categoryId?._id) : t.categoryId,
        categoryName: typeof t.categoryId === 'object' ? t.categoryId?.name : t.categoryName,
        categoryIcon: typeof t.categoryId === 'object' ? t.categoryId?.icon : t.categoryIcon,
        categoryColor: typeof t.categoryId === 'object' ? t.categoryId?.color : t.categoryColor,
        date: t.date,
        description: t.description || '',
        receiptUrl: t.receiptUrl || null,
        createdAt: t.createdAt || t.date,
      }))
    }
    return []
  } catch (err) {
    console.error('[TransactionsService] Error fetching transactions:', err)
    return []
  }
}

/**
 * Creates a transaction directly in the backend MongoDB database.
 */
export async function createTransaction(transactionData) {
  const payload = {
    amount: Number(transactionData.amount),
    type: transactionData.type,
    categoryId: transactionData.categoryId,
    date: transactionData.date || new Date().toISOString(),
    description: transactionData.description ? transactionData.description.trim() : '',
    receiptUrl: transactionData.receiptUrl ? transactionData.receiptUrl.trim() : null,
  }

  const result = await apiRequest('/transactions', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  return {
    id: result?.id || result?._id,
    ...payload,
    ...result,
  }
}

/**
 * Updates an existing transaction directly in MongoDB.
 */
export async function updateTransaction(transactionId, updates) {
  const payload = {
    ...updates,
    amount: updates.amount !== undefined ? Number(updates.amount) : undefined,
  }

  const result = await apiRequest(`/transactions/${transactionId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })

  return result
}

/**
 * Deletes a transaction directly in MongoDB.
 */
export async function deleteTransaction(transactionId) {
  return apiRequest(`/transactions/${transactionId}`, {
    method: 'DELETE',
  })
}

/**
 * Resets all transactions for the authenticated user for the current month.
 */
export async function resetMonthData() {
  return apiRequest('/transactions/reset-month', {
    method: 'POST',
  })
}

