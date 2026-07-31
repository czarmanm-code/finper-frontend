const STORAGE_KEY = 'finper-sections'

function makeId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function seedData() {
  const secAhorro = makeId('sec')
  const secFijos = makeId('sec')
  const secVariables = makeId('sec')

  return [
    {
      id: secFijos,
      name: 'Gastos Fijos',
      icon: 'BuildingLibraryIcon',
      color: '#64748b',
      order: 0,
      categories: [
        { id: makeId('cat'), sectionId: secFijos, name: 'Hipoteca', icon: 'HomeModernIcon', color: '#f43f5e', order: 0 },
      ],
    },
    {
      id: secVariables,
      name: 'Gastos Variables',
      icon: 'ShoppingCartIcon',
      color: '#0ea5e9',
      order: 1,
      categories: [
        { id: makeId('cat'), sectionId: secVariables, name: 'Comida', icon: 'CakeIcon', color: '#10b981', order: 0 },
        { id: makeId('cat'), sectionId: secVariables, name: 'Entretenimiento', icon: 'FilmIcon', color: '#0ea5e9', order: 1 },
        { id: makeId('cat'), sectionId: secVariables, name: 'Transporte', icon: 'TruckIcon', color: '#6366f1', order: 2 },
      ],
    },
    {
      id: secAhorro,
      name: 'Ahorro',
      icon: 'BanknotesIcon',
      color: '#10b981',
      order: 2,
      categories: [
        { id: makeId('cat'), sectionId: secAhorro, name: 'Viaje', icon: 'PaperAirplaneIcon', color: '#38bdf8', order: 0 },
        { id: makeId('cat'), sectionId: secAhorro, name: 'Imprevistos', icon: 'ShieldCheckIcon', color: '#f59e0b', order: 1 },
        { id: makeId('cat'), sectionId: secAhorro, name: 'CETES', icon: 'ChartBarIcon', color: '#22c55e', order: 2 },
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
