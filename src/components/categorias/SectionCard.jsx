import { useSortable } from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Bars2Icon, PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline'
import { HEROICON_MAP, DEFAULT_SECTION_ICON } from '../../utils/heroicons'
import CategoryChip from './CategoryChip'

export default function SectionCard({
  section,
  onEditSection,
  onDeleteSection,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
}) {
  const Icon = HEROICON_MAP[section.icon] || HEROICON_MAP[DEFAULT_SECTION_ICON]

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
    data: { type: 'section' },
  })

  const { setNodeRef: setDroppableRef } = useDroppable({
    id: `categories-${section.id}`,
    data: { type: 'category-container', sectionId: section.id },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const categoryIds = section.categories.map((c) => c.id)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-5 flex flex-col gap-4"
    >
      <div className="flex items-center gap-3">
        <button
          {...attributes}
          {...listeners}
          className="p-1 text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 cursor-grab active:cursor-grabbing touch-none"
          aria-label="Drag section"
        >
          <Bars2Icon className="w-5 h-5" />
        </button>

        <span
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${section.color}20`, color: section.color }}
        >
          <Icon className="w-5 h-5" />
        </span>

        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 flex-1 truncate">
          {section.name}
        </h3>

        <span className="text-xs text-slate-400 dark:text-slate-500">
          {section.categories.length} categor{section.categories.length === 1 ? 'y' : 'ies'}
        </span>

        <button
          onClick={() => onEditSection(section)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/40 dark:hover:text-sky-400 transition"
          aria-label="Edit section"
        >
          <PencilIcon className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDeleteSection(section)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition"
          aria-label="Delete section"
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>

      <SortableContext items={categoryIds} strategy={verticalListSortingStrategy}>
        <div ref={setDroppableRef} className="flex flex-col gap-2 min-h-[3rem]">
          {section.categories.map((category) => (
            <CategoryChip
              key={category.id}
              category={category}
              onEdit={onEditCategory}
              onDelete={onDeleteCategory}
            />
          ))}

          {section.categories.length === 0 && (
            <div className="flex items-center justify-center text-sm text-slate-400 dark:text-slate-600 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg py-4">
              No categories yet in this section
            </div>
          )}
        </div>
      </SortableContext>

      <button
        onClick={() => onAddCategory(section.id)}
        className="flex items-center justify-center gap-1.5 text-sm font-semibold text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 rounded-lg py-2 transition"
      >
        <PlusIcon className="w-4 h-4" />
        Add Category
      </button>
    </div>
  )
}
