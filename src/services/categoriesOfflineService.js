import { db, getDbInstance } from './db.js'
import { apiRequest } from './api.js'
import { getAll as getLocalStorageSections } from './sectionsRepository.js'

// Standard default categories strictly in English including Mexican common financial streams
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
 * Loads categories with robust multi-layer fallback:
 * 1. Checks local IndexedDB first.
 * 2. If missing Income streams or empty, resets and persists default categories.
 * 3. If online and authenticated, syncs fresh records from GET /api/categories.
 */
export async function getCategoriesOfflineFirst(typeFilter = null) {
  let localCategories = []

  try {
    const database = await getDbInstance()
    localCategories = await database.categories.toArray()

    // Check if food vouchers category exists
    const hasVouchers = localCategories.some((c) => c.name === 'Food Vouchers')
    const hasSpanish = localCategories.some((c) =>
      ['Comida', 'Hipoteca', 'Entretenimiento', 'Transporte', 'Viaje', 'Imprevistos', 'Ahorro'].includes(c.name)
    )

    if (!hasVouchers || hasSpanish) {
      await database.categories.clear()
      localCategories = []
    }
  } catch (err) {
    console.warn('[CategoriesService] IndexedDB read error:', err)
  }

  // If local IndexedDB has no categories, seed from localStorage sections or default list
  if (localCategories.length === 0) {
    const categoriesToSeed = []

    try {
      const sections = getLocalStorageSections()
      if (Array.isArray(sections) && sections.length > 0) {
        sections.forEach((sec) => {
          const isIncome =
            sec.name?.toLowerCase().includes('income') ||
            sec.name?.toLowerCase().includes('salary') ||
            sec.name?.toLowerCase().includes('ingreso')
          const catType = isIncome ? 'income' : 'expense'

          if (Array.isArray(sec.categories)) {
            sec.categories.forEach((c) => {
              categoriesToSeed.push({
                serverId: c.id,
                name: c.name,
                type: catType,
                icon: c.icon || sec.icon || 'TagIcon',
                color: c.color || sec.color || '#6366f1',
                plannedAmount: Number(c.plannedAmount) || 0,
                syncStatus: 'synced',
              })
            })
          }
        })
      }
    } catch (e) {
      console.warn('[CategoriesService] Failed reading localStorage sections:', e)
    }

    // If still empty or incomplete, use DEFAULT_FALLBACK_CATEGORIES
    if (categoriesToSeed.length === 0) {
      categoriesToSeed.push(...DEFAULT_FALLBACK_CATEGORIES)
    }

    try {
      const database = await getDbInstance()
      for (const cat of categoriesToSeed) {
        await database.categories.add({
          serverId: cat.serverId || cat.id,
          name: cat.name,
          type: cat.type,
          icon: cat.icon || 'TagIcon',
          color: cat.color || '#3b82f6',
          plannedAmount: Number(cat.plannedAmount) || 0,
          syncStatus: 'synced',
        })
      }
      localCategories = await database.categories.toArray()
    } catch (dbErr) {
      console.warn('[CategoriesService] Could not persist defaults to IndexedDB:', dbErr)
      localCategories = categoriesToSeed
    }
  }

  // Attempt to fetch fresh categories from backend API if online
  if (typeof navigator !== 'undefined' && navigator.onLine) {
    try {
      const endpoint = typeFilter ? `/categories?type=${typeFilter}` : '/categories'
      const serverCategories = await apiRequest(endpoint)

      if (Array.isArray(serverCategories) && serverCategories.length > 0) {
        const database = await getDbInstance()
        for (const sCat of serverCategories) {
          const sId = sCat.id || sCat._id
          try {
            const exists = await database.categories.where('serverId').equals(sId).first()
            if (!exists) {
              await database.categories.add({
                serverId: sId,
                name: sCat.name,
                type: sCat.type,
                icon: sCat.icon || 'TagIcon',
                color: sCat.color || '#3b82f6',
                plannedAmount: Number(sCat.plannedAmount) || 0,
                syncStatus: 'synced',
              })
            } else {
              await database.categories.update(exists.id, {
                name: sCat.name,
                type: sCat.type,
                icon: sCat.icon || exists.icon,
                color: sCat.color || exists.color,
                plannedAmount: sCat.plannedAmount !== undefined ? Number(sCat.plannedAmount) : exists.plannedAmount || 0,
                syncStatus: 'synced',
              })
            }
          } catch {
            // Ignore write errors
          }
        }
        localCategories = await database.categories.toArray()
      }
    } catch {
      // Quietly fall back to local categories on API error
    }
  }

  // Apply type filter if requested
  let filtered = localCategories
  if (typeFilter) {
    filtered = localCategories.filter((cat) => cat.type === typeFilter)
  }

  // Safety net: return English default categories of that type if none found
  if (filtered.length === 0) {
    const fallback = DEFAULT_FALLBACK_CATEGORIES.filter((c) => !typeFilter || c.type === typeFilter)
    return fallback.length > 0 ? fallback : DEFAULT_FALLBACK_CATEGORIES
  }

  return filtered
}

/**
 * Updates a category's monthly target/budget across IndexedDB, localStorage, and the backend.
 */
export async function updateCategoryPlannedAmount(categoryId, plannedAmount) {
  const numericAmount = Math.max(0, Number(plannedAmount) || 0)

  // 1. Update local IndexedDB
  try {
    const database = await getDbInstance()
    const catByServerId = await database.categories.where('serverId').equals(categoryId).first()
    if (catByServerId) {
      await database.categories.update(catByServerId.id, { plannedAmount: numericAmount })
    } else {
      const allCats = await database.categories.toArray()
      const found = allCats.find((c) => String(c.id) === String(categoryId) || c.serverId === categoryId)
      if (found) {
        await database.categories.update(found.id, { plannedAmount: numericAmount })
      }
    }
  } catch (err) {
    console.warn('[CategoriesService] Error updating IndexedDB target:', err)
  }

  // 2. Update localStorage sections
  try {
    const sections = getLocalStorageSections()
    let updated = false
    sections.forEach((sec) => {
      sec.categories?.forEach((c) => {
        if (String(c.id) === String(categoryId)) {
          c.plannedAmount = numericAmount
          updated = true
        }
      })
    })
    if (updated) {
      localStorage.setItem('finper-sections', JSON.stringify(sections))
    }
  } catch (e) {
    console.warn('[CategoriesService] Error updating localStorage sections:', e)
  }

  // 3. Update backend API if online
  if (typeof navigator !== 'undefined' && navigator.onLine) {
    try {
      await apiRequest(`/categories/${categoryId}`, {
        method: 'PATCH',
        body: JSON.stringify({ plannedAmount: numericAmount }),
      })
    } catch (apiErr) {
      console.warn('[CategoriesService] Backend PATCH target error:', apiErr)
    }
  }

  return numericAmount
}

