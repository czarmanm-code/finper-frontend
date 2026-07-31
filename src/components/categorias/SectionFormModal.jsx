import { useState } from 'react'
import Modal from '../ui/Modal'
import IconPicker from './IconPicker'
import { COLOR_PALETTE, DEFAULT_COLOR } from '../../utils/colors'
import { DEFAULT_SECTION_ICON } from '../../utils/heroicons'

export default function SectionFormModal({ section, isNameTaken, onSave, onClose }) {
  const isEditing = Boolean(section)
  const [name, setName] = useState(section?.name ?? '')
  const [icon, setIcon] = useState(section?.icon ?? DEFAULT_SECTION_ICON)
  const [color, setColor] = useState(section?.color ?? DEFAULT_COLOR)
  const [error, setError] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError('El nombre es obligatorio.')
      return
    }
    if (isNameTaken(trimmed, section?.id)) {
      setError('Ya existe una sección con ese nombre.')
      return
    }
    onSave({ name: trimmed, icon, color })
  }

  return (
    <Modal title={isEditing ? 'Editar sección' : 'Nueva sección'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Nombre
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setError('')
            }}
            placeholder="Ej. Ahorro"
            autoFocus
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {error && <p className="text-sm text-rose-500 mt-1">{error}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Color
          </label>
          <div className="flex flex-wrap gap-2">
            {COLOR_PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                style={{ backgroundColor: c }}
                className={`w-7 h-7 rounded-full transition ring-offset-2 ring-offset-white dark:ring-offset-slate-900 ${
                  color === c ? 'ring-2 ring-slate-900 dark:ring-white' : ''
                }`}
                aria-label={c}
              />
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Icono (opcional)
          </label>
          <IconPicker value={icon} onChange={setIcon} />
        </div>

        <div className="flex justify-end gap-3 mt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 transition"
          >
            {isEditing ? 'Guardar cambios' : 'Crear sección'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
