import { apiRequest } from './api.js'

export const DEFAULT_FALLBACK_CATEGORIES = [
  // Income
  { id: 'cat-salary', name: 'Salary', type: 'income', icon: 'BanknotesIcon', color: '#10b981', plannedAmount: 0 },
  { id: 'cat-vouchers', name: 'Food Vouchers', type: 'income', icon: 'CreditCardIcon', color: '#0ea5e9', plannedAmount: 0 },
  { id: 'cat-investments-inc', name: 'Investments', type: 'income', icon: 'ChartBarIcon', color: '#8b5cf6', plannedAmount: 0 },
  // Expense
  { id: 'cat-food', name: 'Food & Groceries', type: 'expense', icon: 'CakeIcon', color: '#f59e0b', plannedAmount: 0 },
  { id: 'cat-housing', name: 'Housing & Rent', type: 'expense', icon: 'HomeModernIcon', color: '#f43f5e', plannedAmount: 0 },
  { id: 'cat-transport', name: 'Transportation', type: 'expense', icon: 'TruckIcon', color: '#6366f1', plannedAmount: 0 },
  { id: 'cat-utilities', name: 'Utilities & Services', type: 'expense', icon: 'BoltIcon', color: '#ec4899', plannedAmount: 0 },
  { id: 'cat-entertainment', name: 'Entertainment', type: 'expense', icon: 'FilmIcon', color: '#06b6d4', plannedAmount: 0 },
]

/**
 * Directly fetches categories from the backend MongoDB API.
 */
export async function getCategories(typeFilter = null) {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('finper_auth_token') : null
  if (!token) {
    return DEFAULT_FALLBACK_CATEGORIES.filter((c) => !typeFilter || c.type === typeFilter)
  }

  try {
    const endpoint = typeFilter ? `/categories?type=${typeFilter}` : '/categories'
    const serverCategories = await apiRequest(endpoint)
    if (Array.isArray(serverCategories) && serverCategories.length > 0) {
      return serverCategories.map((c) => ({
        id: c.id || c._id,
        serverId: c.id || c._id,
        name: c.name,
        type: c.type,
        icon: c.icon || 'TagIcon',
        color: c.color || '#3b82f6',
        plannedAmount: Number(c.plannedAmount) || 0,
      }))
    }
    return DEFAULT_FALLBACK_CATEGORIES.filter((c) => !typeFilter || c.type === typeFilter)
  } catch (err) {
    console.error('[CategoriesService] Error loading categories from API:', err)
    return DEFAULT_FALLBACK_CATEGORIES.filter((c) => !typeFilter || c.type === typeFilter)
  }
}

/**
 * Updates planned budget amount for a category directly in MongoDB.
 */
export async function updateCategoryPlannedAmount(categoryId, plannedAmount) {
  const numericAmount = Math.max(0, Number(plannedAmount) || 0)
  return apiRequest(`/categories/${categoryId}`, {
    method: 'PATCH',
    body: JSON.stringify({ plannedAmount: numericAmount }),
  })
}

/**
 * Creates a category directly in MongoDB.
 */
export async function createCategory(data) {
  return apiRequest('/categories', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * Deletes a category directly in MongoDB.
 */
export async function deleteCategory(id) {
  return apiRequest(`/categories/${id}`, {
    method: 'DELETE',
  })
}

