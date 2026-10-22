import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Bars2Icon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import { HEROICON_MAP, DEFAULT_CATEGORY_ICON } from '../../utils/heroicons'

export default function CategoryChip({ category, onEdit, onDelete, dragOverlay = false }) {
  const Icon = HEROICON_MAP[category.icon] || HEROICON_MAP[DEFAULT_CATEGORY_ICON]

  const sortable = useSortable({
    id: category.id,
    data: { type: 'category', sectionId: category.sectionId },
  })

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = dragOverlay
    ? { attributes: {}, listeners: {}, setNodeRef: null, transform: null, transition: null, isDragging: false }
    : sortable

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group flex items-center gap-2 pl-1 pr-2 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition"
    >
      <button
        {...attributes}
        {...listeners}
        className="p-1 text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 cursor-grab active:cursor-grabbing touch-none"
        aria-label="Drag category"
      >
        <Bars2Icon className="w-4 h-4" />
      </button>

      <span
        className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${category.color}20`, color: category.color }}
      >
        <Icon className="w-4 h-4" />
      </span>

      <span className="text-sm font-medium text-slate-700 dark:text-slate-200 flex-1 truncate">
        {category.name}
      </span>

      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(category)}
          className="p-1 rounded text-slate-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/40 dark:hover:text-sky-400 transition"
          aria-label="Edit category"
        >
          <PencilIcon className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onDelete(category)}
          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition"
          aria-label="Delete category"
        >
          <TrashIcon className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
