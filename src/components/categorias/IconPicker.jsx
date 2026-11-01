import { useState, useMemo } from 'react'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { HEROICON_MAP, HEROICON_NAMES, HEROICON_TAGS } from '../../utils/heroicons'

function normalizeStr(str = '') {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

export default function IconPicker({ value, onChange }) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = normalizeStr(query)
    if (!q) return HEROICON_NAMES

    return HEROICON_NAMES.filter((name) => {
      // 1. Direct component name match (e.g. "calculator", "receipt")
      if (normalizeStr(name).includes(q)) return true

      // 2. Bilingual search tags match with word prefixing to avoid substring false positives
      const tags = HEROICON_TAGS[name]
      if (tags && tags.some((tag) => {
        const normTag = normalizeStr(tag)
        if (normTag === q) return true
        const words = normTag.split(/\s+/)
        return words.some((w) => w === q || (q.length >= 3 && w.startsWith(q)))
      })) {
        return true
      }

      return false
    })
  }, [query])

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search icon (e.g. food, rent, tax, travel)..."
          className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 max-h-56 overflow-y-auto p-1 border border-slate-200 dark:border-slate-800 rounded-lg">
        {filtered.map((name) => {
          const Icon = HEROICON_MAP[name]
          if (!Icon) return null
          const selected = value === name
          return (
            <button
              key={name}
              type="button"
              title={name.replace(/Icon$/, '')}
              onClick={() => onChange(name)}
              className={`flex items-center justify-center p-2 rounded-lg transition ${
                selected
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
            </button>
          )
        })}
        {filtered.length === 0 && (
          <p className="col-span-full text-center text-sm text-slate-400 py-4">
            No icons found
          </p>
        )}
      </div>
    </div>
  )
}
