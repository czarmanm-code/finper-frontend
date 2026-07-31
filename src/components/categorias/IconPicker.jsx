import { useState } from 'react'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { HEROICON_MAP, HEROICON_NAMES } from '../../utils/heroicons'

export default function IconPicker({ value, onChange }) {
  const [query, setQuery] = useState('')

  const filtered = HEROICON_NAMES.filter((name) =>
    name.toLowerCase().includes(query.trim().toLowerCase())
  )

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar icono..."
          className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 max-h-48 overflow-y-auto p-1 border border-slate-200 dark:border-slate-800 rounded-lg">
        {filtered.map((name) => {
          const Icon = HEROICON_MAP[name]
          const selected = value === name
          return (
            <button
              key={name}
              type="button"
              title={name}
              onClick={() => onChange(name)}
              className={`flex items-center justify-center p-2 rounded-lg transition ${
                selected
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-5 h-5" />
            </button>
          )
        })}
        {filtered.length === 0 && (
          <p className="col-span-full text-center text-sm text-slate-400 py-4">
            Sin resultados
          </p>
        )}
      </div>
    </div>
  )
}
