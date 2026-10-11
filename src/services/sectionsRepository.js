const STORAGE_KEY = 'finper-sections'

function makeId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function seedData() {
  const secIncome = makeId('sec')
  const secFixed = makeId('sec')
  const secVariable = makeId('sec')
  const secSavings = makeId('sec')

  return [
    {
      id: secIncome,
      name: 'Income',
      icon: 'BanknotesIcon',
      color: '#10b981',
      order: 0,
      categories: [
        { id: makeId('cat'), sectionId: secIncome, name: 'Salary', icon: 'BanknotesIcon', color: '#10b981', order: 0, plannedAmount: 0 },
        { id: makeId('cat'), sectionId: secIncome, name: 'Food Vouchers', icon: 'CreditCardIcon', color: '#0ea5e9', order: 1, plannedAmount: 0 },
      ],
    },
    {
      id: secFixed,
      name: 'Fixed Expenses',
      icon: 'BuildingLibraryIcon',
      color: '#64748b',
      order: 1,
      categories: [
        { id: makeId('cat'), sectionId: secFixed, name: 'Housing & Rent', icon: 'HomeModernIcon', color: '#f43f5e', order: 0, plannedAmount: 0 },
        { id: makeId('cat'), sectionId: secFixed, name: 'Utilities', icon: 'BoltIcon', color: '#f59e0b', order: 1, plannedAmount: 0 },
      ],
    },
    {
      id: secVariable,
      name: 'Variable Expenses',
      icon: 'ShoppingCartIcon',
      color: '#0ea5e9',
      order: 2,
      categories: [
        { id: makeId('cat'), sectionId: secVariable, name: 'Food & Groceries', icon: 'CakeIcon', color: '#f59e0b', order: 0, plannedAmount: 0 },
        { id: makeId('cat'), sectionId: secVariable, name: 'Entertainment', icon: 'FilmIcon', color: '#06b6d4', order: 1, plannedAmount: 0 },
        { id: makeId('cat'), sectionId: secVariable, name: 'Transportation', icon: 'TruckIcon', color: '#6366f1', order: 2, plannedAmount: 0 },
      ],
    },
    {
      id: secSavings,
      name: 'Savings & Investments',
      icon: 'BuildingOfficeIcon',
      color: '#8b5cf6',
      order: 3,
      categories: [
        { id: makeId('cat'), sectionId: secSavings, name: 'Emergency Fund', icon: 'ShieldCheckIcon', color: '#f59e0b', order: 0, plannedAmount: 0 },
        { id: makeId('cat'), sectionId: secSavings, name: 'Investments', icon: 'ChartBarIcon', color: '#8b5cf6', order: 1, plannedAmount: 0 },
      ],
    },
  ]
}

export function getAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      const seeded = seedData()
      saveAll(seeded)
      return seeded
    }
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) throw new Error('invalid shape')
    
    // Automatically migrate if Income section is missing or legacy Spanish detected
    const hasIncome = parsed.some((s) => s.name === 'Income')
    const hasSpanish = parsed.some(
      (s) => s.name === 'Gastos Fijos' || s.name === 'Gastos Variables' || s.name === 'Ahorro'
    )
    if (!hasIncome || hasSpanish) {
      const seeded = seedData()
      saveAll(seeded)
      return seeded
    }

    return parsed
  } catch {
    const seeded = seedData()
    saveAll(seeded)
    return seeded
  }
}

export function saveAll(sections) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sections))
}

export function newSectionId() {
  return makeId('sec')
}

export function newCategoryId() {
  return makeId('cat')
}
